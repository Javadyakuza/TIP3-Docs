# Mint TIP-3 Tokens

<div class="mintToken">

In previous section we have learned to deploy a token root and wallet using the our custom contract.&#x20;

In this section we will learn the how to mint TIP-3 tokens for a deployed token wallet, it's pretty easy and straight forward, you just need to pay attention to a few small points.

::: tip

- Notice that the owner of the deployed Token Wallet is the `MultiWalletTIP3` contract that we deployed earlier.
- the `notify` parameter is always true in `MultiWalletTIP3` in order to receive callback function from the token root and update the state of the `MultiWalletTIP3` contract.
- We send the `mint` transaction to the `token root` contract, so how do we update the `MultiWalletTIP3` contract state ?\
  There is a callback function named `onAcceptTokensMint` which will be called on the `MultiWalletTIP-3` by the token wallet and updates its state when the tokens are minted if we set the parameter `notify` to _true_ !
  :::

## Step 1: Write Minting Script

<span  :class="LLdis"  >

We can mint TIP-3 tokens for the target Token Wallet, as shown in the code samples below using the locklift tool.

We use the previously written script stats from the [deploy token wallet](/guides/deployingContracts/usingSmartContract/tokenWallet.md) section for the following script.

::: info

- Before we start to write our scripts we need to make sure that there is a file named `05-mint-tip3.ts` in the `script` folder in the project root.
  :::

</span>

<span :class="EIPdis"  >

Minting TIP-3 tokens using everscale-inpage-provider is pretty easy as well:

::: info

- You may find the following code sample a bit complex, that's because we want to get familiar with the multi wallet functionalities and how to use them.

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
/* Minting TIP-3 tokens using multi wallet contract */

// Defining the parameters for minting tip-3 tokens
const mintAmount: number =
  50 * 10 ** deployRootFromDeployerParams.decimals;

console.log(
  'balance before mint:',
  (
    await getWalletData(
      aliceMultiWalletContract,
      tokenRootContract.address
    )
  ).balance /
    10 ** deployRootFromDeployerParams.decimals
);

// Minting tokens for receiver
await tokenRootContract.methods
  .mint({
    amount: mintAmount,
    recipient: aliceMultiWalletContract.address, // the owner of the token wallet is the MW contract
    deployWalletValue: 0,
    notify: true, // To update the Multi Wallet contract
    payload: '',
    remainingGasTo: aliceAccount.address,
  })
  .send({
    from: aliceAccount.address,
    amount: locklift.utils.toNano(5),
  });

