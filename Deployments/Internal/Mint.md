# Mint TIP-3 Tokens

In previous section we have learned to deploy a token root and wallet using the our custom contract.&#x20;

In this section we will learn the how to mint some tokens for the deployed token wallet, it's pretty easy and straight forward, you just need to pay attention to a few small points.

::: tip
- Notice that the owner of the deployed Token Wallet is the `MultiWalletTIP3` contract that we deployed earlier.  
- the `notify` parameter is always true in `MultiWalletTIP3` in order to receive callback function from the token root  and update the state of the `MultiWalletTIP3` contract.
- We send the `mint` transaction to the `token root` contract,  so how do we update the `MultiWalletTIP3` contract state ?\
There is a callback function named `onAcceptTokensMint` which will be called by the token wallet when the tokens are minted if we set the parameter `notify` to _true_ !
:::

<div class="mintToken">


<span  :class="LLdis"  >

We can mint TIP-3 tokens for the target Token Wallet, as shown in the code samples below using the locklift tool.


- Before we start to write our scripts we need to make sure that there is a file named `03-mint-tip3.ts` in the `script` folder in the project root.
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


```` typescript

/**
 * locklift is a globally declared object  
 */

import { EverWalletAccount } from "everscale-standalone-client";
import { factorySource ,FactorySource} from "../build/factorySource";
import {Address, Contract, zeroAddress, Signer} from "locklift";

