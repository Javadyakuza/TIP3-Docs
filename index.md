# TIP-3 Standard

TIP-3 is the technical standard for all fungible tokens of the [TVM(Ton Virtual Machine)](https://everkit.org/en/articles/the-virtual-machine-tvm-1) based blockchains.

# Differences with ERC-20

The suggested standard differs considerably from Ethereum ERC20 and other smart contract token standards with single registry due to its distributed nature related to these blockchains particularities. Given that these blockchains has a storage fee, using an existing ERC20 standard design would cause excessive maintenance costs. Also, ERC20 is somewhat incompatible with the sharding architecture. Therefore, a Distributed Token standard is preferable.

The ERC20 sharding implementation (with an idea to simply shard its registry) has drawbacks mainly related to complicated and expansive management. TIP-3 is fully distributed and implies separate storage of each user’s balance.

## What's Inside

In this onboarding, we will get acquainted with these blockchains smart contracts. We take the [TIP-3](https://github.com/broxus/tip3) token and look at two ways to interact with the TIP-3 Token.

We will use default Account and TypeScript. And in the second case, we will write our custom smart contract which can handle the  the TIP-3 Token deployment.


::: tip

TIP-3 standard describes basic principles of building smart token contracts.

- TIP-3 standard is that smart contracts for user wallets are only allowed to deploy the root smart contract from their address

- The TIP-3 standard also describes the basic ways of interaction of user smart contracts with each other and a mechanism for checking the type of a smart contract by its address on the blockchain.

- TIP-3 wallets share the same code as its stored in the relevant root contract but contain different user data. Therefore, we can calculate the TIP-3 wallet address, send initial data and funds to that address, and deploy the TIP-3 wallet contract to the calculated address.

- Smart contracts of custom wallets have the right to deploy only the root smart contract from their address.

:::

## Useful Links

- [Tokens and Assets (Venom Foundation)](https://docs.venom.foundation/learn/tokens-and-assets)

- [What is TIP? (Everscale)](https://docs.everscale.network/standard/workflow)

- [TIP-3 Implementation (Broxus)](https://github.com/broxus/tip3)