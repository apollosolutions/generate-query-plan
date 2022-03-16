# generate-query-plan

Command line utility for generating an Apollo Federation query plan

**The code in this repository is experimental and has been provided for reference purposes only. Community feedback is welcome but this project may not be supported in the same way that repositories in the official [Apollo GraphQL GitHub organization](https://github.com/apollographql) are. If you need help you can file an issue on this repository, [contact Apollo](https://www.apollographql.com/contact-sales) to talk to an expert, or create a ticket directly in Apollo Studio.**

## Usage

```sh
npx github:@apollosolutions/generate-query-plan \
  --supergraph supergraph.graphql \
  --operation operation.graphql

# or

export APOLLO_KEY="your api key"
npx github:@apollosolutions/generate-query-plan \
  --graphref supergraph.graphql \
  --operation operation.graphql
```

### Federation 1

Use `npx github:@apollosolutions/generate-query-plan#version-0.x` to use the query planner in `@apollo/gateway@0.x`.
