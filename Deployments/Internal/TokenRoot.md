
# Deploy Token Root

<div class="DeployTokenRoot">

In this section, we will learn a little more about the memory structure in ~~TON~~ Threaded Virtual Machine (TVM), and deploy our token through a smart contract.

::: tip 
TVM memory and persistent storage consist of cells. Recall that the TVM memory and persistent storage consist of (TVM) cells. Each cell contains up to 1023 bits of data and up to four references to other cells. Circular references are forbidden and cannot be created by means of TVM. In this way, all cells kept in TVM memory and persistent storage constitute a directed acyclic graph (DAG).
:::

::: tip 
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
:::


<br/>
<span  :class="LLdis" style="font-size: 1.1rem;">

::: tip
Before we start to write our scripts we need to make a file named `01-deploy-token.ts` in the `script` folder in the project root.
:::

Follow the instructions below to deploy the `RootDeployer` contract and using that `TokenRoot` contract:

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

````typescript 
pragma ever-solidity >= 0.61.2;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "@broxus/contracts/contracts/libraries/MsgFlag.tsol";

import "@broxus/tip3/contracts/TokenRoot.tsol";

contract RootDeployer {

    uint32 static randomNonce_;

    address owner_;

    TvmCell rootCode_;
    TvmCell walletCode_;

    constructor(
        TvmCell _rootCode,
        TvmCell _walletCode
    ) public {
        tvm.accept();
        owner_ = msg.sender;
        rootCode_ = _rootCode;
        walletCode_ =  _walletCode;
    }

    function getExpectedTokenRootAddress(        
        string name,
        string symbol,
        uint8 decimals,
        address rootOwner, 
        uint32 randomNonce
        ) public view returns(address){
        return address(tvm.hash(tvm.buildStateInit({
            contr: TokenRoot,
            varInit: {
                randomNonce_: randomNonce,
                deployer_: address(this),
                rootOwner_: rootOwner,
                name_: name,
                symbol_: symbol,
                decimals_: decimals,
                walletCode_: walletCode_
            },
            pubkey: 0,
            code: rootCode_
        })));
    }


    function deployTokenRoot(
        string name,
        string symbol,
        uint8 decimals,
        address initialSupplyTo,
        uint128 initialSupply,
        uint128 deployWalletValue,
        address rootOwner,
        uint32 randomNonce,
        bool mintDisabled,
        bool burnByRootDisabled,
        bool burnPaused,
        address remainingGasTo
    ) public {
        tvm.accept();
        TvmCell initData = tvm.buildStateInit({
            contr: TokenRoot,
            varInit: {
                randomNonce_: randomNonce,
                deployer_: address(this),
                rootOwner_: rootOwner,
                name_: name,
                symbol_: symbol,
                decimals_: decimals,
                walletCode_: walletCode_
            },
            pubkey: 0,
            code: rootCode_
        });

        address tokenRootAddr = new TokenRoot {
            stateInit: initData,
            value: 2 ever,
            flag: MsgFlag.SENDER_PAYS_FEES
        }(
            initialSupplyTo,
            initialSupply,
            deployWalletValue,
            mintDisabled,
            burnByRootDisabled,
            burnPaused,
            remainingGasTo
        );
    }
}
````

::: info 

Now let's write some script to deploy the contract that we wrote earlier (RootDeployer) and deploy a token root using that contract: 

:::

```` typescript
/**
 * locklift is globals declared object 
 */

import { EverWalletAccount } from "everscale-standalone-client";
import { Address,  zeroAddress } from "locklift";

