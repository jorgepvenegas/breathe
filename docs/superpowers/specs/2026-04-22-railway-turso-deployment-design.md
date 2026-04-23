# Railway + Turso Deployment Design

## Context

The breathing app backend now uses SQLite via Prisma's libSQL driver adapter. We need to deploy the full stack to Railway (frontend + backend) with Turso as the cloud database.

## Goals

1. Deploy API to Railway as a Node.js service
2. Deploy web frontend to Railway as a static site
3. Use Turso cloud database for production SQLite
4. Keep local dev unchanged (local SQLite file)
5. Zero-downtime-ish: migrations run on deploy, no manual DB setup on Railway

## Non-Goals

- Docker (using NIXPACKS instead)
- SSR for frontend (static build served by `serve`)
- Custom domains (using Railway-generated domains)
- CI/CD pipeline (manual deploy via Railway dashboard)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Railway Web   │────▶│   Railway API   │────▶│  Turso (libSQL) │
│  (static SPA)   │     │  (Hono + Node)  │     │   (cloud DB)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

Two independent Railway services, one GitHub repo, NIXPACKS builder.

## Service Configuration

### API Service (`apps/api`)

- **Builder**: NIXPACKS
- **Build command**: `pnpm install && pnpm turbo run build --filter=@breath/api`
- **Start command**: `pnpm prisma migrate deploy && node dist/index.js`
- **Healthcheck**: `/health`
- **Root directory**: `apps/api`
- **Install command**: `cd ../.. && pnpm install` (monorepo-aware)

### Web Service (`apps/web`)

- **Builder**: NIXPACKS
- **Build command**: `pnpm install && pnpm turbo run build --filter=@breath/web`
- **Start command**: `npx serve dist -s -l $PORT`
- **Root directory**: `apps/web`
- **Install command**: `cd ../.. && pnpm install` (monorepo-aware)

### NIXPACKS Config

Railway auto-detects Node.js but needs to know about pnpm. We'll add a root `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]
```

## Code Changes Required

### 1. `apps/api/src/lib/prisma.ts` — Support auth token for Turso

The current file only passes `url`. For Turso cloud, we need `authToken` too. We'll make it conditional:

```typescript
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

`authToken` is `undefined` for local file URLs (no token needed), and set from env for cloud.

### 2. `apps/web/src/lib/api.ts` — Use env var for API URL

Replace hardcoded `http://localhost:3001` with `import.meta.env.VITE_API_URL`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
```

### 3. `apps/web/package.json` — Add `serve` dependency

Add `serve` as a dependency so `npx serve` works in production without installing globally.

### 4. `apps/web/.env.example` — Document frontend env var

Add `VITE_API_URL` example.

### 5. Railway config files

- `apps/api/railway.json` — API service config
- `apps/web/railway.json` — Web service config
- `nixpacks.toml` (root) — pnpm + Node.js 20 setup

## Environment Variables

### API Service (Railway)

| Variable | Value | Source |
|----------|-------|--------|
| `PORT` | `3001` | Railway auto-sets, but we use it |
| `TURSO_DATABASE_URL` | `libsql://breath-prod-xxx.turso.io` | Turso CLI |
| `TURSO_AUTH_TOKEN` | `eyJhbG...` | Turso CLI |
| `WEB_URL` | `https://breath-web.up.railway.app` | Railway (after web deploy) |
| `BETTER_AUTH_SECRET` | `generate-32-char-secret` | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | `https://breath-api.up.railway.app` | Railway domain |
| `GOOGLE_CLIENT_ID` | (optional) | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | (optional) | Google Cloud Console |

### Web Service (Railway)

| Variable | Value | Source |
|----------|-------|--------|
| `VITE_API_URL` | `https://breath-api.up.railway.app` | Railway domain |

## Deployment Steps

1. **Create Turso database**
   ```bash
   turso db create breath-prod --location lax
   turso db show breath-prod --url        # → TURSO_DATABASE_URL
   turso db tokens create breath-prod     # → TURSO_AUTH_TOKEN
   ```

2. **Apply code changes** (prisma.ts, api.ts, serve dep, railway.json files)

3. **Commit and push to GitHub**

4. **Create Railway project**
   - Connect GitHub repo
   - Create service for `apps/api`
   - Create service for `apps/web`
   - Set env vars for each service

5. **Deploy API service first**
   - Migrations run automatically (`prisma migrate deploy`)
   - Seed patterns manually via Railway shell or local Turso CLI

6. **Deploy web service**
   - Points to API via `VITE_API_URL`

7. **Update CORS / trusted origins**
   - Set `WEB_URL` on API service to web service's Railway domain
   - Update `BETTER_AUTH_URL` to API domain

8. **(Optional) Configure Google OAuth**
   - Add Railway domains to Google Cloud Console authorized origins

## Verification

- `curl https://<api-domain>/health` → `{"status":"ok"}`
- `curl https://<api-domain>/patterns` → returns seeded patterns
- Open `https://<web-domain>` → app loads, can register, start breathing session

## Rollback

- Re-deploy previous commit in Railway
- Turso database persists across deploys (stateful)
- No data loss on rollback since DB is external to Railway
