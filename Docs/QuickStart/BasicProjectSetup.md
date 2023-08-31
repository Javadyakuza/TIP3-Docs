# Basic project setup

First, let's create a new folder and name it multiwallet, or whatever you want

```shell
mkdir multiwallet
cd multiwallet
```

Let's create a new npm project

``` shell
npm init
```

And install locally locklift. If you have locklift installed globally, skip this step

``` shell
npm install --save-dev locklift
```

Excellent! Now we can create a locklift project

``` shell
npx locklift init
```

![](< /image(12).png>)

We should get such a project structure:

![](< /image(7).png>)

then we need to install the **@broxus/contracts* and **tip3** packages:

```` shell
npm i @broxus/contracts tip3 
````





