# Deploy Token Root

<div class="DeployTokenRoot">

In this section, we will provide a simple, step-by-step guide on deploying the token root contract.

## Step 1: Write Deployment Script

<span  :class="LLdis" >

To deploy the token root using the [locklift](https://docs.locklift.io/) tool, which provides a straightforward approach. The following code sample demonstrates the deployment process:

::: info
Before we start to write our scripts we need to make sure that there is a file named `01-deploy-token.ts` in the `script` folder in the project root.
:::

</span>

<span  :class="EIPdis" >

Deploying a contract using the [everscale-inpage-provider](https://provider-docs.broxus.com/) can be a bit challenging. To ensure a successful contract deployment using this tool, please follow the steps outlined below

::: warning

The parameter `initialSupply` must be set to **zero** if the `initialSupplyTo` is **zero address**.

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
/**
 * locklift is a globally declared object
 */

import {
  Address,
  zeroAddress,
  Signer,
  WalletTypes,
  Contract,
} from 'locklift';
import { ContractData } from 'locklift/internal/factory';
import { FactorySource, factorySource } from '../build/factorySource';

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

  // Preparing test params
  const initialSupplyTo: Address = zeroAddress;
  const rootOwner: Address = aliceAccount.address;
  const name: string = 'Tip3OnboardingToken';
  const symbol: string = 'TOT';
  const decimals: number = 6;
  const disableMint: boolean = false;
  const disableBurnByRoot: boolean = false;
  const pauseBurn: boolean = false;
  const initialSupply: number = 0;

  /*
    Returns compilation artifacts based on the .sol file name
      or name from value config.externalContracts[pathToLib].
  */
  const tokenWallet: ContractData<FactorySource['TokenWallet']> =
    locklift.factory.getContractArtifacts('TokenWallet');

  /**
    * Deploy the TIP-3 Token Root contract.
    * @param deployer_ Its important to set this param to zero address when deploying the token root contract whiteout using an smart contract.
    * @param initialSupplyTo The token wallet that receives the initial supply.
    * @param initialSupply The amount of the tokens to be sent to "initialSupplyTo".
    * @param deployWalletValue: Along with the deployment of the root token,
      the wallet will be automatically deployed to the owner.
      This is the amount of EVERs that will be sent to the wallet.
      This parameter should be zero if the "initialSupplyTo" is zero address.
    * @param burnDisabledByRoot Root can not burn tokens of a token wallet.
    * @param remainingGasTo Address to send the change back.
  */
  const { contract: tokenRootContract } =
    await locklift.factory.deployContract({
      contract: 'TokenRoot',
      publicKey: signerAlice.publicKey,
      initParams: {
        deployer_: zeroAddress,
        randomNonce_: locklift.utils.getRandomNonce(),
        rootOwner_: rootOwner,
        name_: name,
        symbol_: symbol,
        decimals_: decimals,
        walletCode_: tokenWallet.code,
      },
      constructorParams: {
        initialSupplyTo: initialSupplyTo,
        initialSupply: initialSupply * 10 ** decimals,
        deployWalletValue: 0,
        mintDisabled: disableMint,
        burnByRootDisabled: disableBurnByRoot,
        burnPaused: pauseBurn,
        remainingGasTo: aliceAccount.address,
      },
      value: locklift.utils.toNano(5),
    });

  console.log(
    `${name} deployed to: ${tokenRootContract.address.toString()}`
  );
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
// Import the following libraries
import {
  Address,
  GetExpectedAddressParams,
  Contract,
  ProviderApiResponse,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  // Defining an interface for token root deployment parameters
  interface deployRootParams {
    initialSupplyTo: Address;
    rootOwner: Address;
    name: string;
    symbol: string;
    decimals: number;
    disableMint: boolean;
    disableBurnByRoot: boolean;
    pauseBurn: boolean;
    initialSupply: number;
  }

  // Token root abi
  const tokenRootAbi: tip3Artifacts.FactorySource['TokenRoot'] =
    tip3Artifacts.factorySource['TokenRoot'];

  // Token root and wallet's code and tvc
  const tokenRootArtifacts: typeof tip3Artifacts.artifacts.TokenRoot =
    tip3Artifacts.artifacts.TokenRoot;
  const tokenWalletArtifacts: typeof tip3Artifacts.artifacts.TokenWallet =
    tip3Artifacts.artifacts.TokenWallet;

  // Preparing deployments params
  const params: deployRootParams = {
    initialSupplyTo: tip3Artifacts.zeroAddress,
    rootOwner: tip3Artifacts.zeroAddress,
    name: 'Tip3OnboardingToken',
    symbol: 'TOT',
    decimals: 6,
    disableMint: false,
    disableBurnByRoot: false,
    pauseBurn: false,
    initialSupply: 0,
  };

  // Setting the deployWalletValue based on the initialSupply
  const deployWalletValue: number =
    params.initialSupplyTo == tip3Artifacts.zeroAddress
      ? 2 * 10 ** params.decimals
      : 0;

  // Amount to attach to the tx
  const amount: number =
    params.initialSupplyTo == tip3Artifacts.zeroAddress ? 2 : 4;

  // Define the deployParams type
  type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
    publicKey: string | undefined;
  };

  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: providerAddress })
  ).state!;
  const senderPublicKey: string = await provider.extractPublicKey(
    accountFullState.boc!
  );

  /**
   * Preparing deploy params to build the state init with the contract abi
   * @param deployer_ Its important to set this param to zero address when deploying the token root contract whiteout using an smart contract.
   */
  const deployParams: DeployParams<
    tip3Artifacts.FactorySource['TokenRoot']
  > = {
    tvc: tokenRootArtifacts.tvc,
    workchain: 0,
    publicKey: senderPublicKey,
    initParams: {
      deployer_: tip3Artifacts.zeroAddress,
      randomNonce_: (Math.random() * 6400) | 0,
      rootOwner_: params.rootOwner,
      name_: params.name,
      symbol_: params.symbol,
      decimals_: params.decimals,
      walletCode_: tokenWalletArtifacts.code,
    },
  };

  // Get the expected contract address
  const expectedAddress: Address = await provider.getExpectedAddress(
    tokenRootAbi,
    deployParams
  );

  // Get the state init
  const stateInit: ProviderApiResponse<'getExpectedAddress'> =
    await provider.getStateInit(tokenRootAbi, deployParams);

  // Send the coins to the calculated address
  await provider.sendMessage({
    sender: providerAddress,
    recipient: expectedAddress,
    amount: String(amount * 10 ** 9),
    bounce: false, // it's important to set this param to keep the evers in the contract
    stateInit: stateInit.stateInit,
  });

  // Create a contract instance
  const tokenRootContract: Contract<
    tip3Artifacts.FactorySource['TokenRoot']
  > = new provider.Contract(tokenRootAbi, expectedAddress);

  // Call the contract constructor
  const { transaction: deployRes } = await tokenRootContract.methods
    .constructor({
      initialSupplyTo: params.initialSupplyTo,
      initialSupply: params.initialSupply,
      deployWalletValue: deployWalletValue,
      mintDisabled: params.disableMint,
      burnByRootDisabled: params.disableBurnByRoot,
      burnPaused: params.pauseBurn,
      remainingGasTo: providerAddress,
    })
    .sendExternal({
      stateInit: stateInit.stateInit,
      publicKey: deployParams.publicKey!,
    });

  // checking if the token root is deployed successfully by calling its name method
  const tokenName: string = (
    await tokenRootContract.methods.name({ answerId: 0 }).call({})
  ).value0;
  if (tokenName == params.name) {
    console.log(
      `${
        params.symbol
      } Token deployed to ${expectedAddress.toString()}`
    );
    return true;
  } else {
    console.log(
      `${params.symbol} Token deployment failed ! ${
        (deployRes.exitCode, deployRes.resultCode)
      }`
    );
    return false;
  }
}
```

</span>

</div>

<div class="action">

## Step 2: Deploy Token Root

<div :class="llAction">

Let's run our script using locklift:

```shell
npx locklift run -s ./scripts/01-deploy-token.ts -n local

```

<ImgContainer src= '/01-deploy-token.png' width="100%" altText="deployTokenRootOutput" />

Congratulations, you have deployed your first TIP3 Token Root 🎉

</div>

<div :class="eipAction" >

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
<p id="output-p" :class="EIPdis" ref="deployTokenRootOutput"><loading :text="loadingText"/>
</p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../../scripts/types";
import {toast} from "/src/helpers/toast";
import {deployTokenRootEip} from  "../../scripts/account/tokenRoot";
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
      this.loadingText = "";
        // checking of all the values are fully filled
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
        await deployTokenRootEip(deployTokenRootParams);
        // Rendering the output
        deployedTokenAddr = !deployedTokenAddr ? "Failed" :  deployedTokenAddr;
        this.loadingText = deployedTokenAddr

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
