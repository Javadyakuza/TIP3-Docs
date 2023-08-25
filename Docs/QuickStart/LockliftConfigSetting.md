# Locklift config setting

## Add the External Contracts


We must specify for the compiler that we have some external contracts .
Add this line to locklift.config.ts/compiler

```typescript
externalContracts: {
      "node_modules/@broxus/tip3/build": ["TokenRoot", "TokenWallet"],
 },
```

## Locklift configuration 

:::tip
Ignore the incorrect factory import for now, as soon as we compile our first contract, this error will disappear
:::

![](< /image(8).png>)


### Local network entrypoint

We will use our sandbox, so let's delete the graphql in the path

```javascript
const LOCAL_NETWORK_ENDPOINT = "http://localhost/graphql"; 
// to
const LOCAL_NETWORK_ENDPOINT = "http://localhost/";
```

---

### Compiler and TVM Linker

Use it by setting the version of the compiler and the linker: 
![](< /image(11).png>)

More info at [here](https://docs.locklift.io/configuration.html#compiler) and [here](https://docs.locklift.io/configuration.html#linker).  

---

### Local network config

We will only work in the sandbox, the only thing we need to change is the mnemonic phrase. You can generate your own, or use the one commented out in the code

![](< /image(10).png>)

Let's make sure that we have everything set up correctly, and try to compile the sample contract

```powershell
npm i
npx locklift build 
```

As a result, a message about successful building should appear in the terminal, and your config will no longer be marked as erroneous

![](< /image(20).png>)

Then in the build folder you should have TIP-3 contracts: TokenRoot and TokenWallet

![](< /image(9).png>)
