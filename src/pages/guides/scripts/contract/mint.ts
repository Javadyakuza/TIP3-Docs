import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function mintTokenCon(
  tokenRootAddress: string,
  multiWalletAddress: string,
  mintAmount: string
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
    // Fetching the decimals and symbol
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    // Checking if the user already doesn't have the any wallet of that token root
    let tokenWalletData = (await MultiWalletContract.methods.wallets().call()).wallets.map(item => {
      if (item[0].toString() == tokenRootContract.address.toString()) {
        return item[1];
      }
    });
    const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

    let deployWalletValue = 0;

    const oldBal = Number(ethers.formatUnits(tokenWalletData[0]!.balance, decimals));

    if (tokenWalletData[0]!.tokenWallet.toString() == zeroAddress) {
      deployWalletValue = Number(ethers.parseUnits('2', 9).toString());
    }

    // Deploying a new contract if didn't exist before
    const deployWalletRes: Transaction = await tokenRootContract.methods
      .mint({
        amount: ethers.parseUnits(mintAmount, decimals).toString(),
        deployWalletValue: deployWalletValue,
        remainingGasTo: senderAddress,
        recipient: new Address(multiWalletAddress),
        notify: true,
        payload: '',
      })
      .send({
        from: senderAddress,
        amount: ethers.parseUnits(deployWalletValue == 0 ? '2' : '4', 9).toString(),
        bounce: true, // Important to be set to false in order to keep the sent amount in the token wallet contract
      });
    if (deployWalletRes.aborted) {
      toast(`Transaction aborted ! ${deployWalletRes.exitCode}`, 0);

      return deployWalletRes;
    }

    tokenWalletData = (await MultiWalletContract.methods.wallets().call()).wallets.map(item => {
      if (item[0].toString() == tokenRootContract.address.toString()) {
        return item[1];
      }
    });
    const newBal = Number(ethers.formatUnits(tokenWalletData[0]!.balance, decimals));
    if (newBal >= oldBal) {
      toast(`${mintAmount} ${symbol}'s minted successfully `, 1);

      return `tx hash: ${deployWalletRes.id.hash} Old balance: ${oldBal} \n New balance: ${newBal}`;
    } else {
      toast('Minting tokens failed !', 0);

      return `Failed ${(deployWalletRes.exitCode, deployWalletRes.resultCode)}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return `Failed ${e.message}`;
  }
}
