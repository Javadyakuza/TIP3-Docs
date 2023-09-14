// Import the following libraries
import {
  Address,
  GetExpectedAddressParams,
  Contract,
  ProviderApiResponse,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  // Initiate the TVM provider

  // Preparing test params

  // zero address instance
  interface deployRootParams {
    initialSupplyTo: Address;
    rootOwner: Address;
    name: string;
    symbol: string;
    decimals: number;
    disableMint: boolean;
    disableBurnByRoot: boolean;
    pauseBurn: boolean;
    initialSupply: number;
  }

  // Token root abi
  const tokenRootAbi: tip3Artifacts.FactorySource['TokenRoot'] =
    tip3Artifacts.factorySource['TokenRoot'];

  // Token root and wallet's code and tvc
  const tokenRootArtifacts: typeof tip3Artifacts.artifacts.TokenRoot =
    tip3Artifacts.artifacts.TokenRoot;
  const tokenWalletArtifacts: typeof tip3Artifacts.artifacts.TokenWallet =
    tip3Artifacts.artifacts.TokenWallet;

  const params: deployRootParams = {
    initialSupplyTo: tip3Artifacts.zeroAddress,
    rootOwner: tip3Artifacts.zeroAddress,
    name: 'Tip3OnboardingToken',
    symbol: 'TOT',
    decimals: 6,
    disableMint: false,
    disableBurnByRoot: false,
    pauseBurn: false,
    initialSupply: 0,
  }; // Or get them from user

  const deployWalletValue: number =
    params.initialSupplyTo == tip3Artifacts.zeroAddress ? 2 * 10 ** params.decimals : 0;

  // Amount to attach to the tx
  const amount: number = params.initialSupplyTo == tip3Artifacts.zeroAddress ? 2 : 4;

  // Define the deployParams type
  type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
    publicKey: string | undefined;
  };

  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: providerAddress })
  ).state!;
  const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc!);

  /**
   * Preparing deploy params to build the state init with the contract abi
   * @param deployer_ Its important to set this param to zero address when deploying the token root contract whiteout using an smart contract.
   */
  const deployParams: DeployParams<tip3Artifacts.FactorySource['TokenRoot']> = {
    tvc: tokenRootArtifacts.tvc,
    workchain: 0,
    publicKey: senderPublicKey,
    initParams: {
      deployer_: tip3Artifacts.zeroAddress,
      randomNonce_: (Math.random() * 6400) | 0,
      rootOwner_: params.rootOwner,
      name_: params.name,
      symbol_: params.symbol,
      decimals_: params.decimals,
      walletCode_: tokenWalletArtifacts.code,
    },
  };

  // Get the expected contract address
  const expectedAddress: Address = await provider.getExpectedAddress(tokenRootAbi, deployParams);

  // Get the state init
  const stateInit: ProviderApiResponse<'getExpectedAddress'> = await provider.getStateInit(
    tokenRootAbi,
    deployParams
  );

  // Send the coins to the calculated address
  await provider.sendMessage({
    sender: providerAddress,
    recipient: expectedAddress,
    amount: String(amount * 10 ** 9),
    bounce: false, // it's important to set this param to keep the evers in the contract
    stateInit: stateInit.stateInit,
  });

  // Create a contract instance
  const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> =
    new provider.Contract(tokenRootAbi, expectedAddress);

  // Call the contract constructor
  const { transaction: deployRes } = await tokenRootContract.methods
    .constructor({
      initialSupplyTo: params.initialSupplyTo,
      initialSupply: params.initialSupply,
      deployWalletValue: deployWalletValue,
      mintDisabled: params.disableMint,
      burnByRootDisabled: params.disableBurnByRoot,
      burnPaused: params.pauseBurn,
      remainingGasTo: providerAddress,
    })
    .sendExternal({
      stateInit: stateInit.stateInit,
      publicKey: deployParams.publicKey!,
    });

  // checking if the token root is deployed successfully by calling its name method
  const tokenName: string = (await tokenRootContract.methods.name({ answerId: 0 }).call({})).value0;
  if (tokenName == params.name) {
    console.log(`${params.symbol} Token deployed to ${expectedAddress.toString()}`);
    return true;
  } else {
    console.log(
      `${params.symbol} Token deployment failed ! ${(deployRes.exitCode, deployRes.resultCode)}`
    );
    return false;
  }
}
