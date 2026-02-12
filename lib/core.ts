import env from './env';
import { type Address } from '@solana/kit';

export type TRewardSummary = any;

export type SOL = number;

export type TUrl = string;
export type TEnv = typeof env;
export type TDateString = string;
export type TReader<E, A> = (env: E) => A;

export type TStakeContext = {
  rpcUrl: TUrl;
  wsUrl: TUrl;
  cluster: 'devnet';
  validatorVoteAccountAddress: Address;
};
