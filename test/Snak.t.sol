// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/Snak.sol";
import "./mocks/StableMock.sol";

contract SnakTest is Test {
    Snak snak;
    StableMock stable;

    address owner    = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address scorer   = makeAddr("scorer");
    address p1       = makeAddr("p1");
    address p2       = makeAddr("p2");
    address p3       = makeAddr("p3");
    address sponsor  = makeAddr("sponsor");

    uint128 constant STAKE = 1 ether;

    function setUp() public {
        stable = new StableMock();
        vm.prank(owner);
        snak = new Snak(IERC20(address(stable)), treasury, scorer);

        for (uint256 i; i < 4; i++) {
            address w = i == 0 ? p1 : i == 1 ? p2 : i == 2 ? p3 : sponsor;
            stable.mint(w, 100 ether);
            vm.prank(w);
            stable.approve(address(snak), type(uint256).max);
        }
    }

    // create + join

    function test_create_basic() public {
        vm.prank(p1);
        uint256 id = snak.createMatch(STAKE, 4, uint64(block.timestamp + 1 hours));
        assertEq(id, 0);
        Snak.Arena memory a = snak.getMatch(id);
        assertEq(a.creator, p1);
        assertEq(a.stake, STAKE);
        assertEq(a.maxPlayers, 4);
        assertEq(uint256(a.status), uint256(Snak.MatchStatus.Open));
    }

    function test_create_zeroStake_reverts() public {
        vm.prank(p1);
        vm.expectRevert(Snak.InvalidStake.selector);
        snak.createMatch(0, 4, uint64(block.timestamp + 1 hours));
    }

    function test_create_lowMaxPlayers_reverts() public {
        vm.prank(p1);
        vm.expectRevert(Snak.InvalidMaxPlayers.selector);
        snak.createMatch(STAKE, 1, uint64(block.timestamp + 1 hours));
    }

    function test_create_oversizedMatch_reverts() public {
        vm.prank(p1);
        vm.expectRevert(Snak.InvalidMaxPlayers.selector);
        snak.createMatch(STAKE, 51, uint64(block.timestamp + 1 hours));
    }

    function test_create_pastDeadline_reverts() public {
        vm.warp(1_700_000_000);
        vm.prank(p1);
        vm.expectRevert(Snak.InvalidDeadline.selector);
        snak.createMatch(STAKE, 4, uint64(block.timestamp));
    }

    function test_join_paysStake_andAdds() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        Snak.Arena memory a = snak.getMatch(id);
        assertEq(a.joinedCount, 1);
        assertEq(a.prizePool, STAKE);
        assertEq(snak.getPlayers(id).length, 1);
    }

    function test_join_twice_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.startPrank(p2);
        snak.joinMatch(id);
        vm.expectRevert(Snak.AlreadyJoined.selector);
        snak.joinMatch(id);
        vm.stopPrank();
    }

    function test_join_full_autoLocks() public {
        // 2-player match
        vm.prank(p1);
        uint256 id = snak.createMatch(STAKE, 2, uint64(block.timestamp + 1 hours));
        vm.prank(p2);
        snak.joinMatch(id);
        vm.prank(p3);
        snak.joinMatch(id);
        Snak.Arena memory a = snak.getMatch(id);
        assertEq(uint256(a.status), uint256(Snak.MatchStatus.Locked));
    }

    function test_join_afterDeadline_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.warp(block.timestamp + 2 hours);
        vm.prank(p2);
        vm.expectRevert(Snak.DeadlinePassed.selector);
        snak.joinMatch(id);
    }

    // boost

    function test_boost_addsToPrizePool() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.prank(sponsor);
        snak.boostPrize(id, 5 ether);
        assertEq(snak.getMatch(id).prizePool, STAKE + 5 ether);
    }

    function test_boost_settledMatch_reverts() public {
        uint256 id = _runMatchToSettlement();
        vm.prank(sponsor);
        vm.expectRevert(Snak.MatchNotOpen.selector);
        snak.boostPrize(id, 1 ether);
    }

    // extend / cancel

    function test_extendDeadline_pushesForward() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        uint64 newDl = uint64(block.timestamp + 3 hours);
        vm.prank(p1);
        snak.extendDeadline(id, newDl);
        assertEq(snak.getMatch(id).deadline, newDl);
    }

    function test_extendDeadline_byNonCreator_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        vm.expectRevert(Snak.NotPlayer.selector);
        snak.extendDeadline(id, uint64(block.timestamp + 3 hours));
    }

    function test_cancel_emptyMatch() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p1);
        snak.cancelMatch(id);
        assertEq(uint256(snak.getMatch(id).status), uint256(Snak.MatchStatus.Cancelled));
    }

    function test_cancel_withJoiners_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.prank(p1);
        vm.expectRevert(Snak.NotEmpty.selector);
        snak.cancelMatch(id);
    }

    // forfeit

    function test_forfeit_refunds80_keeps20() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);

        uint256 p2Before = stable.balanceOf(p2);
        uint256 treasuryBefore = stable.balanceOf(treasury);

        vm.prank(p2);
        snak.forfeit(id);

        assertEq(stable.balanceOf(p2) - p2Before, (STAKE * 8000) / 10_000);
        assertEq(stable.balanceOf(treasury) - treasuryBefore, (STAKE * 2000) / 10_000);
        assertEq(snak.getMatch(id).prizePool, 0);
    }

    function test_forfeit_nonPlayer_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        vm.expectRevert(Snak.NotPlayer.selector);
        snak.forfeit(id);
    }

    function test_forfeit_twice_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.startPrank(p2);
        snak.forfeit(id);
        vm.expectRevert(Snak.AlreadyForfeited.selector);
        snak.forfeit(id);
        vm.stopPrank();
    }

    // scoring

    function test_submitScore_byScorer_records() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.prank(scorer);
        snak.submitScore(id, p2, 500);
        assertEq(snak.scoreOf(id, p2), 500);
    }

    function test_submitScore_byNonScorer_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.prank(p1);
        vm.expectRevert(Snak.NotScorer.selector);
        snak.submitScore(id, p2, 500);
    }

    function test_submitScore_twice_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.startPrank(scorer);
        snak.submitScore(id, p2, 500);
        vm.expectRevert(Snak.AlreadyScored.selector);
        snak.submitScore(id, p2, 600);
        vm.stopPrank();
    }

    // settle + claim

    function test_settle_findsHighestScore() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.prank(p3);
        snak.joinMatch(id);

        vm.startPrank(scorer);
        snak.submitScore(id, p2, 200);
        snak.submitScore(id, p3, 800);
        vm.stopPrank();

        vm.warp(block.timestamp + 2 hours);

        uint256 treasuryBefore = stable.balanceOf(treasury);
        snak.settleMatch(id);

        Snak.Arena memory a = snak.getMatch(id);
        assertEq(a.winner, p3);
        assertEq(a.winningScore, 800);
        // treasury cut = 5% of 2 * STAKE = 0.1 ether
        assertEq(stable.balanceOf(treasury) - treasuryBefore, (uint256(STAKE) * 2 * 500) / 10_000);
    }

    function test_settle_beforeDeadline_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.expectRevert(Snak.DeadlineNotPassed.selector);
        snak.settleMatch(id);
    }

    function test_settle_emptyMatch_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert(Snak.NoPlayers.selector);
        snak.settleMatch(id);
    }

    function test_claimPrize_winnerOnly() public {
        uint256 id = _runMatchToSettlement();
        Snak.Arena memory a = snak.getMatch(id);
        address winner = a.winner;
        uint256 expected = uint256(a.prizePool) - (uint256(a.prizePool) * 500) / 10_000;

        uint256 before_ = stable.balanceOf(winner);
        vm.prank(winner);
        snak.claimPrize(id);
        assertEq(stable.balanceOf(winner) - before_, expected);
    }

    function test_claimPrize_byNonWinner_reverts() public {
        uint256 id = _runMatchToSettlement();
        Snak.Arena memory a = snak.getMatch(id);
        address loser = a.winner == p2 ? p3 : p2;
        vm.prank(loser);
        vm.expectRevert(Snak.NotWinner.selector);
        snak.claimPrize(id);
    }

    function test_claimPrize_twice_reverts() public {
        uint256 id = _runMatchToSettlement();
        Snak.Arena memory a = snak.getMatch(id);
        vm.startPrank(a.winner);
        snak.claimPrize(id);
        vm.expectRevert(Snak.AlreadyClaimed.selector);
        snak.claimPrize(id);
        vm.stopPrank();
    }

    // seasons

    function test_startSeason_byOwner() public {
        vm.prank(owner);
        uint256 sid = snak.startSeason(uint64(block.timestamp + 30 days));
        assertEq(sid, 1);
    }

    function test_setSeasonRank_recordsRank() public {
        vm.startPrank(owner);
        uint256 sid = snak.startSeason(uint64(block.timestamp + 30 days));
        snak.setSeasonRank(sid, p2, 7);
        vm.stopPrank();
        assertEq(snak.seasonRank(sid, p2), 7);
    }

    function test_setSeasonRank_outOfRange_reverts() public {
        vm.startPrank(owner);
        uint256 sid = snak.startSeason(uint64(block.timestamp + 30 days));
        vm.expectRevert(Snak.NotRanked.selector);
        snak.setSeasonRank(sid, p2, 101);
        vm.stopPrank();
    }

    function test_finalize_thenClaimRankBadge() public {
        vm.startPrank(owner);
        uint256 sid = snak.startSeason(uint64(block.timestamp + 30 days));
        snak.setSeasonRank(sid, p2, 1);
        vm.warp(block.timestamp + 31 days);
        snak.finalizeSeason(sid);
        vm.stopPrank();

        vm.prank(p2);
        uint256 tokenId = snak.claimRankBadge(sid);
        assertEq(snak.ownerOf(tokenId), p2);
    }

    function test_claimRankBadge_unfinalized_reverts() public {
        vm.startPrank(owner);
        uint256 sid = snak.startSeason(uint64(block.timestamp + 30 days));
        snak.setSeasonRank(sid, p2, 1);
        vm.stopPrank();
        vm.prank(p2);
        vm.expectRevert(Snak.SeasonNotFinalized.selector);
        snak.claimRankBadge(sid);
    }

    function test_claimRankBadge_unranked_reverts() public {
        vm.startPrank(owner);
        uint256 sid = snak.startSeason(uint64(block.timestamp + 30 days));
        vm.warp(block.timestamp + 31 days);
        snak.finalizeSeason(sid);
        vm.stopPrank();
        vm.prank(p2);
        vm.expectRevert(Snak.NotRanked.selector);
        snak.claimRankBadge(sid);
    }

    function test_finalize_earlyEnd_reverts() public {
        vm.prank(owner);
        uint256 sid = snak.startSeason(uint64(block.timestamp + 30 days));
        vm.prank(owner);
        vm.expectRevert(Snak.DeadlineNotPassed.selector);
        snak.finalizeSeason(sid);
    }

    // retention

    function test_dailyStrike_firstCall_runOne() public {
        vm.prank(p1);
        snak.dailyStrike();
        assertEq(snak.strikeRun(p1), 1);
        assertEq(snak.freeEntries(p1), 1);
    }

    function test_dailyStrike_tooSoon_reverts() public {
        vm.prank(p1);
        snak.dailyStrike();
        vm.warp(block.timestamp + 12 hours);
        vm.prank(p1);
        vm.expectRevert(Snak.StrikeTooSoon.selector);
        snak.dailyStrike();
    }

    function test_dailyStrike_resetsAfterGrace() public {
        vm.prank(p1);
        snak.dailyStrike();
        vm.warp(block.timestamp + 60 hours);
        vm.prank(p1);
        snak.dailyStrike();
        assertEq(snak.strikeRun(p1), 1);
    }

    function test_dailyStrike_7dayBonus() public {
        for (uint256 i; i < 7; i++) {
            vm.warp(block.timestamp + 24 hours);
            vm.prank(p1);
            snak.dailyStrike();
        }
        // run = 7 → 4. credits: 1+1+1+1+1+1+4 = 10
        assertEq(snak.strikeRun(p1), 7);
        assertEq(snak.freeEntries(p1), 10);
    }

    function test_setIntroducer_records() public {
        vm.prank(p2);
        snak.setIntroducer(p1);
        assertEq(snak.introducerOf(p2), p1);
        assertEq(snak.introductionCount(p1), 1);
        assertEq(snak.freeEntries(p1), 2);
    }

    function test_setIntroducer_self_reverts() public {
        vm.prank(p2);
        vm.expectRevert(Snak.CannotIntroduceSelf.selector);
        snak.setIntroducer(p2);
    }

    // pause

    function test_pause_blocksJoin() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(owner);
        snak.pause();
        vm.prank(p2);
        vm.expectRevert();
        snak.joinMatch(id);
    }

    // rescue

    function test_rescue_recoversStake_afterGrace() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);

        vm.warp(block.timestamp + 1 hours + 3 days + 1);
        uint256 before_ = stable.balanceOf(p2);
        vm.prank(p2);
        snak.rescueStake(id);
        assertEq(stable.balanceOf(p2) - before_, STAKE);
    }

    function test_rescue_beforeGrace_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.warp(block.timestamp + 2 hours);
        vm.prank(p2);
        vm.expectRevert(Snak.RescueNotYet.selector);
        snak.rescueStake(id);
    }

    function test_rescue_afterSettlement_reverts() public {
        uint256 id = _runMatchToSettlement();
        vm.warp(block.timestamp + 3 days + 1);
        vm.prank(p2);
        vm.expectRevert(Snak.MatchNotOpen.selector);
        snak.rescueStake(id);
    }

    function test_rescue_twice_reverts() public {
        uint256 id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.warp(block.timestamp + 1 hours + 3 days + 1);
        vm.startPrank(p2);
        snak.rescueStake(id);
        vm.expectRevert(Snak.AlreadyRescued.selector);
        snak.rescueStake(id);
        vm.stopPrank();
    }

    // helpers

    function _open(uint128 stake, uint16 maxP, uint256 duration) internal returns (uint256 id) {
        vm.prank(p1);
        id = snak.createMatch(stake, maxP, uint64(block.timestamp + duration));
    }

    function _runMatchToSettlement() internal returns (uint256 id) {
        id = _open(STAKE, 4, 1 hours);
        vm.prank(p2);
        snak.joinMatch(id);
        vm.prank(p3);
        snak.joinMatch(id);
        vm.startPrank(scorer);
        snak.submitScore(id, p2, 100);
        snak.submitScore(id, p3, 900);
        vm.stopPrank();
        vm.warp(block.timestamp + 2 hours);
        snak.settleMatch(id);
    }
}
