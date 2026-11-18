#!/usr/bin/env node
/**
 * Reddit Subreddit, Comments & Buyer-Intent OSINT MCP Server (reddit-intelligence-mcp)
 * Dual-Transport Model Context Protocol (MCP) Server:
 *   1. Local stdio transport (`npx -y github:willowswt/reddit-intelligence-mcp`)
 *   2. Streamable HTTP transport (`--http`, or via Apify MCP Gateway `https://mcp.apify.com/?actors=church_of_loujess/reddit-scraper-fast`)
 *
 * Schema discovery (`initialize`, `tools/list`, `ping`, `resources/list`, `prompts/list`)
 * responds locally with zero latency and requires no API token.
 * Live tool execution (`tools/call`) executes the underlying Apify Actor synchronously via:
 *   POST https://api.apify.com/v2/acts/<actorId>/run-sync-get-dataset-items
 * Get your free Apify API token ($5.00/mo free credit included) at:
 *   https://console.apify.com/settings/integrations
 * Primary Apify Store Actor:
 *   https://apify.com/church_of_loujess/reddit-scraper-fast
 */

import http from 'node:http';
import readline from 'node:readline';

const SERVER_NAME = "reddit-intelligence-mcp";
const SERVER_VERSION = '1.0.0';
const STORE_URL = "https://apify.com/church_of_loujess/reddit-scraper-fast";
const APIFY_MCP_GATEWAY = "https://mcp.apify.com/?actors=church_of_loujess/reddit-scraper-fast";
const SUPPORTED_PROTOCOLS = new Set(['2025-06-18', '2025-03-26', '2024-11-05']);
const SERVER_INSTRUCTIONS = "MCP server for high-speed Reddit subreddit extraction, comment thread scraping, RAG Markdown generation, and B2B buyer-intent lead scoring via Apify. Store docs: https://apify.com/church_of_loujess/reddit-scraper-fast";

const ACTOR_BY_TOOL = {
  "scrape_reddit_posts_and_comments": "church_of_loujess~reddit-scraper-fast",
  "find_reddit_buyer_intent_leads": "church_of_loujess~reddit-scraper-fast"
};
const FIXED_ARGS_BY_TOOL = {
  "find_reddit_buyer_intent_leads": {
    "onlyBuyerIntent": true
  }
};
const TOOLS = [
  {
    "name": "scrape_reddit_posts_and_comments",
    "description": "Extract Reddit posts, upvote ratios, top comments, outbound links, and RAG-ready Markdown from subreddits or search queries.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "subreddits": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Subreddit names or URLs (e.g. ['SaaS', 'Entrepreneur'])."
        },
        "searchQueries": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Keywords or phrases to search across Reddit or within subreddits."
        },
        "sort": {
          "type": "string",
          "default": "hot",
          "description": "Sort mode: 'hot', 'new', 'top', 'rising', or 'relevance'."
        },
        "timeframe": {
          "type": "string",
          "default": "month",
          "description": "Timeframe: 'hour', 'day', 'week', 'month', 'year', or 'all'."
        },
        "maxPostsPerSource": {
          "type": "integer",
          "default": 15,
          "description": "Maximum posts per subreddit or query."
        },
        "includeComments": {
          "type": "boolean",
          "default": true,
          "description": "Include top-level comments in results."
        },
        "maxCommentsPerPost": {
          "type": "integer",
          "default": 5,
          "description": "Max comments to extract per post."
        }
      }
    },
    "annotations": {
      "title": "Scrape Reddit Posts And Comments",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "find_reddit_buyer_intent_leads",
    "description": "Filter Reddit discussions for high-intent B2B buying and software recommendation requests (buyerIntentScore >= 25).",
    "inputSchema": {
      "type": "object",
      "properties": {
        "subreddits": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Target B2B/niche subreddits to monitor."
        },
        "searchQueries": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Product category or competitor alternatives (e.g. ['CRM alternative'])."
        },
        "timeframe": {
          "type": "string",
          "default": "week",
          "description": "Timeframe filter."
        },
        "maxPostsPerSource": {
          "type": "integer",
          "default": 15,
          "description": "Maximum posts scanned per source."
        }
      }
    },
    "annotations": {
      "title": "Find Reddit Buyer Intent Leads",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  }
];

