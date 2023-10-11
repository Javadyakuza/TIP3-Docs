import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

// candle is the person whose tokens is going to be burnt
export async function burnByRootTip3Eip(
  tokenRootAddress: string,
  candleAddress: string,
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
  if (!isValidEverAddress(provider, candleAddress)) {
    toast('Please enter a valid recipient address !', 0);

    return 'Failed';
  }

  try {
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );
    const tokenWalletAddress = (
      await tokenRootContract.methods
        .walletOf({ answerId: 0, walletOwner: new Address(candleAddress) })
        .call()
    ).value0;

    if (
      (await tokenRootContract.methods.rootOwner({ answerId: 0 }).call()).value0 == senderAddress
    ) {
      toast(' You are not the root owner !!', 0);

      return 'Failed';
    }
    if (
      !(
        await provider.getFullContractState({
          address: tokenWalletAddress,
        })
      ).state?.isDeployed
    ) {
      toast("Recipient doesn't have any tokens to burn !", 0);

      return 'Failed';
    }

    // creating an instance of the token root contract
    const tokenWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenWallet'],
      tokenWalletAddress
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
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
        walletOwner: new Address(candleAddress),
        payload: '',
        remainingGasTo: senderAddress,
        callbackTo: new Address(zeroAddress),
      })
      .send({
        from: senderAddress,
        amount: ethers.parseUnits('1', 9).toString(),
        bounce: true,
      });

    if (burnRes.aborted) {
      toast(`Transaction aborted ! ${(burnRes.exitCode, burnRes.resultCode)}`, 0);

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
