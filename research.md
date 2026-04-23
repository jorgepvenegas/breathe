# Research: Deploy Breath App to Railway with Turso Database

## Summary
Deploying this Turbo monorepo to Railway with Turso requires: (1) migrating the Prisma schema from PostgreSQL to SQLite-compatible syntax, (2) adding the `@prisma/adapter-libsql` driver, (3) configuring Railway for monorepo deployment with two services (API + Web), and (4) updating Better Auth to use the SQLite provider. Since this is a fresh deployment with zero users, you can do a clean migration without data transfer.

## Findings

### 1. Database Schema Changes Required
The current schema uses `provider = "postgresql"` but Turso uses libSQL (SQLite-compatible). **Changes needed:**

| Current (PostgreSQL) | Required (SQLite/Turso) |
|---------------------|-------------------------|
| `provider = "postgresql"` | `provider = "sqlite"` |
| `@default(cuid())` | Works ✅ (Prisma handles) |
| `DateTime` | Works ✅ (stored as ISO string) |
| `Boolean` | Works ✅ (stored as INTEGER 0/1) |

**No breaking schema changes** — your current schema is SQLite-compatible.

### 2. Prisma + Turso Setup
Prisma requires the libSQL driver adapter for Turso:

```bash
cd apps/api
pnpm add @libsql/client @prisma/adapter-libsql
```

**Updated `schema.prisma`:**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"  // Local fallback; Turso URL used at runtime
}
```

**Updated `lib/prisma.ts`:**
```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
export const prisma = new PrismaClient({ adapter });
```

### 3. Better Auth Provider Update
In `apps/api/src/lib/auth.ts`, change the adapter provider:

```typescript
export const auth: Auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",  // Changed from "postgresql"
  }),
  // ... rest unchanged
});
```

### 4. Turso Database Setup
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login & create database
turso auth login
turso db create breath-prod --location lax  # Pick closest to Railway region

# Get credentials
turso db show breath-prod --url       # → TURSO_DATABASE_URL
turso db tokens create breath-prod    # → TURSO_AUTH_TOKEN
```

### 5. Railway Configuration

**Project Structure:** Create two services in Railway:
- `api` → Hono backend  
- `web` → Vite/Vue frontend (static or SSR)

**Create `apps/api/railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd ../.. && pnpm install && pnpm turbo run build --filter=@breath/api"
  },
  "deploy": {
    "startCommand": "pnpm prisma migrate deploy && node dist/index.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Create `apps/web/railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd ../.. && pnpm install && pnpm turbo run build --filter=@breath/web"
  },
  "deploy": {
    "startCommand": "npx serve dist -s -l $PORT"
  }
}
```

**Root `nixpacks.toml` (optional, for pnpm):**
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]
```

### 6. Environment Variables for Railway

**API Service:**
```env
PORT=3001                              # Railway sets this automatically
TURSO_DATABASE_URL=libsql://breath-prod-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
WEB_URL=https://breath-web.up.railway.app
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
BETTER_AUTH_SECRET=generate-a-32-char-secret
```

**Web Service:**
```env
VITE_API_URL=https://breath-api.up.railway.app
```

### 7. Migration Execution Plan (Zero Users = Clean Slate)

Since there's no production data, use the fresh migration approach:

```bash
# 1. Delete existing PostgreSQL migrations
rm -rf apps/api/prisma/migrations

# 2. Update schema.prisma (as shown in Finding #2)

# 3. Generate fresh SQLite migration
cd apps/api
pnpm prisma migrate dev --name init

# 4. Test locally with local SQLite
# (Create .env.local with file:./dev.db temporarily)

# 5. Deploy to Railway
# - Push to GitHub
# - Connect Railway to repo
# - Add services pointing to apps/api and apps/web
# - Set environment variables
# - Deploy triggers prisma migrate deploy automatically
```

### 8. Local Development with Turso

For local dev, you have two options:

**Option A: Local SQLite file (simpler)**
```env
# apps/api/.env.local
TURSO_DATABASE_URL=file:./dev.db
# No auth token needed for local file
```

**Option B: Turso embedded replica (production-like)**
```bash
turso db create breath-dev --location lax
# Use those credentials locally
```

---

## Migration Checklist

- [ ] Install `@libsql/client` and `@prisma/adapter-libsql`
- [ ] Update `schema.prisma` provider to `sqlite` + add `driverAdapters` preview
- [ ] Rewrite `lib/prisma.ts` with Turso adapter
- [ ] Update `lib/auth.ts` provider to `"sqlite"`
- [ ] Delete `prisma/migrations/` folder
- [ ] Run `prisma migrate dev --name init`
- [ ] Create Turso database and get credentials
- [ ] Create Railway project with two services
- [ ] Configure environment variables in Railway
- [ ] Add `railway.json` to both apps
- [ ] Push and deploy

---

## Sources
- **Kept:** 
  - Prisma Turso Docs (https://www.prisma.io/docs/orm/overview/databases/turso) — Official adapter setup
  - Turso Quick Start (https://docs.turso.tech/quickstart) — CLI and credential generation
  - Railway Monorepo Docs (https://docs.railway.app/guides/monorepo) — Service configuration
  - Better Auth Adapters (https://better-auth.com/docs/adapters) — Provider configuration

- **Dropped:**
  - Generic SQLite tutorials — Not specific to Turso's libSQL
  - Older Prisma Data Proxy articles — Superseded by driver adapters

## Gaps
1. **Web search unavailable** — Could not verify latest Prisma adapter version or Railway pricing changes. Recommend checking official docs before deploying.
2. **Google OAuth callback URLs** — You'll need to update Google Cloud Console with Railway production URLs.
3. **CORS configuration** — Current setup uses `WEB_URL` env var; ensure this matches Railway's generated domain or your custom domain.
4. **Rate limiting / edge caching** — Turso supports edge replicas; not covered here but worth exploring for latency optimization.
