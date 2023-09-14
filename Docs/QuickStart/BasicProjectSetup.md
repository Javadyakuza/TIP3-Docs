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

![](< /image(12).png>)

We should get such a project structure:

![](< /image(7).png>)

## Step 3: Install TIP-3 Contracts and @broxus/contracts

Next, we'll install the `TIP-3` contracts and the `@broxus/contracts` package. `TIP-3` contracts represent token contracts for the TON network, and `@broxus/contracts`provides smart contract interfaces.

```` shell
npm i @broxus/contracts tip3 
````

And that's it! You've set up a project with TIP3 contracts and prepared it for multiwallet integration.

You can also watch the tutorial video for more guidance.https://www.youtube.com/watch?v=SLNEeDrnTB8

