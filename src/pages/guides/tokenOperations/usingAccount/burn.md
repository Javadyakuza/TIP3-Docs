# Burn TIP-3 Tokens

<div class="burnToken">

let's burn some tokens 🔥.&#x20;

In this section we will learn the how to burn TIP-3 tokens from a token wallet.

The TIP-3 standard have to methods to burn tokens:

- `burn`: This method will be called on the token wallet and easily burns the tokens.

- `burnByRoot`: The `burnTokens` will be called on the token root contract, accordingly root will call the `burnByRoot` function on the token wallet and burns the tokens.

::: tip

To utilize the `burnByRoot` function, it is essential to ensure that the `burnByRootDisabled` parameter is set to `false` during the deployment of the token root contract. This will enable the functionality required for burning tokens.

Furthermore, it is important to note that only the owner of the root contract has the authority to invoke the `burnTokens` function.

:::

## Step 1: Write Burning Script

<span  :class="LLdis"  >

Utilize the code sample below to burn TIP- tokens using locklift and the stats of the previously written script in the [transfer tip-3](/guides/tokenOperations/usingAccount/transfer.md#step-1-write-transfer-script) section:

::: info
Before we start to write our scripts we need to make sure that there is a file named `05-burn-tip3.ts` in the `script` folder in the project root.
:::

</span>

<span :class="EIPdis"  >

:::warning

- Notice that if the `Notify` parameter be true for the transaction, the change will be sent back to the sender accounts `tokenWallet` contract !!\
  So if you want the change back into your `account contract` leave the Notify `unchecked` !!

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
// Preparing the burn amounts
const burnAmount: number = 20 * 10 ** decimals;
const burnByRootAmount: number = 10 * 10 ** decimals;

console.log(
  'Alice balance before burn: ',
  Number(
    (
      await aliceTokenWallet.methods
        .balance({
          answerId: 0,
        })
        .call()
    ).value0
  ) /
    10 ** decimals
);

// burning tokens by calling the "burn" method in the alice's token wallet
await aliceTokenWallet.methods
  .burn({
    amount: burnAmount,
    remainingGasTo: aliceAccount.address,
    callbackTo: zeroAddress,
    payload: '',
  })
  .send({
    from: aliceAccount.address,
    amount: locklift.utils.toNano(3),
  });

// checking if tis burned
console.log(
  'Alice balance after burn: ',
  Number(
    (
      await aliceTokenWallet.methods
        .balance({
          answerId: 0,
        })
        .call()
    ).value0
  ) /
    10 ** decimals
);

// burning tokens by calling the "burnTokens" on the token root
await tokenRootContract.methods
  .burnTokens({
    amount: burnByRootAmount,
    walletOwner: aliceAccount.address,
    remainingGasTo: aliceAccount.address,
    callbackTo: zeroAddress,
    payload: '',
  })
  .send({
    from: aliceAccount.address,
    amount: locklift.utils.toNano(3),
  });
console.log(
  'Alice balance after burn by root: ',
  Number(
    (
      await aliceTokenWallet.methods
        .balance({
          answerId: 0,
        })
        .call()
    ).value0
  ) /
    10 ** decimals
);
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
  try {
    const tokenRootAddress: Address = new Address(
      '<YOUR_TOKEN_WALLET_ADDRESS>'
    );

    // Fetching the required contracts
    const tokenRootContract: Contract<
      tip3Artifacts.FactorySource['TokenRoot']
    > = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      tokenRootAddress
    );
    const tokenWalletAddress: Address = (
      await tokenRootContract.methods
        .walletOf({ answerId: 0, walletOwner: providerAddress })
        .call({})
    ).value0;

    const tokenWalletContract: Contract<
      tip3Artifacts.FactorySource['TokenWallet']
    > = new provider.Contract(
      tip3Artifacts.factorySource['TokenWallet'],
      tokenWalletAddress
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      Number(
        (
          await tokenRootContract.methods
            .decimals({ answerId: 0 })
            .call()
        ).value0
      ),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call())
        .value0,
    ]);

    const burnAmount: number = 100 * 10 ** decimals;

    const oldBal: number =
      Number(
        (
          await tokenWalletContract.methods
            .balance({ answerId: 0 })
            .call()
        ).value0
      ) /
      10 ** decimals;

    // burning tokens from a token wallet by calling the burn method
    const burnRes: Transaction = await tokenWalletContract.methods
      .burn({
        amount: burnAmount,
        payload: '',
        remainingGasTo: providerAddress,
        callbackTo: tip3Artifacts.zeroAddress,
      })
      .send({
        from: providerAddress,
        amount: String(3 * 10 ** 9),
      });

    if (burnRes.aborted) {
      throw new Error(
        `Transaction aborted ! ${
          (burnRes.exitCode, burnRes.resultCode)
        }`
      );
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBal: number =
      Number(
        (
          await tokenWalletContract.methods
            .balance({ answerId: 0 })
            .call()
        ).value0
      ) /
      10 ** decimals;

    if (oldBal >= newBal) {
      console.log(
        `${
          burnAmount / 10 ** decimals
        } ${symbol}'s successfully burnt !`
      );

      return `Hash: ${burnRes.id.hash} \n old Balance  ${oldBal} \n New balance: ${newBal}`;
    } else {
      console.error(`Failed \n
      ${(burnRes.exitCode, burnRes.resultCode)}`);
    }

    /*
     Using burnByRoot function

    */
    const burnByRootAmount: number = 50 * 10 ** decimals;

    const oldBalance: number =
      Number(
        (
          await tokenWalletContract.methods
            .balance({ answerId: 0 })
            .call()
        ).value0
      ) /
      10 ** decimals;

    // Deploying a new contract if didn't exist before
    const burnByRotRes: Transaction = await tokenRootContract.methods
      .burnTokens({
        amount: burnByRootAmount,
        walletOwner: providerAddress,
        payload: '',
        remainingGasTo: providerAddress,
        callbackTo: tip3Artifacts.zeroAddress,
      })
      .send({
        from: providerAddress,
        amount: String(3 * 10 ** 9),
      });

    if (burnByRotRes.aborted) {
      throw new Error(
        `Transaction aborted ! ${
          (burnByRotRes.exitCode, burnByRotRes.resultCode)
        }`
      );
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBalance: number =
      Number(
        (
          await tokenWalletContract.methods
            .balance({ answerId: 0 })
            .call()
        ).value0
      ) /
      10 ** decimals;

    if (oldBal >= newBal) {
      console.log(
        `${
          burnByRootAmount / 10 ** decimals
        } ${symbol}'s successfully burnt`
      );

      return `Hash: ${burnByRotRes.id.hash} \n old Balance  ${oldBal} \n New balance: ${newBal}`;
    } else {
      throw new Error(`Failed \n
       ${(burnByRotRes.exitCode, burnByRotRes.resultCode)}`);
    }
  } catch (e: any) {
    throw new Error(`Failed: ${e.message}`);
  }
}
```

</span>

</div>

<div class="action">

## Step 2: Burn Tokens

<div :class="llAction">

Use this command to burn TIP-3 tokens:

```shell
npx locklift run -s ./scripts/05-burn-tip3.ts -n local
```

<ImgContainer src= '/05-burn-tip3.png' width="100%" altText="burnTip3Output" />

Congratulations, you have successfully burned TIP-3 tokens from a token wallet 🎉

</div>

<div :class="eipAction" >

<div :class="burn">

### Burn TIP-3 tokens

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p>
<input ref="actionAmount" class="action Ain" type="text"/>

<button @click="burnTokens" class="burnTokenBut" >burn Tokens</button>

</div>
<p id="output-p" :class="EIPdis" ref="burnTokenOutput"><loading :text="loadingText"/></p>

### Burn TIP-3 Tokens By root

::: tip
In order to utilize the `burnByRoot` you must be the root owner !
:::

<div class="burnByRoot">
<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionTokenRootAddressByRoot" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Target address to burn tokens from</p>
<input ref="actionCandleAddressByRoot" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p>
<input ref="actionAmountByRoot" class="action Ain" type="text"/>

<button @click="burnTokensByRoot" class="burnTokenBut" >burn TIP-3 Tokens By Root </button>

</div>
<p id="output-p" :class="EIPdis" ref="burnTokenOutputByRoot"><loading :text="loadingText2"/></p>

</div>

</div>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {toast} from "/src/helpers/toast";
import {burnTip3Eip} from "../../scripts/account/burn"
import {burnByRootTip3Eip} from "../../scripts/account/burnByRoot"
import ImgContainer from "../../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"
import loading from "../../../../../.vitepress/theme/components/shared/BKDLoading.vue"

export default defineComponent({
  name: "burnToken",
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
        loadingText2: " "
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
  async function burnTokens(){
          this.loadingText = ""
        // checking of all the values are fully filled
        if (
            this.$refs.actionTokenRootAddress.value == ""

        ){
            toast("Token root address field is required !",0)
            this.loadingText = "Failed"
            return
        }
        // checking of all the values are fully filled
        if (
            this.$refs.actionAmount.value == ""

        ){
            toast("Amount field is required !", 0)
            this.loadingText = "Failed"
            return
        }


        let burnTokenRes = await burnTip3Eip(
          this.$refs.actionTokenRootAddress.value,
          this.$refs.actionAmount.value,
          )
          // Rendering the output
          burnTokenRes = !burnTokenRes ? "Failed" :  burnTokenRes;
          this.loadingText = burnTokenRes;
  }

   async function burnTokensByRoot(){
          this.loadingText2 = ""
        if (
            this.$refs.actionTokenRootAddressByRoot.value == ""

        ){
            toast("token Root field field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        if (
            this.$refs.actionCandleAddressByRoot.value == ""

        ){
            toast("target field is required !", 0)
            this.loadingText2 = "Failed"
            return
        }
        // checking of all the values are fully filled
        if (
            this.$refs.actionAmountByRoot.value == ""

        ){
            toast("Amount field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        let burnTokenRes = await burnByRootTip3Eip(
          this.$refs.actionTokenRootAddressByRoot.value,
          this.$refs.actionCandleAddressByRoot.value,
          this.$refs.actionAmountByRoot.value
          )
          // Rendering the output
          burnTokenRes = !burnTokenRes ? "Failed" :  burnTokenRes;
          this.loadingText2 = burnTokenRes;
  }

return {
        eipHandler,
        llHandler,
        burnTokens,
        burnTokensByRoot
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

.burnTokenBut, .switcherContainer, .codeBlockContainer, .Ain
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
.burnTokenBut{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;
    transition: all ease .3s;
}

.burnTokenBut:hover{
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