async function main() {

    // Setting up the signer and wallet
    const signer = (await locklift.keystore.getSigner("0"))!;
  
    const everWallet = await EverWalletAccount.fromPubkey({ publicKey: signer.publicKey!, workchain: 0 });
  
    // Deploying the RootDeployer
    const { contract: rootDeployer } = await locklift.factory.deployContract({
      contract: "RootDeployer",
      publicKey: signer.publicKey,
      initParams: {
        randomNonce_: (Math.random() * 6400) | 0,
      },
      constructorParams: {
        _rootCode: locklift.factory.getContractArtifacts("TokenRoot").code,
        _walletCode: locklift.factory.getContractArtifacts("TokenWallet").code,
      },
      value: locklift.utils.toNano("6"),
    });

    console.log(`Root Deployer: ${rootDeployer.address.toString()}`);

    export interface deployRootParams {
    initialSupplyTo: Address;
    rootOwner: Address;
    name: string;
    symbol: string;
    decimals: number;
    disableMint: boolean;
    disableBurnByRoot: boolean;
    pauseBurn: boolean;
    initialSupply: number;
    randomNonce: number;
    }

    const deployRootFromDeployerParams :deployRootParams = {
        name: "Tip3OnboardingToken",
        decimals: 6,
        initialSupplyTo: zeroAddress,
        initialSupply: 0,
        deployWalletValue: 0,
        symbol: "TOT",
        mintDisabled: false,
        rootOwner: everWallet.address,
        randomNonce: (Math.random() * 6400) | 0, 
        burnByRootDisabled: false,
        burnPaused: false,
        remainingGasTo: everWallet.address,
    }

    await rootDeployer.methods
      .deployTokenRoot(deployRootFromDeployerParams)
      .send({
        from: everWallet.address,
        amount: locklift.utils.toNano("4"),
      });

    // Confirming tha that the token root is deployed by calling the name method on it 
    // making an instance of the contract , the deployment confirmation will be recognized here as well but we prefer getting the name of the contract 
    const tokenRoot = locklift.factory.getDeployedContract(
        "TokenRoot",
         (await rootDeployer.methods
              .getExpectedTokenRootAddress(
                name: deployRootFromDeployerParams.name,
                decimals: deployRootFromDeployerParams.decimals,
                symbol: deployRootFromDeployerParams.symbol,
                rootOwner: deployRootFromDeployerParams.rootOwner,
                randomNonce: deployRootFromDeployerParams.randomNonce,
              )
              .call()
          ).value0
        )
    
    console.log(`Token Root: ${tokenRoot.address.toString()}`); 

    console.log(`Token Root name: ${(tokenRoot.methods.name({ answerId: 0 })
        .call()).value0}`) // >> Tip3OnboardingToken
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

```` typescript

import { ethers } from 'ethers';
import {
  ProviderRpcClient as PRC,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';

import { toast } from '../../../src/helpers/toast';
import isValidEverAddress from '../helpers/isValideverAddress';
import { useProviderInfo } from '../helpers/useWalletsData';
import { deployRootDeployerParams, deployFromRootDeployerParams} from '../types';

const zeroAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

async function main() {

// initiate the TVM provider

/* 
Returns compilation artifacts based on the .sol file name
  or name from value config.externalContracts[pathToLib].
*/
const TokenRoot = tip3Artifacts.factorySource['TokenRoot'];
const RootDeployer = tip3Artifacts.factorySource['RootDeployer'];
const TRArt = tip3Artifacts.artifacts.TokenRoot;
const TWArt = tip3Artifacts.artifacts.TokenWallet;


// define the deployParams type
type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
  publicKey: string | undefined;
};

// Fetching the user public key
const accountFullState: FullContractState = (
  await provider.getFullContractState({ address: providerAddress })
).state!;

const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc);

// Preparing the deployment params
const deployParams: DeployParams<tip3Artifacts.FactorySource['RootDeployer']> = {
  tvc: RDArt.tvc,
  workchain: 0,
  publicKey: senderPublicKey,
  initParams: {
    randomNonce_: (Math.random() * 6400) | 0,
  },
};

// Get the expected contract address
const expectedAddress = await provider.getExpectedAddress(rootDeployer, deployParams);

// Get the state init
const stateInit = await provider.getStateInit(rootDeployer, deployParams);

/**
 * @dev Notice that if the initialSupply was to an address except the zeroAddress the amount that is sent to the calculated address must be more that the walletDeployValue
 * For example for that next  function  the amount can be 3 evers to avoid any aborted tx's,
 * @important Its really important to the mentioned disclaimer otherwise the func will be lost since its just an simple money transfer !!
 */

// Send the coins to the address
await provider.sendMessage({
  sender: providerAddress,
  recipient: expectedAddress,
  amount: 3 * 10 * 9, 
  bounce: false, // It is important to set 'bounce' to false
  // to ensure funds remain in the contract.
  stateInit: stateInit.stateInit,
});

console.log('Fund sent to the Calculated address !');
// Create a contract instance

const userRootDeployer: Contract<tip3Artifacts.FactorySource['RootDeployer']> =
  new provider.Contract(rootDeployer, expectedAddress);

console.log('Sending stateInit to the Calculated address ...');

// Call the contract constructor
const { transaction: deployRes } = await userRootDeployer.methods
  .constructor({
    _rootCode: TRArt.code,
    _walletCode: TWArt.code,
  })
  .sendExternal({
    stateInit: stateInit.stateInit,
    publicKey: deployParams.publicKey!,
  });

// returning the tx response as a string if aborted
if (deployRes.aborted) {
  console.log()(`Transaction aborted ! ${deployRes.exitCode, deployRes.resultCode }`);
  return `Failed ${deployRes.exitCode}`;
}

// checking if the token root is deployed successfully by calling one of its methods
if (
  (
    await provider.getFullContractState({
      address: expectedAddress,
    })
  ).state?.isDeployed
) {
  console.log(`${params.symbol} Root Deployer deployed successfully`);
  return `${params.symbol} deployed to ${expectedAddress.toString()}`;
} else {
  console.log(`${params.symbol} Root Deployer deployment failed !${deployRes.exitCode}`);
  return `Failed ${deployRes.exitCode}`;
}

// Send the coins to the address
const deployWalletValue: string = params.initialSupplyTo == zeroAddress ? '0' : '2';

const tokenRootDeploymentsParams: deployFromRootDeployerParams = {
  initialSupplyTo: new Address(params.initialSupplyTo),
  rootOwner: new Address(params.rootOwner),
  randomNonce: (Math.random() * 6400) | 0,
  deployWalletValue: deployWalletValue,
  name: params.name,
  symbol: params.symbol,
  decimals: params.decimals,
  mintDisabled: params.disableMint,
  burnByRootDisabled: params.disableBurnByRoot,
  burnPaused: params.pauseBurn,
  initialSupply: params.initialSupply,
  remainingGasTo: providerAddress,
};

// Deploying the tokenRoot
const tokenRootDeploymentRes: Transaction = await userRootDeployer.methods
  .deployTokenRoot(tokenRootDeploymentsParams)
  .send({
    from: providerAddress,
    amount: ethers
      .parseUnits(deployWalletValue == '0' ? '2' : '4', Number(params.decimals))
      .toString(),
  });

// checking if the token root is deployed successfully by calling one of its methods
if (tokenRootDeploymentRes.aborted) {
  console.log(
    `transaction aborted ${
      (tokenRootDeploymentRes.exitCode, tokenRootDeploymentRes.resultCode)
    }`
  );
  return `Failed ${(tokenRootDeploymentRes.exitCode, tokenRootDeploymentRes.resultCode)}`;
}

// fetching the address of the token root
const tokenRootAddr: Address = (
  await userRootDeployer.methods
    .getExpectedTokenRootAddress({
      name: tokenRootDeploymentsParams.name,
      decimals: tokenRootDeploymentsParams.decimals,
      symbol: tokenRootDeploymentsParams.symbol,
      rootOwner: tokenRootDeploymentsParams.rootOwner,
      randomNonce: tokenRootDeploymentsParams.randomNonce,
    })
    .call()
).value0;

// making an instance of the token root
const TokenRootCon = new provider.Contract(TokenRoot, tokenRootAddr);

const retrievedTokenName: string = (await TokenRootCon.methods.name({ answerId: 0 }).call({}))
  .value0;

if (retrievedTokenName == params.name) {
  console.log(`${params.symbol} Token deployed successfully`);
  return `${params.symbol} deployed to ${tokenRootAddr.toString()}`;
} else {
  console.log(`${params.symbol} Token deployment failed !${tokenRootDeploymentRes.exitCode}`);
  return `Failed ${tokenRootDeploymentRes.exitCode}`;
}
}

