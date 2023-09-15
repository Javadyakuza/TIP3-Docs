import {
  ProviderRpcClient,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

/**
 * We develop two more methods in order to reduce the mass of the script
 */
async function extractPubkey(provider: ProviderRpcClient, senderAddress: Address): Promise<string> {
  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: senderAddress })
  ).state!;

  const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc);

  return senderPublicKey;
}

async function main() {
  // Initiate the TVM provider

  // Token Root contracts abis
  const tokenRootAbi: tip3Artifacts.FactorySource['TokenRoot'] =
    tip3Artifacts.factorySource['TokenRoot'];

  // Fetching the root deployer
  const rootDeployerAddress: Address = new Address('<YOUR_ROOT_DEPLOYER_ADDRESS>');

  const rootDeployerAbi: tip3Artifacts.FactorySource['RootDeployer'] =
    tip3Artifacts.factorySource['RootDeployer'];

  const rootDeployerContract: Contract<tip3Artifacts.FactorySource['RootDeployer']> =
    new provider.Contract(rootDeployerAbi, rootDeployerAddress);

  // Preparing the params
  interface deployRootParams {
    initialSupplyTo: Address;
    rootOwner: Address;
    name: string;
    symbol: string;
    decimals: number;
    mintDisabled: boolean;
    burnByRootDisabled: boolean;
    burnPaused: boolean;
    initialSupply: number;
    deployWalletValue: number;
    randomNonce: number;
    remainingGasTo: Address;
  }

  const params: deployRootParams = {
    initialSupplyTo: tip3Artifacts.zeroAddress,
    rootOwner: providerAddress,
    randomNonce: (Math.random() * 6400) | 0,
    deployWalletValue: 0,
    name: 'Tip3OnboardingToken',
    symbol: 'TOT',
    decimals: 6,
    mintDisabled: false,
    burnByRootDisabled: false,
    burnPaused: false,
    initialSupply: 0,
    remainingGasTo: providerAddress,
  };

  // Deploying the tokenRoot
  const { transaction: deployRes } = await rootDeployerContract.methods
    .deployTokenRoot(params)
    .sendExternal({
      publicKey: await extractPubkey(provider, providerAddress),
    });

  // checking if the token root is deployed successfully by calling one of its methods
  if (deployRes.aborted) {
    throw new Error(`transaction aborted ${(deployRes.exitCode, deployRes.resultCode)}`);
  }

  // Fetching the address of the token root
  const tokenRootAddr: Address = (
    await rootDeployerContract.methods
      .getExpectedTokenRootAddress({
        name: params.name,
        decimals: params.decimals,
        symbol: params.symbol,
        rootOwner: params.rootOwner,
        randomNonce: params.randomNonce,
      })
      .call()
  ).value0;

  // making an instance of the token root
  const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> =
    new provider.Contract(tokenRootAbi, tokenRootAddr);

  const tokenName: string = (await tokenRootContract.methods.name({ answerId: 0 }).call({})).value0;

  if (tokenName == params.name) {
    console.log(`${params.symbol} Token deployed successfully`);
    return `${params.symbol} deployed to ${tokenRootAddr.toString()}`;
  } else {
    throw new Error(`${params.symbol} Token deployment failed !${deployRes.exitCode}`);
  }
}
