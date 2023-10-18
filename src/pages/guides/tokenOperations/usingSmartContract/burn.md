# Burn TIP-3 Tokens

<div class="burnToken">

Now that we have gained knowledge on deploying custom contracts and minting/transferring tokens using them, we can proceed to explore the burning of TIP-3 tokens through the multi wallet TIP-3 contract. As discussed earlier in the [Burn Tokens Using an Account](/guides/tokenOperations/usingAccount/burn.md) section, the TIP-3 standard offers two implementations for the burn functionality.
It is important to note that the multi wallet contract only supports transactions utilizing the `burn` function, as the `burnByRoot` function can only be called on the `token root contract`. In order to understand how the multi wallet contract updates its state, we will cover both implementations.

## Step 1: Write Burn Script

<span  :class="LLdis">

The code sample below utilizes both burn functions with the help of the locklift but checks the balance on the multi wallet TIP-3 contract.

We use the previously written script stats from the [transfer tip3 tokens](/guides/tokenOperations/usingSmartContract/transfer.md#step-1-write-transfer-script) section for the following script.

::: info
Before we start to write our scripts we need to make sure that there is a file named `07-burn-tip3.ts` in the `script` folder in the project root.
:::

</span>

<span :class="EIPdis"  >

The code sample below follows the same approach but makes the transactions using `everscale-inpage-provider`:

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
  Burning tip-3 tokens using burn method on the Multi Wallet TIP-3 contract
  */

// Preparing the burning amount
const burnAmount: number =
  10 * 10 ** deployRootFromDeployerParams.decimals;

// Fetching the old balance of the token wallet using multi wallet tpi-3 contract
let oldBal: number = (
  await getWalletData(
    aliceMultiWalletContract,
    tokenRootContract.address
  )
).balance;

// Burning tip-3 tokens from Bob's wallet(bob's Multi Wallet contract)
const { transaction: burnRes } =
  await aliceMultiWalletContract.methods
    .burn({
      _amount: burnAmount,
      _tokenRoot: tokenRootContract.address,
    })
    .sendExternal({ publicKey: signerAlice.publicKey });

// Confirming tokens are burnt
let newBal: number = (
  await getWalletData(
    aliceMultiWalletContract,
    tokenRootContract.address
  )
).balance;

if (newBal < oldBal) {
  console.log(
    `${burnAmount / 10 ** deployRootFromDeployerParams.decimals} ${
      deployRootFromDeployerParams.symbol
    }'s burnt successfully \n
    Alice balance before burn: ${
      oldBal / 10 ** deployRootFromDeployerParams.decimals
    } \n
    Alice balance after burn: ${
      newBal / 10 ** deployRootFromDeployerParams.decimals
    }`
  );
} else {
  console.log(
    `Burning token failed ${(burnRes.exitCode, burnRes.resultCode)}`
  );
}

/*
    Burning tip-3 tokens using burnByRoot function on the token root contract
  */

// Defining the burn amount to be used in the burnByRoot function
const burnByRootAmount: number =
  5 * 10 ** deployRootFromDeployerParams.decimals;

// Defining the balance of the token wallet before burning
oldBal = (
  await getWalletData(
    aliceMultiWalletContract,
    tokenRootContract.address
  )
).balance;

// Burning tip-3 tokens using burnByRoot
await tokenRootContract.methods
  .burnTokens({
    amount: burnByRootAmount,
    remainingGasTo: aliceAccount.address,
    walletOwner: aliceMultiWalletContract.address,
    callbackTo: aliceMultiWalletContract.address, // important to update the MW state
    payload: '',
  })
  .send({
    from: aliceAccount.address,
    amount: locklift.utils.toNano('2'),
  });

// Fetching the new balance after the burn is done
newBal = (
  await getWalletData(
    aliceMultiWalletContract,
    tokenRootContract.address
  )
).balance;

// Checking if the token are burnt successfully
if (newBal < oldBal) {
  console.log(
    `${
      burnByRootAmount / 10 ** deployRootFromDeployerParams.decimals
    } ${
      deployRootFromDeployerParams.symbol
    }'s burnt by root successfully \n
    Alice balance before burnByRoot: ${
      oldBal / 10 ** deployRootFromDeployerParams.decimals
    } \n
    Alice balance after burnByRoot: ${
      newBal / 10 ** deployRootFromDeployerParams.decimals
    }`
  );
} else {
  console.log(
    `Burning token failed ${(burnRes.exitCode, burnRes.resultCode)}`
  );
}
```

</span>

<span  :class="EIPdis">

```typescript
import {
  ProviderRpcClient,
  Address,
  Transaction,
  Contract,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

/**
 * We develop two more methods in order to reduce the mass of the script
 */

// This function is utilized to extract the public key of the sender wallet
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
interface walletData {
  tokenWallet: Address;
  balance: number;
}

// THis function is utilized to fetch token wallet data from the multi wallet tip-3 contract
async function getWalletData(
  MWContract: Contract<
    tip3Artifacts.FactorySource['MultiWalletTIP3']
  >,
  tokenRootAddress: Address
): Promise<walletData> {
  // returned value of the "wallets" mapping from multi wallet tip-3
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
    // Preparing the required contracts addresses
    const tokenRootAddress: Address = new Address(
      '<YOUR_TOKEN_ROOT_ADDRESS>'
    );
    const multiWalletAddress: Address = new Address(
      '<YOUR_MULTI_WALLET_ADDRESS>'
    );

    // creating an instance of the required contracts
    const tokenRootContract: Contract<
      tip3Artifacts.FactorySource['TokenRoot']
    > = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      tokenRootAddress
    );

    const multiWalletContract: Contract<
      tip3Artifacts.FactorySource['MultiWalletTIP3']
    > = new provider.Contract(
      tip3Artifacts.factorySource['MultiWalletTIP3'],
      multiWalletAddress
    );

    // Fetching the decimals and symbol
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

    // Defining the burn amount
    const burnAmount: number = 10 * 10 ** decimals;

    // Fetching the balance before burning tokens
    let oldBal: number = (
      await getWalletData(
        multiWalletContract,
        tokenRootContract.address
      )
    ).balance;

    // Get the senders public key
    const senderPubkey: string = await extractPubkey(
      provider,
      providerAddress
    );
    if (
      senderPubkey !=
      (await multiWalletContract.methods.owner({}).call()).owner
    ) {
      throw new Error(
        'You are not the owner of the sender multi wallet contract !'
      );
    }

    // checking if the user has enough tokens to burn
    if (oldBal < burnAmount) {
      throw new Error('Low balance !');
    }

    // burning tokens from a token wallet by calling the burn method
    const { transaction: burnRes } = await multiWalletContract.methods
      .burn({
        _amount: burnAmount,
        _tokenRoot: tokenRootContract.address,
      })
      .sendExternal({
        publicKey: await extractPubkey(provider, providerAddress),
      });

    // Throwing an Error if the transaction was aborted
    if (burnRes.aborted) {
      throw new Error(`Transaction aborted ! ${burnRes.exitCode}`);
    }

    // Getting the balance after burning the tokens
    let newBal = (
      await getWalletData(
        multiWalletContract,
        tokenRootContract.address
      )
    ).balance;

    // Checking if the tokens are successfully burnt
    if (newBal < oldBal) {
      console.log(
        `${
          burnAmount / 10 ** decimals
        } ${symbol}'s successfully burnt !`
      );

      return `Hash: ${burnRes.id.hash} \n
      Balance before burn:  ${oldBal / 10 ** decimals} \n
      Balance after burn: ${newBal / 10 ** decimals}`;
    } else {
      console.error(
        `Burning tokens failed !  ${
          (burnRes.exitCode, burnRes.resultCode)
        }`
      );
    }

    /*
      Using burnByRoot function
    */

    // Fetching the balance before utilizing the burnByRoot function
    oldBal = (
      await getWalletData(
        multiWalletContract,
        tokenRootContract.address
      )
    ).balance;

    // Defining the burn amount to be used when calling the burnByRoot function
    const burnByRootAmount: number = 5 * 10 ** decimals;

    // Checking iof the user has enough tokens to burn
    if (oldBal < burnByRootAmount) {
      throw new Error('Low balance !');
    }

    // burning tokens from a token wallet by calling the burn method
    const { transaction: burnByRootRes } =
      await tokenRootContract.methods
        .burnTokens({
          amount: burnByRootAmount,
          walletOwner: multiWalletContract.address,
          remainingGasTo: multiWalletContract.address,
          callbackTo: multiWalletContract.address,
          payload: '',
        })
        .sendExternal({
          publicKey: await extractPubkey(provider, providerAddress),
        });

    // Throwing an error if the transaction was aborted
    if (burnByRootRes.aborted) {
      throw new Error(
        `Transaction aborted ! ${burnByRootRes.exitCode}`
      );
    }

    // Getting the balance after burning tokens using token root function
    newBal = (
      await getWalletData(
        multiWalletContract,
        tokenRootContract.address
      )
    ).balance;

    // Checking if the tokens are burnt successfully
    if (newBal < oldBal) {
      console.log(
        `${
          burnByRootAmount / 10 ** decimals
        } ${symbol}'s successfully burnt By Root!`
      );

      return `Hash: ${burnByRootRes.id.hash} \n
      Balance before burnByRoot:  ${oldBal / 10 ** decimals} \n
      Balance after burnByRoot:  ${newBal / 10 ** decimals}`;
    } else {
      throw new Error(`Burning tokens failed !
      ${(burnByRootRes.exitCode, burnByRootRes.resultCode)}`);
    }
  } catch (e: any) {
    throw new Error(`Failed ${e.message}`);
  }
}
```

</span>

</div>

<div class="action">

## Step 2: Burn TIP-3 Tokens

<div :class="llAction">

Use this command to burn TIP-3 tokens:

```shell
npx locklift run -s ./scripts/07-burn-tip3.ts -n local
```

<ImgContainer src= '/07-burn-tip3.png' width="100%" altText="buildStructure" />

Congratulations, you have successfully burned TIP-3 tokens using a custom contract 🎉

</div>

<div :class="eipAction" >

<div :class="burn">

### burn TIP-3 tokens

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Multi wallet address</p>
<input ref="actionCandleAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p>
<input ref="actionAmount" class="action Ain" type="text"/>

<button @click="burnTokens" class="burnTokenBut" >burn Tokens</button>

</div>
<p id="output-p" :class="EIPdis" ref="burnTokenOutput"><loading :text="loadingText"/></p>

<div :class="burnByRoot">

### burn TIP-3 tokens By Root

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionRootTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Multi wallet address</p>
<input ref="actionRootCandleAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p>
<input ref="actionRootAmount" class="action Ain" type="text"/>

<button @click="burnTokensByRoot" class="burnTokenBut" >burn Tokens By Root</button>

</div>
</div>

</div>

<p id="output-p" :class="EIPdis" ref="BurnTokenByRootOutput"><loading :text="loadingText2"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {toast} from "/src/helpers/toast";
import {burnTip3Con} from "../../scripts/contract/burn"
import {burnTip3ByRootCon} from "../../scripts/contract/burnByRoot"
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
            this.$refs.actionCandleAddress.value == ""

        ){
            toast("Multi wallet address field is required !",0)
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
        let burnTokenRes = await burnTip3Con(
          this.$refs.actionTokenRootAddress.value,
          this.$refs.actionCandleAddress.value,
          this.$refs.actionAmount.value,
          )
          // Rendering the output
          burnTokenRes = !burnTokenRes ? "Failed" :  burnTokenRes;
          this.loadingText = burnTokenRes;
  }

   async function burnTokensByRoot(){
          this.loadingText2 = ""
        if (
            this.$refs.actionRootTokenRootAddress.value == ""

        ){
            toast("Token root address field is required !",0)
            this.loadingText2 = "Failed"
            return
        }        // checking of all the values are fully filled
        if (
            this.$refs.actionRootCandleAddress.value == ""

        ){
            toast("Multi wallet address field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        if (
            this.$refs.actionRootAmount.value == ""

        ){
            toast("Amount field is required !",0)
            this.loadingText2 = "Failed"
            return
        }
        let burnTokenRes = await burnTip3ByRootCon(
          this.$refs.actionRootTokenRootAddress.value,
          this.$refs.actionRootCandleAddress.value,
          this.$refs.actionRootAmount.value
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
