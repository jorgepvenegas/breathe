# Railway + Turso Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the breathing app to Railway (API + Web services) with Turso cloud database using NIXPACKS.

**Architecture:** Two Railway services from one GitHub repo. API runs Hono.js with Prisma + Turso. Web is a static Vite build served by `serve`. NIXPACKS handles pnpm monorepo builds.

**Tech Stack:** Railway, NIXPACKS, Turso (libSQL), Prisma, Hono.js, Vue 3, Vite

---

### File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/src/lib/prisma.ts` | Modify | Add `authToken` to libSQL client for Turso cloud |
| `apps/web/src/lib/api.ts` | Modify | Use `import.meta.env.VITE_API_URL` instead of hardcoded localhost |
| `apps/web/package.json` | Modify | Add `serve` dependency for static hosting |
| `apps/web/.env.example` | Modify | Add `VITE_API_URL` example |
| `apps/api/railway.json` | Create | Railway service config for API |
| `apps/web/railway.json` | Create | Railway service config for Web |
| `nixpacks.toml` | Create | Root NIXPACKS config (pnpm + Node.js 20) |

---

### Task 0: Add authToken support to Prisma client

**Files:**
- Modify: `apps/api/src/lib/prisma.ts`

- [ ] **Step 1: Add optional authToken to libSQL client**

Replace the contents of `apps/api/src/lib/prisma.ts`:

```typescript
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
export const prisma = new PrismaClient({ adapter });
```

`authToken` is `undefined` for local file URLs (no token needed), and set from env for cloud Turso.

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/prisma.ts
git commit -m "feat: add Turso authToken support to libSQL client"
```

---

### Task 1: Make API URL configurable in frontend

**Files:**
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Replace hardcoded localhost with env var**

Replace the first line of `apps/web/src/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat: use VITE_API_URL env var for API base URL"
```

---

### Task 2: Add serve dependency for static hosting

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add serve to dependencies**

Add to `apps/web/package.json` inside `"dependencies"`:

```json
    "serve": "^14.2.0",
```

- [ ] **Step 2: Install**

```bash
cd apps/web && pnpm install
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "deps: add serve for static site hosting in production"
```

---

### Task 3: Update web .env.example

**Files:**
- Modify: `apps/web/.env.example` (create if missing)

- [ ] **Step 1: Create/update .env.example with VITE_API_URL**

```env
VITE_API_URL="http://localhost:3001"
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/.env.example
git commit -m "chore: add VITE_API_URL to web .env.example"
```

---

### Task 4: Create Railway config files

**Files:**
- Create: `apps/api/railway.json`
- Create: `apps/web/railway.json`
- Create: `nixpacks.toml`

- [ ] **Step 1: Create root nixpacks.toml**

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]
```

- [ ] **Step 2: Create API railway.json**

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

- [ ] **Step 3: Create Web railway.json**

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

- [ ] **Step 4: Commit**

```bash
git add nixpacks.toml apps/api/railway.json apps/web/railway.json
git commit -m "chore: add Railway NIXPACKS config for api and web services"
```

---

### Task 5: Verify TypeScript still compiles

**Files:**
- No file changes

- [ ] **Step 1: Lint API**

```bash
cd apps/api && pnpm lint
```

Expected: `tsc --noEmit` exits 0.

- [ ] **Step 2: Lint Web**

```bash
cd apps/web && pnpm lint
```

Expected: `vue-tsc --noEmit` exits 0.

- [ ] **Step 3: Commit checkpoint**

```bash
git commit --allow-empty -m "chore: verify TypeScript compiles after deployment prep changes"
```

---

### Task 6: Create Turso Database

**Files:**
- No file changes (external service setup)

- [ ] **Step 1: Create Turso database**

```bash
turso db create breath-prod --location lax
```

- [ ] **Step 2: Get database URL**

```bash
turso db show breath-prod --url
```

Save this as `TURSO_DATABASE_URL`.

- [ ] **Step 3: Get auth token**

```bash
turso db tokens create breath-prod
```

Save this as `TURSO_AUTH_TOKEN`.

- [ ] **Step 4: Apply migrations to Turso**

```bash
cd apps/api
TURSO_DATABASE_URL="<url-from-step-2>" \
TURSO_AUTH_TOKEN="<token-from-step-3>" \
pnpm prisma migrate deploy
```

