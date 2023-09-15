import {
  ProviderRpcClient as PRC,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  // Root Deployer contract abi
  const rootDeployerAbi: tip3Artifacts.FactorySource['RootDeployer'] =
    tip3Artifacts.factorySource['RootDeployer'];

  // required contracts code and tvc
  const tokenRootArtifacts: typeof tip3Artifacts.artifacts.TokenRoot =
    tip3Artifacts.artifacts.TokenRoot;
  const tokenWalletArtifacts: typeof tip3Artifacts.artifacts.TokenWallet =
    tip3Artifacts.artifacts.TokenWallet;
  const rootDeployerArtifacts: typeof tip3Artifacts.artifacts.RootDeployer =
    tip3Artifacts.artifacts.RootDeployer;

  // define the deployParams type
  type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
    publicKey: string | undefined;
  };

  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: providerAddress })
  ).state!;

  const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc);

  // Preparing the deployment params
  const deployParams: DeployParams<tip3Artifacts.FactorySource['RootDeployer']> = {
    tvc: rootDeployerArtifacts.tvc,
    workchain: 0,
    publicKey: senderPublicKey,
    initParams: {
      randomNonce_: (Math.random() * 6400) | 0,
    },
  };

  // Get the expected contract address
  const expectedAddress = await provider.getExpectedAddress(rootDeployerAbi, deployParams);

  // Get the state init
  const stateInit = await provider.getStateInit(rootDeployerAbi, deployParams);

  // Send the coins to the address
  await provider.sendMessage({
    sender: providerAddress,
    recipient: expectedAddress,
    amount: String(3 * 10 ** 9),
    bounce: false, // It is important to set 'bounce' to false
    // to ensure funds remain in the contract.
    stateInit: stateInit.stateInit,
  });

  console.log('Fund sent to the Calculated address !');
  // Create a contract instance

  const userRootDeployer: Contract<tip3Artifacts.FactorySource['RootDeployer']> =
    new provider.Contract(rootDeployerAbi, expectedAddress);

  console.log('Sending stateInit to the Calculated address ...');

  // Call the contract constructor
  const { transaction: deployRes } = await userRootDeployer.methods
    .constructor({
      _rootCode: tokenRootArtifacts.code,
      _walletCode: tokenWalletArtifacts.code,
    })
    .sendExternal({
      stateInit: stateInit.stateInit,
      publicKey: deployParams.publicKey!,
    });

  // checking if the token root is deployed successfully by calling one of its methods
  if (
    (
      await provider.getFullContractState({
        address: expectedAddress,
      })
    ).state?.isDeployed
  ) {
    console.log(`Root Deployer deployed successfully`);
    return `Root Deployer deployed to ${expectedAddress.toString()}`;
  } else {
    throw new Error(
      `Root Deployer deployment failed !${(deployRes.exitCode, deployRes.resultCode)}`
    );
  }
}
