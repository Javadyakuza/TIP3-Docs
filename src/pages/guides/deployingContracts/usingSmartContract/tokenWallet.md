# Deploy Token Wallet

<div class="DeployTokenWallet">

In this section, we will explore an important aspect of deploying the TIP-3 standard contracts, which involves deploying a token wallet from a smart contract other than the token root contract. Specifically, we will focus on deploying a token wallet using the MultiWalletTIP3 contract.

## Step 1: Write Deployment Script

<span  :class="LLdis"  >

We can utilize the code sample below to deploy a token wallet and retrieve its address from the multi wallet contract with help of the locklift tool and the stats of the previously written script from the [deploy token root](./tokenRoot.md#step-1-write-deployment-script) section .

::: info
Before we start to write our scripts we need to make sure that there is a file named `04-deploy-wallet.ts` in the `script` folder in the project root.
:::

</span>

<span  :class="EIPdis"  >

In this section, we will cover the process of deploying a token wallet using the Multi Wallet TIP-3 contract. Please note that this operation can only be executed if the user does not possess an existing wallet for the respective token. Furthermore, to successfully deploy a token wallet for a token root using `everscale-inpage-provider`, you will require the addresses of both the token root and the multi wallet.

::: info
According to the Multi Wallet contract, it stores the wallet information and its corresponding balance. This balance is dynamically updated whenever there are token minting, burning, or transfer operations involving the wallet.
:::

</span>
<br/>

<div class="switcherContainer">

<button @click="llHandler" :class="llSwitcher">locklift</button>

<button @click="eipHandler" :class="eipSwitcher">everscale-inpage-provider </button>

</div>

<div class="codeBlockContainer" >

<span  :class="LLdis">

```typescript
/* Deploying Token Wallet contract using Multi Wallet TIP-3 */

// Deploying a TokenWallet contract using the using multi wallet contract for alice
// We will deploy another token wallet for bob at the time of transferring he tokens
await aliceMultiWalletContract.methods
  .deployWallet({
    _deployWalletBalance: locklift.utils.toNano('3'),
    _tokenRoot: tokenRootContract.address,
  })
  .sendExternal({ publicKey: signerAlice.publicKey });

// Fetching the newly deployed Token Wallet
let tokenWalletData = await getWalletData(
  aliceMultiWalletContract,
  tokenRootContract.address
);

const aliceTokenWalletContract: Contract<
  FactorySource['TokenWallet']
> = locklift.factory.getDeployedContract(
  'TokenWallet',
  tokenWalletData.tokenWallet
);

console.log(
  'Alice Token wallet address: ',
  tokenWalletData.tokenWallet.toString()
);
```

</span>

<span  :class="EIPdis">

```typescript
// Import the following libraries
import {
  ProviderRpcClient,
  Address,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

/**
 * We develop two more methods in order to reduce the mass of the script
 */

// This function will extract the public key of the sender
async function extractPubkey(
  provider: ProviderRpcClient,
  senderAddress: Address
): Promise<string> {
  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: senderAddress })
  ).state!;

  const senderPublicKey: string = await provider.extractPublicKey(
    accountFullState.boc
  );

  return senderPublicKey;
}

async function main() {
  try {
    // Required contracts addresses
    const tokenRootAddress: Address = new Address(
      '<YOUR_TOKEN_ROOT_ADDRESS>'
    );
    const multiWalletAddress: Address = new Address(
      '<YOUR_MULTI_WALLET_TIP3_ADDRESS>'
    );

    // Creating instances of the required contracts
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      tokenRootAddress
    );

    const MultiWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['MultiWalletTIP3'],
      multiWalletAddress
    );

    // Fetching the symbol
    const symbol: string = (
      await tokenRootContract.methods.symbol({ answerId: 0 }).call()
    ).value0;

    // Checking if the user already doesn't have any wallet of that token root
    let tokenWalletData = (
      await MultiWalletContract.methods.wallets().call()
    ).wallets.map(item => {
      if (
        item[0].toString() == tokenRootContract.address.toString()
      ) {
        return item[1];
      }
    });

    if (
      tokenWalletData[0]!.tokenWallet.toString() !=
      tip3Artifacts.zeroAddress.toString()
    ) {
      throw new Error(
        'Failed, You already have a wallet of this token !'
      );
    }

    // Deploying a new token wallet if it doesn't exists before
    const { transaction: deployWalletRes } =
      await MultiWalletContract.methods
        .deployWallet({
          _deployWalletBalance: 2 * 10 ** 9,
          _tokenRoot: tokenRootContract.address,
        })
        .sendExternal({
          publicKey: await extractPubkey(provider, providerAddress),
        });

    // Throwing an error if the transaction was aborted
    if (deployWalletRes.aborted) {
      throw new Error(
        `Transaction aborted ! ${
          (deployWalletRes.exitCode, deployWalletRes.resultCode)
        }`
      );
    }

    // Fetching the new wallet data from the multi wallet contract and check if its deployed successfully or not
    tokenWalletData = (
      await MultiWalletContract.methods.wallets().call()
    ).wallets.map(item => {
      if (
        item[0].toString() == tokenRootContract.address.toString()
      ) {
        return item[1];
      }
    });
    if (
      tokenWalletData[0]!.tokenWallet.toString() !=
      tip3Artifacts.zeroAddress.toString()
    ) {
      console.log('Token Wallet successfully deployed !');

      return `${symbol}'s token wallet deployed to: ${tokenWalletData[0]!.tokenWallet.toString()}`;
    } else {
      throw new Error(
        `The token wallet deployment failed ! ${
          (deployWalletRes.exitCode, deployWalletRes.resultCode)
        }`
      );
    }
  } catch (e: any) {
    throw new Error(`Failed ${e.message}`);
  }
}
```

</span>

</div>

## Step 2: Deploy a TokenWallet

<div class="action">
<div :class="llAction">

Use this command and deploy token wallet

```shell
npx locklift run -s ./scripts/04-deploy-wallet.ts -n local
```

<ImgContainer src= '/04-deploy-wallet.png' width="100%" altText="buildStructure" />

Congratulations, you have deployed a TIP3 Token Wallet from the Multi Wallet TIP-3 contract 🎉

</div>

<div :class="eipAction" >

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Multi Wallet TIP-3 address</p>
<input ref="actionMultiWalletTip3Address" class="action Ain" type="text"/>

<button @click="deployTokenWallet" class="deployTokenWalletBut" >Deploy token wallet</button>

</div>

</div>

<p id="output-p" :class="EIPdis" ref="deployTokenWalletOutput"><loading :text="loadingText"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../../scripts/types";
import {toast} from "/src/helpers/toast";
import {deployTokenWalletCon} from "../../scripts/contract/tokenWallet"
import ImgContainer from "../../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"
import loading from "../../../../../.vitepress/theme/components/shared/BKDLoading.vue"

export default defineComponent({
  name: "DeployTokenWallet",
    components :{
    ImgContainer,
    loading

  },
  data(){
    return{
        LLdis: "cbShow",
        EIPdis: "cbHide",
        llSwitcher:"llSwitcher on",
        eipSwitcher: "eipSwitcher off",
        llAction: "llAction cbShow",
        eipAction: "eipAction cbHide",
        loadingText: " ",

    }
  },
  setup() {

    function llHandler(e){
        if(this.LLdis == "cbHide")
        {
            this.llSwitcher = "llSwitcher on";
            this.eipSwitcher = "eipSwitcher off"
        };
        this.EIPdis = "cbHide"
        this.LLdis = "cbShow"
        this.llAction = "llAction cbShow"
        this.eipAction = "eipAction cbHide"
}
    async function eipHandler(e){
        if(this.EIPdis == "cbHide")
        {
            this.llSwitcher = "llSwitcher off";
            this.eipSwitcher = "eipSwitcher on"
        };
        this.LLdis = "cbHide"
        this.EIPdis = "cbShow"
        this.llAction = "llAction cbHide"
        this.eipAction = "eipAction cbShow"
    }
  async function deployTokenWallet(){
          this.loadingText = ""
        // checking of all the values are fully filled
        if (
            this.$refs.actionTokenRootAddress.value == ""

        ){
            toast("Token root address field is required !",0)
            this.loadingText = "Failed"
            return
        }
        if (
            this.$refs.actionMultiWalletTip3Address.value == ""

        ){
            toast("Multi wallet tip-3 address field is required !",0)
            this.loadingText = "Failed"
            return
        }

        let deployTokenWalletAddr = await deployTokenWalletCon(this.$refs.actionTokenRootAddress.value, this.$refs.actionMultiWalletTip3Address.value)
        // Rendering the output
        deployTokenWalletAddr = !deployTokenWalletAddr ? "Failed" :  deployTokenWalletAddr;
        this.loadingText = deployTokenWalletAddr;
  }
return {
        eipHandler,
        llHandler,
        deployTokenWallet
    };
  },
});

</script>

<style>

.action{
    display:inline-block;
}

.actionInName{
    font-size: .9rem;
}

.deployTokenWalletBut, .switcherContainer, .codeBlockContainer, .Ain
{
  background-color: var(--vp-c-bg-mute);
  transition: background-color 0.1s;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-weight: 600;
  cursor : pointer;
}
.Ain{
    padding-left : 10px;
    margin : 0;
}
.deployTokenWalletBut{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;
    transition: all ease .3s;
}

.deployTokenWalletBut:hover{
      border: 1px solid var(--light-color-ts-class);
}

#output-p{
    /* height: 30px; */
    padding: 2px 10px;
    border-radius: 8px;
    border: 1px solid var(--vp-c-divider);
    }

.text{padding-left: 5px;font-size:1rem;}

.switcherContainer{
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    display: flex;
    border: none;
    padding: 0px;
}
.switcherContainer > p{
    margin: 0px;
    padding : 0px;
}
.codeBlockContainer{
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    padding: 8px 12px;
    font-size: 1rem;
}
.cbShow{
    display: block;
}
.cbHide{
    display: none;
}
.llSwitcher{
    padding: 5px 10px;
    border:  0 solid var(--vp-c-divider);
    border-width: 1px ;
    border-color: var(--vp-c-divider);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    font-weight: 600;
    transition: all ease .2s;
}
.eipSwitcher{
    padding: 5px 10px;
    border:  0 solid var(--vp-c-divider);
    border-width: 1px ;
    border-color: var(--vp-c-divider);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    font-weight: 600;
    transition: all ease .2s;
}
.llSwitcher:hover, .eipSwitcher:hover{
      border-color: var(--light-color-ts-class);
}
.eipAction{
    font-weight: 600;
}
.on{
    color : var(--light-color-ts-class);
}
.off{
    color : var(--vp-c-bg-mute);
}

* {box-sizing: border-box;}

.container {
  display: flex;
  position: relative;
  margin-bottom: 12px;
  font-size: .9rem;
}

.container .checkboxInput {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;

}

.checkmark {
  cursor: pointer;
  position: relative;
  top: 0;
  left: 0;
  height: 25px;
  width: 25px;
  background-color: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius : 8px;
  margin-left: 10px;
}

.container input:checked ~ .checkmark {
  background-color: var(--vp-c-brand);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.container input:checked ~ .checkmark:after {
  display: block;
}

.container .checkmark:after {
  left: 9px;
  top: 5px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}

</style>
