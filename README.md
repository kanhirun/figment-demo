# Figment demo

## Getting started

```
$ pnpm install
$ cp .env.example .env
```

Set `FIGMENT_API_KEY` in `.env`.

## Running scripts

Create wallet that acts as your source of funds:
```
$ solana-keygen new --outfile ~/.config/solana/id.json
```

Fund the account via airdrop:

```
$ solana airdrop 5 -u devnet -k ~/.config/solana/id.json
```

You can also fund online: `https://faucet.solana.com/`

Running staking operations:

```
$ pnpm run delegate-1-sol

$ pnpm run rewards-last-month

$ pnpm run undelegate <your-stake-account-address>
```

Your stake account address can be found on the solana explorer via explorer link.
