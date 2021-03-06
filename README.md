# generate-query-plan

Command line utility for generating an Apollo Federation query plan
___________
**The code in this repository is experimental and has been provided for reference purposes only. Community feedback is welcome but this project may not be supported in the same way that repositories in the official [Apollo GraphQL GitHub organization](https://github.com/apollographql) are. If you need help you can file an issue on this repository, [contact Apollo](https://www.apollographql.com/contact-sales) to talk to an expert, or create a ticket directly in Apollo Studio.**
_______________
## Details

Whenever your federated gateway receives an incoming GraphQL operation, it needs to figure out how to use your subgraphs to populate data for each of that operation's fields. To do this, the gateway generates a [query plan](https://www.apollographql.com/docs/federation/query-plans/). A query plan is a blueprint for dividing a single incoming operation into one or more operations that are each resolvable by a single subgraph. Some of these operations depend on the results of other operations, so the query plan also defines any required ordering for their execution. Because query plans are generated based on the operation, they only way to debug performance issues is to run the query plan code itself.


A query plan is built from two pieces:

* Supergraph Schema
* GraphQL Operation


You can also view query plans in [Apollo Studio Explorer](https://www.apollographql.com/docs/studio/explorer/additional-features/#query-plans-for-federated-graphs) and by [logging the runtime results of your gateway](https://www.apollographql.com/docs/federation/query-plans/#outputting-query-plans-from-the-gateway).
## Usage

If you have a Federation 2 supergraph file available locally, you can use the following command:
```sh
npx github:@apollosolutions/generate-query-plan \
  --supergraph supergraph.graphql \
  --operation operation.graphql
```

If you have a federated graph in Apollo Studio, you can pass an API key and the `graphref`, and the CLI will fetch the supergraph for you first, then generate the query plan:

```sh
export APOLLO_KEY="your api key"
npx github:@apollosolutions/generate-query-plan \
  --graphref mygraph@current \
  --operation operation.graphql
```

### Federation 1

The `main` branch of this repo has moved to supporting [Federation 2](https://www.apollographql.com/docs/federation/v2), however the code for Federation 1 is still available at the `version-0.x` branch.

NPX allows running code from a specific branch, so you can modify the command to generate a query plan used in `@apollo/gateway@0.x`.

```sh
npx github:@apollosolutions/generate-query-plan#version-0.x
```

For more details see the [README in the `version-0.x` branch](https://github.com/apollosolutions/generate-query-plan/tree/version-0.x).
