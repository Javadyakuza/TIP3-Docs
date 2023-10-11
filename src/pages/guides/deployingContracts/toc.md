
# Deploying Contracts

In this section, we will delve into the deployment process of the TIP3 standard contracts using an  Account  contract. We will cover the deployment of the following contracts:

- TokenRoot
- TokenWallet
- UpgradeableTokenRoot
- UpgradeableTokenWallet

Additionally, we will discuss deploying them through other smart contracts, specifically the [ `RootDeployer` ](/guides/prerequisites/rootDeployer.md) and [ `MultiWalletTip3` ](/guides/prerequisites/multiWalletTIP3.md) contracts.


::: danger

- It is crucial to exercise caution and carefully manage the numbers and amounts associated with the transactions in this section. Avoid simply copying and pasting the code without thorough review and understanding.

- Kindly be aware that you are signing a transaction on the mainnet (this is not a testnet).

:::

## Deployment Using an Account

<div class="sections-container">
  <div class="bridge-section-row">
    <a href="/guides/deployingContracts/usingAccount/tokenRoot.html">
      <span class="bridge-section">Deploying Token Root</span>
    </a>
    <a href="/guides/deployingContracts/usingAccount/tokenWallet.html">
      <span class="bridge-section">Deploying Token Wallet</span>
    </a>
  </div>
  <div class="bridge-section-row">
    <a href="/guides/deployingContracts/usingAccount/upgradeableContracts.html">
      <span class="bridge-section">Deploying Upgradeable</span>
    </a>
  </div>
</div>

## Deployment Using Smart Contract

<div class="sections-container">
  <div class="bridge-section-row">
    <a href="/guides/deployingContracts/usingSmartContract/tokenRoot.html">
      <span class="bridge-section">Deploy Token Root</span>
    </a>
    <a href="/guides/deployingContracts/usingSmartContract/tokenWallet.html">
      <span class="bridge-section">Deploy Token Wallet</span>
    </a>
  </div>

</div>

<style>
.bridge-section-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin : 10px;
  cursor: pointer;;

}

.sections-container a{
    flex : 1;
    text-decoration: none;
}
.bridge-section {
  background-color: var(--vp-c-bg-mute);
  transition: background-color 0.1s;
  width : 98%;
  display: flex;
  padding: 1rem 0 1rem 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  text-align: left;
  margin-bottom: 0.5rem;
}
</style>

