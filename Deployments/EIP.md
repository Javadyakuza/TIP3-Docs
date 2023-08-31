# Prerequisites

## Packages

if we want to perform the operations mentioned in this documentation using `everscale-inpage-provider`, we need the target contracts artifact's including the contract tvc and code. We can get them using locklift build command which produces the required files for us.
for the simplification of this documentation a simple npm package has been provided which contains the required artifacts of the `TokenRoot`, `TokenWallet`, `Wallet` and the default `custom smart contract`.

Kindly refer to [everscale-inpgae-provider Docs](https://provider-docs.broxus.com/guides/deploy.html#deploy-a-contract) for detailed constructions.

The necessary npm packages are as follows:
- `ethers`
- `everscale-inpage-provider`
- `everscale-standalone-client`
- `tip3-docs-artifacts` 
- 
To install these packages, run the following command in your shell:

  ```shell
  npm install --save-dev ethers everscale-inpage-provider everscale-standalone-client tip3-docs-artifacts
  ```

## Provider
::: warning 
The following steps are only required when building Dapps and using decentralized wallets. If you are using **locklift** to make transactions, you can skip this step.  
:::

everscale-inpage-provider is used as provider for TVM based blockchains such as [Venom](https://venom.foundation/) and [Everscale](https://everscale.network/). Follow the steps below to initialize and use everscale-inpage-provider in your scripts.

```typescript
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
  // use the provider
````

