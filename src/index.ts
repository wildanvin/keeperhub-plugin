import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import {
  KeeperHubClient,
  normalizeToolError,
  normalizeToolResult,
  resolveKeeperHubConfig,
} from "./keeperhubClient.js";

function asToolParams(params: unknown): Record<string, unknown> {
  return typeof params === "object" && params !== null && !Array.isArray(params) ? params as Record<string, unknown> : {};
}

type KeeperHubToolDefinition = {
  name: string;
  keeperHubTool: string;
  description: string;
  optional?: boolean;
  parameters?: ReturnType<typeof Type.Object>;
};

const passthroughParameters = Type.Object({}, { additionalProperties: true });

const keeperHubTools: KeeperHubToolDefinition[] = [
  {
    name: "keeperhub_list_workflows",
    keeperHubTool: "list_workflows",
    description: "List KeeperHub workflows in the authenticated organization. Supports pagination parameters such as limit and offset.",
    parameters: Type.Object({
      limit: Type.Optional(Type.Number({ minimum: 1 })),
      offset: Type.Optional(Type.Number({ minimum: 0 })),
    }),
  },
  {
    name: "keeperhub_get_workflow",
    keeperHubTool: "get_workflow",
    description: "Get a KeeperHub workflow by ID, including nodes and edges. Pass the workflow identifier expected by KeeperHub MCP.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_create_workflow",
    keeperHubTool: "create_workflow",
    description: "Create a KeeperHub workflow with explicit nodes and edges. Call keeperhub_list_action_schemas first for valid action types.",
    optional: true,
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_update_workflow",
    keeperHubTool: "update_workflow",
    description: "Update a KeeperHub workflow's name, description, nodes, edges, or enabled state.",
    optional: true,
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_delete_workflow",
    keeperHubTool: "delete_workflow",
    description: "Permanently delete a KeeperHub workflow. Use force only when deleting workflows with execution history is intended.",
    optional: true,
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_execute_workflow",
    keeperHubTool: "execute_workflow",
    description: "Manually execute a KeeperHub workflow and return an execution ID for polling.",
    optional: true,
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_get_execution_status",
    keeperHubTool: "get_execution_status",
    description: "Get the status of a KeeperHub workflow execution: pending, running, completed, or failed.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_get_execution_logs",
    keeperHubTool: "get_execution_logs",
    description: "Get detailed KeeperHub execution logs, including transaction hashes, API responses, and errors.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_ai_generate_workflow",
    keeperHubTool: "ai_generate_workflow",
    description: "Generate a KeeperHub workflow from a natural language prompt, optionally modifying an existing workflow.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_list_action_schemas",
    keeperHubTool: "list_action_schemas",
    description: "List KeeperHub action schemas. Optional category values include web3, discord, sendgrid, webhook, and system.",
    parameters: Type.Object({
      category: Type.Optional(Type.Union([
        Type.Literal("web3"),
        Type.Literal("discord"),
        Type.Literal("sendgrid"),
        Type.Literal("webhook"),
        Type.Literal("system"),
      ])),
    }),
  },
  {
    name: "keeperhub_search_plugins",
    keeperHubTool: "search_plugins",
    description: "Search KeeperHub plugins by name or category such as web3, messaging, integration, or notification.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_get_plugin",
    keeperHubTool: "get_plugin",
    description: "Get KeeperHub plugin documentation, with optional examples and config field details.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_validate_plugin_config",
    keeperHubTool: "validate_plugin_config",
    description: "Validate a KeeperHub action configuration against its schema and return errors or suggestions.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_search_templates",
    keeperHubTool: "search_templates",
    description: "Search pre-built KeeperHub workflow templates by query, category, or difficulty.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_get_template",
    keeperHubTool: "get_template",
    description: "Get KeeperHub template metadata and setup guide.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_deploy_template",
    keeperHubTool: "deploy_template",
    description: "Deploy a KeeperHub workflow template with optional node customizations.",
    optional: true,
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_list_integrations",
    keeperHubTool: "list_integrations",
    description: "List configured KeeperHub integrations. Can filter by type such as web3, discord, or sendgrid.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_get_wallet_integration",
    keeperHubTool: "get_wallet_integration",
    description: "Get the wallet integration ID needed for KeeperHub write operations such as transfers and contract calls.",
    parameters: passthroughParameters,
  },
  {
    name: "keeperhub_tools_documentation",
    keeperHubTool: "tools_documentation",
    description: "Get KeeperHub MCP tool documentation. Call without arguments for the full tool list.",
    parameters: passthroughParameters,
  },
];

export default definePluginEntry({
  id: "keeperhub",
  name: "KeeperHub",
  description: "Expose KeeperHub workflow automation tools to OpenClaw agents.",
  register(api) {
    const client = new KeeperHubClient(resolveKeeperHubConfig(api.pluginConfig ?? {}));

    for (const tool of keeperHubTools) {
      api.registerTool(
        {
          name: tool.name,
          label: tool.name.replace(/^keeperhub_/, "KeeperHub ").replace(/_/g, " "),
          description: tool.description,
          parameters: tool.parameters ?? passthroughParameters,
          async execute(_id: string, params: unknown): Promise<any> {
            try {
              const result = await client.callTool(tool.keeperHubTool, asToolParams(params));
              return normalizeToolResult(result);
            } catch (error) {
              api.logger.error(`KeeperHub tool ${tool.keeperHubTool} failed: ${error instanceof Error ? error.message : String(error)}`);
              return normalizeToolError(error);
            }
          },
        },
        tool.optional ? { optional: true } : undefined,
      );
    }
  },
});
