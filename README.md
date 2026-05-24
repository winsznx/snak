# snak

> Sats-staked snake battle royale. Last serpent alive takes the pool.

Onchain snake matches with cUSD entry fees and prize-pool settlement on Celo.

- Live worker: <https://snak.timjosh507.workers.dev>
- Network: Celo mainnet (chain id 42220)
- Snak contract: [`0x5f134731bd668071a0bcebfd9ddfd243f63ce424`](https://celoscan.io/address/0x5f134731bd668071a0bcebfd9ddfd243f63ce424)
- Settlement token: cUSD ([`0x765DE816845861e75A25fCA122bb6898B8B1282a`](https://celoscan.io/address/0x765DE816845861e75A25fCA122bb6898B8B1282a))

## Stack

- Next.js 16 on Cloudflare Workers via OpenNext
- React 19 + TypeScript
- Tailwind CSS v4
- wagmi v3 + viem v2 for chain reads/writes
- Foundry for the arena contracts

## Develop

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Deploy

```bash
pnpm exec opennextjs-cloudflare build
pnpm exec opennextjs-cloudflare deploy
```

Build-time env: `NEXT_PUBLIC_SNAK_ADDRESS`, `NEXT_PUBLIC_CUSD_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID`.

## Contracts

```bash
forge build
forge test
```

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Marketing landing + live arena status |
| `/play` | Create or join a match, settle prizes |
| `/leaderboard` | All-time activity, ranked by total actions |

## License

MIT — see [LICENSE](./LICENSE).
