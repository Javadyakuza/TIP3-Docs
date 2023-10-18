# Multi Wallet TIP-3

In this section we will walk through to what tis the multi wallet TIP-3 contract,it's contract code specification and how to deploy it using tools `locklift` or `everscale-inpage-provider`.

## What is Multi Wallet TIP-3 ?

We have developed another contract that facilitates interaction with token wallets. Each individual can have one of these contracts to manage various token wallets associated with different token roots.
This contract provides several features, such as deploying a token wallet for a token root, performing transfer operations based on the TIP-3 standard, tracking each root's token wallet and balance and more.

Contributors can add additional functionalities based on different use cases to the contract such as adding a name to each multi wallet contract or increasing the owners to more than one account and more

## Contract Specifications and Code

::: tip
In Everscale, a contract can have an external (msg.pubkey) and/or internal (msg.sender/ smart contract address)
:::

**We will build a contract around an external owner**

<details>
<summary> show code </summary>

```solidity
pragma ever-solidity >= 0.61.2;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import '@broxus/contracts/contracts/utils/CheckPubKey.tsol';
import '@broxus/contracts/contracts/utils/RandomNonce.tsol';
import '@broxus/contracts/contracts/access/ExternalOwner.tsol';
import "@broxus/tip3/contracts/interfaces/ITokenRoot.tsol";
import "@broxus/tip3/contracts/interfaces/ITokenWallet.tsol";
import "@broxus/tip3/contracts/libraries/TokenMsgFlag.tsol";

import "./libraries/Errors.tsol";

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

</details>

::: tip

Executes TVM instruction "ACCEPT" ([TVM](https://test.ton.org/tvm.pdf) - A.11.2). This instruction sets current gas limit to its maximal allowed value. This action is required to process external messages that bring no value.

In simple terms, when we call a contract from outside, we cannot pay for gas, because we don't have an account to store Evers. And in Everscale, the contract can do that for you.

:::

### Deploy Wallet

**Now let's write a function to deploy a new wallet. The function will take two parameters: the initial amount of EVERs on the new wallet and the address of the Token Root**

<details>
<summary> show code </summary>

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

</details>

<br/>

### Transfer TIP-3 Tokens

**TIP-3 has two implementations of the transfer.**

<details>
<summary> show code </summary>

```solidity
/*
    Transfer tokens and optionally deploy TokenWallet for recipient
    @dev Can be called only by TokenWallet owner
    @dev If deployWalletValue !=0 deploy token wallet for recipient using that gas value
    @param amount How much tokens to transfer
    @param recipient Tokens recipient address
    @param deployWalletValue How much EVERs to attach to token wallet deploy
*/

function transfer(
        uint128 _amount,
        address _recipient,
        uint128 _deployWalletValue,
        address _tokenRoot
    ) public onlyOwner {
        require(wallets.exists(_tokenRoot), Errors.WALLET_NOT_EXISTS);
        Wallet wallet = wallets[_tokenRoot];
        require(wallet.balance >= _amount, Errors.NOT_ENOUGH_BALANCE);
        tvm.accept();

        wallet.balance -= _amount;
        wallets[_tokenRoot] = wallet;

        TvmCell _empty;
        ITokenWallet(wallet.tokenWallet).transfer{
            value: _deployWalletValue + msgFee,
            flag: TokenMsgFlag.IGNORE_ERRORS,
            bounce: true
            } ({
                amount: _amount,
                recipient: _recipient,
                deployWalletValue: _deployWalletValue,
                remainingGasTo: address(this),
                notify: true,
                payload: _empty
        });

    }
