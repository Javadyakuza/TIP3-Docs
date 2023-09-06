# Prerequisites

## Packages

In order to perform the operations mentioned in this documentation using  `everscale-inpage-provider` , the target contracts artifacts, including the contract tvc and code, are required. These artifacts can be obtained using the locklift build command, which generates the necessary files.

For the sake of simplicity, a simple npm package has been provided that contains the required artifacts of the  `TokenRoot` ,  `TokenWallet` ,  `Wallet` , and the default  `custom smart contract` .\

You can also refer to the [everscale-inpgae-provider Docs](https://provider-docs.broxus.com/guides/deploy.html#deploy-a-contract) for detailed instructions.

The necessary npm packages are as follows:

-  `ethers` 
-  `everscale-inpage-provider` 
-  `everscale-standalone-client` 
-  `tip3-docs-artifacts`  

To install these packages, run the following command in your shell:

```` shell
shell
npm install --save-dev ethers everscale-inpage-provider everscale-standalone-client tip3-docs-artifacts
````

## Provider

::: warning 
The following steps are only required when building Dapps and using decentralized wallets. If you are using **locklift** to make transactions, you can skip this step.  
:::

````typescript
The  `everscale-inpage-provider`  is used as a provider for TVM based blockchains such as [Venom](https://venom.foundation/) and [Everscale](https://everscale.network/). Follow the steps below to initialize and use  `everscale-inpage-provider`  in your scripts.
// Import the required libraries
import { ProviderRpcClient, Address } from "everscale-inpage-provider";

// Initialize the provider
const provider = new ProviderRpcClient();

// Make sure the provider is initialized.
await provider.ensureInitialized();

// Request permissions from the user to execute API
await provider.requestPermissions({
  permissions: ["basic", "accountInteraction"],
});

// setting the ever sender address
const providerAddress: Address = (await provider.getProviderState())
.permissions.accountInteraction!.address;

// Use the provider
````

