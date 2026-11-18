[![Glama MCP Server](https://glama.ai/mcp/servers/willowswt/reddit-intelligence-mcp/badges/score.svg)](https://glama.ai/mcp/servers/willowswt/reddit-intelligence-mcp) [![Apify Store](https://img.shields.io/badge/Apify_Store-reddit_scraper_fast-00C853?logo=apify&logoColor=white)](https://apify.com/church_of_loujess/reddit-scraper-fast) [![MCP Protocol](https://img.shields.io/badge/MCP-2025--06--18_Streamable_HTTP_%26_stdio-blue)](https://modelcontextprotocol.io) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Reddit Subreddit, Comments & Buyer-Intent OSINT MCP Server

MCP server for high-speed Reddit subreddit extraction, comment thread scraping, RAG Markdown generation, and B2B buyer-intent lead scoring via Apify.

> **Hosted Apify MCP Gateway URL:** `https://mcp.apify.com/?actors=church_of_loujess/reddit-scraper-fast`  
> **Get Your Free API Token (`$5.00/mo` Free Credit Included):** [Apify Console -> Settings -> Integrations](https://console.apify.com/settings/integrations)  
> **Primary Apify Store Actor:** [https://apify.com/church_of_loujess/reddit-scraper-fast](https://apify.com/church_of_loujess/reddit-scraper-fast)

## Included MCP Tools

| Tool Name | Backing Apify Actor | Description |
| :--- | :--- | :--- |
| `scrape_reddit_posts_and_comments` | `reddit-scraper-fast` | Extract Reddit posts, upvote ratios, top comments, outbound links, and RAG-ready Markdown from subreddits or search queries. |
| `find_reddit_buyer_intent_leads` | `reddit-scraper-fast` | Filter Reddit discussions for high-intent B2B buying and software recommendation requests (buyerIntentScore >= 25). |

## Quick Start (Claude Desktop, Cursor, Windsurf, VS Code)

### Option 1: Local `stdio` via `npx`
```json
{
  "mcpServers": {
    "reddit-intelligence-mcp": {
      "command": "npx",
      "args": ["-y", "github:willowswt/reddit-intelligence-mcp"],
      "env": {
        "APIFY_API_TOKEN": "<YOUR_APIFY_API_TOKEN>"
      }
    }
  }
}
```

### Option 2: Remote Hosted Apify MCP Gateway (Zero Install)
```json
{
  "mcpServers": {
    "reddit-intelligence-mcp": {
      "url": "https://mcp.apify.com/?actors=church_of_loujess/reddit-scraper-fast",
      "headers": {
        "Authorization": "Bearer <YOUR_APIFY_API_TOKEN>"
      }
    }
  }
}
```

## Free Trial vs. Paid Apify Plan

- **Apify Free Tier (`$5.00/mo` included credit):** Returns up to `5` items per run (`items 1-2` 100% unmasked, `items 3-5` preview-masked) so you can verify live email/data quality risk-free.
- **Apify Starter (`$29/mo`) & Higher:** Unlocks unlimited batch sizes (`1,000+` items), `100%` unmasked emails and payloads, and up to `76%` lower per-item rates. Upgrade anytime at [https://console.apify.com/billing/subscription](https://console.apify.com/billing/subscription).
