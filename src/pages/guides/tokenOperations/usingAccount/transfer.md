# Transfer TIP-3 Tokens

<div class="transferToken">

We have already learned how to send messages to a contract through an account.&#x20;

Therefore, making a transfer is as easy as shelling pears!

::: tip

TIP-3 Token Wallet has 2 transfer methods:

- Transfer - Transfer tokens and optionally deploy TokenWallet for recipient account address.
- Transfer tokens using another TokenWallet address, that wallet must be deployed previously.

In the code sample provided below, we assume that Alice does not have a token wallet. Therefore, we begin by deploying a token wallet for Alice which will be accomplished when using the `transfer` function. Subsequently, we can employ the `transferToWallet` function to transfer a certain amount of TIP3 tokens to Alice.
:::

## Step 1: Write Transfer Script

<span  :class="LLdis"  >

In the code sample below, we will demonstrate how to transfer TIP-3 tokens using locklift:

Notice that we utilize the stats of the previously written script in the [mint tip-3](/guides/tokenOperations/usingAccount/mint.md#step-1-write-minting-script) section.

::: info
Before we start to write our scripts we need to make sure that there is a file named `04-transfer-tip3.ts` in the `script` folder in the project root.
:::

</span>

<span :class="EIPdis"  >

Transferring TIP-3 tokens is considered one of the easier steps depended to previous steps. let's look at the code samples below to see how its done using everscale-inpage-provider:

::: warning

- Notice that if the `notify` parameter be true for the transaction, the change will be sent back to the sender accounts `tokenWallet` contract !!\
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
/* Transferring tip-3 tokens using transfer function */

console.log(
  "Bob's balance before transfer: ",
  Number(
    (
      await bobTokenWallet.methods
        .balance({
          answerId: 0,
        })
        .call()
    ).value0
  ) /
    10 ** decimals
);

console.log('Alice balance before transfer: 0');

// Amount to transfer
const transferAmount: number = 30 * 10 ** decimals;

/*
    Transfer with the deployment of a wallet for the recipient account.

    Don't pay attention to notify and payload yet, we'll get back to them.
  */
await bobTokenWallet.methods
  .transfer({
    amount: transferAmount,
    recipient: aliceAccount.address,
    deployWalletValue: locklift.utils.toNano(2), // assume alice doesn't have any token wallet
    remainingGasTo: bobAccount.address,
    notify: false,
    payload: '',
  })
  .send({
    from: bobAccount.address,
    amount: locklift.utils.toNano('5'),
  });

/*
     Creating the alice's token wallet and Checking Alice's balance
   */
const aliceTokenWallet: Contract<FactorySource['TokenWallet']> =
  locklift.factory.getDeployedContract(
    'TokenWallet',
    (
      await tokenRootContract.methods
        .walletOf({
          answerId: 0,
          walletOwner: aliceAccount.address,
        })
        .call()
    ).value0
  );

console.log(
  "Bob's balance after transfer: ",
  Number(
    (
      await bobTokenWallet.methods
        .balance({
          answerId: 0,
        })
        .call()
    ).value0
  ) /
    10 ** decimals
);

console.log(
  "Alice's balance after transfer: ",
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

/* Transferring tip-3 tokens using transferToWallet function */

await bobTokenWallet.methods
  .transferToWallet({
    amount: transferAmount,
    recipientTokenWallet: aliceTokenWallet.address,
    remainingGasTo: bobAccount.address,
    notify: false,
    payload: '',
  })
  .send({
    from: bobAccount.address,
    amount: locklift.utils.toNano('3'),
  });

console.log(
  "Bob's balance after transfer to wallet: ",
  Number(
    (
      await bobTokenWallet.methods
        .balance({
          answerId: 0,
        })
        .call()
    ).value0
  ) /
    10 ** decimals
);

console.log(
  "Alice's balance after transfer to wallet: ",

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
// Import the required libraries
import {
  ProviderRpcClient as PRC,
  Address,
  Contract,
  Transaction,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  // Preparing the required addresses
  const tokenRootAddress: Address = new Address(
    '<YOUR_TOKEN_ROOT_ADDRESS>'
  );
  const recipientAddress: Address = new Address(
    '<RECIPIENT_ACCOUNT_ADDRESS>'
  );

  // creating an instance of the target token root contract
  const tokenRootContract: Contract<
    tip3Artifacts.FactorySource['TokenRoot']
  > = new provider.Contract(
    tip3Artifacts.factorySource['TokenRoot'],
    tokenRootAddress
  );

  // getting the decimals of the token
  const decimals = Number(
    (await tokenRootContract.methods.decimals({ answerId: 0 }).call())
      .value0
  );

  // creating an instance of the sender token wallet contract
  const tokenWallet: Contract<
    tip3Artifacts.FactorySource['TokenWallet']
  > = new provider.Contract(
    tip3Artifacts.factorySource['TokenWallet'],
    (
      await tokenRootContract.methods
        .walletOf({ answerId: 0, walletOwner: providerAddress })
        .call()
    ).value0
  );

  /**
   * we will make an instance of the recipient token wallet contract and we assign value to it if the token wallet was already deployed
   * the amount attached to the tx varies based on the mentioned subject.
   */
  let recipientTokenWallet:
    | Contract<tip3Artifacts.FactorySource['TokenWallet']>
    | undefined = undefined;

  const receiverTokenWalletAddress = (
    await tokenRootContract.methods
      .walletOf({ answerId: 0, walletOwner: recipientAddress })
      .call()
  ).value0;

  // Defining the transfer parameters
  let txFee: number = 3 * 10 ** 9;
  let oldBal: number = 0;
  let deployWalletValue: number = 0;

  // Setting the deployWalletValue and transaction fee based on the recipient token wallet deployment status
  if (
    !(
      await provider.getFullContractState({
        address: receiverTokenWalletAddress,
      })
    ).state?.isDeployed
  ) {
    txFee = 5 * 10 ** 9;
    deployWalletValue = 2 * 10 ** 9;
  } else {
    recipientTokenWallet = new provider.Contract(
      // Transferring the token
      tip3Artifacts.factorySource['TokenWallet'],
      receiverTokenWalletAddress
    );

    oldBal = Number(
      (
        await recipientTokenWallet.methods
          .balance({ answerId: 0 })
          .call({})
      ).value0
    );
  }

  // Defining the transfer amount
  let transferAmount: number = 10 ** (10 ** decimals);

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
    .send({
      from: providerAddress,
      amount: String(txFee),
      bounce: true,
    });

  // Checking of the transaction is aborted or not
  if (transferRes.aborted) {
    throw new Error(
      `Transaction aborted !: ${
        (transferRes.exitCode, transferRes.resultCode)
      }`
    );
  }

  // In this case the recipient didn't have any token wallet and one is deployed during the transfer, so we fetch it since we haven't before
  recipientTokenWallet = new provider.Contract(
    // Transferring the token
    tip3Artifacts.factorySource['TokenWallet'],
    receiverTokenWalletAddress
  );
  // recipient balance after transfer
  const newBal: number = Number(
    (
      await recipientTokenWallet.methods
        .balance({ answerId: 0 })
        .call({})
    ).value0
  );

  // Checking if the tokens are received successfully
  if (newBal >= Number(transferAmount) * 10 ** decimals + oldBal) {
    console.log('tokens transferred successfully');
  } else {
    throw new Error(
      ` Transferring tokens failed \n tx Hash: ${
        (transferRes.exitCode, transferRes.resultCode)
      }`
    );
  }

  // transferring token to wallet
  const transferToWalletRes: Transaction = await tokenWallet.methods
    .transferToWallet({
      amount: transferAmount * 10 ** decimals,
      recipientTokenWallet: recipientTokenWallet.address,
      remainingGasTo: providerAddress,
      notify: false,
      payload: '',
    })
    .send({
      from: providerAddress,
      amount: String(3 * 10 ** 9),
      bounce: true,
    });

  // Throwing an error if the transaction was aborted
  if (transferToWalletRes.aborted) {
    throw new Error(`Transaction aborted !: ${transferRes.exitCode}`);
  }

  // newBal is actually the old balance and its fetched before utilizing the "transferToWallet" the function
  if (
    Number(
      (
        await recipientTokenWallet.methods
          .balance({ answerId: 0 })
          .call({})
      ).value0
    ) > newBal
  ) {
    console.log('tokens transferred successfully');
    return `tx Hash: ${transferRes.id.hash}`;
  } else {
    throw new Error(
      `Transferring tokens failed, tx Hash: ${transferRes.id.hash}`
    );
  }
}
```

</span>

</div>

<div class="action">

## Step 2: Transfer TIP-3 Tokens

<div :class="llAction">

Use this command to transfer TIP-3 tokens:

```shell
npx locklift run -s ./scripts/04-transfer-tip3.ts -n local
```

<ImgContainer src= '/04-transfer-tip3.png' width="100%" altText="transferTip3Output" />

Congratulations, you have successfully transferred TIP-3 tokens from one to another Wallet 🎉

</div>

<div :class="eipAction" >

<div :class="transfer">

### Transfer TIP-3 tokens

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
<p id="output-p" :class="EIPdis" ref="transferTokenOutput"><loading :text="loadingText"/></p>

<div :class="transferToWallet">

### Transfer TIP-3 tokens to Token Wallet

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

<p id="output-p" :class="EIPdis" ref="WalletTransferTokenOutput"><loading :text="loadingText2"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {toast} from "/src/helpers/toast";
import {transferTokenEip, transferTokenToWalletEip} from "../../scripts/account/transfer"
import ImgContainer from "../../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"
import loading from "../../../../../.vitepress/theme/components/shared/BKDLoading.vue"

export default defineComponent({
  name: "transferToken",
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
        loadingText2: " ",
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
            this.$refs.actionRecipientAddress.value == ""

        ){
            toast("Recipient address field is required !",0)
            this.loadingText = "Failed"
            return
        }        // checking of all the values are fully filled
        if (
            this.$refs.actionAmount.value == ""

        ){
            toast("Amount field is required !",0)
            this.loadingText = "Failed"
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
          this.loadingText = transferTokenRes;
  }

   async function transferTokensToWallet(){
          this.loadingText2 = ""
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
            this.loadingText2 = "Failed"
            return
        }
        let transferTokenRes = await transferTokenToWalletEip(
          this.$refs.actionWalletRecipientAddress.value,
          this.$refs.actionWalletAmount.value,
          this.$refs.actionWalletNotify.checked
          )
          // Rendering the output
          transferTokenRes = !transferTokenRes ? "Failed" :  transferTokenRes;
          this.loadingText2 = transferTokenRes;
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
