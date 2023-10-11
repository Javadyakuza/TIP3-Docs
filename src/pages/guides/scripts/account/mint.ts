import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function mintTip3Eip(
  tokenRootAddress: string,
  amount: string,
  recipient: string
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
  if (!isValidEverAddress(provider, recipient)) {
    toast('Please enter a valid recipient address !', 0);

    return 'Failed';
  }
  try {
    // creating an instance of the token root contract
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    // Checking if receiver has a wallet of this token root to specify the deployWalletValue parameter
    let deployWalletValue = 0;
    if (
      !(
        await provider.getFullContractState({
          address: (
            await tokenRootContract.methods
              .walletOf({ answerId: 0, walletOwner: new Address(recipient) })
              .call()
          ).value0,
        })
      ).state?.isDeployed
    ) {
      deployWalletValue = 3 * 10 ** 9;
    }

    // Deploying a new contract if didn't exist before
    const mintRes: Transaction = await tokenRootContract.methods
      .mint({
        amount: ethers.parseUnits(amount, Number(decimals)).toString(),
        recipient: new Address(recipient),
        deployWalletValue: deployWalletValue,
        notify: false,
        payload: '',
        remainingGasTo: senderAddress,
      })
      .send({
        from: senderAddress,
        amount: ethers.parseUnits(deployWalletValue == 0 ? '3' : '5', 9).toString(),
        bounce: true,
      });

    if (mintRes.aborted) {
      toast(`Transaction aborted ! ${mintRes.exitCode}`, 0);

      return mintRes;
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient token wallet balance
    const recipientTWAddress = (
      await tokenRootContract.methods
        .walletOf({ answerId: 0, walletOwner: new Address(recipient) })
        .call({})
    ).value0;

    const recipientTWCon = new provider.Contract(
      tip3Artifacts.factorySource.TokenWallet,
      recipientTWAddress
    );
    const recipientBal = ethers.formatUnits(
      (await recipientTWCon.methods.balance({ answerId: 0 }).call({})).value0,
      Number(decimals)
    );

    if (recipientBal >= amount) {
      toast(`${amount} ${symbol}'s successfully minted for recipient !`);

      return `Hash: ${mintRes.id.hash} \n recipient ${symbol} balance: ${recipientBal}`;
    } else {
      toast('Minting tokens failed !', 0);

      return `Failed \n 
      ${(mintRes.exitCode, mintRes.resultCode)}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
