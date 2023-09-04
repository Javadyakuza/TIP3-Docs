# Deploy token wallet








<div class="DeployTokenWallet">

We have finally reached this section. We will write a smart contract that can manage wallets of TIP-3 tokens. And we will interact with it by external messages.



Let's create an empty contract and write the storage so that the contract can be the owner of many TIP-3 wallets.



::: tip
In Everscale, a contract can have an external (msg.pubkey) and/or internal (msg.sender/ smart contract address)
:::


::: tip
Before we start to write our scripts we need to make a file named `03-deploy-wallet.ts` in the `script` folder in the project root.
:::

<br/>
<span  :class="LLdis" style="font-size: 1.1rem;">

Deploying the Token Wallet of a existing Token Root contract using the locklift tool will be accomplished using the code sample below: 

</span>

<br/>

<div class="switcherContainer">

<button @click="llHandler" :class="llSwitcher">locklift</button>

<button @click="eipHandler" :class="eipSwitcher">everscale-inpage-provider </button>

</div>

<div class="codeBlockContainer" >

<span  :class="LLdis">

We will build a contract around an external owner

```solidity
pragma ton-solidity >= 0.61.2;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import '@broxus/contracts/contracts/utils/CheckPubKey.sol';
import '@broxus/contracts/contracts/utils/RandomNonce.sol';
import '@broxus/contracts/contracts/access/ExternalOwner.sol';
import "@broxus/tip3/contracts/interfaces/ITokenRoot.sol";
import "@broxus/tip3/contracts/interfaces/ITokenWallet.sol";
import "@broxus/tip3/contracts/libraries/TokenMsgFlag.sol";

import "./libraries/Errors.sol";

contract MultiWalletTIP3 is CheckPubKey, ExternalOwner, RandomNonce {
    uint128 constant msgFee = 0.5 ever;
    uint128 constant computeFee = 0.1 ever;

    struct Wallet {
        address tokenWallet;
        uint256 balance;
    }
    // tokenRoot => Wallet
    mapping (address => Wallet) public wallets;

    // tokenWallet => TokenRoot
    mapping (address => address) public tokenRoots;

    address awaitedRoot;

    modifier onlyTokenWallet(address _tokenRoot) {
      require(msg.sender == wallets[_tokenRoot].tokenWallet, Errors.NOT_TOKEN_WALLET);
      _;
    }
    
    constructor(
    ) public checkPubKey {
        tvm.accept();
        setOwnership(msg.pubkey());
    }

}

```

::: tip

Executes TVM instruction "ACCEPT" ([TVM](https://test.ton.org/tvm.pdf) - A.11.2). This instruction sets current gas limit to its maximal allowed value. This action is required to process external messages that bring no value.



In simple terms, when we call a contract from outside, we cannot pay for gas, because we don't have an account to store Evers. And in Everscale, the contract can do that for you.

:::

Now let's write a function to deploy a new wallet. The function will take two parameters: the initial amount of EVERs on the new wallet and the address of the Token Root

```solidity
function deployWallet(
        uint128 _deployWalletBalance,
        address _tokenRoot
    ) public onlyOwner {
        // Check that the wallet has not been created before
        require(!wallets.exists(_tokenRoot), Errors.WALLET_EXISTS);
        tvm.accept();

        awaitedRoot = _tokenRoot;
        ITokenRoot(_tokenRoot).deployWallet{
            // amount of Evers send
            value: _deployWalletBalance + msgFee,
            flag: TokenMsgFlag.IGNORE_ERRORS, 
            // Specify the function to which the address 
            // of the deployed wallet will come
            callback: MultiWalletTIP3.receiveTokenWalletAddress
        }(
            address(this), // Now the owner of the wallet token will be TIP3Account
            _deployWalletBalance
        );
    }

    function receiveTokenWalletAddress(address wallet) external {
        // Be sure to check that the message came from the expected root token
        require(msg.sender == awaitedRoot, 200, Errors.NOT_AWAITED_ROOT);
        wallets[msg.sender] = Wallet(wallet, 0);
        tokenRoots[wallet] = awaitedRoot;
        awaitedRoot = address(0);
    }
```

::: tip

It is important to understand that smart contracts in Everscale ~~have a life of their own~~

live in separate mini-blockchains and can only communicate by messages.

For this reason, we pass callbacks so that the contract returns something.

:::

Great, we have learned how to deploy TIP-3 Wallet from a smart contract.


````typescript

````

</span>

<span  :class="EIPdis">


</span>

</div>


<div class="action">
<div :class="llAction">

Use this command and deploy token wallet

```shell
npx locklift run -s ./scripts/02-deploy-wallet.js -n local
```

![](</image(17).png>)

Congratulations, you have deployed your first TIP3 Token Wallet !

</div>

<div :class="eipAction" >

## Deploy a TokenWallet

<p class=actionInName style="margin-bottom: 0;">Token Root address</p> 
<input ref="actionTokenRootAddress" class="action Ain" type="text"/>

<button @click="deployTokenWallet" class="deployTokenWalletBut" >Deploy token wallet</button>

</div>

</div>

<p id="output-p" :class="EIPdis" ref="deployTokenWalletOutput"></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../Scripts/types";
import {toast} from "/src/helpers/toast";
import {deployTokenWalletEip} from "../Scripts/Account/TokenWallet"

export default defineComponent({
  name: "DeployTokenWallet",
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
  async function deployTokenWallet(){
          this.$refs.deployTokenWalletOutput.innerHTML = "Processing ..."
        // checking of all the values are fully filled 
        if (
            this.$refs.actionTokenRootAddress.value == ""

        ){
            toast("Token root address field is required !",0)
            this.$refs.deployTokenWalletOutput.innerHTML = "Failed"
            return
        }
        let deployTokenWalletAddr = await deployTokenWalletEip(this.$refs.actionTokenRootAddress.value)
                // Rendering the output     
        deployTokenWalletAddr = !deployTokenWalletAddr ? "Failed" :  deployTokenWalletAddr;
        this.$refs.deployTokenWalletOutput.innerHTML = deployTokenWalletAddr;
  }
return {
        eipHandler,
        llHandler,
        deployTokenWallet
    };
  },
});

</script>

<style>
.DeployTokenWallet{
  font-size: 1.1rem;
}
.action{
    display:inline-block;
}

.actionInName{
    font-size: .9rem;
}

.deployTokenWalletBut, .switcherContainer, .codeBlockContainer, .Ain
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
.deployTokenWalletBut{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;
    transition: all ease .3s;
}

.deployTokenWalletBut:hover{
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