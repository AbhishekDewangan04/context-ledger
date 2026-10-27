# Context Ledger

Context Ledger is split into two independently runnable applications:

- `frontend/` — Next.js landing page and dashboard.
- `backend/` — REST API, storage, bearer authentication, rate limiting, and MCP Streamable HTTP.
- `shared/` — API view types shared by both packages.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Set `CONTEXT_LEDGER_API_KEY` in `backend/.env`. Redis variables are optional locally; without them
the backend uses non-persistent in-memory storage.

## Run independently

Frontend:

```bash
npm run dev:frontend
# http://localhost:3000
```

Backend:

```bash
npm run dev:backend
# http://localhost:4000
```

Run both:

```bash
npm run dev
```

Set `frontend/.env.local` to point the browser at another backend:

```text
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

The backend allows the configured `FRONTEND_ORIGIN` and optional comma-separated
`CORS_ALLOWED_ORIGINS`.

## Checks

```bash
npm run typecheck
npm run build
npm run smoke
```

Package-specific commands are also available:

```bash
npm run typecheck --workspace context-ledger-frontend
npm run typecheck --workspace context-ledger-backend
npm run build --workspace context-ledger-frontend
npm run build --workspace context-ledger-backend
```

## Backend contracts

REST endpoints, all requiring `Authorization: Bearer <CONTEXT_LEDGER_API_KEY>` except health:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Storage health |
| GET | `/api/projects` | List active projects |
| GET | `/api/projects/:id` | Project detail, entries, budget, handoff |
| POST | `/api/projects/:id/archive` | Archive a project |
| GET | `/api/projects/:id/export` | Download handoff Markdown |
| GET/POST | `/api/mcp` | MCP Streamable HTTP |

MCP capabilities are unchanged: `create_project`, `log_decision`, `log_progress`, `check_budget`,
`get_handoff_summary`, `list_projects`, `archive_project`, and the `resume_project` prompt.

The MCP endpoint is now served by the backend directly:

```text
http://localhost:4000/api/mcp
```

## Environment variables

Frontend variables are public browser configuration only:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_SITE_URL`

Backend-only variables:

- `PORT`
- `FRONTEND_ORIGIN`
- `CORS_ALLOWED_ORIGINS`
- `CONTEXT_LEDGER_API_KEY`
- `CONTEXT_LEDGER_API_KEYS`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Do not put backend secrets in `frontend/.env.local` or use `NEXT_PUBLIC_` for secrets.
