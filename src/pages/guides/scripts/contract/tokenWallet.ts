import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import { extractPubkey } from '../helpers/extractPubkey';
import { getWalletData } from '../helpers/getTWDataFromMW';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function deployTokenWalletCon(
  tokenRootAddress: string,
  multiWalletAddress: string
): Promise<Address | string | Transaction | undefined | any> {
  // setting up the provider
  let provider: PRC, senderAddress: Address;
  try {
    [provider, senderAddress] = await useProviderInfo();
  } catch (e: any) {
    throw new Error(e.message);
  }
  if (!isValidEverAddress(provider, tokenRootAddress)) {
    toast('Please enter a valid token root address !', 0);

    return 'Failed';
  }

  if (!isValidEverAddress(provider, multiWalletAddress)) {
    toast('Please enter a valid multi wallet address !', 0);

    return 'Failed';
  }

  try {
    // creating an instance of the token root contract
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );
    // creating an instance of the token root contract
    const MultiWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['MultiWalletTIP3'],
      new Address(multiWalletAddress)
    );
    // Fetching the decimals
    const symbol: string = (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0;

    // Checking if the user already doesn't have the any wallet of that token root

    const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

    if (
      (
        await getWalletData(MultiWalletContract, tokenRootContract.address)
      ).tokenWallet.toString() != zeroAddress
    ) {
      toast('You already have a Wallet of this token !', 0);

      return 'Failed';
    }

    // Deploying a new contract if didn't exist before
    const { transaction: deployWalletRes } = await MultiWalletContract.methods
      .deployWallet({
        _deployWalletBalance: ethers.parseUnits('2', 9).toString(),
        _tokenRoot: tokenRootContract.address,
      })
      .sendExternal({
        publicKey: await extractPubkey(provider, senderAddress),
      });
    if (deployWalletRes.aborted) {
      toast(`Transaction aborted ! ${deployWalletRes.exitCode}`, 0);

      return deployWalletRes;
    }
    // Checking if the user already doesn't have the any wallet of that token root

    if (
      (
        await getWalletData(MultiWalletContract, tokenRootContract.address)
      ).tokenWallet.toString() != zeroAddress
    ) {
      toast('Token Wallet successfully deployed !', 1);

      return `${symbol}'s token wallet deployed to: ${(
        await getWalletData(MultiWalletContract, tokenRootContract.address)
      ).tokenWallet.toString()}`;
    } else {
      toast('The token wallet deployment failed !', 0);

      return `Failed ${(deployWalletRes.exitCode, deployWalletRes.resultCode)}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return `Failed ${e.message}`;
  }
}
