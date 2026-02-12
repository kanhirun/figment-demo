#!/usr/bin/env npx tsx

import { createKeyPairSignerFromBytes } from "@solana/kit";
import { type SOL } from '../lib/core';
import { delegateTokens } from "@/sdk/delegation";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const STAKE_AMOUNT: SOL = 1;
const DEFAULT_KEYPAIR_PATH = path.join(os.homedir(), ".config", "solana", "id.json");

async function main(): Promise<void> {
  const keypairPath = process.argv[2] || DEFAULT_KEYPAIR_PATH;

  console.log(`Loading keypair from: ${keypairPath}`);

  if (!fs.existsSync(keypairPath)) {
    console.error(`
Error: Keypair file not found at ${keypairPath}

Usage: pnpm delegate [path-to-keypair.json]
Default path: ~/.config/solana/id.json

To create a new keypair:
  solana-keygen new --outfile ~/.config/solana/id.json

Then fund it with devnet SOL:
https://faucet.solana.com`
    );
    process.exit(1);
  }

  const keypairBytes = new Uint8Array(
    JSON.parse(fs.readFileSync(keypairPath, "utf8"))
  );
  const signer = await createKeyPairSignerFromBytes(keypairBytes);

  console.log(`
Wallet address: ${signer.address}
Delegating ${STAKE_AMOUNT} SOL to Figment validator...`
);

  const explorerUrl = await delegateTokens(signer, STAKE_AMOUNT);

  console.log("Delegation successful!");
  console.log(`Explorer: ${explorerUrl}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