// confirming that its minted
console.log(
  'balance after mint:',
  (
    await getWalletData(
      aliceMultiWalletContract,
      tokenRootContract.address
    )
  ).balance /
    10 ** deployRootFromDeployerParams.decimals
);
```

</span>

<span  :class="EIPdis">

```typescript
import {
  ProviderRpcClient,
  Address,
  Transaction,
  Contract,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

// We use the getWalletData function to extract the token wallet data from the multi wallet contract
async function getWalletData(
  MWContract: Contract<
    tip3Artifacts.FactorySource['MultiWalletTIP3']
  >,
  tokenRootAddress: Address
): Promise<{ tokenWallet: Address; balance: number }> {
  // Returned value of the wallets mapping on the multi wallet tip-3 contract
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
  // Required contracts addresses
  const tokenRootAddress: Address = new Address(
    '<YOUR_TOKEN_ROOT_ADDRESS>'
  );
  const multiWalletAddress: Address = new Address(
    '<YOUR_MULTI_WALLET_ADDRESS>'
  );

  try {
    // creating an instance of the required contracts
    const tokenRootContract: Contract<
      tip3Artifacts.FactorySource['TokenRoot']
    > = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      tokenRootAddress
    );
    const MultiWalletContract: Contract<
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

    // Defining the mint amount
    const mintAmount: number = 50 * 10 ** decimals;

    // Checking if the user already has a token wallet associated with the token root
    let tokenWalletData = await getWalletData(
      MultiWalletContract,
      tokenRootContract.address
    );

    // Defining the deployWalletValue
    let deployWalletValue: number = 0;

    // Fetching the balance before minting tokens
    const oldBal: number =
      Number(tokenWalletData.balance) / 10 ** decimals;

    // Checking the if the user already has an token wallet of the target token root and accordingly setting the deployWalletValue to deploy onw for the user if doesn't have any
    if (
      tokenWalletData.tokenWallet.toString() ==
      tip3Artifacts.zeroAddress.toString()
    ) {
      deployWalletValue = 2 * 10 ** 9;
    }

    // Defining the transaction fee
    const txFee: string = String(2 * 10 ** 9 + deployWalletValue);

    // Minting tokens fo the receiver
    const mintRes: Transaction = await tokenRootContract.methods
      .mint({
        amount: mintAmount,
        deployWalletValue: deployWalletValue,
        remainingGasTo: providerAddress,
        recipient: multiWalletAddress,
        notify: true, /// @dev it's very important to update the MW contract state
        payload: '',
      })
      .send({
        from: providerAddress,
        amount: txFee,
        bounce: true,
      });

    // Throwing an error if the transaction was aborted
    if (mintRes.aborted) {
      throw new Error(
        `Transaction aborted ! ${
          (mintRes.exitCode, mintRes.resultCode)
        }`
      );
    }

    // Fetching the wallet data and balance after the mint is done
    tokenWalletData = await getWalletData(
      MultiWalletContract,
      tokenRootContract.address
    );
    const newBal: number =
      Number(tokenWalletData.balance) / 10 ** decimals;

    // Checking if the tokens are minted successfully for th receiver
    if (newBal >= oldBal) {
      console.log(`${mintAmount} ${symbol}'s minted successfully `);

      return `Old balance: ${oldBal} \n New balance: ${newBal}`;
    } else {
      throw new Error(
        `Failed ${(mintRes.exitCode, mintRes.resultCode)}`
      );
    }
  } catch (e: any) {
    throw new Error(`Failed ${e.message}`);
  }
}
```

</span>

</div>

<div class="action">

## Step 2: Mint TIP-3 tokens

<div :class="llAction">

Use this command to mint TIP-3 tokens:

```shell
npx locklift run -s ./scripts/05-mint-tip3.ts -n local
```

<ImgContainer src= '/05-mint-tip3.png' width="100%" altText="buildStructure" />

Congratulations, you have successfully minted TIP-3 tokens for a token wallet deployed by a custom contract 🎉

</div>

<div :class="eipAction" >

<div :class="mint">

<p class=actionInName style="margin-bottom: 0;">Token Root address</p>
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Multi Wallet (recipient) address</p>
<input ref="actionMultiWalletAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p>
<input ref="actionAmount" class="action Ain" type="text"/>

<button @click="mintTokens" class="mintTokenBut" >mint Tokens</button>

</div>

<p id="output-p" :class="EIPdis" ref="mintTokenOutput"><loading :text="loadingText"/></p>

</div>
</div>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {toast} from "/src/helpers/toast";
import {mintTokenCon} from "../../scripts/contract/mint"
import ImgContainer from "../../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"
import loading from "../../../../../.vitepress/theme/components/shared/BKDLoading.vue"

export default defineComponent({
  name: "mintToken",
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
  async function mintTokens(){
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
            this.$refs.actionMultiWalletAddress.value == ""

        ){
            toast("Multi Wallet  address field is required !",0)
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
        let mintTokenRes = await mintTokenCon(
          this.$refs.actionTokenRootAddress.value,
          this.$refs.actionMultiWalletAddress.value,
          this.$refs.actionAmount.value,
          )
          // Rendering the output
          mintTokenRes = !mintTokenRes ? "Failed" :  mintTokenRes;
          this.loadingText = mintTokenRes;
  }


return {
        eipHandler,
        llHandler,
        mintTokens,
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

.mintTokenBut, .switcherContainer, .codeBlockContainer, .Ain
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
.mintTokenBut{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;
    transition: all ease .3s;
}

.mintTokenBut:hover{
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
