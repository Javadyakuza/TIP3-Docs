import { Address, Contract, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';
async function main() {
  // Preparing the params
  const tokenRootAddress: Address = new Address('<YOUR_TOKEN_ROOT_ADDRESS>');

  // creating an instance of the token root contract
  const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> =
    new provider.Contract(tip3Artifacts.factorySource['TokenRoot'], tokenRootAddress);

  // Checking if the user already doesn't have any deployed wallet of that token root
  const tokenWalletAddress: Address = (
    await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: providerAddress }).call()
  ).value0;

  // checking if the token wallet is already deployed or not
  if (
    (
      await provider.getFullContractState({
        address: tokenWalletAddress,
      })
    ).state?.isDeployed
  )
    throw new Error('You already have a token wallet of this token !');

  // Deploying a new token wallet contract
  const deployWalletRes: Transaction = await tokenRootContract.methods
    .deployWallet({
      answerId: 0,
      walletOwner: providerAddress,
      deployWalletValue: 2 * 10 ** 9,
    })
    .send({
      from: providerAddress,
      amount: String(4 * 10 ** 9),
      bounce: true,
    });

  // Checking if the token wallet is deployed
  if (
    (
      await provider.getFullContractState({
        address: tokenWalletAddress,
      })
    ).state?.isDeployed
  ) {
    console.log(
      ` Token wallet deployed to: ${(
        await tokenRootContract.methods
          .walletOf({ answerId: 0, walletOwner: providerAddress })
          .call()
      ).value0.toString()}`
    );
    return true;
  } else {
    throw new Error(
      `The token wallet deployment failed ! ${
        (deployWalletRes.exitCode, deployWalletRes.resultCode)
      }`
    );
  }
}
