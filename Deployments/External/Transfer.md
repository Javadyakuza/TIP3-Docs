# Transfer TIP-3 Tokens

We have already learned how to send messages to a contract through an account.&#x20;

Therefore, making a transfer is as easy as shelling pears!

<div class="transferToken">

::: tip
Before we start to write our scripts we need to make sure that there is a file named `04-transfer-tip3.ts` in the `script` folder in the project root.
:::

::: tip

TIP-3 Token Wallet has 2 transfer methods:

* Transfer - Transfer tokens and optionally deploy TokenWallet for recipient account address.
* Transfer tokens using another TokenWallet address, that wallet must be deployed previously.

In the code sample provided below, we assume that Alice does not have a token wallet. Therefore, we begin by deploying a token wallet for Alice which will be accomplished when using the  `transfer`  function. Subsequently, we can employ the  `transferToWallet`  function to transfer a certain amount of TIP3 tokens to Alice.
:::

<span  :class="LLdis" style="font-size: 1.1rem;">

In the code sample below, we will demonstrate how to transfer TIP-3 tokens using locklift:

</span>

<span :class="EIPdis" style="font-size: 1.1rem;">

Certainly! Transferring TIP-3 tokens is considered one of the easier steps in the process.

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

```typescript
/**
 * locklift is globals declared object 
 */

import { Address, Contract, Signer } from "locklift";
import { EverWalletAccount } from "everscale-standalone-client";
import { FactorySource, factorySource } from "../build/factorySource";

async function main() {

  const tokenRootAddress: Address = new Address("<YOUR_TOKEN_ROOT_ADDRESS>")

  const signerBob: Signer = (await locklift.keystore.getSigner("0"))!;
  const signerAlice: Signer = (await locklift.keystore.getSigner("1"))!;
  
  /**
   * Making an instance of the wallet account using the signer public key and everscale-standalone-client tool 
  */
  const bobAccount: EverWalletAccount = await EverWalletAccount.fromPubkey({ publicKey: signer.publicKey!, workchain: 0 });
  const aliceAccount: EverWalletAccount = await EverWalletAccount.fromPubkey({ publicKey: signer.publicKey!, workchain: 0 });

  // Creating the target contracts instances
  const tokenRoot: Contract<FactorySource['TokenRoot']> = locklift.factory.getDeployedContract(
    "TokenRoot", 
    tokenRootAddress
  )

  const bobTokenWallet: Contract<FactorySource['TokenWallet']> = locklift.factory.getDeployedContract(
    "TokenWallet",
    (await tokenRoot.methods.walletOf(answerId: 0, walletOwner: bobAccount.address ).call({})).value0,
  );

  // Fetching the decimals 
  const decimals: number  = Number((await tokenRoot.methods.decimals({answerId: 0}).call()).value0) 

  console.log("Bob's balance: ",
    await bobTokenWallet.methods
      .balance({
        answerId: 0,
    })
  .call()).value0 / 10 ^ decimals // assuming that bob has 300 of this token at the first >> 300

  // Amount to transfer 
  const amount : number = 100 * 10 * decimals
  
  /* 
    Transfer with the deployment of a wallet for the recipient account.
    
    Don't pay attention to notify and payload yet, we'll get back to them.
  */
  await bobTokenWallet.methods.transfer({
        amount: amount,
        recipient: aliceAccount.address,
        deployWalletValue: locklift.utils.toNano(2), // assume alice doesn't have any token wallet 
        remainingGasTo: bobAccount.address,
        notify: false,
        payload: '',
      }).send({
        from : bobAccount.address, 
        amount: locklift.utils.toNano("5")
      })
  
   /* 
     Creating the alice's token wallet and Checking Alice's balance
   */
 const aliceTokenWallet: Contract<FactorySource['TokenWallet']> =
  locklift.factory.getDeployedContract(
    'TokenWallet',
    (
      await tokenRoot.methods
        .walletOf({
          answerId: 0,
          walletOwner: aliceAccount.address,
        })
        .call()
    ).value0
  );

  console.log("Alice's balance: ",
    await aliceTokenWallet.methods
      .balance({
        answerId: 0,
    })
  .call()).value0 / 10 ^ decimals  // >> 100
  
  /* 
     Transfer to deployed token wallet
  */
  await bobTokenWallet.methods.transferToWallet({
        amount: amount,
        recipientTokenWallet: aliceTokenWallet.address,
        remainingGasTo: bobAccount.address,
        notify: false,
        payload: '',
      }).send({
        from : bobAccount.address, 
        amount: locklift.utils.toNano("3")
      })
      
  console.log("Alice's balance: ",
   
    await aliceTokenWallet.methods
      .balance({
        answerId: 0,
    })
  .call()).value0 / 10 ^ decimals // >> 200

  console.log("Bob's balance: ",
    await bobTokenWallet.methods
      .balance({
        answerId: 0,
    })
  .call()).value0 / 10 ^ decimals  // >> 100
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

```

</span>

<span  :class="EIPdis">

**using `transfer` function:**

````typescript

