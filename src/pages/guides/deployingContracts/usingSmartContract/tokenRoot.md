# Deploy Token Root

<div class="DeployTokenRoot">

In this section, we will learn a little more about the memory structure and StateInit in the [TVM (Ton Virtual Machine)](https://everkit.org/en/articles/the-virtual-machine-tvm-1), and deploy our token root contract through a smart contract.

## Memory Structure and State Init

TVM memory and persistent storage consist of cells. Remember that the TVM memory and persistent storage consist of (TVM) cells.

`tvm.buildStateInit` - Generates a `StateInit` from `code` and `data` `TvmCell`s. Member `splitDepth` of the tree of cell `StateInit`:

1. is not set. Has no value.
2. is set. `0 <= splitDepth <= 31`
3. Arguments can also be set with names. List of possible names:
4. `code` (`TvmCell`) - defines the code field of the `StateInit`. Must be specified.
5. `data` (`TvmCell`) - defines the data field of the `StateInit`. Conflicts with `pubkey` and `varInit`. Can be omitted, in this case data field would be build from `pubkey` and `varInit`.
6. `splitDepth` (`uint8`) - splitting depth. `0 <= splitDepth <= 31`. Can be omitted. By default, it has no value.
7. `pubkey` (`uint256`) - defines the public key of the new contract. Conflicts with `data`. Can be omitted, default value is 0.
8. `varInit` (`initializer list`) - used to set [static](https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#keyword-static) variables of the contract. Conflicts with `data` and requires `contr` to be set. Can be omitted.
9. `contr` (`contract`) - defines the contract whose `StateInit` is being built. Mandatory to be set if the option `varInit` is specified.

## Step 1: Write Deployment Script

<span  :class="LLdis"  >

Follow the instructions below to deploy a `TokenRoot` using the `rootDeployer` contract with the locklift tool and the state of the previously written script for [deploying the RootDeployer](../../prerequisites/rootDeployer.md).

::: info
Before we start to write our scripts we need to make sure that there is a file named `03-deploy-token.ts` in the `script` folder in the project root.
:::

</span>

<span  :class="EIPdis"  >

Deploying a token root using everscale-inpage-provider is now made easier with the Multi Wallet contract, as demonstrated in the code samples below:

::: warning

The parameter `initialSupply` must be set to zero if the `initialSupplyTo` is **zero address**.

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
/* Deploying Token Root contract using root Deployer */

// Defining an interface for tokens root deployment using the root deployer contract
interface deployRootParams {
  initialSupplyTo: Address;
  rootOwner: Address;
  name: string;
  symbol: string;
  decimals: number;
  mintDisabled: boolean;
  burnByRootDisabled: boolean;
  burnPaused: boolean;
  initialSupply: number;
  deployWalletValue: number;
  randomNonce: number;
  remainingGasTo: Address;
}

// Preparing the deployment params
const deployRootFromDeployerParams: deployRootParams = {
  name: 'Tip3OnboardingToken',
  decimals: 6,
  initialSupplyTo: zeroAddress,
  initialSupply: 0,
  deployWalletValue: 0,
  symbol: 'TOT',
  mintDisabled: false,
  rootOwner: aliceAccount.address,
  randomNonce: locklift.utils.getRandomNonce(),
  burnByRootDisabled: false,
  burnPaused: false,
  remainingGasTo: aliceAccount.address,
};

// Deploying the token root utilizing an external message to the root deployer contract
await rootDeployer.methods
  .deployTokenRoot(deployRootFromDeployerParams)
  .sendExternal({
    publicKey: signerAlice.publicKey,
  });

// Confirming tha that the token root is deployed by calling its name method
const tokenRootContract: Contract<FactorySource['TokenRoot']> =
  locklift.factory.getDeployedContract(
    'TokenRoot',
    (
      await rootDeployer.methods
        .getExpectedTokenRootAddress({
          name: deployRootFromDeployerParams.name,
          decimals: deployRootFromDeployerParams.decimals,
          symbol: deployRootFromDeployerParams.symbol,
          rootOwner: deployRootFromDeployerParams.rootOwner,
          randomNonce: deployRootFromDeployerParams.randomNonce,
        })
        .call()
    ).value0
  );

console.log(
  `Token Root address : ${tokenRootContract.address.toString()} \n Token Root name: ${
    (await tokenRootContract.methods.name({ answerId: 0 }).call())
      .value0
  }`
); // >> Tip3OnboardingToken
```

</span>

<span  :class="EIPdis">

```typescript
import {
  ProviderRpcClient,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

/**
 * We develop two more methods in order to reduce the mass of the script
 */

// THis function will extract the public key of the sender
async function extractPubkey(
  provider: ProviderRpcClient,
  senderAddress: Address
): Promise<string> {
  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: senderAddress })
  ).state!;

  const senderPublicKey: string = await provider.extractPublicKey(
    accountFullState.boc
  );

  return senderPublicKey;
}

