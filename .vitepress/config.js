import vue from '@vitejs/plugin-vue';

const HELP_URL = 'https://t.me/everdev';
const FEEDBACK_URL = 'https://t.me/everdev';
const GITHUB_URL = 'https://github.com/Javadyakuza/TIP3-Docs';
const NAV = [
  {
    text: 'Broxus Docs',
    items: [
      { text: 'Home', link: 'https://docs.broxus.com' },
      { text: 'Inpage Provider', link: 'https://provider-docs.broxus.com/' },
      { text: 'Locklift', link: 'https://docs.locklift.io/' },
      { text: 'OctusBridge Integration', link: 'https://integrate.octusbridge.io' },
      {
        text: 'TIP-3 Api Reference',
        link: 'https://tip3-api-reference.netlify.app/',
      },
      {
        text: 'TIP-3 Docs',
        link: '/',
      },
    ],
  },
  { text: 'Feedback', link: FEEDBACK_URL },
  { text: 'Community', link: HELP_URL },
];
module.exports = {
  title: 'TIP-3 Docs',
  base: '/',

  plugins: [vue()],
  rewrites: {
    'src/pages/index.md': 'index.md',
    'src/pages/concepts/toc.md': 'concepts/toc.md',
    'src/pages/concepts/tokenRoot.md': 'concepts/tokenRoot.md',
    'src/pages/concepts/tokenWallet.md': 'concepts/tokenWallet.md',
    'src/pages/concepts/accounts.md': 'concepts/accounts.md',
    'src/pages/concepts/tip6.md': 'concepts/tip6.md',
    'src/pages/concepts/upgradeableContracts.md': 'concepts/upgradeableContracts.md',
    'src/pages/quickStart/toc.md': 'quickStart/toc.md',
    'src/pages/quickStart/basicProjectSetup.md': 'quickStart/basicProjectSetup.md',
    'src/pages/quickStart/lockliftConfigSetting.md': 'quickStart/lockliftConfigSetting.md',
    'src/pages/quickStart/localEnvironment.md': 'quickStart/localEnvironment.md',
    'src/pages/quickStart/deployAccount.md': 'quickStart/deployAccount.md',
    'src/pages/guides/prerequisites/prerequisites.md': 'guides/prerequisites/prerequisites.md',
    'src/pages/guides/prerequisites/rootDeployer.md': 'guides/prerequisites/rootDeployer.md',
    'src/pages/guides/prerequisites/multiWalletTIP3.md': 'guides/prerequisites/multiWalletTIP3.md',
    'src/pages/guides/deployingContracts/toc.md': 'guides/deployingContracts/toc.md',
    'src/pages/guides/deployingContracts/usingAccount/tokenRoot.md':
      'guides/deployingContracts/usingAccount/tokenRoot.md',
    'src/pages/guides/deployingContracts/usingAccount/tokenWallet.md':
      'guides/deployingContracts/usingAccount/tokenWallet.md',
    'src/pages/guides/deployingContracts/usingAccount/upgradeableContracts.md':
      'guides/deployingContracts/usingAccount/upgradeableContracts.md',
    'src/pages/guides/deployingContracts/usingSmartContract/tokenRoot.md':
      'guides/deployingContracts/usingSmartContract/tokenRoot.md',
    'src/pages/guides/deployingContracts/usingSmartContract/tokenWallet.md':
      'guides/deployingContracts/usingSmartContract/tokenWallet.md',
    'src/pages/guides/tokenOperations/toc.md': 'guides/tokenOperations/toc.md',
    'src/pages/guides/tokenOperations/usingAccount/mint.md':
      'guides/tokenOperations/usingAccount/mint.md',
    'src/pages/guides/tokenOperations/usingAccount/transfer.md':
      'guides/tokenOperations/usingAccount/transfer.md',
    'src/pages/guides/tokenOperations/usingAccount/burn.md':
      'guides/tokenOperations/usingAccount/burn.md',
    'src/pages/guides/tokenOperations/usingSmartContract/mint.md':
      'guides/tokenOperations/usingSmartContract/mint.md',
    'src/pages/guides/tokenOperations/usingSmartContract/transfer.md':
      'guides/tokenOperations/usingSmartContract/transfer.md',
    'src/pages/guides/tokenOperations/usingSmartContract/burn.md':
      'guides/tokenOperations/usingSmartContract/burn.md',
  },
  ignoreDeadLinks: true,
  themeConfig: {
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/Javadyakuza/TIP3-Docs/edit/main/:path',
    },
    nav: NAV,
    sidebar: [
      {
        text: 'Overview',
        link: '/',
      },
      {
        text: 'Concepts',
        collapsable: false,
        link: '/concepts/toc.md',
        items: [
          {
            text: 'Token Root',
            collapsable: false,
            link: '/concepts/tokenRoot.md',
          },
          {
            text: 'Token Wallet',
            collapsable: false,
            link: '/concepts/tokenWallet.md',
          },
          {
            text: 'Accounts',
            collapsable: false,
            link: '/concepts/accounts.md',
          },
          { text: 'TIP-6.1', collapsable: false, link: '/concepts/tip6.md' },
          {
            text: 'upgradeable Contracts',
            collapsable: false,
            link: '/concepts/upgradeableContracts.md',
          },
        ],
      },
      {
        text: 'Quick Start',
        collapsable: false,
        link: '/quickStart/toc.md',
        items: [
          {
            text: 'Setup',
            collapsable: false,
            items: [
              {
                text: 'Basic Project Setup',
                collapsable: false,
                link: '/quickStart/basicProjectSetup.md',
              },
              {
                text: 'Locklift Config Setup',
                collapsable: false,
                link: '/quickStart/lockliftConfigSetting.md',
              },
            ],
          },
          {
            text: 'Local Environment',
            collapsable: false,
            link: '/quickStart/localEnvironment.md',
          },
          {
            text: 'Deploy Account',
            collapsable: false,
            link: '/quickStart/deployAccount.md',
          },
        ],
      },
      {
        text: 'Guides',
        collapsable: false,
        items: [
          {
            text: 'Prerequisites',
            collapsable: false,
            link: '/guides/prerequisites/prerequisites.md',
            items: [
              {
                text: 'Root Deployer',
                collapsable: false,
                link: '/guides/prerequisites/rootDeployer.md',
              },
              {
                text: 'Multi Wallet Tip3',
                collapsable: false,
                link: '/guides/prerequisites/multiWalletTIP3.md',
              },
            ],
          },

          {
            text: 'Deploying Contracts',
            collapsable: false,
            link: '/guides/deployingContracts/toc.md',
            items: [
              {
                text: 'Using Account',
                collapsable: false,
                items: [
                  {
                    text: 'Deploying Token Root',
                    collapsable: false,
                    link: '/guides/deployingContracts/usingAccount/tokenRoot.md',
                  },
                  {
                    text: 'Deploying Token Wallet',
                    collapsable: false,
                    link: '/guides/deployingContracts/usingAccount/tokenWallet.md',
                  },
                  {
                    text: 'Deploying upgradeable',
                    collapsable: false,
                    link: '/guides/deployingContracts/usingAccount/upgradeableContracts.md',
                  },
                ],
              },
              {
                text: 'Using Smart Contract',
                collapsable: false,
                items: [
                  {
                    text: 'Deploying Token Root',
                    collapsable: false,
                    link: '/guides/deployingContracts/usingSmartContract/tokenRoot.md',
                  },
                  {
                    text: 'Deploying Token Wallet',
                    collapsable: false,
                    link: '/guides/deployingContracts/usingSmartContract/tokenWallet.md',
                  },
                ],
              },
            ],
          },
          {
            text: 'Token Operations',
            collapsable: false,
            link: '/guides/tokenOperations/toc.md',
            items: [
              {
                text: 'Using Account',
                collapsable: false,
                items: [
                  {
                    text: 'Minting Tokens',
                    collapsable: false,
                    link: '/guides/tokenOperations/usingAccount/mint.md',
                  },
                  {
                    text: 'Transferring Tokens',
                    collapsable: false,
                    link: '/guides/tokenOperations/usingAccount/transfer.md',
                  },
                  {
                    text: 'Burning Tokens',
                    collapsable: false,
                    link: '/guides/tokenOperations/usingAccount/burn.md',
                  },
                ],
              },
              {
                text: 'Using Smart Contract',
                collapsable: false,
                items: [
                  {
                    text: 'Minting Tokens',
                    collapsable: false,
                    link: '/guides/tokenOperations/usingSmartContract/mint.md',
                  },
                  {
                    text: 'Transferring Tokens',
                    collapsable: false,
                    link: '/guides/tokenOperations/usingSmartContract/transfer.md',
                  },
                  {
                    text: 'Burning Tokens',
                    collapsable: false,
                    link: '/guides/tokenOperations/usingSmartContract/burn.md',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: GITHUB_URL }],
  },

  esbuild: {
    target: ['chrome89', 'edge89', 'firefox79', 'safari14.1'],
  },
};