```

</details>

### Bounce and Notify

Finally, it's time to talk about important bounce and notify

:::tip
To understand how notifications work, let's build a message chain in the transfer
:::

<ImgContainer src= '/drawing_1.png' width="100%" altText="bounceAndNotify" />

:::tip
Bounce - if it's set and transaction (generated by the internal outbound message) falls (only at the computing phase, not at the action phase!) then funds will be returned. Otherwise, (flag isn't set or transaction terminated successfully) the address accepts the funds even if the account doesn't exist or is frozen. Defaults to `true`.
:::

**Let's add bounce handling to our code**

<details>
<summary> show code </summary>

```solidity
onBounce(TvmSlice body) external {
    tvm.rawReserve(_reserve(), 2);

    uint32 functionId = body.load(uint32);

    if (functionId == tvm.functionId(ITokenWallet.transfer)) {
        uint128 amount = body.load(uint128);
        require(tokenRoots.exists(msg.sender), Errors.NOT_TOKEN_WALLET);

        address tokenRoot = tokenRoots[msg.sender];
        Wallet wallet = wallets[tokenRoot];
        wallet.balance += amount;
        wallets[tokenRoot] = wallet;
    }
}
```

</details>

:::tip
`onBounce` function is executed when contract receives a bounced inbound internal message. The message is generated by the network if the contract sends an internal message with `bounce: true` and either

- called contract doesn't exist;
- called contract fails at the storage/credit/computing phase (not at the action phase!)

The message is generated only if the remaining message value is enough for sending one back.

`body` is empty or contains at most **256** data bits of the original message (without references). The function id takes **32** bits and parameters can take at most **224** bits. It depends on the network config. If `onBounce` function is not defined then the contract does nothing on receiving a bounced inbound internal message.

If the `onBounce` function throws an exception then another bounced messages are not generated.
:::

<ImgContainer src= '/drawing_2.png' width="100%" altText="onBounce" />

:::tip
As we have already figured out, the bounce works only if an error occurred on the called contract.

Using the transfer method as an example, what happens if the recipient runs out of Gas or some other error?

If you look at the source code of the wallet token, then when you call the AcceptTransfer function on the recipient of the tokens, a bounce with the value of true is passed. Then the Token Wallet of the recipient will bounce to the Token Wallet of the sender.

And in the original TIP-3 repository, we can observe that the wallet token calls the wallet owner method `onBounceTokensTransfer`

:::

<details>
<summary> show code </summary>

```solidity
onBounce(TvmSlice body) external {
    tvm.rawReserve(_reserve(), 2);

    uint32 functionId = body.load(uint32);

    if (functionId == tvm.functionId(ITokenWallet.acceptTransfer)) {
        uint128 amount = body.load(uint128);
        balance_ += amount;
        IBounceTokensTransferCallback(owner_).onBounceTokensTransfer{
            value: 0,
            flag: TokenMsgFlag.ALL_NOT_RESERVED + TokenMsgFlag.IGNORE_ERRORS,
            bounce: false
        }(
            root_,
            amount,
            msg.sender
      );
    }
}
```

</details>

<br/>

<ImgContainer src= '/drawing_3.png' width="100%" altText="ErrorBounce" />

**Let's develop a method**

<details>
<summary> show code </summary>

```solidity
function onBounceTokensTransfer(
        address tokenRoot,
        uint128 amount,
        address revertedFrom
    ) public onlyTokenWallet(tokenRoot) {
        tvm.accept();
        Wallet wallet = wallets[tokenRoot];
        wallet.balance += amount;
        wallets[tokenRoot] = wallet;
        revertedFrom;
    }
