import {
  type Address,
} from "@solana/kit";
import {
  type TRewardSummary,
  type TDateString,
  type TReader,
  type TEnv,
} from '@/core';

/**
 * Fetches reward summary for a stake account via Figment Rewards API.
 *
 * @param forAddress - The stake account address to query rewards for
 * @returns `IRewardSummary`
 */
export const getRewardsSummary = (
  forAddress: Address,
  args: {
    start: TDateString,
    end: TDateString
  }
): TReader<TEnv, Promise<TRewardSummary>> => {
  const address = forAddress;
  const { start, end } = args;

  const reader = async (env: TEnv) => {
    const url = `https://${env.FIGMENT_API_HOSTNAME}/solana/rewards`;
    const options = {
      method: 'POST',
      headers: {
        'x-api-key': env.FIGMENT_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stake_accounts: [address],
        start,
        end,
      })
    };
    return fetch(url, options).then(res => res.json());
  };

  return reader;
}
