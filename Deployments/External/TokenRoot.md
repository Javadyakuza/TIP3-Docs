# Deploy Token Root

<div class="DeployTokenRoot">

Great! Now we write scripts to deploy Token Root:

::: tip
Before we start to write our scripts we need to make a file named `01-deploy-token.ts` in the `script` folder in the project root.
:::

<br/>
<span  :class="LLdis" style="font-size: 1.1rem;">

Deploying the token root using the [locklift](https://docs.locklift.io/) is pretty straight forward as explained in the following code sample: 

</span>

<span  :class="EIPdis" style="font-size: 1.1rem;">

Deploying a contract using the `everscale-inpage-provider` is a bit tricky, Please follow the steps below in order to have a successful contract deployment using this tool.   

2 - before proceeding to the next step which is the main part kindly notice at the following disclaimer:

::: danger

- The parameter `initialSupply` must be **zero** if the `initialSupplyTo` is an **zero address**.

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
 * locklift is globals declared object 
 */

import { Address, zeroAddress, factory} from "locklift";
import { ethers } from "ethers";
import { EverWalletAccount } from "everscale-standalone-client";

async function main() {

  // Fetching the signer key pair from locklift.config.ts
  const signer = (await locklift.keystore.getSigner("0"))!;
  
  /**
   * Making an instance of the wallet account using the signer public key and everscale-standalone-client tool 
  */
  const myAccount = await EverWalletAccount.fromPubkey({ publicKey: signer.publicKey!, workchain: 0 });

  // Preparing example params
  const initialSupplyTo = zeroAddress;
  const rootOwner = "";
  const name = "Onboarding Token;
  const symbol = "ONT42";
  const decimals = 6;
  const disableMint = "false";
  const disableBurnByRoot = "false";
  const pauseBurn = "false";

  let initialSupply = "0";
  
  /* 
    Returns compilation artifacts based on the .sol file name
      or name from value config.extarnalContracts[pathToLib].
  */
  const TokenWallet = locklift.factory.getContractArtifacts("TokenWallet");

  /* 
    Deploy the TIP-3 Token Root contract.
    @params deployWalletValue: Along with the deployment of the root token,
      the wallet will be automatically deployed to the owner. 
      This is the amount of EVERs that will be sent to the wallet.
  */
  const { contract: tokenRoot } = await locklift.factory.deployContract({
    contract: "TokenRoot",
    publicKey: signer.publicKey,
    initParams: {
      deployer_: new Address(zeroAddress),
      randomNonce_: (Math.random() * 6400) | 0,
      rootOwner_: rootOwner,
      name_: name,
      symbol_: symbol,
      decimals_: decimals,
      walletCode_: TokenWallet.code,
    },
    constructorParams: {
      initialSupplyTo: initialSupplyTo,
      initialSupply: ethers.parseUnits(initialSupply, decimals).toString(),
      deployWalletValue: locklift.utils.toNano(1),
      mintDisabled: disableMint,
      burnByRootDisabled: disableBurnByRoot,
      burnPaused: pauseBurn,
      remainingGasTo: new Address(myAccount.address),
    },
    value: locklift.utils.toNano(5),
  });

  console.log(`${name}: ${tokenRoot.address}`);
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

// Import the following libraries
import {
  ProviderRpcClient as PRC,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  isAddressObject,
} from 'everscale-inpage-provider';
import { ethers } from 'ethers';
import * as tip3Artifacts from 'tip3-docs-artifacts';

async function main(){
  // Initiate the TVM provider as explained in the Prerequisites section 

  interface deployRootParams {
  initialSupplyTo: string;
  rootOwner: string;
  name: string;
  symbol: string;
  decimals: number;
  disableMint: boolean;
  disableBurnByRoot: boolean;
  pauseBurn: boolean;
  initialSupply: number;
}

  // zero address instance
    const zeroAddress: string = '0:0000000000000000000000000000000000000000000000000000000000000000';
  // preparing the parameters  
    const TokenRoot = tip3Artifacts.factorySource['TokenRoot'];
    const TRArt = tip3Artifacts.artifacts.TokenRoot;
    const TWArt = tip3Artifacts.artifacts.TokenWallet;
    const params: deployRootParams = {
        initialSupplyTo: zeroAddress,
        rootOwner: zeroAddress,
        name: "Tip3OnboardingToken",
        symbol: "TOT",
        decimals: 6,
        disableMint: false,
        disableBurnByRoot: false,
        pauseBurn: false,
        initialSupply: 0
    } // Or get them in front-end from user 

  // define the deployParams type
  type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
    publicKey: string | undefined;
  };

    // Fetching the user public key
    const accountFullState: FullContractState = (
      await provider.getFullContractState({ address: senderAddress })
    ).state!;

    const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc!);

  // Preparing the deployment params
  const deployParams: DeployParams<tip3Artifacts.FactorySource['TokenRoot']> = {
    tvc: TRArt.tvc,
    workchain: 0,
    publicKey: senderPublicKey,
    initParams: {
      deployer_: new Address(zeroAddress),
      randomNonce_: (Math.random() * 6400) | 0,
      rootOwner_: new Address(params.rootOwner),
      name_: params.name,
      symbol_: params.symbol,
      decimals_: Number(params.decimals),
      walletCode_: TWArt.code,
    },
  };

  // Get the expected contract address
  const expectedAddress = await provider.getExpectedAddress(TokenRoot, deployParams);

  // Get the state init
  const stateInit = await provider.getStateInit(TokenRoot, deployParams);
    /**
     * @dev Notice that if the initialSupply was to an address except the zeroAddress the amount that is sent to the calculated address must be more that the walletDeployValue
     * For example for the next function  the amount can be 4 evers to avoid any aborted tx's, on the other hand the root contract must have enough(2 evers) to send to the token wallet to deploy that.
     * @important Its really important to the mentioned disclaimer otherwise the func will be lost since its just an simple money transfer !!
     */

    // Send the coins to the address
    const amount: string = params.initialSupplyTo == zeroAddress ? '2' : '4';
    await provider.sendMessage({
      sender: senderAddress,
      recipient: expectedAddress,
      amount: ethers.parseUnits(amount, 9).toString(), 
      bounce: false, // It is important to set 'bounce' to false
      // to ensure funds remain in the contract.
      stateInit: stateInit.stateInit,
    });

    // Create a contract instance
    const userTokenRoot: Contract<tip3Artifacts.FactorySource['TokenRoot']> = new provider.Contract(
      TokenRoot,
      expectedAddress
    );

    // Call the contract constructor
    const { transaction: deployRes } = await userTokenRoot.methods
      .constructor({
        initialSupplyTo: new Address(params.initialSupplyTo),
        initialSupply: ethers
          .parseUnits(String(params.initialSupply), Number(params.decimals))
          .toString(),
        deployWalletValue: ethers.parseUnits('2', 9).toString(),
        mintDisabled: params.disableMint,
        burnByRootDisabled: params.disableBurnByRoot,
        burnPaused: params.pauseBurn,
        remainingGasTo: senderAddress,
      })
      .sendExternal({
        stateInit: stateInit.stateInit,
        publicKey: deployParams.publicKey!,
      });

    // checking if the token root is deployed successfully by calling one of its methods
    const retrievedTokenName: string = (await userTokenRoot.methods.name({ answerId: 0 }).call({}))
      .value0;
    if (retrievedTokenName == params.name) {
      console.log(`${params.symbol} Token deployed to ${expectedAddress.toString()}`);
      return true;
    } else {
      console.log(`${params.symbol} Token deployment failed !`);
      return false;
    }  
}