```

</details>

:::tip
Since `onBounces` has an implicit implementation, we can be sure that the sender will always be a trusted contract.

In contrast, from cases where our callback methods can call everything, and we need to check msg.sender
:::

### Transfer to Wallet

And in the end, let's look at the implementation of the transfer to TokenWallet.

In fact, the implementation differs only in that there is no deployWalletValue and we indicate the recipient Token Wallet, and not its owner

<details>
<summary> show code </summary>

```solidity
    /*
        @notice Transfer tokens using another TokenWallet address, that wallet must be deployed previously
        @dev Can be called only by token wallet owner
        @param amount How much tokens to transfer
        @param recipientWallet Recipient TokenWallet address
    */
    function transferToWallet(
        address _tokenRoot,
        uint128 _amount,
        address _recipientTokenWallet
    ) public onlyOwner {
        require(wallets.exists(_tokenRoot), Errors.WALLET_NOT_EXISTS);
        Wallet wallet = wallets[_tokenRoot];
        require(wallet.balance >= _amount, Errors.NOT_ENOUGH_BALANCE);
        tvm.accept();

        wallet.balance -= _amount;
        wallets[_tokenRoot] = wallet;

        TvmCell _empty;
        ITokenWallet(wallet.tokenWallet).transferToWallet{
            value: msgFee,
            flag: TokenMsgFlag.IGNORE_ERRORS,
            bounce: true
            } ({
                amount: _amount,
                recipientTokenWallet: _recipientTokenWallet,
                remainingGasTo: address(this),
                notify: true,
                payload: _empty
        });

    }

```

</details>

You probably noticed that we have a new TVM method in the code -&#x20;

`tvm.rawReserve(uint value, uint8 flag);`

Creates an output action that reserves **reserve** nanotons. It is roughly equivalent to create an outbound message carrying **reserve** nanotons to oneself, so that the subsequent output actions would not be able to spend more money than the remainder. It's a wrapper for opcodes "RAWRESERVE" and "RAWRESERVEX". See [TVM](https://test.ton.org/tvm.pdf).

:::tip
`tvm.accept` and `tvm.rawReserve`is determined by an external function or internal.\
\
Note: If the function has `tvm.rawReserve`then only a smart contract can call it.

But if the function has an acceptance, then it can be called by an external message and an internal one.\
\
If you need to make the function available only for external messages, add a&#x20;

require(msg.sender == address(0))
:::

---

To maintain the integrity of the Token Wallet contract, it is essential to update its state whenever TIP-3 tokens are either minted or burnt. As the contract's state is updated automatically when TIP-3 tokens are transferred to the token wallet, we have added two additional methods to handle the minting and burning of tokens.

### onAcceptTokensMint

<br/>

<details>
<summary> show code </summary>

```solidity
  function onAcceptTokensMint(
    address tokenRoot,
    uint128 amount,
    address remainingGasTo,
    TvmCell payload
  ) external onlyTokenWallet(tokenRoot) {
    tvm.accept();
    /*
     * @notice at this stage, even if a token wallet wasn't deployed for the specified token root, it should have been deployed during the mint operation.
     * So we can expect the token wallet contract address and assume its deployed.
     */
    Wallet wallet;
    if (wallets.exists(tokenRoot)) {
      wallet = Wallet(_getExpectedTokenWalletAddress(tokenRoot), wallets[tokenRoot].balance + amount);
    } else {
      // not added to this contract state yet , the amount will be tha balance
      wallet = Wallet(_getExpectedTokenWalletAddress(tokenRoot), amount);
    }

    wallets[tokenRoot] = wallet;
    remainingGasTo;
    payload;
  }

```

</details>

### onAcceptTokensBurn

<br/>

<details>
<summary> show code </summary>

```solidity

  function onAcceptTokensBurn(
    uint128 amount,
    address walletOwner,
    address wallet,
    address remainingGasTo,
    TvmCell payload
  ) external onlyTokenRoot(msg.sender) {
    tvm.accept();

    // @dev At this stage the token wallet is definietly deployed and added to this contract state by onAcceptTransfer or onAcceptMint callback functions.
    wallets[msg.sender] = Wallet(wallet, wallets[msg.sender].balance - amount); // undeflow impossible

    walletOwner;
    remainingGasTo;
    payload;
  }
