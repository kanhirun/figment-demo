import { address, type Address } from "@solana/kit";
import { type TStakeContext } from './core';

export const USER_MAINNET_STAKE_ACCOUNT = 
  "4uEX6TQgZ3Zn4iXcjMDSnvEgEHpERa2YsguvCUNajx2B";

const FIGMENT_DEVNET_VALIDATOR_VOTE_ACCOUNT_ADDRESS =
  "5ZWgXcyqrrNpQHCme5SdC5hCeYb2o3fEJhF7Gok3bTVN";

export const DEVNET_RPC_URL = "https://api.devnet.solana.com";
export const DEVNET_WS_URL  = "wss://api.devnet.solana.com";

export const STAKE_ACCOUNT_SIZE = 200n;
export const STAKE_CONFIG_ADDRESS =
  "StakeConfig11111111111111111111111111111111" as Address;
export const STAKE_HISTORY_SYSVAR =
  "SysvarStakeHistory1111111111111111111111111" as Address;

export const FIGMENT_DEVNET_STAKE_CONTEXT: TStakeContext = {
  rpcUrl: DEVNET_RPC_URL,
  wsUrl: DEVNET_WS_URL,
  cluster: 'devnet',
  validatorVoteAccountAddress: address(FIGMENT_DEVNET_VALIDATOR_VOTE_ACCOUNT_ADDRESS),
};
