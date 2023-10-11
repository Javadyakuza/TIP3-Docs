# Introduction

As you are aware, the TIP-3 Standard is utilized for fungible tokens in the [TVM (Ton Virtual Machine)](https://everkit.org/en/articles/the-virtual-machine-tvm-1) based blockchains. It possesses a distinct architecture when compared to other network standards like ERC-20, among others.

This standard facilitates a more efficient approach to the storage and management of token balances, allowing users to avoid the high maintenance costs often associated with registry sharding. Moreover, it aligns with the fiscal policies of these blockchains, where data storage incurs fees, promoting both efficiency and economy in network operations.

The standard defines two primary contracts for interaction:
- Token Root
- [Token Wallet](./tokenWallet.md)

## Token Root

The Token Root contract is responsible for keeping important information about the token such as `name`, `decimals`, `totalSupply` and `walletCode` and also managing the creation of Token Wallets. It handles various important tasks, such as:

- Minting tokens.
- Utilizing the [`burnByRoot`](../guides/tokenOperations/usingAccount/burn.md) function.
- Enabling the `disableMint`, `disableBurnByRoot`, and `setBurnPaused` functions, which allow for the disabling of minting, burningByRoot, or pausing the burning of tokens.
- Transferring ownership of the token root through the `transferOwnership` function.

#### Deploy Wallet
The Token Root contract calculates the expected address of a smart contract based on the Token Wallet's contract code (stored in the root contract) and the provided user data(name, symbol, decimals and other parameters). It then sends the initial data and deployment funds to that address. It is important to note that the initial data (state init) is an encoded version, represented by the [cell](https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#tvmcell) type, which was used to calculate the address.

::: tip
Deploying the Token Wallets can be executed by Token Wallets under specific circumstances. Refer to [Deploying Token Wallets by Token Wallets](./tokenWallet.md#deploying-token-wallets-by-token-wallets) for more information.
:::