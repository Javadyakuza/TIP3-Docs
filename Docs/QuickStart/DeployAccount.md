# Deploy Account

Let's write a simple script that will use locklift to deploy our Account.&#x20;

Take a TIP3 script from the repository as a basis, and rewrite it for a typescript and a newer version of Locklift

``` typescript
async function main() {

  // each mnemonic can generate more that just one key pair, so we specify which pair do we want.
  const keyNumber = "0";
  const balance = 300;
  
  /* We get a pair of private and public keys,
      which we get from the mnemonic from the config
    SimpleSigner {
      keyPair: {
        secretKey: 'bb2903d025a330681e78f3bcb248d7d89b861f3e8a480eb74438ec0299319f7a',
        publicKey: 'e85f61aaef0ea43afc14e08e6bd46c3b996974c495a881baccc58760f6349300'
      },
      publicKey: 'e85f61aaef0ea43afc14e08e6bd46c3b996974c495a881baccc58760f6349300'
    }
  */

  const signer = (await locklift.keystore.getSigner(keyNumber))!;
  
  /* Get a accountFactory from contract name. You can provide your own implementation of account 
      if needed, there is only one constraint - custom contract
    should include SendTransaction method */
  let accountsFactory = locklift.factory.getAccountsFactory("Account");
  
  /* Deploy new Account. 
    @params value: Initial balance in EVERs, received from giver.
  */
  const { account: Account } = await accountsFactory.deployNewAccount({
    publicKey: signer.publicKey,
    initParams: {
      _randomNonce: locklift.utils.getRandomNonce(), 
    },
    constructorParams: {},
    value: locklift.utils.toNano(10),
  });
  console.log(`Account deployed at: ${Account.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });

```

:::tip 
Giver - is a contract that has a `sendTransaction` method.\
The local-node already
has a pre-installed contract with the initial amount of EVERs. For other networks, you can configure your giver in `locklift.config.ts`
:::
:::tip 
If you need a permanent address for testing, then set the `_randomNonce` constant. By changing  `_randomNonce` you change the byte code of the contract, and the final address.
:::


Use this command and deploy account:

```shell-session
npx locklift run -s ./scripts/00-deploy-account.js -n local
```

![](< /image(13).png>)
