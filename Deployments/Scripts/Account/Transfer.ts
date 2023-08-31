import { ethers, toBigInt } from 'ethers';
import {
  ProviderRpcClient as PRC,
  Address,
  Contract,
  Transaction,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../src/helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function transferTokenEip(
  tokenRootAddress: string,
  receiverAddress: string,
  TokenAmount: string,
  notify: boolean
): Promise<Address | string | Transaction | undefined> {
  // setting up the provider
  let provider: PRC, senderAddress: Address;
  try {
    [provider, senderAddress] = await useProviderInfo();

    if (
      !isValidEverAddress(provider, tokenRootAddress) ||
      !isValidEverAddress(provider, receiverAddress)
    ) {
      toast('Please enter a valid ever address !', 0);

      return 'Failed';
    }

    // creating an instance of the target contracts
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );
    const decimals = (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0;
    const tokenWallet = new provider.Contract(
      // Transferring the token
      tip3Artifacts.factorySource['TokenWallet'],
      (
        await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: senderAddress }).call()
      ).value0
    );
    // Checking recipient has a deploy wallet of that h token root
    let amount = '3';
    let oldBal = '0';

    const receiverTokenWalletAddress = (
      await tokenRootContract.methods
        .walletOf({ answerId: 0, walletOwner: new Address(receiverAddress) })
        .call()
    ).value0;

    let possibleRecipientTokenWallet:
      | Contract<tip3Artifacts.FactorySource['TokenWallet']>
      | undefined = undefined;

    if (
      !(
        await provider.getFullContractState({
          address: (
            await tokenRootContract.methods
              .walletOf({ answerId: 0, walletOwner: senderAddress })
              .call()
          ).value0,
        })
      ).state?.isDeployed
    ) {
      amount = '4';
    } else {
      possibleRecipientTokenWallet = new provider.Contract(
        // Transferring the token
        tip3Artifacts.factorySource['TokenWallet'],
        receiverTokenWalletAddress
      );

      oldBal = (await possibleRecipientTokenWallet.methods.balance({ answerId: 0 }).call({}))
        .value0;
    }

    // Transferring token
    const transferRes: Transaction = await tokenWallet.methods
      .transfer({
        amount: ethers.parseUnits(TokenAmount, Number(decimals)).toString(),
        recipient: new Address(receiverAddress),
        deployWalletValue: ethers.parseUnits('2', 9).toString(),
        remainingGasTo: senderAddress,
        notify: notify,
        payload: '',
      })
      .send({ from: senderAddress, amount: ethers.parseUnits(amount, 9).toString(), bounce: true });

    if (transferRes.aborted) {
      toast(`Transaction aborted !: ${transferRes.exitCode}`, 0);

      return `Failed ${transferRes.exitCode}`;
    } else {
      possibleRecipientTokenWallet = new provider.Contract(
        // Transferring the token
        tip3Artifacts.factorySource['TokenWallet'],
        receiverTokenWalletAddress
      );
      const newBal = toBigInt(
        (await possibleRecipientTokenWallet.methods.balance({ answerId: 0 }).call({})).value0
      );
      // Checking if the tokens are received successfully
      if (
        amount == '2' &&
        newBal >= ethers.parseUnits(TokenAmount, Number(decimals)) + toBigInt(oldBal)
      ) {
        toast('tokens transferred successfully', 1);

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

export async function transferTokenToWalletEip(
  tokenWalletAddress: string,
  TokenAmount: string,
  notify: boolean
): Promise<Address | string | Transaction | undefined> {
  // setting up the provider
  let provider: PRC, senderAddress: Address;
  try {
    [provider, senderAddress] = await useProviderInfo();

    if (!isValidEverAddress(provider, tokenWalletAddress)) {
      toast('Please enter a valid ever address !', 0);

      return 'Failed';
    }

    // creating an instance of the target contracts
    const recipientTokenWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenWallet'],
      new Address(tokenWalletAddress)
    );
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      (await recipientTokenWalletContract.methods.root({ answerId: 0 }).call()).value0
    );
    const senderTokenWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenWallet'],
      (
        await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: senderAddress }).call()
      ).value0
    );

    const decimals = (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0;

    // Checking recipient has a deploy wallet of that h token root
    const amount = '3';

    const oldBal: string = (
      await recipientTokenWalletContract.methods.balance({ answerId: 0 }).call()
    ).value0;

    // Transferring token
    const transferRes: Transaction = await senderTokenWalletContract.methods
      .transferToWallet({
        amount: ethers.parseUnits(TokenAmount, Number(decimals)).toString(),
        recipientTokenWallet: recipientTokenWalletContract.address,
        remainingGasTo: senderAddress,
        notify: notify,
        payload: '',
      })
      .send({ from: senderAddress, amount: ethers.parseUnits(amount, 9).toString(), bounce: true });

    if (
      !transferRes.aborted &&
      toBigInt(
        (await recipientTokenWalletContract.methods.balance({ answerId: 0 }).call({})).value0
      ) > toBigInt(oldBal)
    ) {
      toast('tokens transferred successfully', 1);

      return `tx Hash: ${transferRes.id.hash}`;
    } else {
      toast('Transferring tokens failed', 0);

      return `tx Hash: ${(transferRes.exitCode, transferRes.resultCode)}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
