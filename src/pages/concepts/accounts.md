# Accounts

## Differences With Evm Accounts

In EVM, accounts can either be externally owned (controlled by anyone with private keys) or implemented as smart contracts. However, in TVM-based blockchains, there is no distinction between accounts and smart contracts. Every account is essentially a smart contract, equipped with its own code. The concept of an externally-owned account, in the traditional sense, does not exist.

## TVM Accounts

Each account, being a smart contract, has the capability to hold a balance, execute code, and interact with other accounts. This principle is known as `Account Abstraction`, which allows for authentication through various means, not limited to external ownership. Given that every account is a smart contract, the embedded code can incorporate any necessary authentication logic to verify a user's identity.

This flexibility of the smart contract code provides a broad range of authentication options, surpassing the traditional private key ownership.

## Usage

This documentation covers the usage of two tools for deploying and interacting with the contract on the these blockchains.

-  `locklift`
-  `everscale-inpage-provider`

When using  `nodejs`  to interact with the blockchain,  `locklift`  is employed. On the other hand, when making transactions from a  `Dapp` ,  `everscale-inpage-provider`  is utilized.

If you are using  `locklift` , then the  `SafeMultiSig`   is used as the account contract to either add the Account contract to the Accounts storage or create an instance of it. However, if you are using  `everscale-inpage-provider` , the  `WalletV3` contract is utilized.

Please note that the  `EverWallet`  used contract, written in `func` language, is different from the Account contract which is written in `t-sol`.

---

::: tip

Please navigate to [Deploy Account](../quickStart/deployAccount.md) to learn how to deploy an Account contract and use it.

For more information, please refer to the provided links.

- https://docs.everscale.network/arch/accounts

- https://everkit.org/en/articles/account-abstraction-everything-you-wanted-to-know.

:::