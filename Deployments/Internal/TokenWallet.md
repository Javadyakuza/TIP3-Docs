# Deploy token wallet

We have finally reached this section. We will write a smart contract that can manage wallets of TIP-3 tokens. And we will interact with it by external messages.



Let's create an empty contract and write the storage so that the contract can be the owner of many TIP-3 wallets.



::: tip
In Everscale, a contract can have an external (msg.pubkey) and/or internal (msg.sender/ smart contract address)
:::



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

```typescript
await multiWallet.methods
      .deployWallet({
        _deployWalletBalance: locklift.utils.toNano(10),
        _tokenRoot: tokenRoot.address,
      })
      .sendExternal({
        publicKey: signer.publicKey,
      });
```

