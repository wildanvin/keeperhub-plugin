# KeeperHub OpenClaw Plugin

This plugin lets OpenClaw agents use KeeperHub workflow automation tools through KeeperHub's hosted MCP server.

It connects to:

```text
https://app.keeperhub.com/mcp
```

and authenticates with a KeeperHub organization API key.

## What You Get

The plugin adds KeeperHub tools to OpenClaw for:

- Listing, reading, creating, updating, and deleting workflows
- Executing workflows and checking execution status/logs
- Generating workflows with AI
- Discovering action schemas
- Searching KeeperHub plugins and templates
- Deploying templates
- Listing integrations and finding wallet integration IDs
- Reading KeeperHub MCP tool documentation

Tools that can change state, like creating workflows, deleting workflows, executing workflows, or deploying templates, are registered as optional OpenClaw tools.

## Requirements

Before installing, make sure you have:

- OpenClaw installed and configured on the target machine
- Node.js and npm available in the same WSL/Linux environment where OpenClaw runs
- A KeeperHub organization API key, usually starting with `kh_`

Create the API key in KeeperHub under:

```text
Settings > API Keys > Organisation
```

Personal API keys are not enough for the KeeperHub MCP endpoint; use an organization API key.

## Install

The recommended install location is your OpenClaw plugins folder:

```bash
cd ~/.openclaw/plugins
git clone https://github.com/wildanvin/keeperhub-plugin.git keeperhub
cd keeperhub
npm install
```

Then link and enable the plugin in OpenClaw:

```bash
openclaw plugins install -l .
openclaw plugins enable keeperhub
openclaw plugins doctor
```

You can inspect the installed plugin with:

```bash
openclaw plugins inspect keeperhub
```

## OpenClaw Configuration

For OpenClaw runtime usage, configure the API key in your OpenClaw config file:

```text
~/.openclaw/openclaw.json
```

Add or update the `plugins.entries` section:

```json
{
  "plugins": {
    "entries": {
      "keeperhub": {
        "enabled": true,
        "config": {
          "apiKey": "kh_your_organization_key_here"
        }
      }
    }
  }
}
```

If your `openclaw.json` already has other plugin entries, keep them and add only the `keeperhub` entry under `plugins.entries`.

Optional endpoint override, only needed for development or self-hosted setups:

```json
{
  "plugins": {
    "entries": {
      "keeperhub": {
        "enabled": true,
        "config": {
          "apiKey": "kh_your_organization_key_here",
          "baseUrl": "https://app.keeperhub.com/mcp"
        }
      }
    }
  }
}
```

## Local `.env` For Testing

The plugin still supports `.env` for local testing or quick validation outside a full OpenClaw config setup.

Create one from the example:

```bash
cp .env.example .env
```

Then set:

```bash
KH_API_KEY=kh_your_organization_key_here
```

Optional endpoint override:

```bash
KEEPERHUB_MCP_URL=https://app.keeperhub.com/mcp
```

OpenClaw plugin config wins over `.env` if both are present.

## Test Without OpenClaw Running

You can still validate the code on a machine that does not have OpenClaw running:

```bash
npm install
npm run typecheck
```

This checks TypeScript, dependencies, and SDK imports. Full end-to-end testing still requires OpenClaw to load the plugin and call the tools.

## How It Works

- `openclaw.plugin.json` describes the plugin and its config fields.
- `package.json` tells OpenClaw to load `./src/index.ts`.
- `src/index.ts` registers KeeperHub tools with names like `keeperhub_list_workflows` and `keeperhub_tools_documentation`.
- `src/keeperhubClient.ts` connects to KeeperHub's MCP endpoint using Streamable HTTP.
- Each OpenClaw tool forwards its request to the matching KeeperHub MCP tool.
- Errors redact API keys before being returned or logged.

## Development

Run typecheck:

```bash
npm run typecheck
```

Audit production dependencies:

```bash
npm audit --omit=dev --audit-level=moderate
```

Do not commit `.env` or `node_modules/`.
