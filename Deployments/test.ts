// Import the required libraries
import {
  ProviderRpcClient as PRC,
  Address,
  Contract,
  Transaction,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';
async function main() {
  // Initiate the TVM provider

  // Preparing the params
  const tokenRootAddress: Address = new Address('<YOUR_TOKEN_ROOT_ADDRESS>');
  const recipientAddress: Address = new Address('<RECIPIENT_ACCOUNT_ADDRESS>');

  // creating an instance of the target token root contracts
  const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> =
    new provider.Contract(tip3Artifacts.factorySource['TokenRoot'], tokenRootAddress);

  // getting the decimals of the token
  const decimals: number = Number(
    (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0
  );

  // creating an instance of the sender token wallet contract
  const tokenWallet: Contract<tip3Artifacts.FactorySource['TokenWallet']> = new provider.Contract(
    tip3Artifacts.factorySource['TokenWallet'],
    (
      await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: providerAddress }).call()
    ).value0
  );

  /**
   * we will make an instance of the recipient token wallet contract and we assign value to it if the token wallet was already deployed
   * the amount attached to the tx varies based on the mentioned subject.
   */
  let recipientTokenWallet: Contract<tip3Artifacts.FactorySource['TokenWallet']> | undefined =
    undefined;

  const receiverTokenWalletAddress = (
    await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: recipientAddress }).call()
  ).value0;

  let txFee: number = 3 * 10 ** 9;
  let oldBal: number = 0;
  let deployWalletValue: number = 0;

  if (
    !(
      await provider.getFullContractState({
        address: receiverTokenWalletAddress,
      })
    ).state?.isDeployed
  ) {
    txFee = 5 * 10 ** 9;
    deployWalletValue = 2 * 10 ** 9;
  } else {
    recipientTokenWallet = new provider.Contract(
      // Transferring the token
      tip3Artifacts.factorySource['TokenWallet'],
      receiverTokenWalletAddress
    );

    oldBal = Number((await recipientTokenWallet.methods.balance({ answerId: 0 }).call({})).value0);
  }

  let transferAmount: number = 10 ** (10 ** decimals);

  // Transferring token
  const transferRes: Transaction = await tokenWallet.methods
    .transfer({
      amount: transferAmount,
      recipient: recipientAddress,
      deployWalletValue: deployWalletValue,
      remainingGasTo: providerAddress,
      notify: false, // true if the change must be sent back to the sender wallet account not the sender token wallet
      payload: '',
    })
    .send({ from: providerAddress, amount: String(txFee), bounce: true });

  /**
   * We first verify if the transfer transaction was aborted. If it was not aborted, we proceed to check the balance of the recipient's token wallet. We compare this balance to the sum of the previous balance (oldBalance) and the amount transferred only If the user had already deployed a token wallet prior to the transfer transaction, and it was not deployed before the transaction it must have been deployed during the transaction, so we create an instance of the recipient's token wallet contract and confirm that its balance is greater than zero.
   */
  if (transferRes.aborted) {
    throw new Error(`Transaction aborted !: ${(transferRes.exitCode, transferRes.resultCode)}`);
  }
  // In this case the recipient didn't have any token wallet and one is deployed during the transfer, so we fetch it since we haven't before
  recipientTokenWallet = new provider.Contract(
    // Transferring the token
    tip3Artifacts.factorySource['TokenWallet'],
    receiverTokenWalletAddress
  );

  const newBal: number = Number(
    (await recipientTokenWallet.methods.balance({ answerId: 0 }).call({})).value0
  );
  // Checking if the tokens are received successfully
  if (newBal >= Number(transferAmount) * 10 ** decimals + oldBal) {
    console.log('tokens transferred successfully');
  } else {
    throw new Error(
      ` Transferring tokens failed \n tx Hash: ${(transferRes.exitCode, transferRes.resultCode)}`
    );
  }

  // transferring token to wallet
  const transferToWalletRes: Transaction = await tokenWallet.methods
    .transferToWallet({
      amount: transferAmount * 10 ** decimals,
      recipientTokenWallet: recipientTokenWallet.address,
      remainingGasTo: providerAddress,
      notify: false,
      payload: '',
    })
    .send({ from: providerAddress, amount: String(3 * 10 ** 9), bounce: true });

  /**
   * Checking the tokens are transferred and the receiver balance is more than before
   */
  if (transferToWalletRes.aborted) {
    throw new Error(`Transaction aborted !: ${transferRes.exitCode}`);
  }

  // newBal is actually the old balance and its fetched before utilizing the "transferToWallet" the function
  if (
    Number((await recipientTokenWallet.methods.balance({ answerId: 0 }).call({})).value0) > newBal
  ) {
    console.log('tokens transferred successfully');
    return `tx Hash: ${transferRes.id.hash}`;
  } else {
    throw new Error(`Transferring tokens failed, tx Hash: ${transferRes.id.hash}`);
  }
}
