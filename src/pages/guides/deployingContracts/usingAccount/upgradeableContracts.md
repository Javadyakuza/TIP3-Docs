# Deploy upgradeable Contracts

In this section, we will guide you through the process of deploying TIP-3 standard upgradeable tokens and interacting with them using the Locklift tool.

## Step 1: Build Artifacts

Change the compiler config according to the below config in your locklift.config.ts file:

```` typescript
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    // path: "/mnt/o/projects/broxus/TON-Solidity-Compiler/build/solc/solc",

    // Or specify version of compiler
    version: "0.62.0",

    // Specify config for extarnal contracts as in exapmple
    externalContracts: {
      "node_modules/@broxus/tip3/build": [
        "TokenRoot",
        "TokenWallet",
        "TokenRootUpgradeable", // Added
        "TokenWalletPlatform", // Added
        "TokenWalletUpgradeable", // Added
      ],
      "node_modules/@broxus/contracts/contracts/wallets": ["Account"],
    },
  },
````

After changing the config file run this command to rebuild the artifacts of the added contracts:

````shell
npx locklift build
````

## Step 2: Use the Upgradeable Contracts

First create a file named `00-deploy-upgradeable-contracts.ts` in your `scripts` folder and then copy the code sample below to it.

Let's take a look at the code sample,  after that we explore what is happening inside of it.

````typescript

import { Address, Contract, Signer, WalletTypes, zeroAddress } from "locklift";
import { FactorySource } from "../build/factorySource";

