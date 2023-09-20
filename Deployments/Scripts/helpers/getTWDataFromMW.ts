import { Address, Contract } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

const zeroAddress: Address = new Address(
  '0:0000000000000000000000000000000000000000000000000000000000000000'
);
export async function getWalletData(
  MWContract: Contract<tip3Artifacts.FactorySource['MultiWalletTIP3']>,
  tokenRootAddress: Address
): Promise<{ tokenWallet: Address; balance: number }> {
  const walletData = (await MWContract.methods.wallets().call()).wallets.map(item => {
    if (item[0].toString() == tokenRootAddress.toString()) {
      return item[1];
    }
  });
  let balance = 0;
  let tokenWallet: Address = zeroAddress;
  if (walletData.length != 0) {
    balance = Number(walletData[0]!.balance);
    tokenWallet = walletData[0]!.tokenWallet;
  }

  return { tokenWallet: tokenWallet, balance: balance };
}
