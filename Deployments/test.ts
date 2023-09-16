import { ProviderRpcClient, Address, Transaction, Contract } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

// We use the getWalletData function to extract the token wallet data from the multi wallet contract
async function getWalletData(
  MWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']>,
  tokenRootAddress: Address
): Promise<{ tokenWallet: Address; balance: number }> {
  const walletData = (await MWContract.methods.wallets().call()).wallets.map(item => {
    if (item[0].toString() == tokenRootAddress.toString()) {
      return item[1];
    }
  });
  let balance: number = 0;
  let tokenWallet: Address = tip3Artifacts.zeroAddress;
  if (walletData.length != 0) {
    balance = Number(walletData[0]!.balance);
    tokenWallet = walletData[0]!.tokenWallet;
  }
  return { tokenWallet: tokenWallet, balance: balance };
}

async function main() {
  // Initiate the TVM provider
  const tokenRootAddress: Address = new Address('<YOUR_TOKEN_ROOT_ADDRESS>');
  const multiWalletAddress: Address = new Address('<YOUR_MULTI_WALLET_ADDRESS>');

  try {
    // creating an instance of the token root contract
    const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> =
      new provider.Contract(tip3Artifacts.factorySource['TokenRoot'], tokenRootAddress);
    // creating an instance of the token root contract
    const MultiWalletContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']> =
      new provider.Contract(tip3Artifacts.factorySource['MultiWalletTIP3'], multiWalletAddress);
    // Fetching the decimals and symbol
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    const mintAmount: number = 50 * 10 ** decimals;

    // Checking if the user already doesn't have the any wallet of that token root
    let tokenWalletData = await getWalletData(MultiWalletContract, tokenRootContract.address);

    let deployWalletValue: number = 0;

    const oldBal: number = Number(tokenWalletData.balance) / 10 ** decimals;

    if (tokenWalletData.tokenWallet.toString() == tip3Artifacts.zeroAddress.toString()) {
      deployWalletValue = 2 * 10 ** 9;
    }
    const txFee: string = String(2 * 10 ** 9 + deployWalletValue);
    // Deploying a new contract if didn't exist before
    const mintRes: Transaction = await tokenRootContract.methods
      .mint({
        amount: mintAmount,
        deployWalletValue: deployWalletValue,
        remainingGasTo: providerAddress,
        recipient: multiWalletAddress,
        notify: true, // to update the MW contract state
        payload: '',
      })
      .send({
        from: providerAddress,
        amount: txFee,
        bounce: true,
      });

    if (mintRes.aborted) {
      throw new Error(`Transaction aborted ! ${(mintRes.exitCode, mintRes.resultCode)}`);
    }

    tokenWalletData = await getWalletData(MultiWalletContract, tokenRootContract.address);
    const newBal: number = Number(tokenWalletData.balance) / 10 ** decimals;

    if (newBal >= oldBal) {
      console.log(`${mintAmount} ${symbol}'s minted successfully `);

      return `Old balance: ${oldBal} \n New balance: ${newBal}`;
    } else {
      throw new Error(`Failed ${(mintRes.exitCode, mintRes.resultCode)}`);
    }
  } catch (e: any) {
    throw new Error(`Failed ${e.message}`);
  }
}
