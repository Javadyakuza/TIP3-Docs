# Deploy Token Wallet

<div class="DeployTokenWallet">

In this section we will learn how to deploy a token wallet of an existing token root contract.

::: info
TON Solidity compiler allows specifying different parameters of the outbound internal message that is sent via external function call. Note, all external function calls are asynchronous, so callee function will be called after termination of the current transaction. `value`, `currencies`, `bounce` or `flag` options can be set. See [\<address>.transfer()](https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#addresstransfer) where these options are described.&#x20;

**Note:** if `value` isn't set, then the default value is equal to 0.01 ever, or 10^7 nanoever. It's equal to 10_000 units of gas in workchain. If the callee function returns some value and marked as `responsible` then `callback` option must be set. This callback function will be called by another contract. Remote function will pass its return values as function arguments for the callback function. That's why types of return values of the callee function must be equal to function arguments of the callback function. If the function marked as `responsible` then field `answerId` appears in the list of input parameters of the function in `*abi.json` file. `answerId` is function id that will be called.
:::

## Step 1: Write Deployment Script

<span  :class="LLdis">

Now lets write the scripts to deploy a Token Wallet using locklift and previously written script [stats](./tokenRoot.md#step-1-write-deployment-script).

::: info
Before we start to write our scripts we need to make sure that there is a file named `02-deploy-wallet.ts` in the `script` folder in the project root.
:::

Deploying the Token Wallet of an existing Token Root contract using the locklift tool can be achieved by utilizing the code sample provided below:

</span>
<span  :class="EIPdis"  >

Using the `everscale-inpage-provider` to deploy a token wallet is as easy as a piece of cake! All we need to do is call the `deployWallet` function on the root contract, as explained below:

</span>
<br/>

<div class="switcherContainer">

<button @click="llHandler" :class="llSwitcher">locklift</button>

<button @click="eipHandler" :class="eipSwitcher">everscale-inpage-provider </button>

</div>

<div class="codeBlockContainer" >

<span  :class="LLdis">

```typescript
/* Deploying a token wallet for alice  */

// deploying a token wallet using deployWallet method on the token root contract
await tokenRootContract.methods
  .deployWallet({
    answerId: 0,
    walletOwner: aliceAccount.address,
    deployWalletValue: locklift.utils.toNano('2'),
  })
  .send({
    from: aliceAccount.address,
    amount: locklift.utils.toNano('4'),
  });

// Fetching the newly deployed token wallet address by calling the walletOf method on the token root
const walletAddress: Address = (
  await tokenRootContract.methods
    .walletOf({
      answerId: 0,
      walletOwner: aliceAccount.address,
    })
    .call({})
).value0;

console.log(`TIP3 Wallet deployed at: ${walletAddress.toString()}`);
```

</span>

<span  :class="EIPdis">

```typescript
import {
  Address,
  Contract,
  Transaction,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  // Preparing token root address
  const tokenRootAddress: Address = new Address(
    '<YOUR_TOKEN_ROOT_ADDRESS>'
  );

  // creating an instance of the token root contract
  const tokenRootContract: Contract<
    tip3Artifacts.FactorySource['TokenRoot']
  > = new provider.Contract(
    tip3Artifacts.factorySource['TokenRoot'],
    tokenRootAddress
  );

  // Checking if the user already doesn't have any deployed wallet of that token root
  const tokenWalletAddress: Address = (
    await tokenRootContract.methods
      .walletOf({ answerId: 0, walletOwner: providerAddress })
      .call()
  ).value0;

  // checking if the token wallet is already deployed or not
  if (
    (
      await provider.getFullContractState({
        address: tokenWalletAddress,
      })
    ).state?.isDeployed
  )
    throw new Error(
      'You already have a token wallet of this token !'
    );

  // Deploying a new token wallet contract
  const deployWalletRes: Transaction = await tokenRootContract.methods
    .deployWallet({
      answerId: 0,
      walletOwner: providerAddress,
      deployWalletValue: 2 * 10 ** 9,
    })
    .send({
      from: providerAddress,
      amount: String(4 * 10 ** 9),
      bounce: true,
    });

  // Checking if the token wallet is deployed
  if (
    (
      await provider.getFullContractState({
        address: tokenWalletAddress,
      })
    ).state?.isDeployed
  ) {
    console.log(
      ` Token wallet deployed to: ${(
        await tokenRootContract.methods
          .walletOf({ answerId: 0, walletOwner: providerAddress })
          .call()
      ).value0.toString()}`
    );

    return true;
  } else {
    throw new Error(
      `The token wallet deployment failed ! ${
        (deployWalletRes.exitCode, deployWalletRes.resultCode)
      }`
    );
  }
}
```

</span>

</div>

<div class="action">

## Step 2: Deploy Token Wallet

<div :class="llAction">

Use this command and deploy token wallet

```shell
npx locklift run -s ./scripts/02-deploy-wallet.ts -n local
```

<ImgContainer src= '/02-deploy-wallet.png' width="100%" altText="deployTokenWalletOutput" />

Congratulations, you have deployed your first TIP3 Token Wallet 🎉

</div>

<div :class="eipAction" >

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<button @click="deployTokenWallet" class="deployTokenWalletBut" >Deploy token wallet</button>

</div>

</div>

<p id="output-p" :class="EIPdis" ref="deployTokenWalletOutput"><loading :text="loadingText"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../../scripts/types";
import {toast} from "/src/helpers/toast";
import {deployTokenWalletEip} from "../../scripts/account/tokenWallet"
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
                  this.loadingText =  "Failed"
            return
        }
        let deployTokenWalletAddr = await deployTokenWalletEip(this.$refs.actionTokenRootAddress.value)
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
