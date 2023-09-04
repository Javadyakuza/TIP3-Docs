# Root Deployer 
We have designed a smart contract that handles the deployment of the `TokeRoot` contract and can help us retrieve the address of an already deployed `TokenRoot` contract 

::: tip
Notice that although the deployer of the `TokenRoot` contract is the `RootDeployer` contract, the owner of the `TokenRoot` can be specified by the user.    
:::


## Contract Code 

```` solidity 

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
    ) public view{
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

        new TokenRoot {
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


## Deploy

<div class="DeployTokenRoot">

Now we write scripts to deploy the Root Deployer contract :



<br/>
<span  :class="LLdis" style="font-size: 1.1rem;">

Deploying the RootDeployer using the [locklift](https://docs.locklift.io/) is pretty straight forward as explained in the following code sample: 

::: info
Before we start to write our scripts we need to make sure that there is file named `01-deploy-root-deployer.ts` in the `script` folder in the project root.
:::

</span>

<span  :class="EIPdis" style="font-size: 1.1rem;">

Deploying a contract using the `everscale-inpage-provider` is a bit tricky, Please follow the steps below in order to have a successful contract deployment using this tool.   


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

  // Deploying the Root deployer
  const { contract: RootDeployer } = await locklift.factory.deployContract({
    contract: "RootDeployer",
    publicKey: signer.publicKey,
    initParams: {
      randomNonce_: (Math.random() * 6400) | 0,
    },
    constructorParams: {
      _rootCode: locklift.factory.getContractArtifacts("TokenRoot").code,
      _walletCode: locklift.factory.getContractArtifacts("TokenWallet").code,
    },
    value: locklift.utils.toNano("5"),
  });

  console.log(`Root Deployer: ${signer.address.toString()}`);
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
const RootDeployer = tip3Artifacts.factorySource['RootDeployer'];
const TRArt = tip3Artifacts.artifacts.TokenRoot;
const TWArt = tip3Artifacts.artifacts.TokenWallet;


// define the deployParams type
type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
  publicKey: string | undefined;
};

// Fetching the user public key
const accountFullState: FullContractState = (
  await provider.getFullContractState({ address: senderAddress })
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
  sender: senderAddress,
  recipient: expectedAddress,
  amount: ethers.parseUnits('3', 9).toString(), // 2|3_000_000_000 (2 | 3 evers)
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
 await userRootDeployer.methods
  .constructor({
    _rootCode: TRArt.code,
    _walletCode: TWArt.code,
  })
  .sendExternal({
    stateInit: stateInit.stateInit,
    publicKey: deployParams.publicKey!,
  });

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

![](/deployRootDeployer.png)

Congratulations, you have deployed a Root Deployer contract 🎉

</div>

<div :class="eipAction" >

### Deploy Root Deployer

<button @click="deployRootDeployer" class="deployTokenRootBut" >Deploy root deployer</button>

<p id="output-p" :class="EIPdis" ref="deployRootDeployerOutput"></p>

</div>

</div>

<p id="output-p" :class="EIPdis" ref="deployTokenRootOutput"></p>

</div>


<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../Scripts/types";
import {toast} from "/src/helpers/toast";
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

    async function deployRootDeployer(){
        this.$refs.deployRootDeployerOutput.innerHTML = "Processing ...";
        let deployRootDeployerRes = await deployRootDeployerEip();
        deployRootDeployerRes = !deployRootDeployerRes ? "Failed" :  deployRootDeployerRes;
        this.$refs.deployRootDeployerOutput.innerHTML = deployRootDeployerRes;
    }

    return {
        eipHandler,
        llHandler,
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
