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

export async function deployRootDeployerCon(): Promise<
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
    const rootDeployer = tip3Artifacts.factorySource['RootDeployer'];
    const TRArt = tip3Artifacts.artifacts.TokenRoot;
    const TWArt = tip3Artifacts.artifacts.TokenWallet;
    const RDArt = tip3Artifacts.artifacts.RootDeployer;

    // define the deployParams type
    type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
      publicKey: string | undefined;
    };

    // Fetching the user public key
    const accountFullState: FullContractState = (
      await provider.getFullContractState({ address: senderAddress })
    ).state!;

    const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc);

    // Preparing the deployment params
    const randomNonce_ = (Math.random() * 6400) | 0;
    // const randomNonce_ = 78342;
    const deployParams: DeployParams<tip3Artifacts.FactorySource['RootDeployer']> = {
      tvc: RDArt.tvc,
      workchain: 0,
      publicKey: senderPublicKey,
      initParams: {
        randomNonce_: randomNonce_,
      },
    };
    // Get the expected contract address
    const expectedAddress = await provider.getExpectedAddress(rootDeployer, deployParams);

    // Get the state init
    const stateInit = await provider.getStateInit(rootDeployer, deployParams);

    /**
     * @dev Notice that if the initialSupply was to an address except the zeroAddress the amount that is sent to the calculated address must be more that the walletDeployValue
     * For example for that next  function  the amount can be 3 evers to avoid any aborted tx's,
     * @important Its really important to thRe mentioned disclaimer otherwise the func will be lost since its just an simple money transfer !!
     */
    // Send the coins to the address
    await provider.sendMessage({
      sender: senderAddress,
      recipient: expectedAddress,
      amount: ethers.parseUnits('3', 9).toString(),
      bounce: false, // It is important to set 'bounce' to false
      // to ensure funds remain in the contract.
      stateInit: stateInit.stateInit,
    });

    toast('Fund sent to the Calculated address !', 2);
    // Create a contract instance
    const userRootDeployer: Contract<tip3Artifacts.FactorySource['RootDeployer']> =
      new provider.Contract(rootDeployer, expectedAddress);

    // Call the contract constructor
    const { transaction: deployRes } = await userRootDeployer.methods
      .constructor({
        _rootCode: TRArt.code,
        _walletCode: TWArt.code,
      })
      .sendExternal({
        stateInit: stateInit.stateInit,
        publicKey: deployParams.publicKey!,
      });

    // returning the tx response as a string if aborted
    if (deployRes.aborted) {
      toast(`Transaction aborted ! ${deployRes.exitCode}`, 0);

      return `Failed ${deployRes.exitCode}`;
    }

    // checking if the token root is deployed successfully by calling one of its methods

    if (
      (
        await provider.getFullContractState({
          address: expectedAddress,
        })
      ).state?.isDeployed
    ) {
      toast(`Root Deployer deployed successfully`, 1);

      return `Root Deployer deployed to ${expectedAddress.toString()}`;
    } else {
      toast(`Root Deployer deployment failed !${deployRes.exitCode}`, 0);

      return `Failed ${deployRes.exitCode}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