````

</span>

</div>


<div class="action">
<div :class="llAction">

Let's run our script using locklift

```` shell
npx locklift run -s ./scripts/01-deploy-root-deployer.ts -n local
````

![](/image(101).png)

Congratulations, you have deployed your first TIP3 Token Root!

</div>

<div :class="eipAction" >

## Deploy Root Deployer

<button @click="deployRootDeployer" class="deployTokenRootBut" >Deploy root deployer</button>

<p id="output-p" :class="EIPdis" ref="deployRootDeployerOutput"></p>


## Deploy a TokenRoot from Root Deployer

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

<p id="output-p" :class="EIPdis" ref="deployTokenRootOutput"></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../Scripts/types";
import {toast} from "/src/helpers/toast";
import {deployTokenRootFromContract} from  "../Scripts/Contract/DeployTokenRoot";
import {deployRootDeployerEip} from  "../Scripts/Contract/RootDeployer";

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
            this.$refs.actionRootDeployer.value == ""

        ){
            toast("Root Deployer field is required !",0)
            this.$refs.deployTokenRootOutput.innerHTML = "Failed"
            return
        }
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
        await deployTokenRootFromContract(deployTokenRootParams, this.$refs.actionRootDeployer.value);
        // Rendering the output     
        deployedTokenAddr = !deployedTokenAddr ? "Failed" :  deployedTokenAddr;
        this.$refs.deployTokenRootOutput.innerHTML = deployedTokenAddr;

    }

    async function deployRootDeployer(){
        this.$refs.deployRootDeployerOutput.innerHTML = "Processing ...";
        let deployRootDeployerRes = await deployRootDeployerEip();
        deployRootDeployerRes = !deployRootDeployerRes ? "Failed" :  deployRootDeployerRes;
        this.$refs.deployRootDeployerOutput.innerHTML = deployRootDeployerRes;
    }

    return {
        eipHandler,
        llHandler,
        deployTokenRoot, 
        deployRootDeployer
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