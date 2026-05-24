# Security

## Reporting

Open a private security advisory on the repo for anything that lets a player:

- Claim a prize they didn't win
- Mint a rank badge they didn't earn
- Drain or grief escrowed stakes outside the documented `forfeit` / `rescueStake` paths
- Bypass the scorer-key signature requirement

## Out of scope

- Front-end XSS that requires attacker-injected JS
- Forno RPC reachability
- Anything requiring the owner or scorer key to first leak

## Posture

`Snak.sol` uses OpenZeppelin's `ReentrancyGuard`, `Ownable`, `Pausable`. Scorer key is rotatable. `rescueStake` requires the match deadline to lapse + a 3-day delay so honest settlement always wins.
