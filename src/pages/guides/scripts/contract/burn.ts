import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import { extractPubkey } from '../helpers/extractPubkey';
import { getWalletData } from '../helpers/getTWDataFromMW';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function burnTip3Con(
  tokenRootAddress: string,
  multiWalletAddress: string,
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

    const multiWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['MultiWalletTIP3'],
      new Address(multiWalletAddress)
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    const oldBal = (await getWalletData(multiWalletContract, tokenRootContract.address)).balance;
    if (oldBal == 0 || Number(ethers.formatUnits(String(oldBal), decimals)) < Number(amount)) {
      toast('Low balance !', 0);

      return 'Failed';
    }
    // burning tokens from a token wallet by calling the burn method
    const { transaction: burnRes } = await multiWalletContract.methods
      .burn({
        _amount: ethers.parseUnits(amount, decimals).toString(),
        _tokenRoot: tokenRootContract.address,
      })
      .sendExternal({
        publicKey: await extractPubkey(provider, senderAddress),
      });

    if (burnRes.aborted) {
      toast(`Transaction aborted ! ${burnRes.exitCode}`, 0);

      return burnRes;
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBal = (await getWalletData(multiWalletContract, tokenRootContract.address)).balance;

    if (newBal < oldBal) {
      toast(`${amount} ${symbol}'s successfully burnt !`, 1);

      return `Hash: ${burnRes.id.hash} \n old Balance  ${ethers.formatUnits(
        oldBal,
        decimals
      )} \n New balance: ${ethers.formatUnits(newBal, decimals)}`;
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
