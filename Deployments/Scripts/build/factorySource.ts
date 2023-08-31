const tokenRootAbi = {
  ABIversion: 2,
  version: '2.2',
  header: ['pubkey', 'time', 'expire'],
  functions: [
    {
      name: 'constructor',
      inputs: [
        { name: 'initialSupplyTo', type: 'address' },
        { name: 'initialSupply', type: 'uint128' },
        { name: 'deployWalletValue', type: 'uint128' },
        { name: 'mintDisabled', type: 'bool' },
        { name: 'burnByRootDisabled', type: 'bool' },
        { name: 'burnPaused', type: 'bool' },
        { name: 'remainingGasTo', type: 'address' },
      ],
      outputs: [],
    },
    {
      name: 'supportsInterface',
      inputs: [
        { name: 'answerId', type: 'uint32' },
        { name: 'interfaceID', type: 'uint32' },
      ],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    {
      name: 'disableMint',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    {
      name: 'mintDisabled',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    {
      name: 'burnTokens',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'walletOwner', type: 'address' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'callbackTo', type: 'address' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    {
      name: 'disableBurnByRoot',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    {
      name: 'burnByRootDisabled',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    {
      name: 'burnPaused',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    {
      name: 'setBurnPaused',
      inputs: [
        { name: 'answerId', type: 'uint32' },
        { name: 'paused', type: 'bool' },
      ],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    {
      name: 'transferOwnership',
      inputs: [
        { name: 'newOwner', type: 'address' },
        { name: 'remainingGasTo', type: 'address' },
        {
          components: [
            { name: 'value', type: 'uint128' },
            { name: 'payload', type: 'cell' },
          ],
          name: 'callbacks',
          type: 'map(address,tuple)',
        },
      ],
      outputs: [],
    },
    {
      name: 'name',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'string' }],
    },
    {
      name: 'symbol',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'string' }],
    },
    {
      name: 'decimals',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'uint8' }],
    },
    {
      name: 'totalSupply',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'uint128' }],
    },
    {
      name: 'walletCode',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'cell' }],
    },
    {
      name: 'rootOwner',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'address' }],
    },
    {
      name: 'walletOf',
      inputs: [
        { name: 'answerId', type: 'uint32' },
        { name: 'walletOwner', type: 'address' },
      ],
      outputs: [{ name: 'value0', type: 'address' }],
    },
    {
      name: 'deployWallet',
      inputs: [
        { name: 'answerId', type: 'uint32' },
        { name: 'walletOwner', type: 'address' },
        { name: 'deployWalletValue', type: 'uint128' },
      ],
      outputs: [{ name: 'tokenWallet', type: 'address' }],
    },
    {
      name: 'mint',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'recipient', type: 'address' },
        { name: 'deployWalletValue', type: 'uint128' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'notify', type: 'bool' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    {
      name: 'acceptBurn',
      id: '0x192B51B1',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'walletOwner', type: 'address' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'callbackTo', type: 'address' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    { name: 'sendSurplusGas', inputs: [{ name: 'to', type: 'address' }], outputs: [] },
  ],
  data: [
    { key: 1, name: 'name_', type: 'string' },
    { key: 2, name: 'symbol_', type: 'string' },
    { key: 3, name: 'decimals_', type: 'uint8' },
    { key: 4, name: 'rootOwner_', type: 'address' },
    { key: 5, name: 'walletCode_', type: 'cell' },
    { key: 6, name: 'randomNonce_', type: 'uint256' },
    { key: 7, name: 'deployer_', type: 'address' },
  ],
  events: [],
  fields: [
    { name: '_pubkey', type: 'uint256' },
    { name: '_timestamp', type: 'uint64' },
    { name: '_constructorFlag', type: 'bool' },
    { name: 'name_', type: 'string' },
    { name: 'symbol_', type: 'string' },
    { name: 'decimals_', type: 'uint8' },
    { name: 'rootOwner_', type: 'address' },
    { name: 'walletCode_', type: 'cell' },
    { name: 'totalSupply_', type: 'uint128' },
    { name: 'burnPaused_', type: 'bool' },
    { name: 'burnByRootDisabled_', type: 'bool' },
    { name: 'mintDisabled_', type: 'bool' },
    { name: 'randomNonce_', type: 'uint256' },
    { name: 'deployer_', type: 'address' },
  ],
} as const;
const tokenWalletAbi = {
  ABIversion: 2,
  version: '2.2',
  header: ['pubkey', 'time', 'expire'],
  functions: [
    { name: 'constructor', inputs: [], outputs: [] },
    {
      name: 'supportsInterface',
      inputs: [
        { name: 'answerId', type: 'uint32' },
        { name: 'interfaceID', type: 'uint32' },
      ],
      outputs: [{ name: 'value0', type: 'bool' }],
    },
    { name: 'destroy', inputs: [{ name: 'remainingGasTo', type: 'address' }], outputs: [] },
    {
      name: 'burnByRoot',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'callbackTo', type: 'address' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    {
      name: 'burn',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'callbackTo', type: 'address' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    {
      name: 'balance',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'uint128' }],
    },
    {
      name: 'owner',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'address' }],
    },
    {
      name: 'root',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'address' }],
    },
    {
      name: 'walletCode',
      inputs: [{ name: 'answerId', type: 'uint32' }],
      outputs: [{ name: 'value0', type: 'cell' }],
    },
    {
      name: 'transfer',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'recipient', type: 'address' },
        { name: 'deployWalletValue', type: 'uint128' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'notify', type: 'bool' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    {
      name: 'transferToWallet',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'recipientTokenWallet', type: 'address' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'notify', type: 'bool' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    {
      name: 'acceptTransfer',
      id: '0x67A0B95F',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'sender', type: 'address' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'notify', type: 'bool' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    {
      name: 'acceptMint',
      id: '0x4384F298',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'notify', type: 'bool' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    { name: 'sendSurplusGas', inputs: [{ name: 'to', type: 'address' }], outputs: [] },
  ],
  data: [
    { key: 1, name: 'root_', type: 'address' },
    { key: 2, name: 'owner_', type: 'address' },
  ],
  events: [],
  fields: [
    { name: '_pubkey', type: 'uint256' },
    { name: '_timestamp', type: 'uint64' },
    { name: '_constructorFlag', type: 'bool' },
    { name: 'root_', type: 'address' },
    { name: 'owner_', type: 'address' },
    { name: 'balance_', type: 'uint128' },
  ],
} as const;
const walletAbi = {
  ABIversion: 2,
  version: '2.2',
  header: ['time'],
  functions: [
    {
      name: 'sendTransaction',
      inputs: [
        { name: 'dest', type: 'address' },
        { name: 'value', type: 'uint128' },
        { name: 'bounce', type: 'bool' },
        { name: 'flags', type: 'uint8' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
    { name: 'transferOwnership', inputs: [{ name: 'newOwner', type: 'uint256' }], outputs: [] },
    { name: 'constructor', inputs: [], outputs: [] },
    { name: 'owner', inputs: [], outputs: [{ name: 'owner', type: 'uint256' }] },
    { name: '_randomNonce', inputs: [], outputs: [{ name: '_randomNonce', type: 'uint256' }] },
  ],
  data: [{ key: 1, name: '_randomNonce', type: 'uint256' }],
  events: [
    {
      name: 'OwnershipTransferred',
      inputs: [
        { name: 'previousOwner', type: 'uint256' },
        { name: 'newOwner', type: 'uint256' },
      ],
      outputs: [],
    },
  ],
  fields: [
    { name: '_pubkey', type: 'uint256' },
    { name: '_timestamp', type: 'uint64' },
    { name: '_constructorFlag', type: 'bool' },
    { name: 'owner', type: 'uint256' },
    { name: '_randomNonce', type: 'uint256' },
  ],
} as const;
export const artifacts = {
  TokenRoot: {
    tvc: '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',
    code: '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',
    codeHash: 'c9ff57d44724983f7475b7e2951dc22a9cd0ac28b8353fb98ef2816faae31748',
  },
  TokenWallet: {
    tvc: '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',
    code: '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',
    codeHash: '9e424a5afe21655f539fc9d0363890ac154ce54619299ca75117bc444c453afc',
  },
  Wallet: {
    tvc: 'te6ccgECGAEAAsUAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgBCSK7VMg4wMgwP/jAiDA/uMC8gsVBQQXAortRNDXScMB+GYh2zzTAAGOEYMI1xgg+QFY+EIg+GX5EPKo3tM/AfhDIbnytCD4I4ED6KiCCBt3QKC58rT4Y9MfAds88jwIBgNK7UTQ10nDAfhmItDXCwOpOADcIccA4wIh1w0f8rwh4wMB2zzyPBQUBgIoIIIQWFqQZLvjAiCCEGi1Xz+64wIJBwNSMPhCbuMA+Ebyc9H4RSBukjBw3vhCuvLkT/gA+EUgbpIwcN7bPNs88gAIDQsBYu1E0NdJwgGOJnDtRND0BXBxIoBA9A5vkZPXC//e+Gv4aoBA9A7yvdcL//hicPhj4w0TBFAgghAReOm9uuMCIIIQO1MzH7rjAiCCEEzuZGy64wIgghBYWpBkuuMCEhEOCgMqMPhG8uBM+EJu4wDT/9HbPDDbPPIAEwwLACz4S/hK+EP4QsjL/8s/z4PL/8v/ye1UASz4RSBukjBw3vhKuvLkTSDy5E74ANs8DQBG+Eoh+GqNBHAAAAAAAAAAAAAAAAAU2zT8oMjOy//L/8lw+wADQjD4RvLgTPhCbuMAIZPU0dDe+kDTf9IA0wfU0ds84wDyABMQDwAo7UTQ0//TPzH4Q1jIy//LP87J7VQAVPhFIG6SMHDe+Eq68uRN+ABVAlUSyM+FgMoAz4RAzgH6AnHPC2rMyQH7AAFQMNHbPPhLIY4cjQRwAAAAAAAAAAAAAAAALtTMx+DIzsv/yXD7AN7yABMBUDDR2zz4SiGOHI0EcAAAAAAAAAAAAAAAACReOm9gyM7L/8lw+wDe8gATAC7tRNDT/9M/0wAx0//T/9H4a/hq+GP4YgAK+Eby4EwCCvSkIPShFxYAFHNvbCAwLjYyLjAAAA==',
    code: 'te6ccgECFQEAApgABCSK7VMg4wMgwP/jAiDA/uMC8gsSAgEUAortRNDXScMB+GYh2zzTAAGOEYMI1xgg+QFY+EIg+GX5EPKo3tM/AfhDIbnytCD4I4ED6KiCCBt3QKC58rT4Y9MfAds88jwFAwNK7UTQ10nDAfhmItDXCwOpOADcIccA4wIh1w0f8rwh4wMB2zzyPBERAwIoIIIQWFqQZLvjAiCCEGi1Xz+64wIGBANSMPhCbuMA+Ebyc9H4RSBukjBw3vhCuvLkT/gA+EUgbpIwcN7bPNs88gAFCggBYu1E0NdJwgGOJnDtRND0BXBxIoBA9A5vkZPXC//e+Gv4aoBA9A7yvdcL//hicPhj4w0QBFAgghAReOm9uuMCIIIQO1MzH7rjAiCCEEzuZGy64wIgghBYWpBkuuMCDw4LBwMqMPhG8uBM+EJu4wDT/9HbPDDbPPIAEAkIACz4S/hK+EP4QsjL/8s/z4PL/8v/ye1UASz4RSBukjBw3vhKuvLkTSDy5E74ANs8CgBG+Eoh+GqNBHAAAAAAAAAAAAAAAAAU2zT8oMjOy//L/8lw+wADQjD4RvLgTPhCbuMAIZPU0dDe+kDTf9IA0wfU0ds84wDyABANDAAo7UTQ0//TPzH4Q1jIy//LP87J7VQAVPhFIG6SMHDe+Eq68uRN+ABVAlUSyM+FgMoAz4RAzgH6AnHPC2rMyQH7AAFQMNHbPPhLIY4cjQRwAAAAAAAAAAAAAAAALtTMx+DIzsv/yXD7AN7yABABUDDR2zz4SiGOHI0EcAAAAAAAAAAAAAAAACReOm9gyM7L/8lw+wDe8gAQAC7tRNDT/9M/0wAx0//T/9H4a/hq+GP4YgAK+Eby4EwCCvSkIPShFBMAFHNvbCAwLjYyLjAAAA==',
    codeHash: 'c5ec7c79e5225bda1eece55314191ee7aa45de1b720e10ef004672942dc65d72',
  },
};
export const factorySource = {
  TokenRoot: tokenRootAbi,
  TokenWallet: tokenWalletAbi,
  Wallet: walletAbi,
} as const;

export type FactorySource = typeof factorySource;
export type TokenRootAbi = typeof tokenRootAbi;
export type TokenWalletAbi = typeof tokenWalletAbi;
export type WalletAbi = typeof walletAbi;