- [ ] **Step 5: Seed built-in patterns**

```bash
TURSO_DATABASE_URL="<url>" \
TURSO_AUTH_TOKEN="<token>" \
pnpm prisma db seed
```

- [ ] **Step 6: Commit checkpoint**

```bash
git commit --allow-empty -m "chore: create Turso database and apply migrations/seed"
```

---

### Task 7: Push to GitHub

**Files:**
- No file changes

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

---

### Task 8: Create Railway Project and Services

**Files:**
- No file changes (Railway dashboard/CLI actions)

- [ ] **Step 1: Create Railway project**

```bash
railway login
railway init --name breath
```

- [ ] **Step 2: Connect GitHub repo**

In Railway dashboard:
- Project Settings → Source → GitHub
- Select the `breath` repo
- Enable auto-deploy on push (optional)

- [ ] **Step 3: Create API service**

In Railway dashboard:
- "New" → "Service" → "GitHub Repo"
- Select the repo
- Set **Root Directory** to `apps/api`
- Set **Builder** to `NIXPACKS`

- [ ] **Step 4: Create Web service**

In Railway dashboard:
- "New" → "Service" → "GitHub Repo"
- Select the repo
- Set **Root Directory** to `apps/web`
- Set **Builder** to `NIXPACKS`

---

### Task 9: Configure API Service Environment Variables

**Files:**
- No file changes (Railway dashboard/CLI actions)

- [ ] **Step 1: Set API service env vars**

In Railway dashboard → API service → Variables:

```
PORT=3001
TURSO_DATABASE_URL=<url from Task 6>
TURSO_AUTH_TOKEN=<token from Task 6>
BETTER_AUTH_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
BETTER_AUTH_URL=https://<api-service-domain>.up.railway.app
WEB_URL=https://<web-service-domain>.up.railway.app
```

Note: `WEB_URL` and `BETTER_AUTH_URL` require the web service to be deployed first to get its domain. You can update these after the web service deploys.

- [ ] **Step 2: Deploy API service**

In Railway dashboard → API service → Deploy

- [ ] **Step 3: Verify API health**

```bash
curl https://<api-domain>/health
```

Expected: `{"status":"ok"}`

---

### Task 10: Configure Web Service Environment Variables

**Files:**
- No file changes (Railway dashboard/CLI actions)

- [ ] **Step 1: Set Web service env vars**

In Railway dashboard → Web service → Variables:

```
VITE_API_URL=https://<api-service-domain>.up.railway.app
```

- [ ] **Step 2: Deploy Web service**

In Railway dashboard → Web service → Deploy

- [ ] **Step 3: Verify frontend loads**

Open `https://<web-domain>` in browser. Should show the landing page.

---

### Task 11: Final Verification

**Files:**
- No file changes

- [ ] **Step 1: Test API endpoints**

```bash
curl https://<api-domain>/patterns
```

Expected: JSON array with 3 built-in patterns.

- [ ] **Step 2: Test registration flow**

Open `https://<web-domain>/register`, create an account.

- [ ] **Step 3: Test breathing session**

Go to Dashboard, click "Start Session", verify animation works.

- [ ] **Step 4: Update CORS if needed**

If frontend can't reach API (CORS error), update `WEB_URL` env var on API service to match the actual web domain, then redeploy API.

- [ ] **Step 5: Commit checkpoint**

```bash
git commit --allow-empty -m "chore: verify full deployment on Railway + Turso"
```

---

## Self-Review

**Spec coverage:**
- ✅ Prisma authToken for Turso cloud → Task 0
- ✅ Frontend API URL via env var → Task 1
- ✅ Serve dependency for static hosting → Task 2
- ✅ Railway config files (NIXPACKS) → Task 4
- ✅ Turso database creation + migrations → Task 6
- ✅ Railway project + services setup → Tasks 8-10
- ✅ Environment variables for both services → Tasks 9-10
- ✅ Verification steps → Task 11

**Placeholder scan:** No TBD, TODO, or vague instructions. All commands are exact.

**Type consistency:** `VITE_API_URL` used consistently in web code and Railway config. `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` used consistently in prisma.ts and Railway env vars.
