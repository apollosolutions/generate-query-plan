import {
  operationFromDocument,
  Supergraph
} from "@apollo/federation-internals";
import { QueryPlanner, prettyFormatQueryPlan } from "@apollo/query-planner";
import { Command, Option } from "clipanion";
import { parse } from "graphql";
import { readFile } from "fs/promises";
import { GraphQLClient } from "graphql-request";
import { getSdk } from "../studio/graphql.js";

export class DefaultCommand extends Command {
  supergraph = Option.String("--supergraph");

  graphref = Option.String("--graphref");

  operation = Option.String("--operation", { required: true });

  sudo = Option.Boolean("--sudo");

  complexity = Option.Boolean("--complexity");

  async execute() {
    if (this.supergraph && this.graphref) {
      this.context.stderr.write(
        "invalid request: set only one of --supergraph or --graphref"
      );
      process.exit(1);
    }

    const result = this.supergraph
      ? await fetchSupergraphFromFile(this.supergraph)
      : this.graphref
        ? await fetchSupergraphFromStudio(this.graphref, this.sudo ?? false)
        : null;

    if (!result) {
      this.context.stderr.write("cannot load supergraph");
      process.exit(1);
    }

    const operation = await readFile(this.operation, "utf-8");

    const queryPlan = await generateQueryPlan(result, operation);

    if (this.complexity) {
      const comx = calculateComplexity(queryPlan.node, 0);
      console.log("complexity", comx);
    }

    this.context.stdout.write(prettyFormatQueryPlan(queryPlan));
  }
}

const calculateComplexity = (queryPlanNode, complexity) => {
  switch (queryPlanNode.kind) {
    case "QueryPlan":
    case "Flatten":
      complexity = calculateComplexity(queryPlanNode.node, complexity + 1);
      break
    case "Sequence":
    case "Parallel":
      queryPlanNode.nodes.forEach((node) => {
        complexity = calculateComplexity(node, complexity + 1);
      })
      break;
    case "Fetch":
      complexity = complexity + 1;
      break;
    default:
      console.log("Unknown query plan node:", queryPlanNode.kind);
      break;
  }

  return complexity;
};

/**
 * @param {import("@apollo/federation-internals").Supergraph} supergraph
 * @param {string} operationDoc
 * @param {string} [operationName]
 */
export async function generateQueryPlan(supergraph, operationDoc, operationName) {
  const documentNode = parse(operationDoc);
  const operation = operationFromDocument(supergraph.schema, documentNode, {
    operationName,
  });
  const queryPlanner = new QueryPlanner(supergraph);
  return queryPlanner.buildQueryPlan(operation);
}

/**
 * @param {string} file
 */
async function fetchSupergraphFromFile(file) {
  return Supergraph.build(await readFile(file, "utf-8"));
}

/**
 * @param {string} ref
 * @param {boolean} sudo
 */
async function fetchSupergraphFromStudio(ref, sudo) {
  const apiKey = process.env.APOLLO_KEY;
  if (!apiKey) {
    throw new Error("missing APOLLO_KEY");
  }

  const client = new GraphQLClient(
    "https://graphql.api.apollographql.com/api/graphql",
    {
      headers: {
        "x-api-key": apiKey,
        ...(sudo ? { "apollo-sudo": String(sudo) } : {}),
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

  return Supergraph.build(
    resp.variant.latestApprovedLaunch.build.result.coreSchema.coreDocument
  );
}
