# Mint TIP-3 Tokens

In previous section we have learned to deploy a token root and wallet using An account smart contract.&#x20;

In this section we will learn the how to mint some tokens for that token wallet.

To mint some tokens for some token wallet we just need to call the `mint` function in the token root contract.
Accordingly the `acceptMint` function will be called on the token wallet, after that tokens will be minted for the recipient token wallet.

<div class="transferToken">


<span  :class="LLdis" style="font-size: 1.1rem;">

::: info
Before we start to write our scripts we need to make a file named `03-mint-tip3.ts` in the `script` folder in the project root.
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
  const bobSigner = (await locklift.keystore.getSigner("1"))!;

  const aliceEverWallet = await EverWalletAccount.fromPubkey({ publicKey: aliceSigner.publicKey!, workchain: 0 });

  const bobEverWallet = await EverWalletAccount.fromPubkey({ publicKey: bobSigner.publicKey!, workchain: 0 });

  // preparing the parameters
  const tokenRootAddress: Address = new Address("<YOUR_TOKEN_ROOT_ADDRESS>")
  const mintAmount: number = 10;
  const bobHasTokenWallet: boolean = false;
  const deployWalletValue: string = locklift.utils.toNano(bobHasTokenWallet ? "0" : "3");
  const txFee = locklift.utils.toNano(bobHasTokenWallet ? "2" : "5");

  // Fetching the token root contract
  const tokenRootContract = locklift.factory.getDeployedContract("TokenRoot", tokenRootAddress);

  // getting decimals and symbols
  const [decimals, symbol] = await Promise.all([
    (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0,
    (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
  ]);

  // minting some token for the recipient
  await tokenRootContract.methods
    .mint({
      amount: mintAmount * 10 * Number(decimals),
      deployWalletValue: deployWalletValue,
      notify: false,
      recipient: bobEverWallet.address,
      remainingGasTo: aliceEverWallet.address,
      payload: "",
    })
    .send({
      from: aliceEverWallet.address,
      amount: txFee,
    });

  // Fetching the bobs balance
  const bobTWCon = await locklift.factory.getDeployedContract(
    "TokenWallet",
    (await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: bobEverWallet.address }).call()).value0,
  );
  const bobBal = (await bobTWCon.methods.balance({ answerId: 0 }).call()).value0;
  console.log(`bob's ${symbol} balance: ${bobBal}`); // >> 10_000_000
````

</span>

<span  :class="EIPdis">

```` typescript
import { ethers } from 'ethers';
import { ProviderRpcClient as PRC, Address, Transaction } from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../src/helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';

export async function mintTip3Eip(
  tokenRootAddress: string,
  amount: string,
  recipient: string
): Promise<Address | string | Transaction | undefined | any> {
  // setting up the provider
  let provider: PRC, providerAddress: Address;
  try {
    [provider, providerAddress] = await useProviderInfo();
  } catch (e: any) {
    throw new Error(e.message);
  }
  if (!isValidEverAddress(provider, tokenRootAddress)) {
    toast('Please enter a valid token root address !', 0);

    return 'Failed';
  }
  if (!isValidEverAddress(provider, recipient)) {
    toast('Please enter a valid recipient address !', 0);

    return 'Failed';
  }
  try {
    // creating an instance of the token root contract
    const tokenRootContract = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      new Address(tokenRootAddress)
    );

    // Fetching the decimals
    const [decimals, symbol] = await Promise.all([
      (await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0,
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    // Checking if receiver has a wallet of this token root to specify the deployWalletValue parameter
    let deployWalletValue: string = '0';
    if (
      !(
        await provider.getFullContractState({
          address: (
            await tokenRootContract.methods
              .walletOf({ answerId: 0, walletOwner: providerAddress })
              .call()
          ).value0,
        })
      ).state?.isDeployed
    ) {
      deployWalletValue: 3;
    }

    // Deploying a new contract if didn't exist before
    const mintRes: Transaction = await tokenRootContract.methods
      .mint({
        amount: amount * 10 * Number(decimals),
        recipient: new Address(recipient),
        deployWalletValue: deployWalletValue,
        notify: false,
        payload: '',
        remainingGasTo: providerAddress,
      })
      .send({
        from: providerAddress,
        amount: deployWalletValue == '0' ? 2 * 10 * 9 : 5 * 10 * 9,
      });

    if (mintRes.aborted) {
      toast(`Transaction aborted ! ${mintRes.exitCode}`, 0);

      return mintRes;
    }
    // Checking if the user already doesn't have the any wallet of that token root
    // Getting the recipient balance
    const recipientTWCon = new provider.Contract(
      tip3Artifacts.factorySource.TokenWallet,
      new Address(recipient)
    );
    const recipientBal = ethers.formatUnits(
      (await recipientTWCon.methods.balance({ answerId: 0 }).call({})).value0,
      decimals
    );

    if (recipientBal >= amount) {
      toast(`${amount} ${symbol}'s successfully minted for recipient !`);

      return `Hash: ${mintRes.id.hash} \n recipient ${symbol} balance: ${recipientBal}`;
    } else {
      toast('Minting tokens failed !', 0);

      return `Failed \n 
      ${(mintRes.exitCode, mintRes.resultCode)}`;
    }
  } catch (e: any) {
    toast(e.message, 0);

    return 'Failed';
  }
}

````

</span>

</div>


<div class="action">
<div :class="llAction">

Use this command to mint TIP-3 tokens:

```shell
npx locklift run -s ./scripts/03-mint-tip3.ts -n local
```

![](</tip3Mint.png>)

Congratulations, you have successfully minted TIP-3 tokens for a token wallet.

</div>

<div :class="eipAction" >

<div :class="transfer">



## Mint TIP-3 tokens  

::: info 
In order to be able to mint token for token wallet from a token root you must be the root owner .
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