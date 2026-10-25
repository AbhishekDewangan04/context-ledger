# Context Ledger

A remote MCP server that gives AI clients persistent project memory — plus the landing page and
dashboard that make it visible.

Next.js App Router + TypeScript + Tailwind v4, Streamable HTTP at `POST /api/mcp`, Vercel-ready.

## Run

```bash
cd context-ledger
npm install
cp .env.example .env.local         # set CONTEXT_LEDGER_API_KEY
npm run seed                       # optional: seed a demo project for the dashboard
npm run dev                        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Type check: `npm run typecheck`

## Environment

| Variable | Purpose |
| --- | --- |
| `CONTEXT_LEDGER_API_KEY` | Required. Every request must send `Authorization: Bearer <value>`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis storage (Upstash). |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Redis storage (Vercel KV), used when the Upstash pair is absent. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and OG tags (falls back to `VERCEL_URL`, then localhost). |

Without Redis variables, local development falls back to in-memory storage (not durable, lost on
restart). On a hosted deployment (`VERCEL_ENV=production` or `preview`) requests fail with a clear
`storage_unavailable` error instead of losing data silently.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page: 3D memory core, how it works, the seven tools, connect snippet. |
| `/dashboard` | API-key gate (sessionStorage) → every project, polling every 10s. |
| `/dashboard/[id]` | Entry timeline, 3D budget gauge, markdown handoff with copy + download. |

The dashboard reads the REST routes below with the same bearer key. It never stores the key
server-side — it lives in that tab's session storage.

## MCP tools & prompts

| Tool | Arguments | Returns |
| --- | --- | --- |
| `create_project` | `name`, `goal` | The `project_id` used by every other tool. |
| `list_projects` | — | Non-archived projects with goal, updated_at, entry count and latest budget action. |
| `archive_project` | `project_id` | Hides the project from listings and the dashboard. |
| `log_decision` | `project_id`, `decision`, `reason` | The stored decision entry. |
| `log_progress` | `project_id`, `built`, `broken?`, `next?` | The stored progress / issue / next entries. |
| `check_budget` | `project_id`, `tokens_used`, `token_limit` | Percent used and the action: `continue` (<80%), `warn` (80-89%), `stop_and_summarize` (>=90%). |
| `get_handoff_summary` | `project_id` | Capped markdown across six sections, keeping newest entries with omitted count. |

| Prompt | Arguments | Purpose |
| --- | --- | --- |
| `resume_project` | `project_id` | Instructs the agent to read handoff, prioritize Fix/Build Next, and check budget regularly. |

Client configuration:

```json
{
  "mcpServers": {
    "context-ledger": {
      "url": "https://your-app.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer <CONTEXT_LEDGER_API_KEY>" }
    }
  }
}
```

## REST (what the dashboard calls)

| Route | Returns |
| --- | --- |
| `GET /api/projects` | `{ projects: [{ id, name, goal, created_at, updated_at, entry_count, latest_budget }] }` |
| `GET /api/projects/{id}` | `{ project, entries, latest_budget, summary }` |

## Verify

```bash
BASE=http://localhost:3000
KEY=$CONTEXT_LEDGER_API_KEY
AUTH="Authorization: Bearer $KEY"

# 401 without a key
curl -s -o /dev/null -w "%{http_code}\n" $BASE/api/projects
curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/api/mcp \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# tools/list returns exactly 7 tools
curl -s $BASE/api/mcp -H "$AUTH" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 91% of the budget returns stop_and_summarize (use a real project_id)
curl -s $BASE/api/mcp -H "$AUTH" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"check_budget","arguments":{"project_id":"<id>","tokens_used":91000,"token_limit":100000}}}'

# the dashboard payloads
curl -s $BASE/api/projects -H "$AUTH"
curl -s $BASE/api/projects/<id> -H "$AUTH"
```

## Design system

Tokens are defined once in `app/globals.css` under `@theme` and consume from every component:
`--color-base` (#07070D), `--color-violet` (#7C3AED), `--color-cyan` (#22D3EE), plus ink/faint/line,
`--radius-card`, and the Space Grotesk + Inter faces loaded through `next/font`.

Entry colours and the budget thresholds live in `lib/presentation.ts` so the DOM and the 3D materials
read the same values.

3D notes: every scene is pulled in with `next/dynamic` (`ssr: false`). `components/three/Scene3D.tsx`
caps DPR and lowers particle counts on small or low-core devices, and swaps in a static gradient when
WebGL is unavailable or `prefers-reduced-motion` is set. Canvases sit in fixed-height boxes, so
nothing shifts when they mount.

## Deploy to Vercel

1. Import the repository, set **Root Directory** to `context-ledger`.
2. Add `CONTEXT_LEDGER_API_KEY`, the Redis pair, and `NEXT_PUBLIC_SITE_URL`.
3. Deploy. The MCP endpoint is then `https://<your-app>/api/mcp`.

## Layout

```
context-ledger/
├── app/
│   ├── api/mcp/route.ts            # MCP server (7 tools, 1 prompt), bearer auth
│   ├── api/projects/route.ts       # REST: list projects
│   ├── api/projects/[id]/route.ts  # REST: project detail + summary
│   ├── dashboard/page.tsx          # projects
│   ├── dashboard/[id]/page.tsx     # project detail
│   ├── page.tsx  layout.tsx  template.tsx  globals.css  opengraph-image.tsx
├── components/
│   ├── landing/                    # hero, problem, steps, tools, connect, CTA, footer, nav
│   ├── dashboard/                  # gate, cards, timeline, budget panel, handoff
│   ├── three/                      # Scene3D, MemoryCore, BudgetGauge, quality probe
│   └── ui/                         # magnetic button, copy button, reveal, icons
├── lib/
│   ├── ledger.ts                   # all storage + domain logic
│   ├── api.ts  api-key.ts  presentation.ts
│   └── hooks/use-ledger-data.ts    # 10s polling
├── scripts/seed.ts
└── .env.example
```

Auth is a static bearer key, not OAuth, so no protected-resource metadata is served. If you later add
OAuth, swap the guard in `app/api/mcp/route.ts` for `withMcpAuth` from `mcp-handler` — the tool
definitions stay as they are.

React is pinned to `19.3.1` rather than a caret range because `@react-three/fiber` peers to
`>=19 <19.4`.