```

</details>

::: warning
Please note that the state of this contract will only be updated when receiving callback functions from the token root or wallet. As a result, certain operations, such as minting tokens during calling the constructor of the token root by setting the `initialSupply` and `initialSupplyTo` parameters, will not invoke a callback function. Therefore, it is recommended to use the mint function separately with the `notify` parameter set to `true` when using the multi-wallet tip-3 contract, to ensure optimal performance.

Furthermore, it is important to emphasize that all operations related to the token wallet must be performed through this contract. This includes actions such as burning or transferring tokens, which are necessary to keep the contract state updated. In cases where direct transactions are made through the token wallet contract, it is advised to set the `notify` parameter to `true`.
:::

### Burn

Now let's talk about the `burn` method. `Burn` has two implementations as well as the transfer method:

- `burn`: This function will be called on the token wallet contract and only the owner of the token wallet can call it which is the Multi Wallet contract.
- `burnByRoot`: This function can be call on the token root and only the owner of the token root can call it, Notice that the owner of the token root is not the Root Deployer contract as we specify the `rootOwner` at the time of deploying the token root contact.

- Notice that the `notify` parameter is always true in `MultiWalletTIP3` in order to receive callback function from the token root contract and update the state of the `MultiWalletTIP3` contract.

We only implement the `burn` function in our contract so let's look at it real quick:

<details>
<summary> show code </summary>

```solidity
  function burn(uint128 _amount, address _tokenRoot) external view onlyOwner {
    require(wallets.exists(_tokenRoot), 222);
    Wallet wallet = wallets[_tokenRoot];
    require(wallet.balance >= _amount, 202);

    tvm.accept();
    TvmCell _empty;
    IBurnableTokenWallet(wallet.tokenWallet).burn{ value: msgFee, flag: TokenMsgFlag.IGNORE_ERRORS, bounce: true }({
      amount: _amount,
      remainingGasTo: address(this),
      callbackTo: address(this),
      payload: _empty
    });
  }
```

</details>

### Error Codes

Let's create a library to store our Error codes and use them inside of the contracts.
Save the below content in a file named `Errors.tsol` and import the library from the file path.

<details>
<summary> show code </summary>

```solidity
pragma ever-solidity >= 0.61.2;

library Errors {
    // Access
    uint16 constant NOT_TOKEN_WALLET = 1101;
    uint16 constant NOT_TOKEN_ROOT = 1102;
    uint16 constant NOT_AWAITED_ROOT = 1103;

    // Utils
    uint16 constant WALLET_EXISTS = 1201;
    uint16 constant WALLET_NOT_EXISTS = 1202;
    uint16 constant NOT_ENOUGH_BALANCE = 1203;

}

```

</details>

### Whole Code

At the end the whole contract will look like this:

<details>
<summary> show code </summary>

```typescript
pragma ever-solidity >=0.61.2;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "@broxus/contracts/contracts/utils/CheckPubKey.tsol";
import "@broxus/contracts/contracts/utils/RandomNonce.tsol";
import "@broxus/contracts/contracts/access/ExternalOwner.tsol";
import "@broxus/tip3/contracts/interfaces/ITokenRoot.tsol";
import "@broxus/tip3/contracts/interfaces/ITokenWallet.tsol";
import "@broxus/tip3/contracts/interfaces/IBurnableTokenWallet.tsol";
import "@broxus/tip3/contracts/TokenWallet.tsol";
import "@broxus/tip3/contracts/libraries/TokenMsgFlag.tsol";

import "./Errors.tsol";

