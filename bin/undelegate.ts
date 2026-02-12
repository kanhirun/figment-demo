#!/usr/bin/env npx tsx

import { 
  type Address,
  createKeyPairSignerFromBytes
} from "@solana/kit";
import { undelegateTokens } from "@/sdk/delegation";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEFAULT_KEYPAIR_PATH = path.join(os.homedir(), ".config", "solana", "id.json");

async function main(): Promise<void> {
  const stakeAccountAddress = process.argv[2] as Address;
  const keypairPath = process.argv[3] || DEFAULT_KEYPAIR_PATH;

  if (!stakeAccountAddress) {
    console.error(`
Error: Stake account address is required

Usage: pnpm undelegate <stake-account-address> [path-to-keypair.json]
Default keypair path: ~/.config/solana/id.json

Example:
  pnpm undelegate 7YvPGLaNQQUzT9z8KtrZceH3VVXJzXMvxKYRLSqTi6w6
`);
    process.exit(1);
  }

  console.log(`Loading keypair from: ${keypairPath}`);

  if (!fs.existsSync(keypairPath)) {
    console.error(`
Error: Keypair file not found at ${keypairPath}

Usage: pnpm undelegate <stake-account-address> [path-to-keypair.json]
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
Stake account: ${stakeAccountAddress}
Deactivating stake...`
  );

  const explorerUrl = await undelegateTokens(stakeAccountAddress, signer);

  console.log("Deactivation successful!");
  console.log(`Explorer: ${explorerUrl}`);
  console.log(`
Note: The stake will become inactive after the current epoch ends.
After deactivation completes, you can withdraw the funds with a separate transaction.`
  );
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
