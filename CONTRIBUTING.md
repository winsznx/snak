# Contributing

## Setup

```bash
pnpm install
```

Foundry needed for anything in `contracts/`.

## Branch + commits

- Branch off `main`, one concern per branch.
- Brief, specific commit messages. Lowercase prefix (`/play:`, `Header:`, `cusd:`).
- No co-authored-by, no backdating, no `--no-verify`.

## Checks

```bash
pnpm lint
pnpm exec tsc --noEmit
forge test
```

## UI

- The neon palette (`cyan`, `magenta`, `toxic`) is part of the brand — use the tokens, don't introduce ad-hoc hex.
- Grid pattern + scanline live in `globals.css`. Don't double-stack them inside components.
- Reduced-motion users must not see `animate-pulse-neon`. Gate it via `usePrefersReducedMotion`.

## Solidity

- Custom errors only.
- Reentrancy guards on every cUSD-moving external function.
- Events with indexed player on the first slot where possible.