contract MultiWalletTIP3 is CheckPubKey, ExternalOwner, RandomNonce {
  uint128 constant msgFee = 0.5 ever;
  uint128 constant computeFee = 0.1 ever;

  TvmCell walletCode;

  struct Wallet {
    address tokenWallet;
    uint256 balance;
  }
  // tokenRoot => Wallet
  mapping(address => Wallet) public wallets;

  // tokenWallet => TokenRoot
  mapping(address => address) public tokenRoots;

  address awaitedRoot;

  modifier onlyTokenRoot(address _tokenRoot) {
    require(wallets.exists(_tokenRoot), Errors.NOT_TOKEN_ROOT);
    _;
  }

  modifier onlyTokenWallet(address _tokenRoot) {
    // expecting the token wallet address
    require(msg.sender == _getExpectedTokenWalletAddress(_tokenRoot), Errors.NOT_TOKEN_WALLET);
    _;
  }

  constructor(TvmCell _walletCode) public checkPubKey {
    tvm.accept();
    walletCode = _walletCode;
    setOwnership(msg.pubkey());
  }

  function _getExpectedTokenWalletAddress(address _tokenRoot) private view returns (address) {
    return
      address(
        tvm.hash(
          tvm.buildStateInit({
            contr: TokenWallet,
            varInit: { root_: _tokenRoot, owner_: address(this) },
            pubkey: 0,
            code: walletCode
          })
        )
      );
  }

  function deployWallet(uint128 _deployWalletBalance, address _tokenRoot) public onlyOwner {
    require(!wallets.exists(_tokenRoot), Errors.WALLET_EXISTS);
    tvm.accept();

    awaitedRoot = _tokenRoot;
    ITokenRoot(_tokenRoot).deployWallet{
      value: _deployWalletBalance + msgFee,
      flag: 2,
      callback: MultiWalletTIP3.receiveTokenWalletAddress
    }(
      address(this), // Now the owner of the wallet token will be TIP3Account
      _deployWalletBalance
    );
  }

  function receiveTokenWalletAddress(address wallet) external {
    wallets[msg.sender] = Wallet(wallet, 0);
    tokenRoots[wallet] = awaitedRoot;
    awaitedRoot = address(0);
  }

  /*
        @notice Transfer tokens and optionally deploy TokenWallet for recipient
        @dev Can be called only by TokenWallet owner
        @dev If deployWalletValue !=0 deploy token wallet for recipient using that gas value
        @param amount How much tokens to transfer
        @param recipient Tokens recipient address
        @param deployWalletValue How much EVERs to attach to token wallet deploy
    */
  function transfer(
    uint128 _amount,
    address _recipient,
    uint128 _deployWalletValue,
    address _tokenRoot
  ) public onlyOwner {
    require(wallets.exists(_tokenRoot), 222);
    Wallet wallet = wallets[_tokenRoot];
    require(wallet.balance >= _amount, 202);
    tvm.accept();

    wallet.balance -= _amount;
    wallets[_tokenRoot] = wallet;

    TvmCell _empty;
    ITokenWallet(wallet.tokenWallet).transfer{
      value: _deployWalletValue + msgFee,
      flag: TokenMsgFlag.IGNORE_ERRORS,
      bounce: true
    }({
      amount: _amount,
      recipient: _recipient,
      deployWalletValue: _deployWalletValue,
      remainingGasTo: address(this),
      notify: true,
      payload: _empty
    });
  }

  /*
        @notice Transfer tokens using another TokenWallet address, that wallet must be deployed previously
        @dev Can be called only by token wallet owner
        @param amount How much tokens to transfer
        @param recipientWallet Recipient TokenWallet address
    */
  function transferToWallet(address _tokenRoot, uint128 _amount, address _recipientTokenWallet) public onlyOwner {
    require(wallets.exists(_tokenRoot), Errors.WALLET_NOT_EXISTS);
    Wallet wallet = wallets[_tokenRoot];
    require(wallet.balance >= _amount, Errors.NOT_ENOUGH_BALANCE);
    tvm.accept();

    wallet.balance -= _amount;
    wallets[_tokenRoot] = wallet;

    TvmCell _empty;
    ITokenWallet(wallet.tokenWallet).transferToWallet{ value: msgFee, flag: TokenMsgFlag.IGNORE_ERRORS, bounce: true }({
      amount: _amount,
      recipientTokenWallet: _recipientTokenWallet,
      remainingGasTo: address(this),
      notify: true,
      payload: _empty
    });
  }

  function onAcceptTokensTransfer(
    address tokenRoot,
    uint128 amount,
    address sender,
    address senderWallet,
    address remainingGasTo,
    TvmCell payload
  ) external onlyTokenWallet(tokenRoot) {
    tvm.accept();
    /*
     * @notice at this stage, even if a token wallet wasn't deployed for the specified token root, it should have been deployed during the transfer operation.
     * So we can expect the token wallet contract address and assume its deployed.
     */
    Wallet wallet;
    if (wallets.exists(tokenRoot)) {
      wallet = Wallet(_getExpectedTokenWalletAddress(tokenRoot), wallets[tokenRoot].balance + amount);
    } else {
      // not added to this contract state yet , the amount will be tha balance
      wallet = Wallet(_getExpectedTokenWalletAddress(tokenRoot), amount);
    }

    wallets[tokenRoot] = wallet;

    tokenRoot;
    sender;
    senderWallet;
    remainingGasTo;
    payload;
  }

  function onAcceptTokensMint(
    address tokenRoot,
    uint128 amount,
    address remainingGasTo,
    TvmCell payload
  ) external onlyTokenWallet(tokenRoot) {
    tvm.accept();
    /*
     * @notice at this stage, even if a token wallet wasn't deployed for the specified token root, it should have been deployed during the mint operation.
     * So we can expect the token wallet contract address and assume its deployed.
     */
    Wallet wallet;
    if (wallets.exists(tokenRoot)) {
      wallet = Wallet(_getExpectedTokenWalletAddress(tokenRoot), wallets[tokenRoot].balance + amount);
    } else {
      // not added to this contract state yet , the amount will be tha balance
      wallet = Wallet(_getExpectedTokenWalletAddress(tokenRoot), amount);
    }

    wallets[tokenRoot] = wallet;
    remainingGasTo;
    payload;
  }

  function burn(uint128 _amount, address _tokenRoot) external view onlyOwner {
    require(wallets.exists(_tokenRoot), 222);
    Wallet wallet = wallets[_tokenRoot];
    require(wallet.balance >= _amount, 202);

    tvm.accept();
    TvmCell _empty;
    IBurnableTokenWallet(wallet.tokenWallet).burn{ value: msgFee, flag: TokenMsgFlag.IGNORE_ERRORS, bounce: true }({
      amount: _amount,
      remainingGasTo: address(this),
      callbackTo: address(this),
      payload: _empty
    });
  }

  function onAcceptTokensBurn(
    uint128 amount,
    address walletOwner,
    address wallet,
    address remainingGasTo,
    TvmCell payload
  ) external onlyTokenRoot(msg.sender) {
    tvm.accept();

    // @dev At this stage the token wallet is definietly deployed and added to this contract state by onAcceptTransfer or onAcceptMint callback functions.
    wallets[msg.sender] = Wallet(wallet, wallets[msg.sender].balance - amount); // undeflow impossible

    walletOwner;
    remainingGasTo;
    payload;
  }

  function onBounceTokensTransfer(
    address tokenRoot,
    uint128 amount,
    address revertedFrom
  ) public onlyTokenWallet(tokenRoot) {
    tvm.accept();
    Wallet wallet = wallets[tokenRoot];
    wallet.balance += amount;
    wallets[tokenRoot] = wallet;
    revertedFrom;
  }

  onBounce(TvmSlice body) external {
    tvm.rawReserve(_reserve(), 2);

    uint32 functionId = body.decode(uint32);

    if (functionId == tvm.functionId(ITokenWallet.transfer)) {
      uint128 amount = body.decode(uint128);
      require(tokenRoots.exists(msg.sender), Errors.NOT_TOKEN_WALLET);

      address tokenRoot = tokenRoots[msg.sender];
      Wallet wallet = wallets[tokenRoot];
      wallet.balance += amount;
      wallets[tokenRoot] = wallet;
    }
  }

  function _reserve() public pure returns (uint128 reserve) {
    return msgFee + computeFee;
  }
}

