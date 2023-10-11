# Deploy Account

In this section we will learn how to deploy an Account smart contract and use it in our scripts to send transactions.


## Step 1: Write a Deployment Script

Let's write a simple script in typescript that will use locklift to deploy our Account.&#x20;

::: info
Before we start to write our scripts we need to make sure that there is a file named `00-deploy-account.ts` in the `script` folder in the project root.
:::

``` typescript

/*
  locklift is a globally declared variable
*/

import { Signer, WalletTypes, Address } from "locklift";

async function main() {

  // each mnemonic can generate more that just one key pair, so we specify which pair do we want.
  const keyNumber = "0";
  const balance = 30;

  /* We get a pair of private and public keys,
      which we get from the mnemonic from the config
    SimpleSigner {
      keyPair: {
        secretKey: 'bb2903d025a330681e78f3bcb248d7d89b861f3e8a480eb74438ec0299319f7a',
        publicKey: 'e85f61aaef0ea43afc14e08e6bd46c3b996974c495a881baccc58760f6349300'
      },
      publicKey: 'e85f61aaef0ea43afc14e08e6bd46c3b996974c495a881baccc58760f6349300'
    }
  */

  const signer: Signer = (await locklift.keystore.getSigner(keyNumber))!;

  // Deploying the account contract
  const {contract: account} = await locklift.factory.deployContract({
    contract: "Account",
    publicKey: signer.publicKey,
    constructorParams: {},
    initParams: { _randomNonce: locklift.utils.getRandomNonce() },
    value: locklift.utils.toNano(balance),
  });

  // Adding it to the AccountStorage to be recognized as a sender to be able to send transaction from it
  const loadedAccount = await locklift.factory.accounts.addExistingAccount({
    type: WalletTypes.MsigAccount,
    address: account.address,
    mSigType: "SafeMultisig",
  });

  console.log(`Account deployed at: ${loadedAccount.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

```

:::tip
- Giver - is a contract that has a `sendTransaction` method.\
The local-node already
has a pre-installed contract with the initial amount of EVERs. For other networks, you can configure your giver in `locklift.config.ts`

- If you need a permanent address for testing, then set the `_randomNonce` constant. By changing  `_randomNonce` you change the byte code of the contract, and the final address.

- Kindly Navigate to the Deployment section to see the example of using the Account contract to send transaction from.
:::

## Step 2: Deploy the Account

Use this command and deploy account:

```shell
npx locklift run -s ./scripts/00-deploy-account.ts -n local
```
<ImgContainer src= '/image(13).png' width="100%" altText="deployAccountOutput" />

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import ImgContainer from "../../../.vitepress/theme/components/shared/BKDImgContainer.vue"

export default defineComponent({
  name: "Diagrams",
  components :{
    ImgContainer
  },
  setup() {
    return {
    };
  },
});

</script>