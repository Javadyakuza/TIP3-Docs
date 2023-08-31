import { ProviderRpcClient, Address } from 'everscale-inpage-provider';

/**
 * Fetches the data about the EVER Wallet
 * @returns Either the Tvm provider, Tvm wallet address or undefined
 */
export async function useProviderInfo(): Promise<[ProviderRpcClient, Address]> {
  try {
    // fetching the tvm provider
    const provider = new ProviderRpcClient();

    // Make sure the tvm provider is initialized.
    await provider.ensureInitialized();
    // Request permissions from the user to execute API
    // methods using the provider.
    await provider.requestPermissions({
      permissions: ['basic', 'accountInteraction'],
    });
    // setting the ever sender address
    const everSender: Address = (await provider.getProviderState()).permissions.accountInteraction!
      .address;
    
return [provider, everSender];
  } catch (e: any) {
    throw new Error(e.message);
  }
}
