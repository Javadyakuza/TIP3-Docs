import { parseUnits } from 'ethers';
import {
  ProviderRpcClient as PRC,
  Address,
  Contract,
  Transaction,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import { extractPubkey } from '../helpers/extractPubkey';
import { getWalletData } from '../helpers/getTWDataFromMW';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function transferTokenCon(
  tokenRootAddress: string,
  receiverMWAddress: string,
  senderMWAddress: string,
  tokenAmount: string
): Promise<Address | string | Transaction | undefined> {
  // setting up the provider
  let provider: PRC, senderAddress: Address;
  try {
    [provider, senderAddress] = await useProviderInfo();

    if (!isValidEverAddress(provider, tokenRootAddress)) {
      toast('Please enter a valid token root address !', 0);

      return 'Failed';
    }
    if (!isValidEverAddress(provider, receiverMWAddress)) {
      toast('Please enter a valid receiver multi wallet address !', 0);

      return 'Failed';
    }

    if (!isValidEverAddress(provider, senderMWAddress)) {
      toast('Please enter a valid sender multi wallet address !', 0);

      return 'Failed';
    }
    const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

    // creating an instance of the target contracts
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );

    const senderMWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> =
      new provider.Contract(
        tip3Artifacts.factorySource['MultiWalletTIP3'],
        new Address(senderMWAddress)
      );

    const receiverMWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> =
      new provider.Contract(
        tip3Artifacts.factorySource['MultiWalletTIP3'],
        new Address(receiverMWAddress)
      );
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    // checking if the sender has enough tokens to send
    if (
      (await getWalletData(senderMWContract, tokenRootContract.address)).balance <
      parseUnits(tokenAmount, decimals)
    ) {
      toast('Low balance !', 0);

      return 'Failed';
    }
    const senderPubkey: string = await extractPubkey(provider, senderAddress);

    // Checking recipient has a deploy wallet of that token root
    const recipientOldWalletData = await getWalletData(
      receiverMWContract,
      tokenRootContract.address
    );

    const oldBal = recipientOldWalletData.balance;
    let deployWalletValue = '0';
    if (recipientOldWalletData.tokenWallet.toString() == zeroAddress) {
      deployWalletValue = parseUnits('2', 9).toString();
    }

    // Transferring token
    const { transaction: transferRes } = await senderMWContract.methods
      .transfer({
        _amount: parseUnits(tokenAmount, decimals).toString(),
        _recipient: receiverMWContract.address,
        _deployWalletValue: deployWalletValue,
        _tokenRoot: tokenRootContract.address,
      })
      .sendExternal({ publicKey: senderPubkey });

    if (transferRes.aborted) {
      toast(`Transaction aborted !: ${transferRes.exitCode}`, 0);

      return `Failed ${transferRes.exitCode}`;
    } else {
      const newBal = (await getWalletData(receiverMWContract, tokenRootContract.address)).balance;
      // Checking if the tokens are received successfully
      if (newBal > oldBal) {
        toast(`${tokenAmount} ${symbol}'s transferred successfully`, 1);

        return `tx Hash: ${transferRes.id.hash}`;
      } else {
        toast('Transferring tokens failed', 0);

        return `tx Hash: ${(transferRes.exitCode, transferRes.exitCode)}`;
      }
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}

export async function transferTokenToWalletCon(
  tokenRootAddress: string,
  receiverMWAddress: string,
  senderMWAddress: string,
  tokenAmount: string
): Promise<Address | string | Transaction | undefined> {
  // setting up the provider
  let provider: PRC, senderAddress: Address;
  try {
    [provider, senderAddress] = await useProviderInfo();

    if (!isValidEverAddress(provider, tokenRootAddress)) {
      toast('Please enter a valid token root address !', 0);

      return 'Failed';
    }
    if (!isValidEverAddress(provider, receiverMWAddress)) {
      toast('Please enter a valid receiver multi wallet address !', 0);

      return 'Failed';
    }

    if (!isValidEverAddress(provider, senderMWAddress)) {
      toast('Please enter a valid sender multi wallet address !', 0);

      return 'Failed';
    }

    // creating an instance of the target contracts
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );

    const senderMWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> =
      new provider.Contract(
        tip3Artifacts.factorySource['MultiWalletTIP3'],
        new Address(senderMWAddress)
      );

    const receiverMWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> =
      new provider.Contract(
        tip3Artifacts.factorySource['MultiWalletTIP3'],
        new Address(receiverMWAddress)
      );
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    // checking if the sender has enough tokens to send
    if (
      (await getWalletData(senderMWContract, tokenRootContract.address)).balance <
      parseUnits(tokenAmount, decimals)
    ) {
      toast('Low balance !', 0);

      return 'Failed';
    }
    const senderPubkey: string = await extractPubkey(provider, senderAddress);

    // Checking recipient has a deploy wallet of that token root
    const recipientOldWalletData = await getWalletData(
      receiverMWContract,
      tokenRootContract.address
    );

    const oldBal = recipientOldWalletData.balance;

    // Transferring token
    const { transaction: transferRes } = await senderMWContract.methods
      .transferToWallet({
        _amount: parseUnits(tokenAmount, decimals).toString(),
        _recipientTokenWallet: recipientOldWalletData.tokenWallet,
        _tokenRoot: tokenRootContract.address,
      })
      .sendExternal({ publicKey: senderPubkey });

    if (transferRes.aborted) {
      toast(`Transaction aborted !: ${transferRes.exitCode}`, 0);

      return `Failed ${transferRes.exitCode}`;
    } else {
      const newBal = (await getWalletData(receiverMWContract, tokenRootContract.address)).balance;
      // Checking if the tokens are received successfully
      if (newBal > oldBal) {
        toast(`${tokenAmount} ${symbol}'s transferred successfully`, 1);

        return `tx Hash: ${transferRes.id.hash}`;
      } else {
        toast('Transferring tokens failed', 0);

        return `tx Hash: ${(transferRes.exitCode, transferRes.exitCode)}`;
      }
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
