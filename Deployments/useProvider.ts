// Import the required libraries
import { ProviderRpcClient, Address } from 'everscale-inpage-provider';

// Initialize the provider
const provider: ProviderRpcClient = new ProviderRpcClient();

// Make sure the provider is initialized.
await provider.ensureInitialized();

// Request permissions from the user to execute API
await provider.requestPermissions({
  permissions: ['basic', 'accountInteraction'],
});

// setting the ever sender address
const providerAddress: Address = (await provider.getProviderState()).permissions.accountInteraction!
  .address;

export { provider, providerAddress };