async function main() {
  // Setting up the signer and the wallet
  const signer: Signer: = (await locklift.keystore.getSigner("0"))!;
  
  const everWallet: EverWalletAccount = await EverWalletAccount.fromPubkey({ publicKey: signer.publicKey!, workchain: 0 });
  

  // deploy or use the Root Deployer, Multi Wallet and the Token Root contracts from previous sections 
  const tokenRootAddress: Address = new Address('<YOUR_TOKEN_ROOT_ADDReSS>');
  const multiWalletAddress: Address = new Address('<YOUR_MULTI_WALLET_ADDRESS>');

  const [tokenRootContract, multiWalletContract] = await Promise.all([
    await locklift.factory.getDeployedContract("TokenRoot", tokenRootAddress),
    await locklift.factory.getDeployedContract("MultiWalletTIP3", tokenRootAddress),
  ])

  const [decimals, symbol] = await Promise.all([
    Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
    (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
  ]);

  let tokenWalletContract: Contract<FactorySource['TokenWallet']>;
  
  // fetching the balance of the token wallet associated with the token root and determining of its deployed or no 
  const tokenWalletData = (await multiWalletContract.methods.wallets().call()).wallets.map(item => {
    if (item[0].toString() == tokenRootAddress.toString()) {
      return item[1];
    }
  });
  
  let deployWalletValue: number = 0;
  if (tokenWalletData[0]!.tokenWallet.toString() != zeroAddress.toString()){
    // means that the token wallet is deployed for the user
    tokenWalletContract = locklift.factory.getDeployedContract("TokenWallet", tokenWalletData[0]!.tokenWallet);
    console.log("Token Wallet is deployed, balance before mint: ", Number(tokenWalletData[0]!.balance) / 10 ** decimals);
    deployWalletValue = locklift.utils.toNano("2");
  }else{
    console.log("Token Wallet is not deployed, balance before mint: 0");
  }


  const mintAmount: number = 50 * 10 ** decimals;

  // Minting tokens for Alice
  await tokenRootContract.methods
    .mint({
      amount: mintAmount,
      recipient: multiWalletAddress, // the owner of the token wallet is the MW contract
      deployWalletValue: deployWalletValue , 
      notify: true, // To update the Multi Wallet contract
      payload: "",
      remainingGasTo: everWallet.address,
    })
    .send({ from: everWallet.address, amount: deployWalletValue + locklift.utils.toNano("2") });

  // confirming that its received
  console.log(
    "balance after mint:",
    Number((await tokenWalletContract.methods.balance({ answerId: 0 }).call({})).value0) / 10 ** decimals,
  ); 
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

````typescript
import { ProviderRpcClient as PRC, Address, Transaction, Contract} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

async function main(){

  // Initiate the TVM provider
  const tokenRootAddress: Address = new Address("<YOUR_TOKEN_ROOT_ADDRESS>");
  const multiWalletAddress: Address = new Address("<YOUR_MULTI_WALLET_ADDRESS>");
  const mintAmount: number = 50;

  try {
    // creating an instance of the token root contract
    const tokenRootContract: Contract<tip3Artifacts.factorySource['TokenRoot']> = new provider.Contract(
      tip3Artifacts.factorySource['TokenRoot'],
      tokenRootAddress
    );
    // creating an instance of the token root contract
    const MultiWalletContract: Contract<tip3Artifacts.factorySource['MultiWalletTIP3']> = new provider.Contract(
      tip3Artifacts.factorySource['MultiWalletTIP3'],
      multiWalletAddress
    );
    // Fetching the decimals and symbol
    const [decimals, symbol] = await Promise.all([
      Number((await tokenRootContract.methods.decimals({ answerId: 0 }).call()).value0),
      (await tokenRootContract.methods.symbol({ answerId: 0 }).call()).value0,
    ]);

    // Checking if the user already doesn't have the any wallet of that token root
    let tokenWalletData = (await MultiWalletContract.methods.wallets().call()).wallets.map(item => {
      if (item[0].toString() == tokenRootContract.address.toString()) {
        return item[1];
      }
    });
    const zeroAddress: string = '0:0000000000000000000000000000000000000000000000000000000000000000';

    let deployWalletValue: number = 0;

    const oldBal: number = Number(tokenWalletData[0]!.balance) / 10 ** decimals;

    if (tokenWalletData[0]!.tokenWallet.toString() == zeroAddress) {
      deployWalletValue = 2 * 10 ** 9;
    }

    // Deploying a new contract if didn't exist before
    const deployWalletRes: Transaction = await tokenRootContract.methods
      .mint({
        amount: mintAmount * 10 ** decimals,
        deployWalletValue: deployWalletValue,
        remainingGasTo: senderAddress,
        recipient: multiWalletAddress,
        notify: true, // to update the MW contract state
        payload: '',
      })
      .send({
        from: senderAddress,
        amount: 2 * 10 ** 9 + deployWalletValue,
        bounce: true, 
      });
      
    if (deployWalletRes.aborted) {
      console.log(`Transaction aborted ! ${deployWalletRes.exitCode}`);

      return deployWalletRes;
    }

    tokenWalletData = (await MultiWalletContract.methods.wallets().call()).wallets.map(item => {
      if (item[0].toString() == tokenRootContract.address.toString()) {
        return item[1];
      }
    });
    const newBal: number = Number(tokenWalletData[0]!.balance) / 10 ** decimals;

    if (newBal >= oldBal) {
      console.log(`${mintAmount} ${symbol}'s minted successfully `);

      return `Old balance: ${oldBal} \n New balance: ${newBal}`;
    } else {
      console.log('Minting tokens failed !');

      return `Failed ${(deployWalletRes.exitCode, deployWalletRes.resultCode)}`;
    }
  } catch (e: any) {
    console.log(e.message);

    return `Failed ${e.message}`;
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

![](</mintForTWFromMW.png>)

Congratulations, you have successfully minted TIP-3 tokens for a token wallet deployed by a costume contract .

</div>

<div :class="eipAction" >

<div :class="mint">

## mint TIP-3 tokens  

<p class=actionInName style="margin-bottom: 0;">Token Root address</p> 
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Multi Wallet (recipient) address</p> 
<input ref="actionMultiWalletAddress" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">Amount</p> 
<input ref="actionAmount" class="action Ain" type="text"/>


<button @click="mintTokens" class="mintTokenBut" >mint Tokens</button>

</div>

<p id="output-p" :class="EIPdis" ref="mintTokenOutput"></p>

</div>
</div>

</div>


<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {toast} from "/src/helpers/toast";
import {mintTokenCon} from "../Scripts/Contract/mint"

export default defineComponent({
  name: "mintToken",
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
  async function mintTokens(){
          this.$refs.mintTokenOutput.innerHTML = "Processing ..."
        // checking of all the values are fully filled 
        if (
            this.$refs.actionTokenRootAddress.value == ""

        ){
            toast("Token root address field is required !",0)
            this.$refs.mintTokenOutput.innerHTML = "Failed"
            return
        }
                // checking of all the values are fully filled 
        if (
            this.$refs.actionMultiWalletAddress.value == ""

        ){
            toast("Multi Wallet  address field is required !",0)
            this.$refs.mintTokenOutput.innerHTML = "Failed"
            return
        }        // checking of all the values are fully filled 
        if (
            this.$refs.actionAmount.value == ""

        ){
            toast("Amount field is required !",0)
            this.$refs.mintTokenOutput.innerHTML = "Failed"
            return
        }
        let mintTokenRes = await mintTokenCon(
          this.$refs.actionTokenRootAddress.value,
          this.$refs.actionMultiWalletAddress.value,
          this.$refs.actionAmount.value,
          )
          // Rendering the output     
          mintTokenRes = !mintTokenRes ? "Failed" :  mintTokenRes;
          this.$refs.mintTokenOutput.innerHTML = mintTokenRes;
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
.mintTokens{
  font-size: 1.1rem;
}
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