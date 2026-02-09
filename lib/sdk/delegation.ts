/**
 * Solana stake delegation module.
 *
 * This module provides functionality for staking and unstaking accounts
 * to the Figment validator on Solana devnet.
 */

import {
  address,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  devnet,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type TransactionSigner,
  type Address,
} from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getDeactivateInstruction,
  getDelegateStakeInstruction,
  getInitializeInstruction,
} from "@solana-program/stake";
import {
  // TODO: Explain how I got this from the validator identity address?
  FIGMENT_DEVNET_VALIDATOR_VOTE_ACCOUNT_ADDRESS,
  DEVNET_RPC_URL,
  DEVNET_WS_URL,
  // TODO: Get values from @solana-program/stake, remove from @/constants
  STAKE_ACCOUNT_SIZE,
  STAKE_CONFIG_ADDRESS,
  STAKE_HISTORY_SYSVAR,
  STAKE_PROGRAM_ADDRESS,
  SYSTEM_PROGRAM_ADDRESS,
} from "@/constants";
import {
  type SOL,
  type TUrl,
} from '@/core';

/**
 * Delegates SOL stake to the Figment validator on Solana devnet.
 *
 * Creates a new stake account, initializes it, and delegates the specified amount
 * of SOL to the Figment devnet validator. The transaction is signed and confirmed
 * on-chain.
 *
 * @param from - The payer that will fund and authorize the stake account.
 * @param stakeAmount - The amount of SOL to delegate (in whole SOL units).
 * @returns A promise that resolves to a Solana Explorer URL for the confirmation tx.
 */
export const delegate = async (
  // Question: we are assuming here that the signer = authority?
  from: TransactionSigner<string>,
  stakeAmount: SOL
): Promise<TUrl> => {
  const payer = from;

  const rpc = createSolanaRpc(devnet(DEVNET_RPC_URL));
  const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(DEVNET_WS_URL));

  const stakeAccount = await generateKeyPairSigner();  // CREATE2 analogy?
  const rentExemptBalance = await rpc
    .getMinimumBalanceForRentExemption(STAKE_ACCOUNT_SIZE)
    .send();
  const stakeAmountLamports = lamports(BigInt(stakeAmount * 1e9));
  const totalLamports = rentExemptBalance + stakeAmountLamports;

  const createStakeAccountInstruction = getCreateAccountInstruction({
    payer,
    newAccount: stakeAccount,
    lamports: totalLamports,
    space: STAKE_ACCOUNT_SIZE,
    programAddress: STAKE_PROGRAM_ADDRESS,
  });

  const initStakeAccountInstruction = getInitializeInstruction({
    stake: stakeAccount.address,
    arg0: {
      staker: payer.address,
      withdrawer: payer.address,
    },
    arg1: {
      unixTimestamp: 0n,
      epoch: 0n,
      custodian: SYSTEM_PROGRAM_ADDRESS,
    },
  });

  const delegateStakeInstruction = getDelegateStakeInstruction({
    stake: stakeAccount.address,
    // TODO: Inject me via reader
    vote: address(FIGMENT_DEVNET_VALIDATOR_VOTE_ACCOUNT_ADDRESS),
    stakeHistory: STAKE_HISTORY_SYSVAR,
    unused: STAKE_CONFIG_ADDRESS,
    stakeAuthority: payer,
  });

  const { value: latestBlockhashInfo } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(payer.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhashInfo, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [createStakeAccountInstruction, initStakeAccountInstruction, delegateStakeInstruction],
        tx
      )
  );

  const signedTx = await signTransactionMessageWithSigners(
    transactionMessage
  );

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  // TODO: Fix type issue
  await sendAndConfirmTransaction(signedTx as any, {
    commitment: "confirmed",
  });

  const sig = getSignatureFromTransaction(signedTx);

  // Fix: cluster param depends on ctx
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

/**
 * Undelegates a stake account from the Figment validator on Solana devnet.
 *
 * This initiates the deactivation process for a previously delegated stake account.
 * After the current epoch ends, the stake becomes inactive and can be withdrawn.
 * Note: The actual withdrawal of funds requires a separate withdraw transaction
 * after the cooldown period completes.
 *
 * @param fromStakeAccountAddress - The stake account to deactivate
 * @param byAuthorized - The stake authority signer authorized to deactivate 
 * @returns A promise that resolves to a Solana Explorer URL for the deactivation tx.
 */
export const undelegate = async (
  fromStakeAccountAddress: Address,
  byAuthorized: TransactionSigner<string>,
): Promise<TUrl> => {
  const stakeAuthority = byAuthorized;
  const stakeAccountAddress = address(fromStakeAccountAddress);
  const rpc = createSolanaRpc(devnet(DEVNET_RPC_URL));
  const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(DEVNET_WS_URL));

  const deactivateInstruction = getDeactivateInstruction({
    stake: address(stakeAccountAddress),
    stakeAuthority,
  });

  const { value: latestBlockhashInfo } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(stakeAuthority.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhashInfo, tx),
    (tx) => appendTransactionMessageInstructions([deactivateInstruction], tx)
  );

  const signedTx = await signTransactionMessageWithSigners(transactionMessage);

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  // TODO: Fix type issue
  await sendAndConfirmTransaction(signedTx as any, {
    commitment: "confirmed",
  });

  const sig = getSignatureFromTransaction(signedTx);

  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}
