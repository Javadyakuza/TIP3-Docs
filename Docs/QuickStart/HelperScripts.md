# Add Helper Scripts

We will need a sandbox in the future, let's write scripts that will help us start and stop a local node

```json
 "scripts": {
    "test": "npx locklift test --network local",
    "start-sandbox": "docker run -d -e USER_AGREEMENT=yes --rm --name local-node -p80:80 tonlabs/local-node:0.29.1",
    "stop-sandbox": "docker kill local-node",
    "reload-sandbox": "npx stop-sandbox && npx start-sandbox"
  },
```

