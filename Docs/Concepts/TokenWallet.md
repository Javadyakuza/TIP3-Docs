# Token Wallet 
 
Token Wallet contracts provide users with primary functions such as fetching balances, transferring tokens, and approving (acceptTransfer), among others. 
 
The token transfer operation is implemented through two approaches: 
 
-  `transfer`  
-  `transferToWallet`  
 
The  `transferToWallet`  function is straightforward. It accepts a TokenWallet address as a parameter and transfers tokens to that specific wallet. 
 
On the other hand, the  `transfer`  function transfers tokens to the user's TokenWallet by calculating its address based on the given [Account](./Accounts.md) address, TokenWallet's code and initial data. 
 
## Deploying Token Wallets by Token Wallets 
 
If no token wallet is deployed for the provided user Account address, the sender's token wallet has the option to deploy one for the recipient. However, this step is optional. If the sender chooses to deploy a token wallet for the recipient, the  `deployWalletValue`  parameter must be set to a specific amount.