````
</span>

</div>


<div class="action">
<div :class="llAction">

Let's run our script using locklift

```` shell
npx locklift run -s ./scripts/01-deploy-token.ts -n local
````

![](/image(15).png)

Congratulations, you have deployed your first TIP3 Token Root!

</div>

<div :class="eipAction" >

## Deploy a TokenRoot

<p class=actionInName style="margin-bottom: 0;">initialSupplyTo</p> 
<input ref="actionInitialSupplyTo" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">rootOwner</p>
<input ref="actionRootOwner" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">name</p>
<input ref="actionName" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">symbol</p>
<input ref="actionSymbol" class="action Ain" type="text"/>

<p class=actionInName style="margin-bottom: 0;">decimals</p>
<input ref="actionDecimals" class="action Ain" type="number"/>

<p class=actionInName style="margin-bottom: 0;">initialSupply</p>
<input ref="actionInitialSupply" class="action Ain" type="number"/>

<label class="container"> disableMint
<input class="checkboxInput" ref="actionDisableMint" type="checkbox">
<span class="checkmark"></span>
</label>

<label class="container"> disableBurnByRoot
<input class="checkboxInput" ref="actionDisableBurnByRoot" type="checkbox">
<span class="checkmark"></span>
</label>

<label class="container"> pauseBurn
<input class="checkboxInput" ref="actionPauseBurn" type="checkbox">
<span class="checkmark"></span>
</label>


