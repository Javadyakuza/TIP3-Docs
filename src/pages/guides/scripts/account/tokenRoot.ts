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
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';
import { deployRootParams } from '../types';

const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';
/**
 * Deploys the token root contract using the EIP (Everscale Inpage Provider).
 *
 * @param {deployRootParams} Required parameters for deploying the token root.
 * @returns {Address | string | undefined} Returns either the deployed token root address or undefined in rare cases such as transaction freezing. It may also return a transaction response in string format to provide more information about the transaction abortion if the transaction was aborted.
 *
 * @dev Any errors will be caught, and the user will be notified accordingly using a toast notification.
 */
export async function deployTokenRootEip(
  params: deployRootParams
): Promise<Address | string | Transaction | undefined | any> {
  // Fetching the provider
  let provider: PRC, senderAddress: Address;
  try {
    [provider, senderAddress] = await useProviderInfo();
  } catch (e: any) {
    throw new Error(e.message);
  }
  try {
    // Replacing the zeroAddresses
    if (params.initialSupplyTo == '') {
      params.initialSupplyTo = zeroAddress;
    }
    if (params.rootOwner == '') {
      params.rootOwner = zeroAddress;
    }
    if (params.initialSupply == 0) {
      params.initialSupply = 0;
    }

    if (!(await isValidEverAddress(provider, params.initialSupplyTo))) {
      throw new Error('initialSupplyTo address is not valid !!');
    }
    if (!(await isValidEverAddress(provider, params.rootOwner))) {
      throw new Error('rootOwner address is not valid !!');
    }

    /* 
    Returns compilation artifacts based on the .sol file name
      or name from value config.externalContracts[pathToLib].
    */
    const TokenRoot = tip3Artifacts.factorySource['TokenRoot'];
    const TRArt = tip3Artifacts.artifacts.TokenRoot;
    const TWArt = tip3Artifacts.artifacts.TokenWallet;

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
    const deployParams: DeployParams<tip3Artifacts.FactorySource['TokenRoot']> = {
      tvc: TRArt.tvc,
      workchain: 0,
      publicKey: senderPublicKey,
      initParams: {
        deployer_: new Address(zeroAddress),
        randomNonce_: (Math.random() * 6400) | 0,
        rootOwner_: new Address(params.rootOwner),
        name_: params.name,
        symbol_: params.symbol,
        decimals_: Number(params.decimals),
        walletCode_: TWArt.code,
      },
    };

    // Get the expected contract address
    const expectedAddress = await provider.getExpectedAddress(TokenRoot, deployParams);

    // Get the state init
    const stateInit = await provider.getStateInit(TokenRoot, deployParams);

    /**
     * @dev Notice that if the initialSupply was to an address except the zeroAddress the amount that is sent to the calculated address must be more that the walletDeployValue
     * For example for that next  function  the amount can be 3 evers to avoid any aborted tx's,
     * @important Its really important to the mentioned disclaimer otherwise the func will be lost since its just an simple money transfer !!
     */
    // Send the coins to the address
    const amount: string = params.initialSupplyTo == zeroAddress ? '2' : '5';

    await provider.sendMessage({
      sender: senderAddress,
      recipient: expectedAddress,
      amount: ethers.parseUnits(amount, 9).toString(),
      bounce: true, // It is important to set 'bounce' to false
      // to ensure funds remain in the contract.
      stateInit: stateInit.stateInit,
    });
    toast('Fund sent to the Calculated address !', 2);
    // Create a contract instance
    const userTokenRoot: Contract<tip3Artifacts.FactorySource['TokenRoot']> = new provider.Contract(
      TokenRoot,
      expectedAddress
    );
    toast('Sending stateInit to the Calculated address ...', 2);
    // Call the contract constructor
    const { transaction: deployRes } = await userTokenRoot.methods
      .constructor({
        initialSupplyTo: new Address(params.initialSupplyTo),
        initialSupply: ethers
          .parseUnits(String(params.initialSupply), Number(params.decimals))
          .toString(),
        deployWalletValue: ethers
          .parseUnits(params.initialSupplyTo == zeroAddress ? '0' : '2', 9)
          .toString(),
        mintDisabled: params.disableMint,
        burnByRootDisabled: params.disableBurnByRoot,
        burnPaused: params.pauseBurn,
        remainingGasTo:
          params.initialSupplyTo == zeroAddress ? new Address(zeroAddress) : senderAddress,
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

    const retrievedTokenName: string = (await userTokenRoot.methods.name({ answerId: 0 }).call({}))
      .value0;
    if (retrievedTokenName == params.name) {
      toast(`${params.symbol} Token deployed successfully`, 1);

      return `${params.symbol} deployed to ${expectedAddress.toString()}`;
    } else {
      toast(`${params.symbol} Token deployment failed !${deployRes.exitCode}`, 0);

      return `Failed ${deployRes.exitCode}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
