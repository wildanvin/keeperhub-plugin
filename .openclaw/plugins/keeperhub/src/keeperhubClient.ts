import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export type KeeperHubClientConfig = {
  apiKey: string;
  baseUrl?: string;
};

const DEFAULT_KEEPERHUB_MCP_URL = "https://app.keeperhub.com/mcp";

export class KeeperHubClient {
  private client: Client | undefined;
  private transport: StreamableHTTPClientTransport | undefined;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: KeeperHubClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_KEEPERHUB_MCP_URL;
  }

  async callTool(name: string, args: Record<string, unknown>) {
    const client = await this.getClient();
    return client.callTool({ name, arguments: args });
  }

  async close(): Promise<void> {
    await this.client?.close();
    this.client = undefined;
    this.transport = undefined;
  }

  private async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    const client = new Client({
      name: "openclaw-keeperhub-plugin",
      version: "0.1.0",
    });

    const transport = new StreamableHTTPClientTransport(new URL(this.baseUrl), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    });

    try {
      await client.connect(transport);
    } catch (error) {
      throw new Error(`Failed to connect to KeeperHub MCP: ${redactSecrets(error)}`);
    }

    this.client = client;
    this.transport = transport;
    return client;
  }
}

export function resolveKeeperHubConfig(pluginConfig: Record<string, unknown>): KeeperHubClientConfig {
  const apiKey = readString(pluginConfig.apiKey) ?? process.env.KH_API_KEY;
  if (!apiKey) {
    throw new Error(
      "KeeperHub API key is required. Set plugins.entries.keeperhub.config.apiKey or KH_API_KEY.",
    );
  }

  return {
    apiKey,
    baseUrl: readString(pluginConfig.baseUrl) ?? process.env.KEEPERHUB_MCP_URL,
  };
}

export function normalizeToolResult(result: unknown) {
  if (isOpenClawToolResult(result)) {
    return {
      ...result,
      details: result.details ?? result,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
    details: result,
  };
}

export function normalizeToolError(error: unknown) {
  const text = `KeeperHub error: ${redactSecrets(error)}`;
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
    details: { status: "failed", error: text },
    isError: true,
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isOpenClawToolResult(value: unknown): value is { content: Array<{ type: string }>; details?: unknown; isError?: boolean } {
  return typeof value === "object" && value !== null && Array.isArray((value as { content?: unknown }).content);
}

function redactSecrets(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/kh_[A-Za-z0-9_-]+/g, "kh_[redacted]").replace(/Bearer\s+[^\s,)]+/gi, "Bearer [redacted]");
}
