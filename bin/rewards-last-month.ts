#!/usr/bin/env npx tsx

import { Temporal } from "@js-temporal/polyfill";
import { address } from "@solana/kit";
import { getRewardsSummary } from "@/api/rewards";
import { USER_MAINNET_STAKE_ACCOUNT } from "@/constants";
import env from "@/env";

async function main(): Promise<void> {
  const previousMonth = Temporal.Now.plainDateISO().subtract({ months: 1 }).toString();
  const now = Temporal.Now.plainDateISO().toString();

  console.log(`Fetching rewards for stake account: ${USER_MAINNET_STAKE_ACCOUNT}`);
  console.log(`Period: ${previousMonth} to ${now}\n`);

  const rewardResponse = await getRewardsSummary(
    address(USER_MAINNET_STAKE_ACCOUNT), { start: previousMonth, end: now }
  )(env);

  console.log("Rewards Summary:");
  console.log(JSON.stringify(rewardResponse, null, 2));
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
