import { ethers } from 'ethers';
import {
  ProviderRpcClient as PRC,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function deployMultiWalletTip3Con(): Promise<
  Address | string | Transaction | undefined | any
> {
  // Fetching the provider
  let provider: PRC, senderAddress: Address;
  try {
    [provider, senderAddress] = await useProviderInfo();
  } catch (e: any) {
    throw new Error(e.message);
  }

  try {
    /*
    Returns compilation artifacts based on the .sol file name
      or name from value config.externalContracts[pathToLib].
  */
    const MW = tip3Artifacts.factorySource['MultiWalletTIP3'];
    const TWArt = tip3Artifacts.artifacts.TokenWallet;
    const MWArt = tip3Artifacts.artifacts.MultiWalletTIP3;

    // define the deployParams type
    type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
      publicKey: string | undefined;
    };

    // Fetching the user public key
    const accountFullState: FullContractState = (
      await provider.getFullContractState({ address: senderAddress })
    ).state!;

    const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc);

    const deployParams: DeployParams<tip3Artifacts.FactorySource['MultiWalletTIP3']> = {
      tvc: MWArt.tvc,
      workchain: 0,
      publicKey: senderPublicKey,
      initParams: {
        _randomNonce: (Math.random() * 6400) | 0,
      },
    };
    // Get the expected contract address
    const expectedAddress = await provider.getExpectedAddress(MW, deployParams);

    // Get the state init
    const stateInit = await provider.getStateInit(MW, deployParams);

    /**
     * @dev Notice that if the initialSupply was to an address except the zeroAddress the amount that is sent to the calculated address must be more that the walletDeployValue
     * For example for that next  function  the amount can be 3 evers to avoid any aborted tx's,
     * @important Its really important to thRe mentioned disclaimer otherwise the func will be lost since its just an simple money transfer !!
     */
    // Send the coins to the address
    await provider.sendMessage({
      sender: senderAddress,
      recipient: expectedAddress,
      amount: ethers.parseUnits('2', 9).toString(),
      bounce: false, // It is important to set 'bounce' to false
      // to ensure funds remain in the contract.
      stateInit: stateInit.stateInit,
    });

    toast('Fund sent to the Calculated address !', 2);
    // Create a contract instance
    const MWcon: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> = new provider.Contract(
      MW,
      expectedAddress
    );

    // Call the contract constructor
    const { transaction: deployRes } = await MWcon.methods
      .constructor({
        _walletCode: TWArt.code,
      })
      .sendExternal({
        stateInit: stateInit.stateInit,
        publicKey: deployParams.publicKey!,
      });

    // returning the tx response as a string if aborted
    if (deployRes.aborted) {
      toast(`Transaction aborted ! ${(deployRes.exitCode, deployRes.resultCode)}`, 0);

      return `Failed ${(deployRes.exitCode, deployRes.resultCode)}`;
    }

    // checking if the token root is deployed successfully by calling one of its methods

    if (
      (
        await provider.getFullContractState({
          address: expectedAddress,
        })
      ).state?.isDeployed
    ) {
      toast(`Multi Wallet Tip3 deployed successfully`, 1);

      return `Multi Wallet Tip3 deployed to ${expectedAddress.toString()}`;
    } else {
      toast(
        `Multi Wallet Tip3 deployment failed !${(deployRes.exitCode, deployRes.resultCode)}`,
        0
      );

      return `Failed ${(deployRes.exitCode, deployRes.resultCode)}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
