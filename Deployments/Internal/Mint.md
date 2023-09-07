# Transfer TIP-3 Tokens

In previous section we have learned to deploy a token root and wallet using the our custom contract.&#x20;

In this section we will learn the how to mint some tokens for the deployed token wallet, it's pretty easy and straight forward, you just need to pay attention to a few small points.

<div class="transferToken">

::: info
Before we start to write our scripts we need to make sure that there is a file named `03-mint-tip3.ts` in the `script` folder in the project root.
:::

::: tip 

- Notice that the owner of the deployed Token Wallet is the `MultiWalletTIP3` contract that we deployed earlier.  
- the `notify` parameter is always true in `MultiWalletTIP3` in order to receive callback function from the token root contract and update the state of the `MultiWalletTIP3` contract.
:::

<span  :class="LLdis" style="font-size: 1.1rem;">

We can mint some TIP-3 tokens for the target Token Wallet as explained in the code samples below: 

</span>

<span :class="EIPdis" style="font-size: 1.1rem;">

Minting TIP-3 tokens using everscale-inpage-provider tool is pretty easy as well:


</span>
<br/>

<div class="switcherContainer">

<button @click="llHandler" :class="llSwitcher">locklift</button>

<button @click="eipHandler" :class="eipSwitcher">everscale-inpage-provider </button>

</div>

<div class="codeBlockContainer" >

<span  :class="LLdis">


```` typescript

import { EverWalletAccount } from "everscale-standalone-client";

/**
 * locklift is globals declared object 
 */

