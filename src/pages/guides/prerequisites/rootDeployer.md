<div class="DeployRootDeployer">

# Root Deployer

In this section we will learn what is the root deployer contract, its code and how to deploy it using tools like `locklift` or `everscale-inpage-provider`.

## What is the Root Deployer ?

We have developed a smart contract written in [t-solidity](https://github.com/tonlabs/TON-Solidity-Compiler) that facilitates the deployment of the `TokenRoot` contract and enables us to obtain the address of an already deployed `TokenRoot` contract.

Deploying a token root contract using this smart contract is easier than deploying it through an Account. Contributors can also customize the contract to suit different needs, such as keeping track of all deployed token roots or implementing other functionalities.

Please note that while the `RootDeployer` contract acts as the deployer of the `TokenRoot` contract, the ownership of the `TokenRoot` can be specified by the user.

::: warning
To retrieve the address of your deployed token root via the root deployer's `getExpectedTokenRootAddress` function, it is crucial to remember what was your token root `randomNonce_` value!
:::

## Contract Code

<details>
<summary> show code </summary>

```solidity

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


    function DeployRootDeployer(
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
```

</details>

::: tip

It is important to understand that smart contracts in Everscale ~~have a life of their own~~

live in separate mini-blockchains and can only communicate by messages.

For this reason, we pass callbacks so that the contract returns something.

:::

## Step 1: Write Deployment Script

Now we write scripts to deploy the Root Deployer contract :

<span  :class="LLdis"  >

We have already covered how to deploy a contract using locklift, so deploying `RootDeployer` should be a straightforward process:

::: info
Before we start to write our scripts we need to make sure that there is file named `01-deploy-root-deployer.ts` in the `script` folder in the project root.
:::

</span>

<span  :class="EIPdis"  >

We have already learned how to deploy a contract using `everscale-inpage-provider` as well, so the process remains the same as before.

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
 * locklift is a globally declared object
 */

import {
  Address,
  Contract,
  Signer,
  WalletTypes,
  zeroAddress,
} from 'locklift';
import { FactorySource } from '../build/factorySource';

async function getWalletData(
  MWContract: Contract<FactorySource['MultiWalletTIP3']>,
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
  let tokenWallet: Address = zeroAddress;
  if (walletData.length != 0) {
    balance = Number(walletData[0]!.balance);
    tokenWallet = walletData[0]!.tokenWallet;
  }
  return { tokenWallet: tokenWallet, balance: balance };
}
async function main() {
  // Fetching the signer key pair from locklift.config.ts
  const signerAlice: Signer =
    (await locklift.keystore.getSigner('0'))!;
  const signerBob: Signer = (await locklift.keystore.getSigner('1'))!;

  // uncomment if deploying a new account
  // const { contract: account } = await locklift.factory.deployContract({
  //   contract: "Account",
  //   publicKey: signer.publicKey,
  //   constructorParams: {},
  //   initParams: { _randomNonce: locklift.utils.getRandomNonce() },
  //   value: locklift.utils.toNano(20),
  // });

  // Adding an existing SafeMultiSig Account using its address
  const aliceAccount =
    await locklift.factory.accounts.addExistingAccount({
      type: WalletTypes.MsigAccount,
      address: new Address('<ALICE_ACCOUNT_ADDRESS>'),
      mSigType: 'SafeMultisig',
      publicKey: signerAlice.publicKey,
    });

  // uncomment if deploying a new account
  // const { contract: account } = await locklift.factory.deployContract({
  //   contract: "Account",
  //   publicKey: signer.publicKey,
  //   constructorParams: {},
  //   initParams: { _randomNonce: locklift.utils.getRandomNonce() },
  //   value: locklift.utils.toNano(20),
  // });

  // Adding an existing SafeMultiSig Account using its address
  const bobAccount =
    await locklift.factory.accounts.addExistingAccount({
      type: WalletTypes.MsigAccount,
      address: new Address('<BOB_ACCOUNT_ADDRESS>'),
      mSigType: 'SafeMultisig',
      publicKey: signerBob.publicKey,
    });

  // Deploying the Root deployer
  const { contract: rootDeployer } =
    await locklift.factory.deployContract({
      contract: 'RootDeployer',
      publicKey: signerAlice.publicKey,
      initParams: {
        randomNonce_: locklift.utils.getRandomNonce(),
      },
      constructorParams: {
        _rootCode:
          locklift.factory.getContractArtifacts('TokenRoot').code,
        _walletCode:
          locklift.factory.getContractArtifacts('TokenWallet').code,
      },
      value: locklift.utils.toNano('5'),
    });

  console.log(`Root Deployer: ${rootDeployer.address.toString()}`);
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

```typescript
import {
  ProviderRpcClient as PRC,
  Address,
  GetExpectedAddressParams,
  Contract,
  Transaction,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  // Root Deployer contract abi
  const rootDeployerAbi: tip3Artifacts.FactorySource['RootDeployer'] =
    tip3Artifacts.factorySource['RootDeployer'];

  // required contracts code and tvc
  const tokenRootArtifacts: typeof tip3Artifacts.artifacts.TokenRoot =
    tip3Artifacts.artifacts.TokenRoot;
  const tokenWalletArtifacts: typeof tip3Artifacts.artifacts.TokenWallet =
    tip3Artifacts.artifacts.TokenWallet;
  const rootDeployerArtifacts: typeof tip3Artifacts.artifacts.RootDeployer =
    tip3Artifacts.artifacts.RootDeployer;

  // define the deployParams type
  type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
    publicKey: string | undefined;
  };

  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: providerAddress })
  ).state!;

  const senderPublicKey: string = await provider.extractPublicKey(
    accountFullState.boc
  );

  // Preparing the deployment params
  const deployParams: DeployParams<
    tip3Artifacts.FactorySource['RootDeployer']
  > = {
    tvc: rootDeployerArtifacts.tvc,
    workchain: 0,
    publicKey: senderPublicKey,
    initParams: {
      randomNonce_: (Math.random() * 6400) | 0,
    },
  };

  // Get the expected address of the root deployer contract
  const expectedAddress = await provider.getExpectedAddress(
    rootDeployerAbi,
    deployParams
  );

  // Get the state init
  const stateInit = await provider.getStateInit(
    rootDeployerAbi,
    deployParams
  );

  // Send the coins to the address
  await provider.sendMessage({
    sender: providerAddress,
    recipient: expectedAddress,
    amount: String(3 * 10 ** 9),
    bounce: false, // It is important to set 'bounce' to false
    // to ensure funds remain in the contract.
    stateInit: stateInit.stateInit,
  });

  console.log('Fund sent to the Calculated address !');

  // Create a instance of the root deployer contract
  const userRootDeployer: Contract<
    tip3Artifacts.FactorySource['RootDeployer']
  > = new provider.Contract(rootDeployerAbi, expectedAddress);

  console.log('Sending stateInit to the Calculated address ...');

  // Call the contract constructor
  const { transaction: deployRes } = await userRootDeployer.methods
    .constructor({
      _rootCode: tokenRootArtifacts.code,
      _walletCode: tokenWalletArtifacts.code,
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
    console.log(`Root Deployer deployed successfully`);
    return `Root Deployer deployed to ${expectedAddress.toString()}`;
  } else {
    throw new Error(
      `Root Deployer deployment failed !${
        (deployRes.exitCode, deployRes.resultCode)
      }`
    );
  }
}
```

</span>

</div>

## Step 2: Deploy Root Deployer

<div class="action">
<div :class="llAction">

Let's run our script using locklift

```shell
npx locklift run -s ./scripts/01-deploy-root-deployer.ts -n local
```

<ImgContainer src= '/01-deploy-root-deployer.png' width="100%" altText="deployRootDeployerOutput" />

Congratulations, you have deployed a Root Deployer contract 🎉

</div>

<div :class="eipAction" >

<button @click="deployRootDeployer" class="DeployRootDeployerBut" >Deploy root deployer</button>

</div>

</div>

<p id="output-p" :class="EIPdis" ref="DeployRootDeployerOutput"><loading :text="loadingText"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../scripts/types";
import {toast} from "/src/helpers/toast";
import {deployRootDeployerCon} from  "../scripts/contract/rootDeployer";
import ImgContainer from "../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"
import loading from "../../../../.vitepress/theme/components/shared/BKDLoading.vue"

export default defineComponent({
  name: "DeployRootDeployer",
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

    async function deployRootDeployer(){
        this.loadingText = "";
        let deployRootDeployerRes = await deployRootDeployerCon();
        deployRootDeployerRes = !deployRootDeployerRes ? "Failed" :  deployRootDeployerRes;
        this.loadingText = deployRootDeployerRes;
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

.action{
    display:inline-block;
}

.actionInName{
    font-size: .9rem;
}

.DeployRootDeployerBut, .switcherContainer, .codeBlockContainer, .Ain, details
{
  background-color: var(--vp-c-bg-mute);
  transition: background-color 0.1s;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-weight: 600;
  cursor : pointer;
}
details {
  padding-left : 10px;
}
.Ain{
    padding-left : 10px;
    margin : 0;
}
.DeployRootDeployerBut{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;
    transition: all ease .3s;
}

.DeployRootDeployerBut:hover{
      border: 1px solid var(--light-color-ts-class);
}

.llSwitcher:hover, .eipSwitcher:hover{
      border-color: var(--light-color-ts-class);
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
    border-width: 1px;
    border-color: var(--vp-c-divider);
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
