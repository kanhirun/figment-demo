import env from './env';

export type TRewardSummary = any;

export type SOL = number;

export type TUrl = string;
export type TEnv = typeof env;
export type TDateString = string;
export type TReader<E, A> = (env: E) => A
