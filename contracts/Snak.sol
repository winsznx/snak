// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@oz/access/Ownable.sol";
import "@oz/utils/Pausable.sol";
import "@oz/utils/ReentrancyGuard.sol";
import "@oz/token/ERC20/IERC20.sol";
import "@oz/token/ERC20/utils/SafeERC20.sol";
import "@oz/token/ERC721/ERC721.sol";

//   ░ Snak ░  Sats-staked snake battle royale on Celo cUSD.
//   create → join → score → settle → claim. last serpent alive takes the pot.
//   season rank badges (top 100 of a finalized season) mint here too.
contract Snak is ERC721, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    //
    //  ── constants ─────────────────────────────────────────────────────────
    //

    uint256 public constant TREASURY_CUT_BPS = 500;       // 5% of every pot
    uint256 public constant MIN_PLAYERS_TO_SETTLE = 1;
    uint256 public constant MAX_PLAYERS_PER_MATCH = 50;
    uint256 public constant FORFEIT_REFUND_BPS = 8000;    // forfeit refunds 80% (treasury keeps 20%)
    uint64  public constant STRIKE_COOLDOWN = 22 hours;
    uint64  public constant STRIKE_GRACE = 50 hours;

    //
    //  ── enums + structs ───────────────────────────────────────────────────
    //

    enum MatchStatus { Open, Locked, Settled, Cancelled }

    struct Arena {
        address creator;
        uint128 stake;
        uint128 prizePool;
        uint64  deadline;
        uint16  maxPlayers;
        uint16  joinedCount;
        MatchStatus status;
        address winner;
        uint64  winningScore;
    }

    struct Season {
        uint64  startedAt;
        uint64  endsAt;
        bool    finalized;
    }

    //
    //  ── state ─────────────────────────────────────────────────────────────
    //

    IERC20 public immutable cUSD;
    address public treasury;
    address public scorer;        // server that signs / submits scores

    uint256 public nextMatchId;
    uint256 public nextTokenId;
    uint256 public nextSeasonId;

    string private _baseTokenURI;

    mapping(uint256 => Arena) public matches;
    mapping(uint256 => mapping(address => bool))   public hasJoined;
    mapping(uint256 => mapping(address => uint64)) public scoreOf;
    mapping(uint256 => mapping(address => bool))   public hasSubmittedScore;
    mapping(uint256 => mapping(address => bool))   public hasForfeited;
    mapping(uint256 => mapping(address => bool))   public claimedPrize;
    mapping(uint256 => address[]) private _arenaPlayers;

    // seasons + rank badges
    mapping(uint256 => Season) public seasons;
    mapping(uint256 => mapping(address => uint16)) public seasonRank; // 1..100; 0 = unranked
    mapping(uint256 => mapping(address => bool))   public claimedRankBadge;

    // retention (game-themed names)
    mapping(address => uint64) public lastStrike;
    mapping(address => uint16) public strikeRun;
    mapping(address => uint128) public freeEntries;
    mapping(address => address) public introducerOf;
    mapping(address => uint32) public introductionCount;

    //
    //  ── events ────────────────────────────────────────────────────────────
    //

    event ArenaCreated(uint256 indexed matchId, address indexed creator, uint256 stake, uint16 maxPlayers, uint64 deadline);
    event Joined(uint256 indexed matchId, address indexed player, uint256 stake);
    event ScoreSubmitted(uint256 indexed matchId, address indexed player, uint64 score);
    event MatchSettled(uint256 indexed matchId, address indexed winner, uint64 winningScore, uint256 prize, uint256 treasuryCut);
    event PrizeClaimed(uint256 indexed matchId, address indexed winner, uint256 amount);
    event Forfeited(uint256 indexed matchId, address indexed player, uint256 refund);
    event MatchCancelled(uint256 indexed matchId);
    event PrizeBoosted(uint256 indexed matchId, address indexed sponsor, uint256 amount);
    event DeadlineExtended(uint256 indexed matchId, uint64 oldDeadline, uint64 newDeadline);

    event SeasonStarted(uint256 indexed seasonId, uint64 endsAt);
    event SeasonFinalized(uint256 indexed seasonId);
    event SeasonRankSet(uint256 indexed seasonId, address indexed player, uint16 rank);
    event RankBadgeMinted(uint256 indexed seasonId, address indexed player, uint16 rank, uint256 indexed tokenId);

    event Striked(address indexed player, uint16 run, uint128 reward);
    event IntroducerSet(address indexed player, address indexed introducer);

    event ScorerUpdated(address indexed oldScorer, address indexed newScorer);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event BaseURIUpdated(string newBaseURI);

    //
    //  ── errors ────────────────────────────────────────────────────────────
    //

    error ZeroAddress();
    error InvalidStake();
    error InvalidMaxPlayers();
    error InvalidDeadline();
    error MatchNotOpen();
    error MatchNotLocked();
    error MatchNotSettled();
    error MatchAlreadyOpen();
    error AlreadyJoined();
    error MatchFull();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error NotPlayer();
    error AlreadyForfeited();
    error AlreadyScored();
    error NotScorer();
    error NotWinner();
    error AlreadyClaimed();
    error NoPlayers();
    error NotEmpty();
    error SeasonNotFinalized();
    error SeasonAlreadyFinalized();
    error SeasonNotActive();
    error AlreadyClaimedBadge();
    error NotRanked();
    error StrikeTooSoon();
    error AlreadyIntroduced();
    error CannotIntroduceSelf();

    //
    //  ── constructor ───────────────────────────────────────────────────────
    //

    constructor(IERC20 _cUSD, address _treasury, address _scorer)
        ERC721("Snak Rank Badges", "SNAKR")
        Ownable(msg.sender)
    {
        if (address(_cUSD) == address(0) || _treasury == address(0) || _scorer == address(0)) {
            revert ZeroAddress();
        }
        cUSD = _cUSD;
        treasury = _treasury;
        scorer = _scorer;
    }

    //
    //  ── match lifecycle ───────────────────────────────────────────────────
    //

    function createMatch(uint128 stake, uint16 maxPlayers, uint64 deadline)
        external
        whenNotPaused
        returns (uint256 matchId)
    {
        if (stake == 0) revert InvalidStake();
        if (maxPlayers < 2 || maxPlayers > MAX_PLAYERS_PER_MATCH) revert InvalidMaxPlayers();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        matchId = nextMatchId++;
        matches[matchId] = Arena({
            creator: msg.sender,
            stake: stake,
            prizePool: 0,
            deadline: deadline,
            maxPlayers: maxPlayers,
            joinedCount: 0,
            status: MatchStatus.Open,
            winner: address(0),
            winningScore: 0
        });

        emit ArenaCreated(matchId, msg.sender, stake, maxPlayers, deadline);
    }

    function joinMatch(uint256 matchId) external nonReentrant whenNotPaused {
        Arena storage m = matches[matchId];
        if (m.status != MatchStatus.Open) revert MatchNotOpen();
        if (block.timestamp >= m.deadline) revert DeadlinePassed();
        if (hasJoined[matchId][msg.sender]) revert AlreadyJoined();
        if (m.joinedCount >= m.maxPlayers) revert MatchFull();

        hasJoined[matchId][msg.sender] = true;
        _arenaPlayers[matchId].push(msg.sender);
        unchecked { m.joinedCount++; }
        m.prizePool += m.stake;

        cUSD.safeTransferFrom(msg.sender, address(this), m.stake);

        // auto-lock the moment max players join
        if (m.joinedCount == m.maxPlayers) {
            m.status = MatchStatus.Locked;
        }
        emit Joined(matchId, msg.sender, m.stake);
    }

    /// @notice Sponsor adds extra cUSD to the prize pool. Anyone can call,
    ///         no need to be a player. Common for streamed tournaments.
    function boostPrize(uint256 matchId, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidStake();
        Arena storage m = matches[matchId];
        if (m.status == MatchStatus.Settled || m.status == MatchStatus.Cancelled) {
            revert MatchNotOpen();
        }
        cUSD.safeTransferFrom(msg.sender, address(this), amount);
        m.prizePool += uint128(amount);
        emit PrizeBoosted(matchId, msg.sender, amount);
    }

    function extendDeadline(uint256 matchId, uint64 newDeadline) external whenNotPaused {
        Arena storage m = matches[matchId];
        if (msg.sender != m.creator) revert NotPlayer();
        if (m.status != MatchStatus.Open) revert MatchNotOpen();
        if (newDeadline <= m.deadline) revert InvalidDeadline();
        if (newDeadline <= block.timestamp) revert InvalidDeadline();

        uint64 oldDeadline = m.deadline;
        m.deadline = newDeadline;
        emit DeadlineExtended(matchId, oldDeadline, newDeadline);
    }

    function cancelMatch(uint256 matchId) external whenNotPaused {
        Arena storage m = matches[matchId];
        if (msg.sender != m.creator) revert NotPlayer();
        if (m.status != MatchStatus.Open) revert MatchNotOpen();
        if (m.joinedCount != 0) revert NotEmpty();

        m.status = MatchStatus.Cancelled;
        emit MatchCancelled(matchId);
    }

    function forfeit(uint256 matchId) external nonReentrant whenNotPaused {
        Arena storage m = matches[matchId];
        if (!hasJoined[matchId][msg.sender]) revert NotPlayer();
        if (hasForfeited[matchId][msg.sender]) revert AlreadyForfeited();
        // only forfeit before lock — once everyone's locked in, the bracket is fixed
        if (m.status != MatchStatus.Open) revert MatchNotOpen();
        if (block.timestamp >= m.deadline) revert DeadlinePassed();

        hasForfeited[matchId][msg.sender] = true;
        uint256 refund = (uint256(m.stake) * FORFEIT_REFUND_BPS) / 10_000;
        uint256 keepAmount = uint256(m.stake) - refund;

        m.prizePool -= m.stake;
        if (keepAmount > 0) {
            cUSD.safeTransfer(treasury, keepAmount);
        }
        cUSD.safeTransfer(msg.sender, refund);
        emit Forfeited(matchId, msg.sender, refund);
    }

    //
    //  ── scoring ───────────────────────────────────────────────────────────
    //

    /// @notice Scorer (off-chain server) submits a score for a player.
    ///         v1 is permissioned to a single scorer key; v2 will accept ECDSA-signed
    ///         scores anyone can relay.
    function submitScore(uint256 matchId, address player, uint64 score) external whenNotPaused {
        if (msg.sender != scorer) revert NotScorer();
        Arena storage m = matches[matchId];
        if (m.status != MatchStatus.Open && m.status != MatchStatus.Locked) revert MatchNotOpen();
        if (!hasJoined[matchId][player]) revert NotPlayer();
        if (hasForfeited[matchId][player]) revert AlreadyForfeited();
        if (hasSubmittedScore[matchId][player]) revert AlreadyScored();

        hasSubmittedScore[matchId][player] = true;
        scoreOf[matchId][player] = score;
        emit ScoreSubmitted(matchId, player, score);
    }

    /// @notice After deadline, anyone can settle the match. Computes the winner
    ///         (single highest score), pays them 95% of prize pool, treasury gets 5%.
    function settleMatch(uint256 matchId) external nonReentrant whenNotPaused {
        Arena storage m = matches[matchId];
        if (m.status != MatchStatus.Open && m.status != MatchStatus.Locked) revert MatchNotOpen();
        if (block.timestamp <= m.deadline) revert DeadlineNotPassed();

        address[] memory players = _arenaPlayers[matchId];
        if (players.length < MIN_PLAYERS_TO_SETTLE) revert NoPlayers();

        address winner;
        uint64 winningScore;
        for (uint256 i; i < players.length; i++) {
            if (hasForfeited[matchId][players[i]]) continue;
            uint64 s = scoreOf[matchId][players[i]];
            // tiebreaker: first to submit wins (we just take strict-greater-than)
            if (s > winningScore) {
                winningScore = s;
                winner = players[i];
            }
        }

        m.status = MatchStatus.Settled;
        m.winner = winner;
        m.winningScore = winningScore;

        uint256 cut = (uint256(m.prizePool) * TREASURY_CUT_BPS) / 10_000;
        uint256 prize = uint256(m.prizePool) - cut;

        if (cut > 0) cUSD.safeTransfer(treasury, cut);
        // prize stays in contract until winner pulls via claimPrize
        emit MatchSettled(matchId, winner, winningScore, prize, cut);
    }

    function claimPrize(uint256 matchId) external nonReentrant whenNotPaused {
        Arena storage m = matches[matchId];
        if (m.status != MatchStatus.Settled) revert MatchNotSettled();
        if (msg.sender != m.winner) revert NotWinner();
        if (claimedPrize[matchId][msg.sender]) revert AlreadyClaimed();

        claimedPrize[matchId][msg.sender] = true;
        uint256 cut = (uint256(m.prizePool) * TREASURY_CUT_BPS) / 10_000;
        uint256 prize = uint256(m.prizePool) - cut;
        m.prizePool = 0;

        cUSD.safeTransfer(msg.sender, prize);
        emit PrizeClaimed(matchId, msg.sender, prize);
    }

    //
    //  ── seasons + rank badges ─────────────────────────────────────────────
    //

    function startSeason(uint64 endsAt) external onlyOwner returns (uint256 seasonId) {
        if (endsAt <= block.timestamp) revert InvalidDeadline();
        seasonId = ++nextSeasonId;
        seasons[seasonId] = Season({startedAt: uint64(block.timestamp), endsAt: endsAt, finalized: false});
        emit SeasonStarted(seasonId, endsAt);
    }

    function setSeasonRank(uint256 seasonId, address player, uint16 rank) external onlyOwner {
        Season storage s = seasons[seasonId];
        if (s.startedAt == 0) revert SeasonNotActive();
        if (s.finalized) revert SeasonAlreadyFinalized();
        if (rank == 0 || rank > 100) revert NotRanked();
        seasonRank[seasonId][player] = rank;
        emit SeasonRankSet(seasonId, player, rank);
    }

    function finalizeSeason(uint256 seasonId) external onlyOwner {
        Season storage s = seasons[seasonId];
        if (s.startedAt == 0) revert SeasonNotActive();
        if (s.finalized) revert SeasonAlreadyFinalized();
        if (block.timestamp < s.endsAt) revert DeadlineNotPassed();
        s.finalized = true;
        emit SeasonFinalized(seasonId);
    }

    function claimRankBadge(uint256 seasonId) external whenNotPaused returns (uint256 tokenId) {
        Season storage s = seasons[seasonId];
        if (!s.finalized) revert SeasonNotFinalized();
        uint16 rank = seasonRank[seasonId][msg.sender];
        if (rank == 0) revert NotRanked();
        if (claimedRankBadge[seasonId][msg.sender]) revert AlreadyClaimedBadge();

        claimedRankBadge[seasonId][msg.sender] = true;
        tokenId = ++nextTokenId;
        _safeMint(msg.sender, tokenId);
        emit RankBadgeMinted(seasonId, msg.sender, rank, tokenId);
    }

    //
    //  ── retention (game-flavored) ─────────────────────────────────────────
    //

    function dailyStrike() external whenNotPaused {
        uint64 last = lastStrike[msg.sender];
        uint64 nowTs = uint64(block.timestamp);
        if (last != 0 && nowTs < last + STRIKE_COOLDOWN) revert StrikeTooSoon();

        if (last == 0 || nowTs > last + STRIKE_GRACE) {
            strikeRun[msg.sender] = 1;
        } else {
            unchecked { strikeRun[msg.sender]++; }
        }
        lastStrike[msg.sender] = nowTs;

        // four-tier reward shape:
        //   default: 1 free entry
        //   every 7: 4
        //   every 21: 12
        //   every 60: 30
        uint128 reward = 1;
        uint16 r = strikeRun[msg.sender];
        if (r % 60 == 0) reward = 30;
        else if (r % 21 == 0) reward = 12;
        else if (r % 7 == 0) reward = 4;

        freeEntries[msg.sender] += reward;
        emit Striked(msg.sender, r, reward);
    }

    function setIntroducer(address by) external whenNotPaused {
        if (introducerOf[msg.sender] != address(0)) revert AlreadyIntroduced();
        if (by == msg.sender) revert CannotIntroduceSelf();
        if (by == address(0)) revert ZeroAddress();
        introducerOf[msg.sender] = by;
        unchecked { introductionCount[by]++; }
        freeEntries[by] += 2;
        emit IntroducerSet(msg.sender, by);
    }

    //
    //  ── admin ─────────────────────────────────────────────────────────────
    //

    function setScorer(address newScorer) external onlyOwner {
        if (newScorer == address(0)) revert ZeroAddress();
        emit ScorerUpdated(scorer, newScorer);
        scorer = newScorer;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    //
    //  ── views ─────────────────────────────────────────────────────────────
    //

    function getMatch(uint256 matchId) external view returns (Arena memory) {
        return matches[matchId];
    }

    function getPlayers(uint256 matchId) external view returns (address[] memory) {
        return _arenaPlayers[matchId];
    }

    function isJoined(uint256 matchId, address player) external view returns (bool) {
        return hasJoined[matchId][player];
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
