# Introduction 
 
As you are aware, the TIP-3 Standard is utilized for fungible tokens in the [TVM (Threaded Virtual Machine)](https://everkit.org/en/articles/the-virtual-machine-tvm-1) based blockchains. It possesses a distinct architecture when compared to other network standards like ERC-20, among others. 
 
This standard is fully distributed and establishes separate storage for each individual. Consequently, balances are not saved in a single contract but rather in each user's token wallet contract. This design aligns with the rules of these blockchains, where storing incurs fees. In other words, you cannot store data indefinitely on the network without cost; you are required to pay for it! 
 
The standard defines two primary contracts for interaction: 
- Token Root 
- [Token Wallet](./TokenWallet.md) 
 
## Token Root 
 
In simple terms, the Token Root contract manages the deployment of Token Wallets. 
 
The Token Root contract calculates the expected address of a smart contract based on the Token Wallet's contract code (stored in the root contract) and the provided user data. It then sends the initial data and deployment funds to that address. It is important to note that the initial data (state init) is an encoded version, represented by the [cell](https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#tvmcell) type, which was used to calculate the address. 

::: tip 
Deploying the Token Wallets can be carried out by Token Wallets under some certain circumstances. see {[Deploying Token Wallets by Token Wallets ](./TokenWallet.md#deploying-token-wallets-by-token-wallets)}.
:::

[ Place for API reference ](/index.md)