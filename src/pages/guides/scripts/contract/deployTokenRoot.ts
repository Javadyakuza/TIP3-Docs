import {
  ProviderRpcClient as PRC,
  Address,
  Contract,
  Transaction,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../../helpers/toast';
import { extractPubkey } from '../helpers/extractPubkey';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';
import { deployRootParams, deployFromRootDeployerParams } from '../types';

const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Deploys the token root contract using the EIP (Everscale Inpage Provider).
 *
 * @param {deployRootParams} Required parameters for deploying the token root.
 * @returns {Address | string | undefined} Returns either the deployed token root address or undefined in rare cases such as transaction freezing. It may also return a transaction response in string format to provide more information about the transaction abortion if the transaction was aborted.
 *
 * @dev Any errors will be caught, and the user will be notified accordingly using a toast notification.
 */
export async function deployTokenRootFromContract(
  params: deployRootParams,
  RootDeployerAddress: string
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

    if (!(await isValidEverAddress(provider, params.initialSupplyTo.toString()))) {
      throw new Error('initialSupplyTo address is not valid !!');
    }
    if (!(await isValidEverAddress(provider, params.rootOwner.toString()))) {
      throw new Error('rootOwner address is not valid !!');
    }
    if (!(await isValidEverAddress(provider, RootDeployerAddress))) {
      throw new Error('RootDeployerAddress address is not valid !!');
    }

    /*
    Returns compilation artifacts based on the .sol file name
      or name from value config.externalContracts[pathToLib].
  */
    const TokenRoot = tip3Artifacts.factorySource['TokenRoot'];
    const RootDeployer = tip3Artifacts.factorySource['RootDeployer'];

    /**
     * @dev Notice that if the initialSupply was to an address except the zeroAddress the amount that is sent to the calculated address must be more that the walletDeployValue
     * For example for that next  function  the amount can be 3 evers to avoid any aborted tx's,
     * @important Its really important to the mentioned disclaimer otherwise the func will be lost since its just an simple money transfer !!
     */
    // Send the coins to the address
    const deployWalletValue: string = params.initialSupplyTo.toString() == zeroAddress ? '0' : '2';

    // Create a contract instance
    const userRootDeployer: Contract<tip3Artifacts.FactorySource['RootDeployer']> =
      new provider.Contract(RootDeployer, new Address(RootDeployerAddress));

    const tokenRootDeploymentsParams: deployFromRootDeployerParams = {
      initialSupplyTo: new Address(params.initialSupplyTo),
      rootOwner: new Address(params.rootOwner),
      randomNonce: (Math.random() * 6400) | 0,
      deployWalletValue: deployWalletValue,
      name: params.name,
      symbol: params.symbol,
      decimals: params.decimals,
      mintDisabled: params.disableMint,
      burnByRootDisabled: params.disableBurnByRoot,
      burnPaused: params.pauseBurn,
      initialSupply: params.initialSupply,
      remainingGasTo: senderAddress,
    };
    // Deploying the tokenRoot
    const { transaction: tokenRootDeploymentRes } = await userRootDeployer.methods
      .deployTokenRoot(tokenRootDeploymentsParams)
      .sendExternal({
        publicKey: await extractPubkey(provider, senderAddress),
      });
    // checking if the token root is deployed successfully by calling one of its methods
    if (tokenRootDeploymentRes.aborted) {
      toast(
        `transaction aborted ${
          (tokenRootDeploymentRes.exitCode, tokenRootDeploymentRes.resultCode)
        }`,
        0
      );

      return `Failed ${(tokenRootDeploymentRes.exitCode, tokenRootDeploymentRes.resultCode)}`;
    }

    // fetching the address of the token root
    const tokenRootAddr: Address = (
      await userRootDeployer.methods
        .getExpectedTokenRootAddress({
          name: tokenRootDeploymentsParams.name,
          decimals: tokenRootDeploymentsParams.decimals,
          symbol: tokenRootDeploymentsParams.symbol,
          rootOwner: tokenRootDeploymentsParams.rootOwner,
          randomNonce: tokenRootDeploymentsParams.randomNonce,
        })
        .call()
    ).value0;

    // making an instance of the token root

    const TokenRootCon = new provider.Contract(TokenRoot, tokenRootAddr);

    const retrievedTokenName: string = (await TokenRootCon.methods.name({ answerId: 0 }).call({}))
      .value0;
    if (retrievedTokenName == params.name) {
      toast(`${params.symbol} Token deployed successfully`, 1);

      return `${params.symbol} deployed to ${tokenRootAddr.toString()}`;
    } else {
      toast(`${params.symbol} Token deployment failed !${tokenRootDeploymentRes.exitCode}`, 0);

      return `Failed ${tokenRootDeploymentRes.exitCode}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}