// Import the required libraries 
import {
  ProviderRpcClient as PRC,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

async function main() {
  // Initiate the TVM provider

  // Preparing the params 
  const tokenRootAddress: Address = new Address("<YOUR_TOKEN_ROOT_ADDRESS>");
  const recipientAddress: Address = new Address("<RECIPIENT_ACCOUNT_ADDRESS>");
  let txFee: number  = 3 * 10 * 9;  
  let oldBal: number = 0 ;
  let deployWalletValue: number = 0; 

  // creating an instance of the target token root contracts
  const tokenRootContract: Contract<tip3Artifacts.FactorySource['TokenRoot']> = new provider.Contract(
    tip3Artifacts.factorySource['TokenRoot'],
    tokenRootAddress
  );
  // getting the decimals of the token
  const decimals: number = Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0);
  let transferAmount: number = 10 * 10 * decimals;

  // creating an instance of the sender token wallet contract
  const tokenWallet: Contract<tip3Artifacts.FactorySource['TokenWallet']> = new provider.Contract(
    tip3Artifacts.factorySource['TokenWallet'],
    (
      await tokenRootContract.methods.walletOf({ answerId: 0, walletOwner: providerAddress }).call()
    ).value0
  );

  
  /**
   * we will make an instance of the recipient token wallet contract and we assign value to it if the token wallet was already deployed 
   * the amount attached to the tx varies based on the mentioned subject.
   */
  let RecipientTokenWallet:
    | Contract<tip3Artifacts.FactorySource['TokenWallet']>
    | undefined = undefined;
  
  const receiverTokenWalletAddress = (
          await tokenRootContract.methods
            .walletOf({ answerId: 0, walletOwner: recipientAddress })
            .call()
        ).value0 
  if (
    !(
      await provider.getFullContractState({
        address: receiverTokenWalletAddress ,
      })
    ).state?.isDeployed
  ) {
    txFee = 5 * 10 * 9 ;
    deployWalletValue = 2 *10 * 9;
  } else {
    RecipientTokenWallet = new provider.Contract(
      // Transferring the token
      tip3Artifacts.factorySource['TokenWallet'],
      receiverTokenWalletAddress
    );

    oldBal = Number((await RecipientTokenWallet.methods.balance({ answerId: 0 }).call({}))
      .value0);
  }

  // Transferring token
  const transferRes: Transaction = await tokenWallet.methods
    .transfer({
      amount: transferAmount,
      recipient: recipientAddress,
      deployWalletValue: deployWalletValue,
      remainingGasTo: providerAddress,
      notify: false, // true if the change must be sent back to the sender wallet account not the sender token wallet 
      payload: '',
    })
    .send({ from: providerAddress, amount: txFee, bounce: true });

  /**
   * We first verify if the transfer transaction was aborted. If it was not aborted, we proceed to check the balance of the recipient's token wallet. We compare this balance to the sum of the previous balance (oldBalance) and the amount transferred only If the user had already deployed a token wallet prior to the transfer transaction, and it was not deployed before the transaction it must have been deployed during the transaction, so we create an instance of the recipient's token wallet contract and confirm that its balance is greater than zero.
   */
  if (transferRes.aborted) {
    console.log(`Transaction aborted !: ${transferRes.exitCode, transferRes.resultCode}`);
    
    return "Failed";
    } else {

      // In this case the recipient didn't have any token wallet and one is deployed during the transfer, so we fetch it since we haven't before 
      RecipientTokenWallet = new provider.Contract(
        // Transferring the token
        tip3Artifacts.factorySource['TokenWallet'],
        receiverTokenWallet.address
      );
      const newBal: number = Number(
        (await RecipientTokenWallet.methods.balance({ answerId: 0 }).call({})).value0
      );
      // Checking if the tokens are received successfully
      if (amount == '2' && newBal >= Number(transferAmount) * 10 * decimals + oldBal) {
        console.log('tokens transferred successfully');

        return `tx Hash: ${transferRes.id.hash}`;
      } else {
        console.log('Transferring tokens failed');

        return `tx Hash: ${(transferRes.exitCode, transferRes.resultCode)}`;
      }
    }
  }



````

**using `transferToWallet` function:**

```` typescript

async function main(){
  
  /**
   * We use the previous code block states 
   */

  const transferRes: Transaction = await tokenWallet.methods
    .transferToWallet({
      amount: transferAmount * 10 * decimals,
      recipientTokenWallet: RecipientTokenWallet.address,
      remainingGasTo: providerAddress,
      notify: false,
      payload: '',
    })
    .send({ from: providerAddress, amount: 3 * 10 * 9, bounce: true });
  
  /**
   * Checking the tokens are transferred and the receiver balance is more than before 
   */
  if (transferRes.aborted) {
    console.log(`Transaction aborted !: ${transferRes.exitCode}`);
    return `Failed ${transferRes.exitCode}`;
  } else {
    // newBal is actually the old balance and its fetched before utilizing the "transferToWallet" the function
    if (
      Number(
        (await recipientTokenWalletContract!.methods.balance({ answerId: 0 }).call({})).value0
      ) > newBal
    ) {
      console.log('tokens transferred successfully');
      return `tx Hash: ${transferRes.id.hash}`;
    } else {
      console.log('Transferring tokens failed');
      return `tx Hash: ${transferRes.id.hash}`;
    }
  }
}
````

</span>

</div>


<div class="action">
<div :class="llAction">

Use this command to transfer TIP-3 tokens:

```shell
npx locklift run -s ./scripts/04-transfer-tip3.ts -n local
```

![](</transferTip3.png>)

Congratulations, you have successfully transferred TIP-3 tokens from one to another Wallet.

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