# Setup of TIP-3 Contracts in a Project

This guide will walk you through the process of setting up a project with TIP3 contracts and integrating it with a multiwallet example.

## Prerequisites
First, make sure you have the nodeJs and npm installed on your machine.

And it will be very good if you are already familiar with the basics of [Everscale-solidity](https://github.com/ever-guild/ever-solidity).

## Step 1: Create a New Project Directory

First, let's create a new directory for our project. We'll call it "multiwallet", but you can name it anything you want.

```shell
mkdir multiwallet
cd multiwallet
```

## Step 2: Initialize a Locklift Project

Locklift is a tool that simplifies the development and management of smart contracts. We can initialize a locklift project in our new directory. This command will also install locklift if it's not already installed.

``` shell
npx locklift init
```
<ImgContainer src= '/image(12).png' width="100%" altText="locklift initialization output" />

We should get such a project structure:

<ImgContainer src= '/image(7).png' width="100%" altText="EverEVMNativeCoin" />

## Step 3: Install Packages

Next, we'll install the `TIP-3` contracts and the `@broxus/contracts` package. `TIP-3` contracts represent token contracts for the TON network, and `@broxus/contracts`provides smart contract interfaces.

```` shell
npm i @broxus/contracts tip3
````

And that's it! You've set up a project with TIP3 contracts and prepared it for multiwallet integration.

::: tip
You can also refer to below provided links for more guidance.

https://www.youtube.com/watch?v=SLNEeDrnTB8

https://docs.locklift.io/
:::

<script lang="ts" >
import { defineComponent, ref, onMounted } from "vue";
import ImgContainer from "../../.vitepress/theme/components/shared/BKDImgContainer.vue"

export default defineComponent({
  name: "Diagrams",
  components :{
    ImgContainer
  },
  setup() {
    return {
    };
  },
});

</script>