```

</details>

## Step 1: Write Deployment Script

<div class="DeployMultiWalletTip3">

<span  :class="LLdis"  >

We can utilize the code sample below to deploy a `MultiWalletTIP3` contract using previously written script stats from the [deploy root deployer](rootDeployer.md) section and the locklift tool:

::: info
Before we start to write our scripts we need to make sure that there is file named `02-deploy-multi-wallet-tip3.ts` in the `script` folder in the project root.
:::

</span>

<span  :class="EIPdis"  >

The code samples below demonstrate how to deploy a Multi Wallet TIP3 contract using `everscale-inpage-provider` tool.

</span>
<br/>

<div class="switcherContainer">

<button @click="llHandler" :class="llSwitcher">locklift</button>

<button @click="eipHandler" :class="eipSwitcher">everscale-inpage-provider </button>

</div>

<div class="codeBlockContainer" >

<span  :class="LLdis">

```typescript
/* Deploying two MultiWalletTIP3 contract */

// We send a bit more Ever than usual since the transaction fees will be spent from the contract balance and all of initiator the tx's are external.
const { contract: aliceMultiWalletContract } =
  await locklift.factory.deployContract({
    contract: 'MultiWalletTIP3',
    publicKey: signerAlice.publicKey,
    initParams: {
      _randomNonce: locklift.utils.getRandomNonce(),
    },
    constructorParams: {
      _walletCode:
        locklift.factory.getContractArtifacts('TokenWallet').code,
    },
    value: locklift.utils.toNano('20'),
  });

