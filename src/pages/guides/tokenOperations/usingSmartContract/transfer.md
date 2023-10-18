<div class="transferToken">

# Transfer TIP-3 Tokens

Now that we have minted TIP-3 tokens, it's time to transfer them. As explained in the [transfer Using an Account](/guides/tokenOperations/usingAccount/transfer.md) section, the TIP-3 standard has two implementations for the transfer concept, both of which we will cover. It's worth noting that both of these methods are implemented within the MultiWalletTIP-3 contract, so we will be exploring them in detail.

## Step 1: Write Transfer Script

<span  :class="LLdis"  >

In the code sample below, we will demonstrate how to utilize both if the transfer functions of the TIP-3 standard using `locklift` tool and MultiWalletTIP3 contract.

We use the previously written script stats from the [mint tip3 tokens](/guides/tokenOperations/usingSmartContract/mint.md#step-1-write-minting-script) section for the following script.

::: info
Before we start to write our scripts we need to make sure that there is a file named `06-transfer-tip3.ts` in the `script` folder in the project root.
:::

</span>

<span :class="EIPdis"  >

Transferring tokens using `everscale-inpage-provider` MultiWalletTIP3 contract:

::: warning

- Notice that if the `notify` parameter be true for the transaction, the change will be sent back to the sender accounts `tokenWallet` contract !!

So if you want the change back into your `account contract` leave the notify `unchecked` !!

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
/*
     Transfer tokens using transfer method
  */

// WE know that bob doesn't have any token wallet of that root since we didn't it
console.log(`Alice has token wallet ? ${
  (
    await getWalletData(
      aliceMultiWalletContract,
      tokenRootContract.address
    )
  ).tokenWallet.toString() != zeroAddress.toString()
} \n
   Alice balance before transfer: ${
     (
       await getWalletData(
         aliceMultiWalletContract,
         tokenRootContract.address
       )
     ).balance /
     10 ** deployRootFromDeployerParams.decimals
   }`);

console.log(`Bob has token wallet ? ${
  (
    await getWalletData(
      bobMultiWalletContract,
      tokenRootContract.address
    )
  ).tokenWallet.toString() != zeroAddress.toString()
} \n
  Bob balance before transfer: ${
    (
      await getWalletData(
        bobMultiWalletContract,
        tokenRootContract.address
      )
    ).balance /
    10 ** deployRootFromDeployerParams.decimals
  }`);

// Amount to transfer
const transferAmount: number =
  10 * 10 ** deployRootFromDeployerParams.decimals;

/*
    Transfer with deployment of a wallet for the recipient account.

    Don't pay attention to notify and payload yet, we'll get back to them.
  */
await aliceMultiWalletContract.methods
  .transfer({
    _amount: transferAmount,
    _recipient: bobMultiWalletContract.address,
    _deployWalletValue: locklift.utils.toNano(2), // We assume bob doesn't have any token wallet
    _tokenRoot: tokenRootContract.address,
  })
  .sendExternal({
    publicKey: signerAlice.publicKey!,
  });

// Fetching the balances after the normal transfer function
console.log(
  `Alice balance after transfer: ${
    (
      await getWalletData(
        aliceMultiWalletContract,
        tokenRootContract.address
      )
    ).balance /
    10 ** deployRootFromDeployerParams.decimals
  }`
); // >> 100
console.log(
  `Bob balance after transfer: ${
    (
      await getWalletData(
        bobMultiWalletContract,
        tokenRootContract.address
      )
    ).balance /
    10 ** deployRootFromDeployerParams.decimals
  }`
); // >> 100

/*
     Transfer tokens to deployed token wallet using transferToWallet method
  */
const transferToWalletAmount: number =
  15 * 10 ** deployRootFromDeployerParams.decimals;

await aliceMultiWalletContract.methods
  .transferToWallet({
    _amount: transferToWalletAmount,
    _recipientTokenWallet: (
      await getWalletData(
        bobMultiWalletContract,
        tokenRootContract.address
      )
    ).tokenWallet,
    _tokenRoot: tokenRootContract.address,
  })
  .sendExternal({
    publicKey: signerAlice.publicKey!,
  });

// Fetching the balances after utilizing the transferToWallet function
console.log(
  `Alice balance after transfer to wallet: ${
    (
      await getWalletData(
        aliceMultiWalletContract,
        tokenRootContract.address
      )
    ).balance /
    10 ** deployRootFromDeployerParams.decimals
  }`
); // >> 50
console.log(
  `Bob balance after transfer to wallet: ${
    (
      await getWalletData(
        bobMultiWalletContract,
        tokenRootContract.address
      )
    ).balance /
    10 ** deployRootFromDeployerParams.decimals
  }`
);
```

</span>

<span  :class="EIPdis">

```typescript
import {
  ProviderRpcClient,
  Address,
  Contract,
  Transaction,
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
  providerAddress: Address
): Promise<string> {
  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: providerAddress })
  ).state!;

  const senderPublicKey: string = await provider.extractPublicKey(
    accountFullState.boc
  );

  return senderPublicKey;
}

