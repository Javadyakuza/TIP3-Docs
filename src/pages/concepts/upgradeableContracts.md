# Upgradeable Contracts

## What are the upgradeable Contracts ?

In the EVM (Ethereum Virtual Machine), to enable upgradeability for a specific A1, you must deploy at least one additional A2 for that A1. Each upgrade will necessitate the deployment of a new account. This widely accepted approach is known as the _Upgradeable Proxy Pattern_.

In the TVM (Ton Virtual Machine), there is an instruction called  `SETCODE`  that allows an account to upgrade itself using a code obtained from an inbound message or its own storage. The account's address remains unchanged, and the upgrade does not require any additional deployments.

::: tip
For a better understanding of this instruction, you can also refer to the TVM API documentation at the following link:
https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md#tvmsetcode
:::

## TIP-3 upgradeable Contracts

In the case of the TIP-3 standard, there are three main contracts related to upgradeable contracts:

- [TokenRootupgradeable](https://github.com/broxus/tip3/blob/master/contracts/TokenRootUpgradeable.tsol)
- [TokenWalletupgradeable](https://github.com/broxus/tip3/blob/master/contracts/TokenWalletUpgradeable.tsol)
- [TokenWalletPlatform](https://github.com/broxus/tip3/blob/master/contracts/TokenWalletPlatform.tsol)

We will now explain how these smart contracts function and their purpose. However, before diving into that, let's first examine the implementation of the  `Platform`  mentioned earlier.

## Token Wallet Platform

In simpler terms, the base implementation of the Platform (represented by the  `TokenWalletPlatform`  contract in the TIP-3 standard) initializes the  `TokenWalletUpgradeable` contract.

## Why Do We Need the Platform Contract?

Why do we need a platform contract when we can simply deploy a token wallet directly?

The platform contract features immutable and unmodifiable code, providing a stable foundation for deploying token wallets. This ensures that wallets can always recognize each other. Conversely, when token wallets are upgraded, the expected address is derived from the same code. This provides stability to the token wallet addresses, allowing them to consistently recognize each other.

#### workflow

In the following section, we will provide an explanation of how the  `TokenWalletUpgradeable`  contract is initiated by the  `TokenWalletPlatform`  contract.
Let's begin by examining the base implementation of the Platform:

<details>
<summary> show code</summary>

```` solidity
pragma ever-solidity >= 0.57.0;

import "./libraries/TokenMsgFlag.tsol";

/**
 * @dev Theis contract provides an immutable foundation for a wallet
 * token contract that can be updated.
 * It ensures that all wallet addresses are considered to be derived
 * from the same code, regardless of the version of the wallet.
 *
 * We uses the `tvm.buildStateInit` function to create a `StateInit` data cell
 * containing the {TokenWalletPlatform} code and static data. Then
 * use the `tvm.hash` function to compute the hash of the `StateInit` data and
 * convert it to an address.
 */
contract TokenWalletPlatform {
    address static root;
    address static owner;

    /**
     * @dev Contstructor for TokenWalletPlatform.
     * @param walletCode Code of the upgradeable token wallet.
     * @param walletVersion Version of the upgradeable token wallet.
     * @param sender Address of the sender.
     * @param remainingGasTo Address to send remaining gas to.
     *
     * Precondition:
     *   - Caller must be root or sender must be a wallet.
     *
     * Postcondition:
     *  - Deployed upgradeable token wallet or remaining gas is sent
     *    to remainingGasTo.
     */
    constructor(TvmCell walletCode, uint32 walletVersion, address sender, address remainingGasTo)
        public
        functionID(0x15A038FB)
    {
        if (msg.sender == root || (sender.value != 0 && _getExpectedAddress(sender) == msg.sender)) {
           initialize(walletCode, walletVersion, remainingGasTo);
        } else {
            remainingGasTo.transfer({
                value: 0,
                flag: TokenMsgFlag.ALL_NOT_RESERVED + TokenMsgFlag.DESTROY_IF_ZERO,
                bounce: false
            });
        }
    }

    /**
     * @dev Derive wallet address from owner.
     *
     * The function uses the `tvm.hash`, that computes the representation
     * hash of of the wallet `StateInit` data and returns it as a 256-bit unsigned
     * integer, then converted to an address.
     *
     * For string and bytes it computes hash of the tree of cells that contains
     * data but not data itself.
     *
     * This allows the contract to determine the expected address of a wallet
     * based on its owner's address.  See sha256 to count hash of data.
     *
     * @param owner_ Token wallet owner address
     * @return Token wallet address
     */
    function _getExpectedAddress(address owner_) private view returns (address) {
        TvmCell stateInit = tvm.buildStateInit({
            contr: TokenWalletPlatform,
            varInit: {
                root: root,
                owner: owner_
            },
            pubkey: 0,
            code: tvm.code()
        });

        return address(tvm.hash(stateInit));
    }

    /**
     * @dev Initialize the upgradeable token wallet.
     *
     * The initialize function uses the `TvmBuilder` object to building `TvmCell`
     * to store the `root`, `owner`, and `remainingGasTo` addresses, as well
     * as the `walletVersion `and the contract's code.
     * It then sets the contract's code to the provided `walletCode` and calls
     * the {onCodeUpgrade} function with the TvmCell data.
     *
     * The purpose of the initialize function is to set the necessary state and
     * code for the wallet contract. It also triggers the {onCodeUpgrade} function,
     * which can be overridden by derived contracts to handle code upgrades.
     *
     * @param walletCode Code of the upgradeable token wallet.
     * @param walletVersion Version of the upgradeable token wallet.
     * @param remainingGasTo Address to send remaining gas to.
     *
     */
    function initialize(TvmCell walletCode, uint32 walletVersion, address remainingGasTo) private {
        TvmBuilder builder;

        builder.store(root);
        builder.store(owner);
        builder.store(uint128(0));
        builder.store(uint32(0));
        builder.store(walletVersion);
        builder.store(remainingGasTo);

        builder.store(tvm.code());

        tvm.setcode(walletCode);
        tvm.setCurrentCode(walletCode);

        onCodeUpgrade(builder.toCell());
    }

    function onCodeUpgrade(TvmCell data) private {}
}

````
</details>

As you have observed, the platform contract accepts the  `code` ,  `walletVersion` , static variable values ( `params` ) and the remainingGasTo as inputs in its constructor. It then calls the initialize function, which changes the code of the deployed platform contract to the  `TokenWalletUpgradeable`  contract code.

Once the  `TokenWalletUpgradeable`  contract has been initialized, it becomes available for interaction as a standard token wallet contract. However, it also offers additional features related to upgradeability, which are explained below.

::: tip
Pleas Note that the `TokenWalletPlatform` contract is only deployable via the the `TokenRootupgradeable` or `TokenWalletUpgradeable` contract.
Contrary, the normal token wallet can be deployed by contracts except than the `TokenRoot` or `TokenWallet` contracts.
:::

## How Does Contract Upgrading Work?
### Upgrading the TokenRootUpgradeable Contract
The  `upgrade`  function within the token root contract allows for the upgrading of the contract itself by utilizing the `SETCODE` TVM instruction.
### TokenWalletUpgradeable
The upgrade process for the  `TokenWalletUpgradeable`  contract occurs when there are changes made to the wallet code within the token root contract, utilizing the  `setWalletCode`  method.
Once this update has taken place, it becomes possible to request an upgrade for the token wallet code to the most recent version available in the token root contract, utilizing the  `upgrade`  method on the `TokenWalletUpgradeable`.

## Token Wallet upgradeable

before any further explanations lets take a look at the `TokenWalletUpgradeable` code:

<details>
<summary> show code</summary>

```` solidity
pragma ever-solidity >= 0.57.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./abstract/TokenWalletBurnableByRootBase.tsol";
import "./abstract/TokenWalletBurnableBase.tsol";
import "./abstract/TokenWalletDestroyableBase.tsol";

import "./interfaces/ITokenWalletUpgradeable.tsol";
import "./interfaces/ITokenRootUpgradeable.tsol";
import "./interfaces/IVersioned.tsol";
import "./libraries/TokenErrors.tsol";
import "./libraries/TokenGas.tsol";
import "./libraries/TokenMsgFlag.tsol";
import "./TokenWalletPlatform.tsol";

/**
 * @title Fungible token wallet upgradeable contract.
 *
 * @dev This is an implementation of TokenWallet upgradeable that implements all the
 * required methods of the TIP-3 standard.
 * As well as optional ones: burn and collections.
 *
 * Each token holder has its own instance of token wallet contract.
 * Transfer happens in a decentralized fashion - sender token wallet SHOULD
 * send the specific message to the receiver token wallet. Since token wallets
 * have the same code, it's easy for receiver token wallet to check the correctness
 * of sender token wallet.
*/
contract TokenWalletUpgradeable is
    TokenWalletBurnableBase,
    TokenWalletDestroyableBase,
    TokenWalletBurnableByRootBase,
    ITokenWalletUpgradeable
{

    uint32 version_;
    TvmCell platformCode_;

    /**
     * @dev The constructor has been reverted because it was called in
     * the TokenWalletPlatform. The `revert()` function is used to prevent
     * the contract from executing any further.
     */
    constructor() public {
        revert();
    }

    /**
     * @dev See {SID-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceID) override external view responsible returns (bool) {
        return { value: 0, flag: TokenMsgFlag.REMAINING_GAS, bounce: false } (
            interfaceID == bytes4(0x3204ec29) ||    // SID
            interfaceID == bytes4(0x4f479fa3) ||    // TIP3TokenWallet
            interfaceID == bytes4(0x2a4ac43e) ||    // ITokenWallet
            interfaceID == bytes4(0x562548ad) ||    // IBurnableTokenWallet
            interfaceID == bytes4(0x0c2ff20d) ||    // IBurnableByRootTokenWallet
            interfaceID == bytes4(0x7edc1d37) ||    // ITokenWalletUpgradeable
            interfaceID == bytes4(0x0f0258aa)       // IDestroyable
        );
    }

    /**
     * @dev See {ITokenWalletUpgradeable-platformCode}.
     */
    function platformCode() override external view responsible returns (TvmCell) {
        return { value: 0, flag: TokenMsgFlag.REMAINING_GAS, bounce: false } platformCode_;
    }

    /**
     * @dev This function is used if the deployment transaction fails, then the unused Evers will be returned to the `remainingGasTo`.
     */
    function onDeployRetry(TvmCell, uint32, address sender, address remainingGasTo)
        external
        view
        functionID(0x15A038FB)
    {
        require(msg.sender == root_ || address(tvm.hash(_buildWalletInitData(sender))) == msg.sender);

        tvm.rawReserve(_reserve(), 0);

        if (remainingGasTo.value != 0 && remainingGasTo != address(this)) {
            remainingGasTo.transfer({
                value: 0,
                flag: TokenMsgFlag.ALL_NOT_RESERVED + TokenMsgFlag.IGNORE_ERRORS,
                bounce: false
            });
        }
    }
    /**
     * @dev Returns the version of the Wallet.
     */
    function version() override external view responsible returns (uint32) {
        return { value: 0, flag: TokenMsgFlag.REMAINING_GAS, bounce: false } version_;
    }

    /**
     * @dev See {ITokenWalletUpgradeable-upgrade}.
     *
     * Sends a request to the {TokenRootUpgradeable} to upgrade the Wallet code to
     * the latest version.
     */
    function upgrade(address remainingGasTo) override external onlyOwner {
        ITokenRootUpgradeable(root_).requestUpgradeWallet{ value: 0, flag: TokenMsgFlag.REMAINING_GAS, bounce: false }(
            version_,
            owner_,
            remainingGasTo
        );
    }

    /**
     * @dev See {ITokenWalletUpgradeable-acceptUpgrade}.
     */
    function acceptUpgrade(TvmCell newCode, uint32 newVersion, address remainingGasTo) override external onlyRoot {
        if (version_ == newVersion) {
            tvm.rawReserve(_reserve(), 0);
            remainingGasTo.transfer({
                value: 0,
                flag: TokenMsgFlag.ALL_NOT_RESERVED + TokenMsgFlag.IGNORE_ERRORS,
                bounce: false
            });
        } else {
            TvmBuilder builder;

            builder.store(root_);
            builder.store(owner_);
            builder.store(balance_);
            builder.store(version_);
            builder.store(newVersion);
            builder.store(remainingGasTo);

            builder.store(platformCode_);

            tvm.setcode(newCode);
            tvm.setCurrentCode(newCode);
            onCodeUpgrade(builder.toCell());
        }
    }
    /**
     * @dev This function rewrites the wallet storage after the code upgrade.
     * @param data - TvmСell with the new wallet storage.
     */
    function onCodeUpgrade(TvmCell data) private {
        tvm.rawReserve(_reserve(), 2);
        tvm.resetStorage();

        uint32 oldVersion;
        address remainingGasTo;

        TvmSlice s = data.toSlice();
        (root_, owner_, balance_, oldVersion, version_, remainingGasTo) = s.decode(
            address,
            address,
            uint128,
            uint32,
            uint32,
            address
        );

        platformCode_ = s.loadRef();

        if (remainingGasTo.value != 0 && remainingGasTo != address(this)) {
            remainingGasTo.transfer({
                value: 0,
                flag: TokenMsgFlag.ALL_NOT_RESERVED + TokenMsgFlag.IGNORE_ERRORS,
                bounce: false
            });
        }
    }
    /**
     * @dev Returns the `TokenGas.TARGET_WALLET_BALANCE` EVER of gas reserved for the current operation.
     */
    function _targetBalance() override internal pure returns (uint128) {
        return TokenGas.TARGET_WALLET_BALANCE;
    }

    /**
     * @dev Implementation of the {TokenRootBase-_buildWalletInitData}.
     *
     * This function builds the init data for the upgradeable wallet.
     * @dev Used in transfer and mint function, for deploy new wallet, when the recipient is not a deployed wallet.
     * @dev It is also used in AcceptTransfer to ensure that the transfer is from a valid wallet.
     * @param walletOwner - owner of the wallet.
     * @return init data cell for the wallet.
     */
    function _buildWalletInitData(address walletOwner) override internal view returns (TvmCell) {
        return tvm.buildStateInit({
            contr: TokenWalletPlatform,
            varInit: {
                root: root_,
                owner: walletOwner
            },
            pubkey: 0,
            code: platformCode_
        });
    }

    /**
     * @dev Deploy new upgradeable TokenWallet.
     */
    function _deployWallet(TvmCell initData, uint128 deployWalletValue, address remainingGasTo)
        override
        internal
        view
        returns (address)
    {
        address wallet = new TokenWalletPlatform {
            stateInit: initData,
            value: deployWalletValue,
            wid: address(this).wid,
            flag: TokenMsgFlag.SENDER_PAYS_FEES
        }(tvm.code(), version_, owner_, remainingGasTo);
        return wallet;
    }
}

````

</details>

Now, let's delve into the additional functions and variables of the  `TokenWalletUpgradeable`  contract, which are as follows:

-  `upgrade`
-  `acceptUpgrade`
-  `onCodeUpgrade`
-  `platformCode`
-  `version`

---

####  upgrade  and  acceptUpgrade
The  `upgrade`  function calls the `requestUpgradeWallet` on the token root contract. Once the root contract confirms that the `msg.sender` is the valid sender, the  `acceptUpgrade`  function is called on `TokenWalletupgradeable` contract accordingly and the latest wallet code will be passed to it as the input.

The  `acceptUpgrade`  function then sets the new code of the contract using the same approach as the  `TokenWalletPlatform`  and invokes the  `onCodeUpgrade`  function.

---

####  onCodeUpgrade
At this stage, the contract code has been updated and it is time to update the state of the contract. The  `onCodeUpgrade`  function takes care of this task.

Within the  `onCodeUpgrade`  function, the old storage and state of the contract are terminated using  `tvm.resetStorage`  to set the value of the old variables to their default values.

Next, the passed input, which is a converted encoded builder to a cell, is converted to a  `TVMSlice`  type variable using the  `TVMCell.toSlice`  method. The stored encoded data in the  `TVMSlice`  is then decoded using the  `TVMSlice.decode`  method, and the decoded data is stored in the variables with their respective data types.

This process ensures that if a new state variable is added to the contract code, it will be initialized with an desired value. It is important to note that this desired value is decoded and passed as input to the  `onCodeUpgrade`  function. However, in the case of the  `tokenWalletupgradeable`  and  `TokenWalletPlatform`  contracts, which are immutable, this scenario is not encountered.

---

####  platformCode
This variable stores the cell type that holds the code of the old  `TokenRootPlatform`  contract. The platform contract stores a cell, which is the contract code obtained using  `tvm.code`  right before setting the new code of the contract. Therefore, the stored code represents the platform contract code, not the token wallet upgradeable code.

---

####  version
This variable represents the version of the current token wallet code.

---



## Token Root upgradeable

The  `TokenRootupgradeable`  contract provides the same functionality as the standard token root contract in terms of fungibility. However, it also incorporates additional features related to the upgradeability of both the TokenWallet and itself ( `TokenRootupgradeable` ). We will delve into these features shortly, but first, let's examine its contract code.

<details>
<summary> show code</summary>

```` solidity
pragma ever-solidity >= 0.57.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./abstract/TokenRootTransferableOwnershipBase.tsol";
import "./abstract/TokenRootBurnPausableBase.tsol";
import "./abstract/TokenRootBurnableByRootBase.tsol";
import "./abstract/TokenRootDisableableMintBase.tsol";

import "./interfaces/ITokenRootUpgradeable.tsol";
import "./interfaces/ITokenWalletUpgradeable.tsol";
import "./interfaces/IVersioned.tsol";
import "./libraries/TokenErrors.tsol";
import "./libraries/TokenMsgFlag.tsol";
import "./libraries/TokenGas.tsol";
import "./TokenWalletPlatform.tsol";


/**
 * @title Fungible token root upgradeable contract.
 *
 * @dev This is an implementation of upgradeable token root that implements
 * all the required methods of the TIP-3 standard.
 */
contract TokenRootUpgradeable is
    TokenRootTransferableOwnershipBase,
    TokenRootBurnPausableBase,
    TokenRootBurnableByRootBase,
    TokenRootDisableableMintBase,
    ITokenRootUpgradeable
{

    uint256 static randomNonce_;
    address static deployer_;

    TvmCell static platformCode_;
    uint32 walletVersion_;


    /**
     * @dev Sets the values for `mintDisabled_`, `burnByRootDisabled_`,`burnPaused_`,
     * and increases the `totalSupply_` if `initialSupply` is not zero.
     *
     * Parameters such as `symbol`, `decimals`, `name`, `rootOwner_` `randomNonce_`
     * `deployer_`, and `platformCode_` are set during contract deployment,
     * and passed as `StateInit` params.
     *
     * Also, the listed parameters, with the exception of `totalSupply_` and
     * `burnPaused_`, are immutable:
     * they can only be set once during construction.
     *
     * @param initialSupplyTo The address for which the initial suplay will be minted.
     * @param initialSupply The Initial amount to be minted.
     * @param deployWalletValue The initial value in EVER of the deploy wallet.
     * @param mintDisabled True If need to disable minting tokens.
     * @param burnByRootDisabled True If need to disabled burning by TokenRoot.
     * @param burnPaused True If need to paused burn.
     * @param remainingGasTo The address of the recipient of the remaining gas
     *        after deploy contract.
     *
     * Preconditions:
     *
     * - The owner of {TokenRoot} can be an external or internal:
     *
     * - If the owner of {TokenRoot} is external, then the message being expanded
     *   must be signed with the same key passed to `StateInit`.
     *
     * - If the owner of {TokenRoot} is internal, then the sender of the message
     *   must be a `deployer_` and the `deployer_` must be an existed address.
     *   Or the `deployer_` can be 0, but in this case the `msg.sender`
     *   must be a equal `rootOwner_` passed to `StateInit`.
    */
    constructor(
        address initialSupplyTo,
        uint128 initialSupply,
        uint128 deployWalletValue,
        bool mintDisabled,
        bool burnByRootDisabled,
        bool burnPaused,
        address remainingGasTo
    )
        public
    {
        if (msg.pubkey() != 0) {
            require(msg.pubkey() == tvm.pubkey() && deployer_.value == 0, TokenErrors.WRONG_ROOT_OWNER);
            tvm.accept();
        } else {
            require(deployer_.value != 0 && msg.sender == deployer_ ||
                    deployer_.value == 0 && msg.sender == rootOwner_, TokenErrors.WRONG_ROOT_OWNER);
        }

        totalSupply_ = 0;
        mintDisabled_ = mintDisabled;
        burnByRootDisabled_ = burnByRootDisabled;
        burnPaused_ = burnPaused;
        walletVersion_ = 1;

        tvm.rawReserve(_targetBalance(), 0);

        if (initialSupplyTo.value != 0 && initialSupply != 0) {
            TvmCell empty;
            _mint(initialSupply, initialSupplyTo, deployWalletValue, remainingGasTo, false, empty);
        } else if (remainingGasTo.value != 0) {
            remainingGasTo.transfer({
                value: 0,
                flag: TokenMsgFlag.ALL_NOT_RESERVED + TokenMsgFlag.IGNORE_ERRORS,
                bounce: false
            });
        }
    }

    /**
     * @dev Implementation of the {SID} interface.
     */
    function supportsInterface(bytes4 interfaceID) override external view responsible returns (bool) {
        return { value: 0, flag: TokenMsgFlag.REMAINING_GAS, bounce: false } (
            interfaceID == bytes4(0x3204ec29) ||    // SID
            interfaceID == bytes4(0x4371d8ed) ||    // TIP3TokenRoot
            interfaceID == bytes4(0x0b1fd263) ||    // ITokenRoot
            interfaceID == bytes4(0x18f7cce4) ||    // IBurnableByRootTokenRoot
            interfaceID == bytes4(0x0095b2fa) ||    // IDisableableMintTokenRoot
            interfaceID == bytes4(0x45c92654) ||    // IBurnPausableTokenRoot
            interfaceID == bytes4(0x376ddffc) ||    // IBurnPausableTokenRoot
            interfaceID == bytes4(0x1df385c6)       // ITransferableOwnership
        );
    }

    /**
     * @dev See {ITokenRootUpgradeable-walletVersion}.
     */
    function walletVersion() override external view responsible returns (uint32) {
        return { value: 0, flag: TokenMsgFlag.REMAINING_GAS, bounce: false } walletVersion_;
    }

    /**
     * @dev See {ITokenRootUpgradeable-platformCode}.
     */
    function platformCode() override external view responsible returns (TvmCell) {
        return { value: 0, flag: TokenMsgFlag.REMAINING_GAS, bounce: false } platformCode_;
    }

    /**
     * @dev See {ITokenRootUpgradeable-requestUpgradeWallet}.
     *
     * Preconditions:
     *  - Sender is a valid wallet.
     *  - `currentVersion` must be not equal to `walletVersion_`.
     *
     * Postcondition:
     *   - If `currentVersion` is not equal to `walletVersion_`, then
     *    the wallet will be upgraded to the new version. Otherwise,
     *    the remaining gas will be transferred to `remainingGasTo`.
     */
    function requestUpgradeWallet(
        uint32 currentVersion,
        address walletOwner,
        address remainingGasTo
    )
        override
        external
    {
        require(msg.sender == _getExpectedWalletAddress(walletOwner), TokenErrors.SENDER_IS_NOT_VALID_WALLET);

        tvm.rawReserve(_reserve(), 0);

        if (currentVersion == walletVersion_) {
            remainingGasTo.transfer({ value: 0, flag: TokenMsgFlag.ALL_NOT_RESERVED });
        } else {
            ITokenWalletUpgradeable(msg.sender).acceptUpgrade{
                value: 0,
                flag: TokenMsgFlag.ALL_NOT_RESERVED,
                bounce: false
            }(
                walletCode_,
                walletVersion_,
                remainingGasTo
            );
        }
    }

    /**
     * @dev See {ITokenRootUpgradeable-setWalletCode}.
     *
     * Preconditions:
     *  - Sender must be the owner of the TokenRoot.
     *
     * Postcondition:
     *  - `walletCode_` is set to `code`.
     *  - `walletVersion_` is incremented.
     */
    function setWalletCode(TvmCell code) override external onlyRootOwner {
        tvm.rawReserve(_targetBalance(), 0);
        walletCode_ = code;
        walletVersion_++;
    }

    /**
     * @dev See {ITokenRootUpgradeable-upgrade}.
     *
     * Precondition:
     *  - Sender must be the owner of the TokenRoot.
     */
    function upgrade(TvmCell code) override external virtual onlyRootOwner {
        TvmBuilder builder;

        builder.store(rootOwner_);
        builder.store(totalSupply_);
        builder.store(decimals_);

        TvmBuilder codes;
        codes.store(walletVersion_);
        codes.store(platformCode_);
        codes.store(walletCode_);

        TvmBuilder naming;
        codes.store(name_);
        codes.store(symbol_);

        TvmBuilder params;
        params.store(mintDisabled_);
        params.store(burnByRootDisabled_);
        params.store(burnPaused_);

        builder.storeRef(naming);
        builder.storeRef(codes);
        builder.storeRef(params);

        tvm.setcode(code);
        tvm.setCurrentCode(code);
        onCodeUpgrade(builder.toCell());
    }

    /**
     * @dev See {ITokenRootUpgradeable-onCodeUpgrade}.
     */
    function onCodeUpgrade(TvmCell data) private { }

    /**
     * @dev Returns the target balance.
     */
    function _targetBalance() override internal pure returns (uint128) {
        return TokenGas.TARGET_ROOT_BALANCE;
    }

    /**
     * @dev Returns the wallet init data for deploy new wallet.
     * @param walletOwner - wallet owner.
     * @return wallet init data cell.
     */
    function _buildWalletInitData(address walletOwner) override internal view returns (TvmCell) {
        return tvm.buildStateInit({
            contr: TokenWalletPlatform,
            varInit: {
                root: address(this),
                owner: walletOwner
            },
            pubkey: 0,
            code: platformCode_
        });
    }

    /**
     * @dev implemetation logic `deployWallet` function.
     * @param initData - wallet init data.
     * @param deployWalletValue - value for deploy wallet.
     * @param remainingGasTo - recipient of remaining gas.
     * @return deployed wallet address.
     *
     * Postcondition:
     *  - Deploy new token wallet.
     */
    function _deployWallet(TvmCell initData, uint128 deployWalletValue, address remainingGasTo)
        override
        internal
        view
        returns (address)
    {
       address tokenWallet = new TokenWalletPlatform {
            stateInit: initData,
            value: deployWalletValue,
            wid: address(this).wid,
            flag: TokenMsgFlag.SENDER_PAYS_FEES
       }(walletCode_, walletVersion_, address(0), remainingGasTo);

       return tokenWallet;
    }

}


````

</details>

In contrast to the standard TokenRoot, the upgradeable version deploys the  `TokenWalletPlatform`  contract, which we previously explained its workflow.


::: tip
Please navigate to the [Deploy upgradeable Contracts](../guides/deployingContracts/usingAccount/upgradeableContracts.md) section for detailed instructions on the deployment process of the previously mentioned contracts and how to interact with them.
:::

<style>

details {
  background-color: var(--vp-c-bg-mute);
  transition: background-color 0.1s;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-weight: 600;
  cursor : pointer;
  padding-left : 10px;
}
</style>