console.log(
  'Alice Multi Wallet TIP-3 address: ',
  aliceMultiWalletContract.address.toString()
);

// We need another multi wallet in order to be able to perform the transfer operation
const { contract: bobMultiWalletContract } =
  await locklift.factory.deployContract({
    contract: 'MultiWalletTIP3',
    publicKey: signerBob.publicKey,
    initParams: {
      _randomNonce: locklift.utils.getRandomNonce(),
    },
    constructorParams: {
      _walletCode:
        locklift.factory.getContractArtifacts('TokenWallet').code,
    },
    value: locklift.utils.toNano('20'),
  });

console.log(
  'Bob Multi Wallet TIP-3 address: ',
  bobMultiWalletContract.address.toString()
);
```

</span>

<span  :class="EIPdis">

```typescript
import {
  ProviderRpcClient as PRC,
  GetExpectedAddressParams,
  Contract,
  FullContractState,
} from 'everscale-inpage-provider';
import * as tip3Artifacts from 'tip3-docs-artifacts';
import { provider, providerAddress } from './useProvider';

async function main() {
  try {
    // Required contracts Abi's
    const multiWalletTip3Abi: tip3Artifacts.FactorySource['MultiWalletTIP3'] =
      tip3Artifacts.factorySource['MultiWalletTIP3'];
    const multiWalletTip3Artifacts: typeof tip3Artifacts.artifacts.MultiWalletTIP3 =
      tip3Artifacts.artifacts.MultiWalletTIP3;
    const tokenWalletArtifacts: typeof tip3Artifacts.artifacts.TokenWallet =
      tip3Artifacts.artifacts.TokenWallet;

    // define the deployParams type
    type DeployParams<Abi> = GetExpectedAddressParams<Abi> & {
      publicKey: string | undefined;
    };

    // Fetching the user public key
    const accountFullState: FullContractState = (
      await provider.getFullContractState({
        address: providerAddress,
      })
    ).state!;

    const senderPublicKey: string = await provider.extractPublicKey(
      accountFullState.boc
    );

    // Preparing the deployment parameters
    const deployParams: DeployParams<
      tip3Artifacts.FactorySource['MultiWalletTIP3']
    > = {
      tvc: multiWalletTip3Artifacts.tvc,
      workchain: 0,
      publicKey: senderPublicKey,
      initParams: {
        _randomNonce: (Math.random() * 6400) | 0,
      },
    };

    // Get the expected address of the multi wallet tip-3 contract
    const expectedAddress = await provider.getExpectedAddress(
      multiWalletTip3Abi,
      deployParams
    );

    // Get the state init
    const stateInit = await provider.getStateInit(
      multiWalletTip3Abi,
      deployParams
    );

    // Send the coins to the address
    await provider.sendMessage({
      sender: providerAddress,
      recipient: expectedAddress,
      amount: String(20 * 10 ** 9),
      bounce: false, // It is important to set 'bounce' to false
      // to ensure funds remain in the contract.
      // if true "no data" exception will be raised
      stateInit: stateInit.stateInit,
    });

    console.log('Fund sent to the Calculated address !');

    // Create a instance from the multi wallet contract
    const multiWalletTip3Contract: Contract<
      tip3Artifacts.FactorySource['MultiWalletTIP3']
    > = new provider.Contract(multiWalletTip3Abi, expectedAddress);

    console.log('Sending stateInit to the Calculated address ...');

    // activating the contract by calling its constructor
    const { transaction: deployRes } =
      await multiWalletTip3Contract.methods
        .constructor({
          _walletCode: tokenWalletArtifacts.code,
        })
        .sendExternal({
          stateInit: stateInit.stateInit,
          publicKey: deployParams.publicKey!,
        });

    // returning the tx response if aborted
    if (deployRes.aborted) {
      console.log(
        `Transaction aborted ! ${
          (deployRes.exitCode, deployRes.resultCode)
        }`
      );

      return `Failed ${(deployRes.exitCode, deployRes.resultCode)}`;
    }

    // checking if the token root is deployed successfully by calling one of its methods
    if (
      (
        await provider.getFullContractState({
          address: expectedAddress,
        })
      ).state?.isDeployed
    ) {
      console.log(`Multi Wallet Tip3 deployed successfully`);

      return `Multi Wallet Tip3 deployed to ${expectedAddress.toString()}`;
    } else {
      throw new Error(
        `Multi Wallet Tip3 deployment failed !${
          (deployRes.exitCode, deployRes.resultCode)
        }`
      );
    }
  } catch (e: any) {
    throw new Error(`Failed ${e.message}`);
  }
}
```

</span>

</div>

## Step 2: Deploy Multi Wallet TIP-3

<div class="action">
<div :class="llAction">

Use this command and deploy MultiWalletTIP3 contract

```shell
npx locklift run -s ./scripts/02-deploy-multi-wallet-tip3.ts -n local
```

<ImgContainer src= '/01-deploy-token-contract.png' width="100%" altText="deployMWOutput" />

Congratulations, you have deployed a Multi Wallet TIP3 contract 🎉

</div>

<div :class="eipAction" >

<button @click="deployMultiWallet" class="DeployMultiWalletTip3But" >Deploy Multi Wallet Tip3</button>

</div>

</div>

<p id="output-p" :class="EIPdis" ref="DeployMultiWalletTip3Output"><loading :text="loadingText"/></p>

</div>

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import {deployRootParams} from "../scripts/types";
import {toast} from "/src/helpers/toast";
import {deployMultiWalletTip3Con} from "../scripts/contract/deployMultiWallet"
import ImgContainer from "../../../../.vitepress/theme/components/shared/BKDImgContainer.vue"
import loading from "../../../../.vitepress/theme/components/shared/BKDLoading.vue"

export default defineComponent({
  name: "DeployMultiWalletTip3",
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
  async function deployMultiWallet(){
          this.loadingText = ""
        // checking of all the values are fully filled
        let DeployMultiWalletTip3Addr = await deployMultiWalletTip3Con()
        // Rendering the output
        DeployMultiWalletTip3Addr = !DeployMultiWalletTip3Addr ? "Failed" :  DeployMultiWalletTip3Addr;
        this.loadingText = DeployMultiWalletTip3Addr;
  }
return {
        eipHandler,
        llHandler,
        deployMultiWallet
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

.DeployMultiWalletTip3But, .switcherContainer, .codeBlockContainer, .Ain, details
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
.DeployMultiWalletTip3But{
    cursor:pointer;
    padding: 5px 12px;
    display: flex;

    transition: all ease .3s;
}

.DeployMultiWalletTip3But:hover{
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
    border-width: 1px ;
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
