# Token Wallet

Token Wallet contracts offer primary functions to users, including fetching balances, transferring tokens, accepting transfers, and burning tokens, among others.

Token transfer operations can be performed in two ways:

-  `transfer`
-  `transferToWallet`

`transferToWallet` accepts the receiver token wallet address and transfers tokens to that directly.

Contrarily, the  `transfer`  function receives the receiver's account address and computes the corresponding token wallet address for the receiver. The process of deploying the token wallet takes place at this stage. If the calculated token wallet address does not correspond to an existing deployed contract, a token wallet will be deployed specifically for the receiver. It is important to note that the decision to deploy a token wallet for the receiver lies with the sender.

## Deploying Token Wallets by Token Wallets

In cases where a token wallet hasn't been deployed for a given user account address, the initiating token wallet has the option to deploy one for the recipient. However, this step isn't mandatory. If one chooses to proceed, the `deployWalletValue` parameter must be assigned a specific value to facilitate the deployment.

::: tip
Given that all token wallets share the same code, it's straightforward for the receiving token wallet to verify the sender token wallet's correctness.
:::