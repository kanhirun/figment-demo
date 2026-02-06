import env from './config';

export type SOL = number;

export type Env = typeof env;
export type DateString = string;
export type IReader<E, A> = (env: E) => A
