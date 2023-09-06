# Burn TIP-3 Tokens

let's burn some tokens 🔥.&#x20;

In this section we will learn the how to burn TIP-3 tokens from a token wallet.


::: info 

The TIP-3 standard have to methods to burn tokens:


- `burn`: This method will be called on the token wallet and easily burns the tokens.
- `burnByRoot`: The `burnTokens` will be called on the token root contract, accordingly root will call the `burnByRoot` function on the token wallet and burns the tokens.

:::
::: tip
- To be able to utilize the `burnByRoot` function the `burnByRootDisabled` parameter must be set to `false` at the time of deploying the token root contract !
- Only the owner of the root can call the `burnTokens`. 
:::

<div class="transferToken">

<span  :class="LLdis" style="font-size: 1.1rem;">

::: info
Before we start to write our scripts we need to make a file named `05-burn-tip3.ts` in the `script` folder in the project root.
:::

</span>

<span :class="EIPdis" style="font-size: 1.1rem;">

:::danger

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


````typescript
/**
 * locklift is globals declared object 
 */

import { ethers } from "ethers";
import { EverWalletAccount } from "everscale-standalone-client";
import { Address, WalletTypes, zeroAddress } from "locklift";

  // Creating two signers and wallets
  const aliceSigner = (await locklift.keystore.getSigner("0"))!;

  const aliceEverWallet = await EverWalletAccount.fromPubkey({ publicKey: aliceSigner.publicKey!, workchain: 0 });

  // Fetching the token root contract
  const tokenRootContract = locklift.factory.getDeployedContract("TokenRoot", tokenRootAddress);

  // getting decimals and symbols
  const [decimals, symbol] = await Promise.all([
    (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0,
    (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
  ]);

    const aliceTWCon: Contract<FactorySource["TokenWallet"]> = locklift.factory.getDeployedContract(
      "TokenWallet",
      (
        await tokenRoot.methods
          .walletOf({
            answerId: 0,
            walletOwner: aliceEverWallet.address,
          })
          .call()
      ).value0,
    );

    // We assume that alice has 200 tokens 
    console.log(
      "Alice's balance: ",
      ethers.formatUnits(
        (
          await aliceTWCon.methods
            .balance({
              answerId: 0,
            })
            .call()
        ).value0.toString(),
        Number(decimals),
      ),
    ); // >> 200

    // burning tokens by calling the "burn" method in the alice's token wallet 
    await aliceTWCon.methods
      .burn({
        amount: 100_000_000,
        remainingGasTo: aliceEverWallet.address,
        callbackTo: zeroAddress,
        payload: "",
      })
      .send({
        from: aliceEverWallet.address,
        amount: locklift.utils.toNano(3),
      });

    // checking if tis burned 
    console.log(
      "alice's balance: ",
      ethers.formatUnits(
        (
          await aliceTWCon.methods
            .balance({
              answerId: 0,
            })
            .call()
        ).value0.toString(),
        Number(decimals),
      ),
    ); // >> 100


    // burning tokens by calling the "burnTokens" on the token root 
    await tokenRoot.methods
      .burnTokens({
        amount: 50_000_000,
        walletOwner: aliceEverWallet.address,
        remainingGasTo: aliceEverWallet.address,
        callbackTo: zeroAddress,
        payload: "",
      })
      .send({
        from: aliceEverWallet.address,
        amount: locklift.utils.toNano(3),
      });

    console.log(
      "alice's balance: ",
      ethers.formatUnits(
        (
          await aliceTWCon.methods
            .balance({
              answerId: 0,
            })
            .call()
        ).value0.toString(),
        Number(decimals),
      ),
    ); // >> 50 

````

</span>

<span  :class="EIPdis">

** Using `burn` method: 

````typescript
import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

export async function main()
{

  // Initiate the TVm provider 
  const tokenWalletAddress: string = "<YOUR_TOKEN_ROOT_ADDRESS>"
  const tokenRootAddress: string = "<YOUR_TOKEN_WALLET_ADDRESS>"
  const burnAmount: number = 100;

  try {
    // creating an instance of the token root contract
    const tokenWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenWallet'],
      new Address(tokenWalletAddress)
    );
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0,
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    const oldBal = ethers.formatUnits(
      (await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0,
      Number(decimals)
    );

    // burning tokens from a token wallet by calling the burn method
    const burnRes: Transaction = await tokenWalletContract.methods
      .burn({
        amount: burnAmount * 10 * Number(decimals),
        payload: '',
        remainingGasTo: providerAddress,
        callbackTo: new Address(zeroAddress),
      })
      .send({
        from: providerAddress,
        amount: 3 * 10 * 9,
      });

    if (burnRes.aborted) {
      console.log(`Transaction aborted ! ${burnRes.exitCode}`);

      return burnRes;
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBal = ethers.formatUnits(
      (await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0,
      Number(decimals)
    );

    if (oldBal >= newBal) {
      console.log(`${amount} ${symbol}'s successfully burnt !`);

      return `Hash: ${burnRes.id.hash} \n old Balance  ${oldBal} \n New balance: ${newBal}`;
    } else {
      console.log('Burning tokens failed !');

      return `Failed \n 
      ${(burnRes.exitCode, burnRes.resultCode)}`;
    }
  } catch (e: any) {
    console.log(e.message, 0);

    return 'Failed';
  }
}

````
** Using `burnByRoot` method: 

````typescript
import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../src/helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

export async function main(){

  // Initiate the TVM provider 

  const tokenRootAddress: string = "<YOUR_TOKEN_WALLET_ADDRESS>"
  const burnByRootAmount: number  = 50;

  try {
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );
    const tokenWalletAddress = (
      await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: providerAddress }).call()
    ).value0;

    if (
      !(
        await provider.getFullContractState({
          address: tokenWalletAddress,
        })
      ).state?.isDeployed
    ) {
      console.log('You dont have tokens to burn !');

      return 'Failed';
    }

    // creating an instance of the token root contract
    const tokenWalletContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenWallet'],
      tokenWalletAddress
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0,
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    const oldBal = ethers.formatUnits(
      (await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0,
      Number(decimals)
    );
    // Deploying a new contract if didn't exist before
    const burnRes: Transaction = await tokenRootContract.methods
      .burnTokens({
        amount: burnByRootAmount * 10 * Number(decimals),
        walletOwner: providerAddress,
        payload: '',
        remainingGasTo: providerAddress,
        callbackTo: new Address(zeroAddress),
      })
      .send({
        from: providerAddress,
        amount: 3 * 10 * 9,
      });

    if (burnRes.aborted) {
      console.log(`Transaction aborted ! ${burnRes.exitCode}`);

      return burnRes;
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance

    const newBal = ethers.formatUnits(
      (await tokenWalletContract.methods.balance({ answerId: 0 }).call()).value0,
      Number(decimals)
    );

    if (oldBal >= newBal) {
      console.log(`${amount} ${symbol}'s successfully burnt`);

      return `Hash: ${burnRes.id.hash} \n old Balance  ${oldBal} \n New balance: ${newBal}`;
    } else {
      console.log('Burning tokens failed !');

      return `Failed \n 
      ${(burnRes.exitCode, burnRes.resultCode)}`;
    }
  } catch (e: any) {
    console.log(e.message);

    return 'Failed';
  }
}

````

</span>

</div>


<div class="action">
<div :class="llAction">

Use this command to burn TIP-3 tokens:

```shell
npx locklift run -s ./scripts/05-burn-tip3.ts -n local
```

![](</burnTip3.png>)

Congratulations, you have successfully burned TIP-3 tokens from a token wallet.

</div>

<div :class="eipAction" >

<div :class="transfer">



## burn TIP-3 tokens  

::: info 
In order to be able to burn token for token wallet from a token root you must be the root owner .
:::

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

</div>

</div>

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