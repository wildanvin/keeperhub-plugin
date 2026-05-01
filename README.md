# KeeperHub OpenClaw Plugin

This plugin lets OpenClaw agents use KeeperHub workflow automation tools through KeeperHub's hosted MCP server.

It connects to:

```text
https://app.keeperhub.com/mcp
```

and authenticates with a KeeperHub API key. A personal API key is fine as long as KeeperHub accepts it for the MCP endpoint. Organization-scoped keys also work.

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
- A KeeperHub API key, usually starting with `kh_`

Create or copy your API key from KeeperHub. If you use organization-scoped keys, they are usually under:

```text
Settings > API Keys > Organisation
```

If you already have a personal API key, use that.

## Install

The recommended install location is your OpenClaw plugins folder:

```bash
cd ~/.openclaw/plugins
git clone https://github.com/wildanvin/keeperhub-plugin.git keeperhub
cd keeperhub
npm install
cp .env.example .env
```

Edit `.env` and add your KeeperHub key:

```bash
KH_API_KEY=kh_your_key_here
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

## Configuration

The simplest setup is using `.env`:

```bash
KH_API_KEY=kh_your_key_here
```

Optional endpoint override, only needed for development or self-hosted setups:

```bash
KEEPERHUB_MCP_URL=https://app.keeperhub.com/mcp
```

The plugin can also read config from OpenClaw plugin config. If both OpenClaw config and environment variables are present, OpenClaw config wins for `apiKey` and `baseUrl`.

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
