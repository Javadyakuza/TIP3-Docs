import {
  ProviderRpcClient,
  Address,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

/**
 * We develop two more methods in order to reduce the mass of the script
 */
async function extractPubkey(
  provider: ProviderRpcClient,
  providerAddress: Address
): Promise<string> {
  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: providerAddress })
  ).state!;

  const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc);

  return senderPublicKey;
}
interface walletData {
  tokenWallet: Address;
  balance: number;
}
export async function getWalletData(
  MWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']>,
  tokenRootAddress: Address
): Promise<walletData> {
  const walletData = (await MWContract.methods.wallets().call()).wallets.map(item => {
    if (item[0].toString() == tokenRootAddress.toString()) {
      return item[1];
    }
  });
  let balance: number = 0;
  let tokenWallet: Address = tip3Artifacts.zeroAddress;
  if (walletData.length != 0) {
    balance = Number(walletData[0]!.balance);
    tokenWallet = walletData[0]!.tokenWallet;
  }
  return { tokenWallet: tokenWallet, balance: balance };
}

async function main() {
  // Initiate the TVM provider
  try {
    const tokenRootAddress: Address = new Address('<YOUR_TOKEN_ROOT_ADDRESS>');
    const receiverMWAddress: Address = new Address('<RECEIVER_MULTI_WALLET_ADDRESS>');
    const senderMWAddress: Address = new Address('<SENDER_MULTI_WALLET_ADDRESS>');

    // creating an instance of the target contracts
    const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> =
      new provider.Contract(tip3Artifacts.factorySource['TokenRoot'], tokenRootAddress);

    const senderMWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> =
      new provider.Contract(tip3Artifacts.factorySource['MultiWalletTIP3'], senderMWAddress);

    const receiverMWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> =
      new provider.Contract(tip3Artifacts.factorySource['MultiWalletTIP3'], receiverMWAddress);
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    const tokenAmount: number = 10 * 10 ** decimals;

    // checking if the sender has enough tokens to send
    if (
      (await getWalletData(senderMWContract, tokenRootContract.address)).balance <
      tokenAmount * 10 ** decimals
    ) {
      console.log('Low balance !');

      return 'Failed';
    }
    const senderPubkey: string = await extractPubkey(provider, providerAddress);
    if (senderPubkey != (await senderMWContract.methods.owner({}).call()).owner) {
      console.log('You are not the owner of the sender multi wallet contract !');

      return 'Failed';
    }
    // Checking recipient has a deploy wallet of that token root
    let recipientOldWalletData: walletData = await getWalletData(
      receiverMWContract,
      tokenRootContract.address
    );

    let oldBal: number = recipientOldWalletData.balance;

    let deployWalletValue: number = 0;

    if (recipientOldWalletData.tokenWallet.toString() == tip3Artifacts.zeroAddress.toString()) {
      deployWalletValue = 2 * 10 ** 9;
    }

    // Transferring token
    const { transaction: transferRes } = await senderMWContract.methods
      .transfer({
        _amount: tokenAmount,
        _recipient: receiverMWContract.address,
        _deployWalletValue: deployWalletValue,
        _tokenRoot: tokenRootContract.address,
      })
      .sendExternal({ publicKey: senderPubkey });

    if (transferRes.aborted) {
      console.log(`Transaction aborted !: ${(transferRes.exitCode, transferRes.resultCode)}`);
    } else {
      const newBal: number = (await getWalletData(receiverMWContract, tokenRootContract.address))
        .balance;
      // Checking if the tokens are received successfully
      if (newBal > oldBal) {
        console.log(`${tokenAmount / 10 ** decimals} ${symbol}'s transferred successfully`);

        return `tx Hash: ${transferRes.id.hash}`;
      } else {
        console.error(
          `Transferring tokens failed, tx Hash: ${(transferRes.exitCode, transferRes.exitCode)}`
        );
      }
    }
    /*
      Using transferToWallet function
    */

    // Checking recipient has a deploy wallet of that token root
    recipientOldWalletData = await getWalletData(receiverMWContract, tokenRootContract.address);

    oldBal = recipientOldWalletData.balance;

    // Transferring token
    const { transaction: transferToWalletRes } = await senderMWContract.methods
      .transferToWallet({
        _amount: tokenAmount,
        _recipientTokenWallet: recipientOldWalletData.tokenWallet,
        _tokenRoot: tokenRootContract.address,
      })
      .sendExternal({ publicKey: senderPubkey });

    if (transferToWalletRes.aborted) {
      throw new Error(
        `Transaction aborted !: ${(transferToWalletRes.exitCode, transferToWalletRes.resultCode)}`
      );
    } else {
      const newBal = (await getWalletData(receiverMWContract, tokenRootContract.address)).balance;

      // Checking if the tokens are received successfully
      if (newBal > oldBal) {
        console.log(`${tokenAmount / 10 ** decimals} ${symbol}'s transferred successfully`);

        return `tx Hash: ${transferToWalletRes.id.hash}`;
      } else {
        throw new Error(
          `Transferring tokens failed , tx Hash: ${
            (transferToWalletRes.exitCode, transferToWalletRes.exitCode)
          }`
        );
      }
    }
  } catch (e: any) {
    throw new Error(`Failed ${e.message}`);
  }
}
