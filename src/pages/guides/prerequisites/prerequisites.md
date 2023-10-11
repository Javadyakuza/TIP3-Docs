# Prerequisites

## Packages

In order to perform the operations mentioned in this documentation using  [`everscale-inpage-provider`](https://provider-docs.broxus.com) , the target contracts artifacts, including the contract tvc and code, are required. These artifacts can be obtained using the `locklift build` command, which generates the necessary files.

For the sake of simplicity, a simple npm package named `tip3-docs-artifacts` has been provided that contains the required artifacts of the  `TokenRoot` ,  `TokenWallet` ,  `Wallet` , and the default custom smart contract.


The necessary npm packages are as follows:

-  `everscale-inpage-provider`
-  `everscale-standalone-client`
-  `tip3-docs-artifacts`


::: info
Here is the propose of using the mentioned packages in our scripts:

- `everscale-inpage-provider` is used to interact with blockchain in Dapps.
- `everscale-standalone-client` Facilitates usage of the Accounts when interacting with them.
- `tip3-docs-artifacts` Provides the required artifacts of TIP-3 standard, Account and custom smart contracts when using `everscale-inpage-provider` and
  It also provides `zeoAddress` object for us since its not available in the `everscale-inpage-provider`.
:::


To install these packages, run the following command in your shell:

```` shell
npm install --save-dev everscale-inpage-provider everscale-standalone-client tip3-docs-artifacts
````

## Provider

::: warning
The following steps are only required when building Dapps and using decentralized wallets. If you are using **locklift** to make transactions, you can skip this step.
:::

The  `everscale-inpage-provider`  is used as a provider for TVM based blockchains such as [Venom](https://venom.foundation/) and [Everscale](https://everscale.network/). Follow the steps below to initialize and use  `everscale-inpage-provider`  in your scripts.

You can also refer to the [everscale-inpage-provider Docs](https://provider-docs.broxus.com/guides/deploy.html#deploy-a-contract) for detailed instructions.

### Step 1: Create the module

Create a file named `useProvider.ts`.

### Step 2: Add Scripts

Add the following script to the file you just made:

````typescript

// Import the required libraries
import { ProviderRpcClient, Address } from "everscale-inpage-provider";

// Initialize the provider
const provider: ProviderRpcClient = new ProviderRpcClient();

// Make sure the provider is initialized.
await provider.ensureInitialized();

// Request permissions from the user to execute API
await provider.requestPermissions({
  permissions: ["basic", "accountInteraction"],
});

// setting the ever sender address
const providerAddress: Address = (await provider.getProviderState())
.permissions.accountInteraction!.address;

export {provider,  providerAddress};
````

From now we can use the provider object and the provider address in our scripts by just simply importing them.

::: tip
You can also refer to the Documentation of the everscale-inpage-provider.

https://provider-docs.broxus.com/guides/deploy.html#deploy-a-contract

:::