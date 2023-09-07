import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../src/helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

export async function burnByRootTip3Eip(
  tokenRootAddress: string,
  amount: string
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
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );
    const tokenWalletAddress = (
      await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: senderAddress }).call()
    ).value0;

    if (
      !(
        await provider.getFullContractState({
          address: tokenWalletAddress,
        })
      ).state?.isDeployed
    ) {
      toast('You dont have tokens to burn !', 0);

      return 'Failed';
    }

    // creating an instance of the token root contract
    const tokenWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenWallet'],
      tokenWalletAddress
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0,
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    const oldBal = ethers.formatUnits(
      (await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0,
      Number(decimals)
    );
    // Deploying a new contract if didn't exist before
    const burnRes: Transaction = await tokenRootContract.methods
      .burnTokens({
        amount: ethers.parseUnits(amount, Number(decimals)).toString(),
        walletOwner: senderAddress,
        payload: '',
        remainingGasTo: senderAddress,
        callbackTo: new Address(zeroAddress),
      })
      .send({
        from: senderAddress,
        amount: ethers.parseUnits('3', 9).toString(),
      });

    if (burnRes.aborted) {
      toast(`Transaction aborted ! ${burnRes.exitCode}`, 0);

      return burnRes;
    }

    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBal = ethers.formatUnits(
      (await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0,
      Number(decimals)
    );

    if (oldBal >= newBal) {
      toast(`${amount} ${symbol}'s successfully burnt !`);

      return `Hash: ${burnRes.id.hash} \n old Balance  ${oldBal} \n New balance: ${newBal}`;
    } else {
      toast('Burning tokens failed !', 0);

      return `Failed \n 
      ${(burnRes.exitCode, burnRes.resultCode)}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
