# Deploy Upgradable Contracts

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

## Step 2: Deploy The Contracts

First create a file named `00-deploy-upgradeable-contracts.ts` in your `scripts` folder and then copy the code sample below to it.

````typescript
import { Address, Contract, Signer, WalletTypes, zeroAddress } from "locklift";
import { FactorySource } from "../build/factorySource";
async function main() {
  try {
    // Fetching the signer and creating a wallet
    const signer: Signer = (await locklift.keystore.getSigner("0"))!;

    // uncomment if deploying a new account
    // const { contract: Account } = await locklift.factory.deployContract({
    //   contract: "Account",
    //   publicKey: signer.publicKey,
    //   constructorParams: {},
    //   initParams: { _randomNonce: locklift.utils.getRandomNonce() },
    //   value: locklift.utils.toNano(20),
    // });

    // Adding an existing account from the key pair defined in  the locklift.config.ts
    const account = await locklift.factory.accounts.addExistingAccount({
      type: WalletTypes.WalletV3,
      publicKey: signer.publicKey,
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
    console.log(`Token Root Upgradeable deployed to: ${tokenRootUpgradeable.address.toString()}`);

    // Deploying the TokenWalletPlatform via the TokenRootContract which results deploying the TokenWalletUpgradable contract
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

    console.log(`The token wallet upgradable balance: ${balance}`); // >> 0

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

    balance = (await tokenWalletUpgradeable.methods.balance({ answerId: 0 }).call({})).value0;

    console.log(`The token wallet upgradable balance: ${Number(balance) / 10 ** 6}`); // >> 10
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

### Step 3: Interacting with Token Wallet Upgradeable
  We called the balance method on the token wallet contract to ensure that its deployed and then minted TIP-3 tokens for it to ensure is typical fungible functionality.


<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import ImgContainer from "../.vitepress/theme/components/shared/BKDImgContainer.vue"

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