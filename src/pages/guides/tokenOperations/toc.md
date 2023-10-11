# Token Operations

In this section, we will explore the various token operations represented by the TIP3 standard, which include:
- Minting
- Burning
- Transferring

We will cover these operations using an  `Account`  smart contract, as well as through other smart contracts such as the [RootDeployer](/guides/prerequisites/rootDeployer.md) and [MultiWalletTip3](/guides/prerequisites/multiWalletTIP3.md) contracts.

::: danger
- It is crucial to exercise caution and carefully manage the numbers and amounts associated with the transactions in this section. Avoid simply copying and pasting the code without thorough review and understanding.

- Kindly be aware that you are signing a transaction on the mainnet (this is not a testnet).
:::

## TIP3 Operations with Account

<div class="sections-container">
  <div class="bridge-section-row">
    <a href="/guides/tokenOperations/usingAccount/mint.html">
      <span class="bridge-section">Minting Tokens</span>
    </a>
    <a href="/guides/tokenOperations/usingAccount/transfer.html">
      <span class="bridge-section">Transferring Tokens</span>
    </a>
  </div>
    <div class="bridge-section-row">
    <a href="/guides/tokenOperations/usingAccount/burn.html">
      <span class="bridge-section">Burning Tokens</span>
    </a>
  </div>
</div>


## TIP3 Operations with Smart contract
<div class="sections-container">
  <div class="bridge-section-row">
    <a href="/guides/tokenOperations/usingSmartContract/mint.html">
      <span class="bridge-section">Minting Tokens</span>
    </a>
    <a href="/guides/tokenOperations/usingSmartContract/transfer.html">
      <span class="bridge-section">Transferring Tokens</span>
    </a>
  </div>
  <div class="bridge-section-row">
    <a href="/guides/tokenOperations/usingSmartContract/burn.html">
      <span class="bridge-section">Burning Tokens</span>
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