// Defining the interface of what does the extractPubkey function returns
interface walletData {
  tokenWallet: Address;
  balance: number;
}
// This function will extract the wallets data from the wallets mapping from the multi wallet tip-3 contract
async function getWalletData(
  MWContract: Contract<
    tip3Artifacts.FactorySource['MultiWalletTIP3']
  >,
  tokenRootAddress: Address
): Promise<walletData> {
  const walletData = (
    await MWContract.methods.wallets().call()
  ).wallets.map(item => {
    if (item[0].toString() == tokenRootAddress.toString()) {
      return item[1];
    }
  });
  let balance: number = 0;
  let tokenWallet: Address = tip3Artifacts.zeroAddress;
  if (walletData.length != 0) {
    balance = Number(walletData[0]!.balance);
    tokenWallet = walletData[0]!.tokenWallet;
  }
  return { tokenWallet: tokenWallet, balance: balance };
}

async function main() {
  try {
    // Required contracts addresses
    const tokenRootAddress: Address = new Address(
      '<YOUR_TOKEN_ROOT_ADDRESS>'
    );
    const receiverMWAddress: Address = new Address(
      '<RECEIVER_MULTI_WALLET_ADDRESS>'
    );
    const senderMWAddress: Address = new Address(
      '<SENDER_MULTI_WALLET_ADDRESS>'
    );

    // creating an instance of the target contracts
    const tokenRootContract: Contract<
      tip3Artifacts.FactorySource['TokenRoot']
    > = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      tokenRootAddress
    );

    const senderMWContract: Contract<
      tip3Artifacts.FactorySource['MultiWalletTIP3']
    > = new provider.Contract(
      tip3Artifacts.factorySource['MultiWalletTIP3'],
      senderMWAddress
    );

    const receiverMWContract: Contract<
      tip3Artifacts.FactorySource['MultiWalletTIP3']
    > = new provider.Contract(
      tip3Artifacts.factorySource['MultiWalletTIP3'],
      receiverMWAddress
    );
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

    const tokenAmount: number = 10 * 10 ** decimals;

    // checking if the sender has enough tokens to send
    if (
      (
        await getWalletData(
          senderMWContract,
          tokenRootContract.address
        )
      ).balance <
      tokenAmount * 10 ** decimals
    ) {
      console.log('Low balance !');

      return 'Failed';
    }
    const senderPubkey: string = await extractPubkey(
      provider,
      providerAddress
    );
    if (
      senderPubkey !=
      (await senderMWContract.methods.owner({}).call()).owner
    ) {
      console.log(
        'You are not the owner of the sender multi wallet contract !'
      );

      return 'Failed';
    }

    // Checking recipient has a deploy wallet of that token root
    let recipientOldWalletData: walletData = await getWalletData(
      receiverMWContract,
      tokenRootContract.address
    );

    // Fetching the old balance of the receiver before transfer and determining if the receiver has a token wallet and deploy one by setting the deployWalletValue if not
    let oldBal: number = recipientOldWalletData.balance;

    let deployWalletValue: number = 0;

    if (
      recipientOldWalletData.tokenWallet.toString() ==
      tip3Artifacts.zeroAddress.toString()
    ) {
      deployWalletValue = 2 * 10 ** 9;
    }

    // Transferring token
    const { transaction: transferRes } =
      await senderMWContract.methods
        .transfer({
          _amount: tokenAmount,
          _recipient: receiverMWContract.address,
          _deployWalletValue: deployWalletValue,
          _tokenRoot: tokenRootContract.address,
        })
        .sendExternal({ publicKey: senderPubkey });

    // Throwing an error if transaction aborted and checking the confirmation of the transfer if not aborted
    if (transferRes.aborted) {
      console.log(
        `Transaction aborted !: ${
          (transferRes.exitCode, transferRes.resultCode)
        }`
      );
    } else {
      const newBal: number = (
        await getWalletData(
          receiverMWContract,
          tokenRootContract.address
        )
      ).balance;
      // Checking if the tokens are received successfully
      if (newBal > oldBal) {
        console.log(
          `${
            tokenAmount / 10 ** decimals
          } ${symbol}'s transferred successfully`
        );

        return `tx Hash: ${transferRes.id.hash}`;
      } else {
        console.error(
          `Transferring tokens failed, tx Hash: ${
            (transferRes.exitCode, transferRes.exitCode)
          }`
        );
      }
    }

    /*
      Using transferToWallet function
    */

    // Fetching the receiver balance before utilizing th transfer to wallet function
    oldBal = recipientOldWalletData.balance;

    // Transferring token using the receiver token wallet address
    const { transaction: transferToWalletRes } =
      await senderMWContract.methods
        .transferToWallet({
          _amount: tokenAmount,
          _recipientTokenWallet: recipientOldWalletData.tokenWallet,
          _tokenRoot: tokenRootContract.address,
        })
        .sendExternal({ publicKey: senderPubkey });

    // Throwing an error if transaction aborted and checking the confirmation of the transfer if not aborted
    if (transferToWalletRes.aborted) {
      throw new Error(
        `Transaction aborted !: ${
          (transferToWalletRes.exitCode,
          transferToWalletRes.resultCode)
        }`
      );
    } else {
      const newBal = (
        await getWalletData(
          receiverMWContract,
          tokenRootContract.address
        )
      ).balance;

      // Checking if the tokens are received successfully
      if (newBal > oldBal) {
        console.log(
          `${
            tokenAmount / 10 ** decimals
          } ${symbol}'s transferred successfully`
        );

        return `tx Hash: ${transferToWalletRes.id.hash}`;
      } else {
        throw new Error(
          `Transferring tokens failed , tx Hash: ${
            (transferToWalletRes.exitCode,
            transferToWalletRes.exitCode)
          }`
        );
      }
    }
  } catch (e: any) {
    throw new Error(`Failed ${e.message}`);
  }
}
```

</span>

</div>

<div class="action">

## Step 2: Transfer Tokens

<div :class="llAction">

Use this command to transfer TIP-3 tokens:

```shell
npx locklift run -s ./scripts/06-transfer-tip3.ts -n local
```

<ImgContainer src= '/06-transfer-tip3.png' width="100%" altText="buildStructure" />

Congratulations, you have successfully transferred TIP-3 tokens from one to another Wallet using a custom contract 🎉

</div>

<div :class="eipAction" >

<div :class="transfer">

### Transfer TIP-3 tokens

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Sender multi wallet address</p>
<input ref="actionSenderAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Recipient multi wallet address</p>
<input ref="actionRecipientAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p>
<input ref="actionAmount" class="action Ain" type="text"/>

<button @click="transferTokens" class="transferTokenBut" >Transfer Tokens</button>

</div>
<p id="output-p" :class="EIPdis" ref="transferTokenOutput"><loading :text="loadingText"/></p>

<div :class="transferToWallet">

### Transfer TIP-3 tokens to Token Wallet

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionWalletTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Sender multi wallet address</p>
<input ref="actionWalletSenderAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Recipient multi wallet address</p>
<input ref="actionWalletRecipientAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p>
<input ref="actionWalletAmount" class="action Ain" type="text"/>

<button @click="transferTokensToWallet" class="transferTokenBut" >Transfer Tokens to Wallet</button>

</div>
</div>

</div>

<p id="output-p" :class="EIPdis" ref="WalletTransferTokenOutput"><loading :text="loadingText2"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {toast} from "/src/helpers/toast";
import {transferTokenCon, transferTokenToWalletCon} from "../../scripts/contract/transfer"
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
        if (
            this.$refs.actionRecipientAddress.value == ""

        ){
            toast("Recipient multi wallet address field is required !",0)
            this.loadingText = "Failed"
            return
        }
        if (
            this.$refs.actionSenderAddress.value == ""

        ){
            toast("Sender multi wallet address field is required !",0)
            this.loadingText = "Failed"
            return
        }
        if (
            this.$refs.actionAmount.value == ""

        ){
            toast("Amount field is required !",0)
            this.loadingText = "Failed"
            return
        }
        let transferTokenRes = await transferTokenCon(
          this.$refs.actionTokenRootAddress.value,
          this.$refs.actionRecipientAddress.value,
          this.$refs.actionSenderAddress.value,
          this.$refs.actionAmount.value,
        )

        // Rendering the output
        transferTokenRes = !transferTokenRes ? "Failed" :  transferTokenRes;
        this.loadingText = transferTokenRes;
  }

   async function transferTokensToWallet(){
          this.loadingText2 = ""
        if (
            this.$refs.actionWalletTokenRootAddress.value == ""

        ){
            toast("Token root address field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        if (
            this.$refs.actionWalletRecipientAddress.value == ""

        ){
            toast("Recipient multi wallet address field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        if (
            this.$refs.actionWalletSenderAddress.value == ""

        ){
            toast("Sender multi wallet address field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        if (
            this.$refs.actionWalletAmount.value == ""

        ){
            toast("Amount field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        let transferTokenRes = await transferTokenToWalletCon(
          this.$refs.actionWalletTokenRootAddress.value,
          this.$refs.actionWalletRecipientAddress.value,
          this.$refs.actionWalletSenderAddress.value,
          this.$refs.actionWalletAmount.value,
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
