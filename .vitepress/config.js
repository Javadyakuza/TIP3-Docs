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
  title: 'TIP-3 Docs',

  plugins: [vue()],
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Feedback', link: FEEDBACK_URL },
      { text: 'Community', link: HELP_URL },
    ],
    sidebar: [
      {
        text: 'Overview',
        link: '/',
      },
      {
        text: 'Concepts',
        collapsable: false,
        link: '/Docs/Concepts/ToC.md',
        items: [
          {
            text: 'Token Root',
            collapsable: false,
            link: '/Docs/Concepts/TokenRoot.md',
          },
          {
            text: 'Token Wallet',
            collapsable: false,
            link: '/Docs/Concepts/TokenWallet.md',
          },
          {
            text: 'Accounts',
            collapsable: false,
            link: '/Docs/Concepts/Accounts.md',
          },
          { text: 'TIP-6.1', collapsable: false, link: '/Docs/Concepts/tip6.md' },
          {
            text: 'Upgradable Contracts',
            collapsable: false,
            link: '/Docs/Concepts/UpgradableContracts.md',
          },
        ],
      },
      {
        text: 'Quick Start',
        collapsable: false,
        link: '/Docs/QuickStart/ToC.md',
        items: [
          {
            text: 'Setup',
            collapsable: false,
            items: [
              {
                text: 'Basic Project Setup',
                collapsable: false,
                link: '/Docs/QuickStart/BasicProjectSetup.md',
              },
              {
                text: 'Locklift Config Setup',
                collapsable: false,
                link: '/Docs/QuickStart/LockliftConfigSetting.md',
              },
            ],
          },
          {
            text: 'Local Environment',
            collapsable: false,
            link: '/Docs/QuickStart/HelperScripts.md',
          },
          {
            text: 'Deploy Account',
            collapsable: false,
            link: '/Docs/QuickStart/DeployAccount.md',
          },
        ],
      },
      {
        text: 'TIP-3 Token Deployment',
        collapsable: false,
        items: [
          {
            text: 'Prerequisites',
            collapsable: false,
            link: '/Deployments/EIP.md',
          },
          {
            text: 'Deploy Upgradable Contracts',
            collapsable: false,
            link: '/Deployments/upgradeableContracts.md',
          },
          {
            text: 'Using Account',
            collapsable: false,
            link: '/Deployments/External/ToC.md',
            items: [
              {
                text: 'Deploy Token Root',
                collapsable: false,
                link: '/Deployments/External/TokenRoot.md',
              },
              {
                text: 'Deploy Token Wallet',
                collapsable: false,
                link: '/Deployments/External/TokenWallet.md',
              },
              {
                text: 'Mint TIP-3 Tokens',
                collapsable: false,
                link: '/Deployments/External/Mint.md',
              },
              {
                text: 'Transfer TIP-3 Tokens',
                collapsable: false,
                link: '/Deployments/External/Transfer.md',
              },
              {
                text: 'Burn TIP-3 Tokens',
                collapsable: false,
                link: '/Deployments/External/burn.md',
              },
            ],
          },
          {
            text: 'Using Smart-Contract',
            collapsable: false,
            link: '/Deployments/Internal/ToC.md',
            items: [
              {
                text: 'Smart Contracts',
                collapsable: false,
                items: [
                  {
                    text: 'Root Deployer',
                    collapsable: false,
                    link: '/Deployments/Contracts/RootDeployer.md',
                  },
                  {
                    text: 'Multi Wallet Tip3',
                    collapsable: false,
                    link: '/Deployments/Contracts/MultiWalletTIP3.md',
                  },
                ],
              },
              {
                text: 'Code Samples',
                collapsable: false,
                items: [
                  {
                    text: 'Deploy Token Root',
                    collapsable: false,
                    link: '/Deployments/Internal/TokenRoot.md',
                  },
                  {
                    text: 'Deploy Token Wallet',
                    collapsable: false,
                    link: '/Deployments/Internal/TokenWallet.md',
                  },
                  {
                    text: 'Mint TIP-3 Tokens',
                    collapsable: false,
                    link: '/Deployments/Internal/Mint.md',
                  },
                  {
                    text: 'Transfer TIP-3 Tokens',
                    collapsable: false,
                    link: '/Deployments/Internal/Transfer.md',
                  },
                  {
                    text: 'Burn TIP-3 Tokens',
                    collapsable: false,
                    link: '/Deployments/Internal/Burn.md',
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
