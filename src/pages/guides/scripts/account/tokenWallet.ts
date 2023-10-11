import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function deployTokenWalletEip(
  tokenRootAddress: string
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

  try {
    // creating an instance of the token root contract
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );
    // Checking if the user already doesn't have the any wallet of that token root

    if (
      (
        await provider.getFullContractState({
          address: (
            await tokenRootContract.methods
              .walletOf({ answerId: 0, walletOwner: senderAddress })
              .call()
          ).value0,
        })
      ).state?.isDeployed
    ) {
      toast('You already have a Wallet of this token !', 0);

      return 'Failed';
    }

    // Deploying a new contract if didn't exist before
    const deployWalletRes: Transaction = await tokenRootContract.methods
      .deployWallet({
        answerId: 0,
        walletOwner: senderAddress,
        deployWalletValue: ethers.parseUnits('2', 9).toString(),
      })
      .send({
        from: senderAddress,
        amount: ethers.parseUnits('4', 9).toString(),
        bounce: false, // Important to be set to false in order to keep the sent amount in the token wallet contract
      });
    if (deployWalletRes.aborted) {
      toast(`Transaction aborted ! ${deployWalletRes.exitCode}`, 0);

      return deployWalletRes;
    }
    // Checking if the user already doesn't have the any wallet of that token root

    if (
      (
        await provider.getFullContractState({
          address: (
            await tokenRootContract.methods
              .walletOf({ answerId: 0, walletOwner: senderAddress })
              .call()
          ).value0,
        })
      ).state?.isDeployed
    ) {
      toast('Token Wallet successfully deployed !', 1);

      return `TOken wallet deployed to: ${(
        await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: senderAddress }).call()
      ).value0.toString()}`;
    } else {
      toast('The token wallet deployment failed !', 0);

      return 'Failed';
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