async function main() {
  // Initiate the TVM provider

  // Token Root contracts abi
  const tokenRootAbi: tip3Artifacts.FactorySource['TokenRoot'] =
    tip3Artifacts.factorySource['TokenRoot'];

  // Creating an instance of the  root deployer contract
  const rootDeployerAddress: Address = new Address(
    '<YOUR_ROOT_DEPLOYER_ADDRESS>'
  );

  const rootDeployerAbi: tip3Artifacts.FactorySource['RootDeployer'] =
    tip3Artifacts.factorySource['RootDeployer'];

  const rootDeployerContract: Contract<
    tip3Artifacts.FactorySource['RootDeployer']
  > = new provider.Contract(rootDeployerAbi, rootDeployerAddress);

  // Defining an interface for tokens root deployment using the root deployer contract
  interface deployRootParams {
    initialSupplyTo: Address;
    rootOwner: Address;
    name: string;
    symbol: string;
    decimals: number;
    mintDisabled: boolean;
    burnByRootDisabled: boolean;
    burnPaused: boolean;
    initialSupply: number;
    deployWalletValue: number;
    randomNonce: number;
    remainingGasTo: Address;
  }

  // Preparing the parameters
  const params: deployRootParams = {
    initialSupplyTo: tip3Artifacts.zeroAddress,
    rootOwner: providerAddress,
    randomNonce: (Math.random() * 6400) | 0,
    deployWalletValue: 0,
    name: 'Tip3OnboardingToken',
    symbol: 'TOT',
    decimals: 6,
    mintDisabled: false,
    burnByRootDisabled: false,
    burnPaused: false,
    initialSupply: 0,
    remainingGasTo: providerAddress,
  };

  // Deploying the tokenRoot
  const { transaction: deployRes } =
    await rootDeployerContract.methods
      .deployTokenRoot(params)
      .sendExternal({
        publicKey: await extractPubkey(provider, providerAddress),
      });

  // Throwing an error if the transaction was aborted
  if (deployRes.aborted) {
    throw new Error(
      `transaction aborted ${
        (deployRes.exitCode, deployRes.resultCode)
      }`
    );
  }

  // Fetching the address of the token root
  const tokenRootAddr: Address = (
    await rootDeployerContract.methods
      .getExpectedTokenRootAddress({
        name: params.name,
        decimals: params.decimals,
        symbol: params.symbol,
        rootOwner: params.rootOwner,
        randomNonce: params.randomNonce,
      })
      .call()
  ).value0;

  // making an instance of the token root
  const tokenRootContract: Contract<
    tip3Artifacts.FactorySource['TokenRoot']
  > = new provider.Contract(tokenRootAbi, tokenRootAddr);

  // checking if the token root is deployed successfully by calling one of its methods
  const tokenName: string = (
    await tokenRootContract.methods.name({ answerId: 0 }).call({})
  ).value0;

  if (tokenName == params.name) {
    console.log(`${params.symbol} Token deployed successfully`);
    return `${params.symbol} deployed to ${tokenRootAddr.toString()}`;
  } else {
    throw new Error(
      `${params.symbol} Token deployment failed !${deployRes.exitCode}`
    );
  }
}
```

</span>

</div>

## Step 2: Deploy Token Root

<div class="action">
<div :class="llAction">

Let's run our script using locklift

```shell
npx locklift run -s ./scripts/03-deploy-token.ts -n local
```

<ImgContainer src= '/01-deploy-token-contract.png' width="100%" altText="buildStructure" />

Congratulations, you have deployed a TIP3 Token Root through the Root Deployer contract 🎉

</div>

<div :class="eipAction" >

<p class=actionInName style="margin-bottom: 0;">Root deployer</p>
<input ref="actionRootDeployer" class="action Ain" type="text"/>

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

<p id="output-p" :class="EIPdis" ref="deployTokenRootOutput"><loading :text="loadingText"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../../scripts/types";
import {toast} from "/src/helpers/toast";
import {deployTokenRootFromContract} from  "../../scripts/contract/deployTokenRoot";
import ImgContainer from "../../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"
import loading from "../../../../../.vitepress/theme/components/shared/BKDLoading.vue"

export default defineComponent({
  name: "DeployTokenRoot",
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

    async function deployTokenRoot(){
      this.loadingText = ""
        // checking of all the values are fully filled
        if (
            this.$refs.actionRootDeployer.value == ""

        ){
            toast("Root Deployer field is required !",0)
            this.loadingText = "Failed"
            return
        }
        if (
            this.$refs.actionName.value == ""

        ){
            toast("Name field is required !",0)
            this.loadingText = "Failed"
            return
        }
        if (
            this.$refs.actionSymbol.value == ""
        ){
            toast("Symbol field is required !",0)
            this.loadingText = "Failed"
            return
        }
        if (
            this.$refs.actionDecimals.value == 0 ||
            isNaN(Number(this.$refs.actionDecimals.value))
        ){
            toast("Decimals field must be number and non empty !",0)
            this.loadingText = "Failed"
            return
        }
        if (
            this.$refs.actionInitialSupplyTo.value == "" &&
            this.$refs.actionInitialSupply.value != 0

        ){
            toast("initialSupply must be empty for zeroAddress supply receiver !",0)
            this.loadingText = "Failed"
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
        await deployTokenRootFromContract(deployTokenRootParams, this.$refs.actionRootDeployer.value);
        // Rendering the output
        deployedTokenAddr = !deployedTokenAddr ? "Failed" :  deployedTokenAddr;
        this.loadingText = deployedTokenAddr;

    }

    return {
        eipHandler,
        llHandler,
        deployTokenRoot,
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
