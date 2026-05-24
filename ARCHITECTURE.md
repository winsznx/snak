# Architecture

Snak is a winner-take-most arena: players stake cUSD into a match, last-survivor (or top-score) takes the prize pool minus a treasury cut. The worker holds nothing — score reporting goes through an off-chain scorer key that the contract trusts.

```
Browser ── HTML/JS ──> Cloudflare Worker (Next.js 16 / OpenNext)
                              │
                              ▼
                       wagmi v3 + viem v2
                              │
                              ▼
                    forno.celo.org (reads)
                       Celo mainnet (42220)
                              │
                              ▼
                    Snak.sol
                       │     │     │
                       │     │     └── claimRankBadge (NFT)
                       │     └────── submitScore (scorer-only)
                       └─────────── createMatch / joinMatch
                              │
                              ▼
                    cUSD ERC20 (Mento Dollar)
```

## Match lifecycle

1. `createMatch(stake, maxPlayers, deadline)` — caller pays stake, becomes player #1
2. `joinMatch(matchId)` — each joiner pays stake
3. `submitScore(matchId, player, score)` — scorer key reports during play
4. `settleMatch(matchId)` — anyone can call after deadline; winner takes pool minus treasury cut, badges minted
5. `forfeit / rescueStake` — escape hatches if a match stalls

## Trust boundary

- The `scorer` key is the only address that can submit scores. Rotatable via `setScorer`.
- `treasury` collects the cut on settlement. Rotatable via `setTreasury`.
- Players control stake refunds via `forfeit` (80% back) or `rescueStake` (post-deadline).

## Why this works on Celo

cUSD is the entry fee currency. MiniPay users can join with one tap. Gas is paid in CELO but the experience is denominated in dollars.