async function main() {
  // Setting up the signer and the wallet
  const signerAlice = (await locklift.keystore.getSigner("0"))!;
  
  const AliceEverWallet = await EverWalletAccount.fromPubkey({ publicKey: signer.publicKey!, workchain: 0 });
  
  // deploy or use the Root Deployer, Multi Wallet and the Token Root contracts from previous sections 
  const AliceMWCon;  
  const tokenRootCon;

  // Deploying a TokenWallet contract for Alice using the newly deployed MultiWallet contract
  await AliceMWCon.methods
    .deployWallet({
      _deployWalletBalance: locklift.utils.toNano("10"),
      _tokenRoot: tokenRootCon.address,
    })
    .sendExternal({ publicKey: signerAlice.publicKey });

  // Fetching the newly deployed Token Wallet
  const AliceTW = (await AliceMWCon.methods.wallets().call()).wallets.map(item => {
    if (item[0].toString() == tokenRootCon.address.toString()) {
      return item[1];
    }
  });

  const AliceTWCon = locklift.factory.getDeployedContract("TokenWallet", AliceTW[0]!.tokenWallet);

  console.log("Alice Token Wallet  ", AliceTW[0]!.tokenWallet.toString());

  const mintAmount: number = 50_000_000;

  // Minting tokens for Alice
  await tokenRootCon.methods
    .mint({
      amount: mintAmount,
      recipient: AliceMWCon.address,
      deployWalletValue: 0, // 2 if the token wallet was not deployed
      notify: true, // To update the Multi Wallet contract
      payload: "",
      remainingGasTo: AliceEverWallet.address,
    })
    .send({ from: AliceEverWallet.address, amount: locklift.utils.toNano("2") });

  // confirming that its received
  console.log(
    "Is the tokens minted for Alice ?",
    Number((await AliceTWCon.methods.balance({ answerId: 0 }).call({})).value0) == mintAmount,
  ); // >> true
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

````

</span>

<span  :class="EIPdis">


</span>

</div>


<div class="action">
<div :class="llAction">

Use this command to transfer TIP-3 tokens:

```shell
npx locklift run -s ./scripts/03-mint-tip3.js -n local
```

![](</internal_mint.png>)

Congratulations, you have successfully minted TIP-3 tokens for an token wallet deployed a costume contract .

</div>

<div :class="eipAction" >

<div :class="transfer">

## Transfer TIP-3 tokens  

<p class=actionInName style="margin-bottom: 0;">Token Root address</p> 
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Recipient address</p> 
<input ref="actionRecipientAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p> 
<input ref="actionAmount" class="action Ain" type="text"/>

<label class="container"> Notify
<input class="checkboxInput" ref="actionNotify" type="checkbox">
<span class="checkmark"></span>
</label>

<button @click="transferTokens" class="transferTokenBut" >Transfer Tokens</button>
</div>
<p id="output-p" :class="EIPdis" ref="transferTokenOutput"></p>

<div :class="transferToWallet">

## Transfer TIP-3 tokens to Token Wallet  

<p class=actionInName style="margin-bottom: 0;">Token Wallet address</p> 
<input ref="actionWalletRecipientAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p> 
<input ref="actionWalletAmount" class="action Ain" type="text"/>

<label class="container"> Notify
<input class="checkboxInput" ref="actionWalletNotify" type="checkbox">
<span class="checkmark"></span>
</label>

<button @click="transferTokensToWallet" class="transferTokenBut" >Transfer Tokens to Wallet</button>
</div>
</div>

</div>

<p id="output-p" :class="EIPdis" ref="WalletTransferTokenOutput"></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {toast} from "/src/helpers/toast";
import {transferTokenEip, transferTokenToWalletEip} from "../Scripts/Account/Transfer"

export default defineComponent({
  name: "transferToken",
  data(){
    return{
        LLdis: "cbShow",
        EIPdis: "cbHide",
        llSwitcher:"llSwitcher on",
        eipSwitcher: "eipSwitcher off",
        llAction: "llAction cbShow",
        eipAction: "eipAction cbHide"
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
  async function transferTokens(){
          this.$refs.transferTokenOutput.innerHTML = "Processing ..."
        // checking of all the values are fully filled 
        if (
            this.$refs.actionTokenRootAddress.value == ""

        ){
            toast("Token root address field is required !",0)
            this.$refs.transferTokenOutput.innerHTML = "Failed"
            return
        }
                // checking of all the values are fully filled 
        if (
            this.$refs.actionRecipientAddress.value == ""

        ){
            toast("Recipient address field is required !",0)
            this.$refs.transferTokenOutput.innerHTML = "Failed"
            return
        }        // checking of all the values are fully filled 
        if (
            this.$refs.actionAmount.value == ""

        ){
            toast("Amount field is required !",0)
            this.$refs.transferTokenOutput.innerHTML = "Failed"
            return
        }
        let transferTokenRes = await transferTokenEip(
          this.$refs.actionTokenRootAddress.value,
          this.$refs.actionRecipientAddress.value,
          this.$refs.actionAmount.value,
          this.$refs.actionNotify.checked
          )
          // Rendering the output     
          transferTokenRes = !transferTokenRes ? "Failed" :  transferTokenRes;
          this.$refs.transferTokenOutput.innerHTML = transferTokenRes;
  }

   async function transferTokensToWallet(){
          this.$refs.WalletTransferTokenOutput.innerHTML = "Processing ..."
        if (
            this.$refs.actionWalletRecipientAddress.value == ""

        ){
            toast("Recipient address field is required !",0)
            this.$refs.actionWalletAmount.innerHTML = "Failed"
            return
        }        // checking of all the values are fully filled 
        if (
            this.$refs.actionWalletNotify.value == ""

        ){
            toast("Amount field is required !",0)
            this.$refs.WalletTransferTokenOutput.innerHTML = "Failed"
            return
        }
        let transferTokenRes = await transferTokenToWalletEip(
          this.$refs.actionWalletRecipientAddress.value,
          this.$refs.actionWalletAmount.value,
          this.$refs.actionWalletNotify.checked
          )
          // Rendering the output     
          transferTokenRes = !transferTokenRes ? "Failed" :  transferTokenRes;
          this.$refs.WalletTransferTokenOutput.innerHTML = transferTokenRes;
  }
  
return {
        eipHandler,
        llHandler,
        transferTokens,
        transferTokensToWallet
    };
  },
});

</script>

<style>
.transferTokens{
  font-size: 1.1rem;
}
.action{
    display:inline-block;
}

.actionInName{
    font-size: .9rem;
}

.transferTokenBut, .switcherContainer, .codeBlockContainer, .Ain
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
.transferTokenBut{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;
    transition: all ease .3s;
}

.transferTokenBut:hover{
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
    border: 1px solid var(--vp-c-divider);
    border-bottom: none;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    font-weight: 600;
    transition: all ease .2s;
}
.eipSwitcher{
    padding: 5px 10px;
    border: 1px solid var(--vp-c-divider);
    border-bottom: none;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    font-weight: 600;
    transition: all ease .2s;
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
  background-color: var(--light-color-ts-class);
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