async function executeApifyActor(toolName, args) {
    const token = (
        process.env.APIFY_API_TOKEN ||
        process.env.APIFY_TOKEN ||
        process.env.MCP_API_TOKEN ||
        ''
    ).trim();

    const actorId = ACTOR_BY_TOOL[toolName];
    if (!token) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            status: 'configuration_required',
                            server: SERVER_NAME,
                            tool: toolName,
                            apifyActor: actorId,
                            message:
                                'APIFY_API_TOKEN is required to run live extractions. Create a free Apify account ' +
                                '($5.00/mo free credit included) and copy your token from https://console.apify.com/settings/integrations, ' +
                                `or connect via the hosted Apify MCP Gateway: ${APIFY_MCP_GATEWAY}`,
                            apifyMcpGateway: APIFY_MCP_GATEWAY,
                            apifyStoreUrl: STORE_URL,
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    const mergedInput = { ...(args || {}), ...(FIXED_ARGS_BY_TOOL[toolName] || {}) };
    const runUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?timeout=120`;

    const resp = await fetch(runUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mergedInput),
    });

    if (!resp.ok) {
        const errTxt = await resp.text();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: `Apify Actor HTTP ${resp.status}: ${errTxt.slice(0, 400)}`,
                        actor: actorId,
                        storeUrl: STORE_URL,
                    }),
                },
            ],
            isError: true,
        };
    }

    const items = await resp.json();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(
                    {
                        tool: toolName,
                        apifyActor: actorId,
                        itemCount: Array.isArray(items) ? items.length : 1,
                        items,
                    },
                    null,
                    2
                ),
            },
        ],
        isError: false,
    };
}

async function handleRpcMessage(msg) {
    if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
        return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' } };
    }
    const method = String(msg.method || '');
    const hasId = msg.id !== undefined && msg.id !== null;
    if (!hasId || method.startsWith('notifications/')) {
        return null;
    }
    const id = msg.id;
    const params = msg.params && typeof msg.params === 'object' ? msg.params : {};

    if (method === 'initialize') {
        const clientPv = String(params.protocolVersion || '2025-06-18');
        const protocolVersion = SUPPORTED_PROTOCOLS.has(clientPv) ? clientPv : '2025-06-18';
        return {
            jsonrpc: '2.0',
            id,
            result: {
                protocolVersion,
                capabilities: {
                    tools: { listChanged: false },
                    resources: { subscribe: false, listChanged: false },
                    prompts: { listChanged: false },
                },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
                instructions: SERVER_INSTRUCTIONS,
            },
        };
    }

    if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
    if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    if (method === 'resources/list') return { jsonrpc: '2.0', id, result: { resources: [] } };
    if (method === 'resources/templates/list') return { jsonrpc: '2.0', id, result: { resourceTemplates: [] } };
    if (method === 'prompts/list') return { jsonrpc: '2.0', id, result: { prompts: [] } };

    if (method === 'tools/call') {
        const toolName = String(params.name || '').trim();
        const toolArgs = params.arguments && typeof params.arguments === 'object' ? params.arguments : {};
        const toolDef = TOOLS.find((t) => t.name === toolName);
        if (!toolDef) {
            return { jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${toolName}` } };
        }
        for (const reqField of toolDef.inputSchema?.required || []) {
            if (toolArgs[reqField] === undefined || toolArgs[reqField] === null || String(toolArgs[reqField]).trim() === '') {
                return { jsonrpc: '2.0', id, error: { code: -32602, message: `Missing required parameter: ${reqField}` } };
            }
        }
        try {
            const toolResult = await executeApifyActor(toolName, toolArgs);
            return { jsonrpc: '2.0', id, result: toolResult };
        } catch (err) {
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify({ error: String(err?.message || err) }) }],
                    isError: true,
                },
            };
        }
    }

    return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

const isHttpMode = process.argv.includes('--http') || process.env.MCP_TRANSPORT === 'http';

if (isHttpMode) {
    const port = Number(process.env.PORT || 4321);
    const server = http.createServer(async (req, res) => {
        const urlPath = (req.url || '/').split('?')[0];
        if (req.method === 'GET' && (urlPath === '/' || urlPath === '/health')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION, tools: TOOLS.map((t) => t.name) }));
            return;
        }
        if (urlPath === '/mcp' && req.method === 'POST') {
            const chunks = [];
            for await (const ch of req) chunks.push(ch);
            let body;
            try {
                body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }));
                return;
            }
            const out = await handleRpcMessage(body);
            if (!out) {
                res.writeHead(202);
                res.end();
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(out));
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    });
    server.listen(port, '0.0.0.0', () => {
        console.error(`[${SERVER_NAME}] HTTP MCP server listening on 0.0.0.0:${port}/mcp`);
    });
} else {
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.on('line', async (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        } catch {
            process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
            return;
        }
        if (Array.isArray(parsed)) {
            const responses = [];
            for (const item of parsed) {
                const r = await handleRpcMessage(item);
                if (r) responses.push(r);
            }
            if (responses.length > 0) process.stdout.write(JSON.stringify(responses) + '\n');
            return;
        }
        const resp = await handleRpcMessage(parsed);
        if (resp) process.stdout.write(JSON.stringify(resp) + '\n');
    });
}
