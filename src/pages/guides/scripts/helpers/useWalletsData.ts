import { ProviderRpcClient, Address } from 'everscale-inpage-provider';

import { useProvider } from '../../../../providers/useProvider';
/**
 * Fetches the data about the EVER Wallet
 * @returns Either the Tvm provider, Tvm wallet address or undefined
 */
export async function useProviderInfo(): Promise<[ProviderRpcClient, Address]> {
  try {
    const provider = useProvider();
    await provider.connectToWallet();
    // setting the ever sender address
    const providerAddress: Address = (await provider.provider.getProviderState()).permissions
      .accountInteraction!.address;

    return [provider.provider, providerAddress];
  } catch (e: any) {
    throw new Error(e.message);
  }
}
