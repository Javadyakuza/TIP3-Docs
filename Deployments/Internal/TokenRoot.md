# Deploy Token Root

In this section, we will learn a little more about the memory structure in ~~TON~~ Everscale Virtual Machine, and deploy our token through a smart contract.

::: tip 
TVM memory and persistent storage consist of cells. Recall that the TVM memory and persistent storage consist of (TVM) cells. Each cell contains up to 1023 bits of data and up to four references to other cells. Circular references are forbidden and cannot be created by means of TVM. In this way, all cells kept in TVM memory and persistent storage constitute a directed acyclic graph (DAG).
:::
::: tip 
`tvm.buildStateInit` - Generates a `StateInit` from `code` and `data` `TvmCell`s. Member `splitDepth` of the tree of cell `StateInit`:

1. is not set. Has no value.
2. is set. `0 <= splitDepth <= 31`
3. Arguments can also be set with names. List of possible names:
4. `code` (`TvmCell`) - defines the code field of the `StateInit`. Must be specified.
5. `data` (`TvmCell`) - defines the data field of the `StateInit`. Conflicts with `pubkey` and `varInit`. Can be omitted, in this case data field would be build from `pubkey` and `varInit`.
6. `splitDepth` (`uint8`) - splitting depth. `0 <= splitDepth <= 31`. Can be omitted. By default, it has no value.
7. `pubkey` (`uint256`) - defines the public key of the new contract. Conflicts with `data`. Can be omitted, default value is 0.
8. `varInit` (`initializer list`) - used to set [static](https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#keyword-static) variables of the contract. Conflicts with `data` and requires `contr` to be set. Can be omitted.
9. `contr` (`contract`) - defines the contract whose `StateInit` is being built. Mandatory to be set if the option `varInit` is specified.
:::
```solidity
pragma ton-solidity >= 0.59.0;

import "@broxus/contracts/contracts/libraries/MsgFlag.sol";

import "@broxus/tip3/contracts/TokenRoot.sol";

contract rootDeployer {

    uint32 static randomNonce_;

    address owner_;

    TvmCell rootCode_;
    TvmCell walletCode_;

    constructor(
    ) public {
        tvm.accept();
    }

    function deployTokenRoot(
        string name,
        string symbol,
        uint8 decimals,
        address initialSupplyTo,
        uint128 initialSupply,
        uint128 deployWalletValue,
        bool mintDisabled,
        bool burnByRootDisabled,
        bool burnPaused,
        address remainingGasTo
    ) public {
        tvm.accept();

        TvmCell initData = tvm.buildStateInit({
            contr: TokenRoot,
            varInit: {
                randomNonce_: now,
                deployer_: address(this),
                rootOwner_: msg.sender,
                name_: name,
                symbol_: symbol,
                decimals_: decimals,
                walletCode_: walletCode_
            },
            pubkey: 0,
            code: rootCode_
        });

        address tokenRoot = new TokenRoot {
            stateInit: initData,
            value: 2 ever,
            flag: MsgFlag.SENDER_PAYS_FEES
        }(
            initialSupplyTo,
            initialSupply,
            deployWalletValue,
            mintDisabled,
            burnByRootDisabled,
            burnPaused,
            remainingGasTo
        );
    }

}
```
