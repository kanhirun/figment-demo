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
  type Address,
  type TransactionSigner,
} from "@solana/kit";
import {
  getDelegateStakeInstruction,
  getInitializeInstruction,
} from "@solana-program/stake";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  FIGMENT_DEVNET_VALIDATOR_VOTE_ACCOUNT_ADDRESS,
  DEVNET_RPC_URL,
  DEVNET_WS_URL,
  STAKE_ACCOUNT_SIZE,
  STAKE_CONFIG_ADDRESS,
  STAKE_HISTORY_SYSVAR,
  STAKE_PROGRAM_ADDRESS,
  SYSTEM_PROGRAM_ADDRESS,
} from "./constants";
import { type SOL } from './core';

/**
 * Delegates SOL to the Figment validator on devnet and returns a block explorer link.
 *
 * @param owner - The transaction signer (wallet) that will stake SOL
 * @param amountSol - Amount of SOL to stake (as a number)
 * @returns A Solana Explorer link to the delegation transaction
 */
export async function delegateStake(
  owner: TransactionSigner<string>,
  amountSol: SOL
): Promise<string> {
  const rpc = createSolanaRpc(devnet(DEVNET_RPC_URL));
  const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(DEVNET_WS_URL));

  const stakeAccount = await generateKeyPairSigner();
  const rentExemptBalance = await rpc
    .getMinimumBalanceForRentExemption(STAKE_ACCOUNT_SIZE)
    .send();
  const stakeAmountLamports = lamports(BigInt(amountSol * 1e9));
  const totalLamports = rentExemptBalance + stakeAmountLamports;

  const createStakeAccountInstruction = getCreateAccountInstruction({
    payer: owner,
    newAccount: stakeAccount,
    lamports: totalLamports,
    space: STAKE_ACCOUNT_SIZE,
    programAddress: STAKE_PROGRAM_ADDRESS,
  });

  const initStakeAccountInstruction = getInitializeInstruction({
    stake: stakeAccount.address,
    arg0: {
      staker: owner.address,
      withdrawer: owner.address,
    },
    arg1: {
      unixTimestamp: 0n,
      epoch: 0n,
      custodian: SYSTEM_PROGRAM_ADDRESS,
    },
  });

  const delegateStakeInstruction = getDelegateStakeInstruction({
    stake: stakeAccount.address,
    vote: address(FIGMENT_DEVNET_VALIDATOR_VOTE_ACCOUNT_ADDRESS),
    stakeHistory: STAKE_HISTORY_SYSVAR,
    unused: STAKE_CONFIG_ADDRESS,
    stakeAuthority: owner,
  });

  // Get latest blockhash with lastValidBlockHeight
  const { value: latestBlockhashInfo } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(owner.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhashInfo, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [createStakeAccountInstruction, initStakeAccountInstruction, delegateStakeInstruction],
        tx
      )
  );

  const signedTransaction = await signTransactionMessageWithSigners(
    transactionMessage
  );

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  await sendAndConfirmTransaction(signedTransaction as any, {
    commitment: "confirmed",
  });

  // Get transaction signature
  const signature = getSignatureFromTransaction(signedTransaction);

  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
