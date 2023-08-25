# Accounts 

In Ethereum, accounts can be externally owned (controlled by anyone with private keys) or implemented as smart contracts.
There is no distinction between accounts and smart contracts in the TVM based blockchains.
Every account is a smart contract with code, and there is no concept of an externally-owned account (owned by key pair) in the traditional sense.

All accounts can hold a balance, perform code, and call each other. 
This approach is called `Account abstraction` and allows for authentication through other means beyond external ownership.
Since every account in the TVM based blockchains is a smart contract, the contract's code can include any authentication logic necessary to verify a user's identity. 

The flexibility of smart contract code allows for a wide range of authentication options beyond traditional private key ownership. 

More information at [here](https://docs.everscale.network/arch/accounts) and [here](https://everkit.org/en/articles/account-abstraction-everything-you-wanted-to-know).