async function main() {
  try {
    // Fetching the signer and creating a wallet
    const signer: Signer = (await locklift.keystore.getSigner("0"))!;

    // uncomment if deploying a new account
    // const { contract: account } = await locklift.factory.deployContract({
    //   contract: "Account",
    //   publicKey: signer.publicKey,
    //   constructorParams: {},
    //   initParams: { _randomNonce: locklift.utils.getRandomNonce() },
    //   value: locklift.utils.toNano(20),
    // });

    // Adding an existing SafeMultiSig Account using its address
    const account = await locklift.factory.accounts.addExistingAccount({
      type: WalletTypes.MsigAccount,
      address: new Address("<YOUR_ACCOUNT_ADDRESS>"),
      mSigType: "SafeMultisig",
    });

    console.log(`Account address: ${account.address.toString()}`);

    // Deploying the required contracts
    const { contract: tokenRootUpgradeable } = await locklift.factory.deployContract({
      contract: "TokenRootUpgradeable",
      publicKey: signer.publicKey,
      constructorParams: {
        initialSupplyTo: zeroAddress,
        initialSupply: 0,
        deployWalletValue: 0,
        mintDisabled: false,
        burnByRootDisabled: false,
        burnPaused: false,
        remainingGasTo: account.address,
      },
      initParams: {
        deployer_: zeroAddress, // must be zero address, not zeroAddress if deploying fromm a contract
        randomNonce_: locklift.utils.getRandomNonce(),
        rootOwner_: account.address,
        name_: "Tip3OnboardingToken",
        symbol_: "TOT",
        decimals_: 6,
        walletCode_: locklift.factory.getContractArtifacts("TokenWalletUpgradeable").code,
        platformCode_: locklift.factory.getContractArtifacts("TokenWalletPlatform").code,
      },
      value: locklift.utils.toNano(6),
    });
    console.log(`Token Root Upgradeable deployed to: ${tokenRootUpgradeable.address.toString()}`);

    // ensure its deployed
    console.log(`Token Root name: ${(await tokenRootUpgradeable.methods.name({ answerId: 0 }).call()).value0}`); // >> Tip3OnboardingToken

    // Deploying the TokenWalletPlatform via the TokenRootContract which results deploying the TokenWalletupgradeable contract
    await tokenRootUpgradeable.methods
      .deployWallet({
        answerId: 0,
        deployWalletValue: locklift.utils.toNano(5),
        walletOwner: account.address,
      })
      .send({ from: account.address, amount: locklift.utils.toNano(10) });

    /**
     * @dev Notice that now that the constructor of the Token Wallet Platform is triggered, its code should have been changed to the Token Wallet upgradeable,
     * but our script has fetched the contract with the platform contract abi so we are not able to call the token wallet function, therefor we need to an instance of the contract.
     */
    const tokenWalletAddress: Address = (
      await tokenRootUpgradeable.methods
        .walletOf({
          answerId: 0,
          walletOwner: account.address,
        })
        .call({})
    ).value0;

    const tokenWalletUpgradeable: Contract<FactorySource["TokenWalletUpgradeable"]> =
      locklift.factory.getDeployedContract("TokenWalletUpgradeable", tokenWalletAddress);

    let balance: string = (await tokenWalletUpgradeable.methods.balance({ answerId: 0 }).call({})).value0;

    console.log(`The token wallet upgradeable balance: ${balance}`); // >> 0

    // Minting some token for that token wallet
    await tokenRootUpgradeable.methods
      .mint({
        recipient: account.address,
        amount: 10 * 10 ** 6,
        remainingGasTo: account.address,
        notify: false,
        payload: "",
        deployWalletValue: 0, // already minted
      })
      .send({ from: account.address, amount: locklift.utils.toNano(3) });

    // Fetching the balance and the version of the wallet
    balance = (await tokenWalletUpgradeable.methods.balance({ answerId: 0 }).call({})).value0;

    let version = (await tokenWalletUpgradeable.methods.version({ answerId: 0 }).call({})).value0;

    console.log(
      `The token wallet upgradeable balance: ${Number(balance) / 10 ** 6}
       token Wallet version: ${version}`,
    ); // >> 10 , 1

    // Upgrading the token wallet code in the root contract
    await tokenRootUpgradeable.methods
      .setWalletCode({
        code: locklift.factory.getContractArtifacts("newTokenWalletUpgradeable").code,
      })
      .send({ from: account.address, amount: locklift.utils.toNano(3) });

    // Time to update the th token wallet upgradeable code by requesting a code upgrade on the root contract
    await tokenWalletUpgradeable.methods
      .upgrade({ remainingGasTo: account.address })
      .send({ from: account.address, amount: locklift.utils.toNano(3) });

    // Calling the newly added function (getName)
    //fetching the token wallet contract with the new abi and the same old address
    const newTokenWalletUpgradeable: Contract<FactorySource["newTokenWalletUpgradeable"]> =
      locklift.factory.getDeployedContract("newTokenWalletUpgradeable", tokenWalletUpgradeable.address);

    console.log(
      "retrieved name: ",
      (await newTokenWalletUpgradeable.methods.getName({ answerId: 0, _name: "alice" }).call()).value0,
      "\n new token wallet version: ",
      (await tokenWalletUpgradeable.methods.version({ answerId: 0 }).call({})).value0,
    );

    // destroy the token wallet
    // draining the token balance of the wallet
    await tokenRootUpgradeable.methods
      .burnTokens({
        amount: 10 * 10 ** 6,
        walletOwner: account.address,
        remainingGasTo: account.address,
        callbackTo: zeroAddress,
        payload: "",
      })
      .send({ from: account.address, amount: locklift.utils.toNano(2) });

    // confirming that the balance is drained successfully
    balance = (await tokenWalletUpgradeable.methods.balance({ answerId: 0 }).call({})).value0;

    console.log(`balance after draining: ${balance}`); // >> 0
    // now its time to destroy the token wallet

    // Time to destroy the token wallet
    await tokenWalletUpgradeable.methods
      .destroy({ remainingGasTo: account.address })
      .send({ from: account.address, amount: locklift.utils.toNano(2) });

    // calling a method on it to ensure its destroyed
    console.log((await newTokenWalletUpgradeable.methods.getName({ answerId: 0, _name: "alice" }).call()).value0); // >> runLocal: Account not found
  } catch (err: any) {
    console.log(err.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    // console.log(e);
    process.exit(1);
  });
````

Then run this command to execute the script:

```` shell
npx locklift run -s scripts/00-deploy-upgradeable-contracts.ts -n local
````

The expected output will be:

<ImgContainer src= '/upgradeableContracts.png' width="100%" altText="deployMWOutput" />

## Code Sample Specification

### Step 1: Deploy Token Root Upgradeable
  We deployed a `TokenRootUpgradeable` using `TokenWalletPlatform` and `TokenWalletUpgradeable` contract codes and other params.

### Step 2: Deploy Token Wallet (Token Wallet Platform)
  We utilized the `deployWallet` function of the root contract to deploy a `TokenWalletPlatform` contract which results deployment of the `TokenWalletUpgradeable` contract.

### Step 3: Mint TIP-3 Tokens for the Token wallet
We utilize the mint function on the token root upgradeable contract to mint tip-3 token for the newly deploy token wallet upgradeable contract.

### Step 4: Interacting with Token Wallet Upgradeable
  We called the balance method on the token wallet contract to ensure that its deployed and then minted TIP-3 tokens for it to ensure is typical fungible functionality.

### Step 5: Upgrading the Token Wallet Upgradeable
This step is containing two steps:

- Upgrading the wallet code in the root contract
- Upgrading the wallets codes to the the latest code accessible on the root contract

These two steps are achieved by calling utilizing the `setWalletCode` function to update the latest wallet code on the root contract and then we request to upgrade our wallet code to the latest code by utilizing the `upgrade` function on the `tokenWalletUpgradeable` contract.

### Step 6: Destroying the Token Wallet

In addition to the previous section, this section consists of two steps:

1. Draining the token balance from the wallet.
2. Destroying the wallet by draining its entire balance.

The first step is achieved by using the  `burnTokens`  function on the token root contract, which burns all of the TIP3 tokens owned by the target wallet. This ensures that no funds are lost. Afterward, the  `destroy`  method is called on the  `tokenWalletUpgradeable`  contract to drain all gas tokens (such as ton, ever, etc.) from the wallet balance, resulting in the destruction of the wallet contract.

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import ImgContainer from "../../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"

export default defineComponent({
  name: "DUC",
  components :{
    ImgContainer
  },
  data(){

return {

    };
  },
});

</script>