::: info
In this section we will utilize **custom** smart contracts to deploy TIP-3 standard smart contracts and interact with them.
:::

## Smart Contract specification  
<div class="sections-container">
  <div class="bridge-section-row">
    <a href="/Deployments/Contracts/RootDeployer.html">
      <span class="bridge-section">Root Deployer</span>
    </a>
    <a href="/Deployments/Contracts/MultiWalletTIP3.html">
      <span class="bridge-section">Multi Wallet TIP-3</span>
    </a>
  </div>
</div>

## Code Samples
<div class="sections-container">
  <div class="bridge-section-row">
    <a href="/Deployments/Internal/TokenRoot.html">
      <span class="bridge-section">Deploy Token Root</span>
    </a>
    <a href="/Deployments/Internal/TokenWallet.html">
      <span class="bridge-section">Deploy Token Wallet</span>
    </a>
  </div>
  <div class="bridge-section-row">
    <a href="/Deployments/Internal/Mint.html">
      <span class="bridge-section">Mint TIP-3 Tokens</span>
    </a>
    <a href="/Deployments/Internal/Transfer.html">
      <span class="bridge-section">Transfer TIP-3 Tokens</span>
    </a>
  </div>
    <div class="bridge-section-row">
    <a href="/Deployments/Internal/Burn.html">
      <span class="bridge-section">Burn TIP-3 Tokens</span>
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
