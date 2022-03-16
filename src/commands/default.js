import { buildOperationContext } from "@apollo/gateway";
import { buildComposedSchema, QueryPlanner } from "@apollo/query-planner";
import { Command, Option } from "clipanion";
import { parse } from "graphql";
import { readFile } from "fs/promises";
import { GraphQLClient } from "graphql-request";
import { getSdk } from "../studio/graphql.js";

export class DefaultCommand extends Command {
  supergraph = Option.String("--supergraph");

  graphref = Option.String("--graphref");

  operation = Option.String("--operation", { required: true });

  async execute() {
    if (this.supergraph && this.graphref) {
      this.context.stderr.write(
        "invalid request: set only one of --supergraph or --graphref"
      );
      process.exit(1);
    }

    const schema = this.supergraph
      ? await fetchSupergraphFromFile(this.supergraph)
      : this.graphref
      ? await fetchSupergraphFromStudio(this.graphref)
      : null;

    if (!schema) {
      this.context.stderr.write("cannot load supergraph");
      process.exit(1);
    }

    const operation = await readFile(this.operation, "utf-8");

    const queryPlan = await generateQueryPlan(schema, operation);

    this.context.stdout.write(JSON.stringify(queryPlan, null, 2));
    this.context.stdout.write("\n");
  }
}

/**
 * @param {import("graphql").GraphQLSchema} schema
 * @param {string} operationDoc
 * @param {string} [operationName]
 */
export async function generateQueryPlan(schema, operationDoc, operationName) {
  const operationDocument = parse(operationDoc);
  const operationContext = buildOperationContext({
    schema,
    operationDocument,
    operationName,
  });
  const queryPlanner = new QueryPlanner(schema);
  return queryPlanner.buildQueryPlan(operationContext, {
    autoFragmentization: false,
  });
}

/**
 * @param {string} file
 */
async function fetchSupergraphFromFile(file) {
  return buildComposedSchema(parse(await readFile(file, "utf-8")));
}

/**
 * @param {string} ref
 */
async function fetchSupergraphFromStudio(ref) {
  const apiKey = process.env.APOLLO_KEY;
  if (!apiKey) {
    throw new Error("missing APOLLO_KEY");
  }

  const client = new GraphQLClient(
    "https://graphql.api.apollographql.com/api/graphql",
    {
      headers: {
        "x-api-key": apiKey,
      },
    }
  );

  const sdk = getSdk(client);

  const resp = await sdk.SupergraphForGraphRef({ ref });

  if (resp.variant?.__typename !== "GraphVariant") {
    return null;
  }

  if (
    resp.variant.latestApprovedLaunch?.build?.result?.__typename !==
    "BuildSuccess"
  ) {
    return null;
  }

  return buildComposedSchema(
    parse(
      resp.variant.latestApprovedLaunch.build.result.coreSchema.coreDocument
    )
  );
}
