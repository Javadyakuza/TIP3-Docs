# Local Environment

The locklift tool has its own local node to make transaction locally.

But if you want to play around with the local node the front end we will be needing a sandbox as explained below.

Add this scripts to your `package.json` scripts sections.

```json
 "scripts": {
    "test": "npx locklift test --network local",
    "start-sandbox": "docker run -d -e USER_AGREEMENT=yes --rm --name local-node -p80:80 tonlabs/local-node:0.29.1",
    "stop-sandbox": "docker kill local-node",
    "reload-sandbox": "npx stop-sandbox && npx start-sandbox"
  },
```

After adding them execute the necessary command based on your specific requirement.