<button @click="deployTokenRoot" class="deployTokenRootBut" >Deploy token root</button>

</div>

</div>

<p id="output-p" :class="EIPdis" ref="deployTokenRootOutput"></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../Scripts/types";
import {toast} from "/src/helpers/toast";
import {deployTokenRootEip} from  "../Scripts/Account/TokenRoot";

export default defineComponent({
  name: "DeployTokenRoot",
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

    async function deployTokenRoot(){
      this.$refs.deployTokenRootOutput.innerHTML = "Processing ..."
        // checking of all the values are fully filled 
        if (
            this.$refs.actionName.value == ""

        ){
            toast("Name field is required !",0)
            this.$refs.deployTokenRootOutput.innerHTML = "Failed"
            return
        }
        if (
            this.$refs.actionSymbol.value == ""
        ){
            toast("Symbol field is required !",0)
            this.$refs.deployTokenRootOutput.innerHTML = "Failed"
            return
        }
        if (
            this.$refs.actionDecimals.value == 0 ||
            isNaN(Number(this.$refs.actionDecimals.value))
        ){
            toast("Decimals field must be number and non empty !",0)
            this.$refs.deployTokenRootOutput.innerHTML = "Failed"
            return
        }
        if (
            this.$refs.actionInitialSupplyTo.value == "" &&
            this.$refs.actionInitialSupply.value != 0
          
        ){
            toast("initialSupply must be empty for zeroAddress supply receiver !",0)
            this.$refs.deployTokenRootOutput.innerHTML = "Failed"
            return
        }

        // fetching the params values 
        const deployTokenRootParams: deployRootParams = {
            initialSupplyTo: this.$refs.actionInitialSupplyTo.value,
            rootOwner: this.$refs.actionRootOwner.value,
            name: this.$refs.actionName.value,
            symbol: this.$refs.actionSymbol.value,
            decimals: this.$refs.actionDecimals.value,
            disableMint: this.$refs.actionDisableMint.checked,
            disableBurnByRoot: this.$refs.actionDisableBurnByRoot.checked,
            pauseBurn: this.$refs.actionPauseBurn.checked,
            initialSupply: this.$refs.actionInitialSupply.value
        }
        let deployedTokenAddr =
        await deployTokenRootEip(deployTokenRootParams);
        // Rendering the output     
        deployedTokenAddr = !deployedTokenAddr ? "Failed" :  deployedTokenAddr;
        this.$refs.deployTokenRootOutput.innerHTML = deployedTokenAddr;

    }
    return {
        eipHandler,
        llHandler,
        deployTokenRoot
    };
  },
});

</script>

<style>
.DeployTokenRoot{
  font-size: 1.1rem;
}
.action{
    display:inline-block;
}

.actionInName{
    font-size: .9rem;
}

.deployTokenRootBut, .switcherContainer, .codeBlockContainer, .Ain
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
.deployTokenRootBut{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;
    transition: all ease .3s;
}

.deployTokenRootBut:hover{
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