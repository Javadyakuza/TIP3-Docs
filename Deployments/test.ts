import { Address, Contract, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  try {
    const tokenRootAddress: Address = new Address('<YOUR_TOKEN_WALLET_ADDRESS>');

    // Fetching the required contracts
    const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> =
      new provider.Contract(tip3Artifacts.factorySource['TokenRoot'], tokenRootAddress);
    const tokenWalletAddress: Address = (
      await tokenRootContract.methods
        .walletOf({ answerId: 0, walletOwner: providerAddress })
        .call({})
    ).value0;

    const tokenWalletContract: Contract<tip3Artifacts.FactorySource['TokenWallet']> =
      new provider.Contract(tip3Artifacts.factorySource['TokenWallet'], tokenWalletAddress);

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    const burnAmount: number = 100 * 10 ** decimals;

    const oldBal: number =
      Number((await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0) /
      10 ** decimals;

    // burning tokens from a token wallet by calling the burn method
    const burnRes: Transaction = await tokenWalletContract.methods
      .burn({
        amount: burnAmount,
        payload: '',
        remainingGasTo: providerAddress,
        callbackTo: tip3Artifacts.zeroAddress,
      })
      .send({
        from: providerAddress,
        amount: String(3 * 10 ** 9),
      });

    if (burnRes.aborted) {
      throw new Error(`Transaction aborted ! ${(burnRes.exitCode, burnRes.resultCode)}`);
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBal: number =
      Number((await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0) /
      10 ** decimals;

    if (oldBal >= newBal) {
      console.log(`${burnAmount / 10 ** decimals} ${symbol}'s successfully burnt !`);

      return `Hash: ${burnRes.id.hash} \n old Balance  ${oldBal} \n New balance: ${newBal}`;
    } else {
      console.error(`Failed \n
      ${(burnRes.exitCode, burnRes.resultCode)}`);
    }

    /*
     Using burnByRoot function

    */
    const burnByRootAmount: number = 50 * 10 ** decimals;

    const oldBalance: number =
      Number((await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0) /
      10 ** decimals;

    // Deploying a new contract if didn't exist before
    const burnByRotRes: Transaction = await tokenRootContract.methods
      .burnTokens({
        amount: burnByRootAmount,
        walletOwner: providerAddress,
        payload: '',
        remainingGasTo: providerAddress,
        callbackTo: tip3Artifacts.zeroAddress,
      })
      .send({
        from: providerAddress,
        amount: String(3 * 10 ** 9),
      });

    if (burnByRotRes.aborted) {
      throw new Error(`Transaction aborted ! ${(burnByRotRes.exitCode, burnByRotRes.resultCode)}`);
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBalance: number =
      Number((await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0) /
      10 ** decimals;

    if (oldBal >= newBal) {
      console.log(`${burnByRootAmount / 10 ** decimals} ${symbol}'s successfully burnt`);

      return `Hash: ${burnByRotRes.id.hash} \n old Balance  ${oldBal} \n New balance: ${newBal}`;
    } else {
      throw new Error(`Failed \n
       ${(burnByRotRes.exitCode, burnByRotRes.resultCode)}`);
    }
  } catch (e: any) {
    throw new Error(`Failed: ${e.message}`);
  }
}
