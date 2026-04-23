# PostgreSQL to SQLite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the backend database layer from PostgreSQL to SQLite (file-based) using Prisma's libSQL driver adapter, preparing for future Turso deployment.

**Architecture:** Replace `PrismaClient` direct instantiation with `@prisma/adapter-libsql` wrapped around `@libsql/client`. Switch Prisma schema provider to `sqlite`. Update Better Auth adapter config. Zero data migration needed.

**Tech Stack:** Prisma 5, `@libsql/client`, `@prisma/adapter-libsql`, Better Auth, Hono, SQLite

---

### File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/package.json` | Modify | Add `@libsql/client` and `@prisma/adapter-libsql` dependencies |
| `apps/api/prisma/schema.prisma` | Modify | Change provider to `sqlite`, add `driverAdapters` preview feature |
| `apps/api/src/lib/prisma.ts` | Rewrite | Use libSQL adapter instead of direct `PrismaClient()` |
| `apps/api/src/lib/auth.ts` | Modify | Change `provider: "postgresql"` → `provider: "sqlite"` |
| `apps/api/.env` | Modify | Replace `DATABASE_URL` with `TURSO_DATABASE_URL=file:./dev.db` |
| `apps/api/prisma/migrations/` | Delete + regenerate | Remove PostgreSQL migrations, create fresh SQLite init migration |
| `apps/api/prisma/seed.ts` | No changes | Already SQLite-compatible |
| `apps/api/.env.example` | Modify | Update example env to match new variable name |

---

### Task 0: Delete Existing Migrations

**Files:**
- Delete: `apps/api/prisma/migrations/`

- [ ] **Step 1: Remove old PostgreSQL migrations**

```bash
rm -rf apps/api/prisma/migrations
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: delete PostgreSQL migrations before SQLite switch"
```

---

### Task 1: Install libSQL Dependencies

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Add dependencies to `apps/api/package.json`**

Add inside `"dependencies"`:

```json
    "@libsql/client": "^0.15.0",
    "@prisma/adapter-libsql": "^6.6.0",
```

- [ ] **Step 2: Install packages**

```bash
cd apps/api && pnpm install
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
 git commit -m "deps: add @libsql/client and @prisma/adapter-libsql"
```

---

### Task 2: Update Prisma Schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Update generator and datasource**

Replace the top of `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("TURSO_DATABASE_URL")
}
```

- [ ] **Step 2: Regenerate Prisma client**

```bash
cd apps/api && pnpm prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma
 git commit -m "chore: switch Prisma schema from postgresql to sqlite with driverAdapters"
```

---

### Task 3: Rewrite Prisma Client Initialization

**Files:**
- Rewrite: `apps/api/src/lib/prisma.ts`

- [ ] **Step 1: Replace `prisma.ts` with libSQL adapter**

```typescript
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
});

const adapter = new PrismaLibSQL(libsql);
export const prisma = new PrismaClient({ adapter });
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/prisma.ts
 git commit -m "feat: use libSQL adapter for PrismaClient"
```

---

### Task 4: Update Better Auth Provider

**Files:**
- Modify: `apps/api/src/lib/auth.ts`

- [ ] **Step 1: Change provider string**

Replace:

```typescript
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
```

With:

```typescript
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/auth.ts
 git commit -m "chore: update Better Auth adapter provider to sqlite"
```

---

### Task 5: Update Environment Variables

**Files:**
- Modify: `apps/api/.env`
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Update `.env`**

Replace `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/breath` with:

```env
TURSO_DATABASE_URL=file:./dev.db
```

Keep all other existing variables (`PORT`, `WEB_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`).

- [ ] **Step 2: Update `.env.example`**

Replace `DATABASE_URL=...` with:

```env
TURSO_DATABASE_URL=file:./dev.db
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/.env apps/api/.env.example
 git commit -m "chore: update env vars for SQLite (TURSO_DATABASE_URL)"
```

---

### Task 6: Create Fresh SQLite Migration

**Files:**
- Create: `apps/api/prisma/migrations/...`

- [ ] **Step 1: Create migration**

```bash
cd apps/api && pnpm prisma migrate dev --name init
```

When prompted about data loss, confirm (no data exists).

- [ ] **Step 2: Verify migration files were created**

```bash
ls apps/api/prisma/migrations/
```

Expected: a directory like `20260422xxxxxx_init/` containing `migration.sql`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/migrations/
 git commit -m "chore: generate fresh SQLite init migration"
```

---

### Task 7: Seed Database

**Files:**
- No file changes (seed script is already SQLite-compatible)

- [ ] **Step 1: Run seed script**

```bash
cd apps/api && pnpm prisma db seed
```

- [ ] **Step 2: Verify seed worked**

```bash
cd apps/api && sqlite3 dev.db "SELECT name FROM BreathingPattern;"
```

Expected: `Box Breathing`, `4-7-8 Relax`, `Coherent Breathing`

- [ ] **Step 3: Commit (empty commit to mark checkpoint)**

```bash
git commit --allow-empty -m "chore: seed SQLite database with built-in patterns"
```

---

### Task 8: Verify TypeScript Compilation

**Files:**
- No file changes

- [ ] **Step 1: Run API lint**

```bash
cd apps/api && pnpm lint
```

Expected: `tsc --noEmit` exits with code 0.

- [ ] **Step 2: Run API build**

```bash
cd apps/api && pnpm build
```

Expected: `tsc` compiles without errors.

- [ ] **Step 3: Commit (empty checkpoint)**

```bash
git commit --allow-empty -m "chore: verify TypeScript compiles after SQLite migration"
```

---

### Task 9: Runtime Verification

**Files:**
- No file changes

- [ ] **Step 1: Start the dev server**

```bash
cd apps/api && pnpm dev &
```

- [ ] **Step 2: Test health endpoint**

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Test patterns endpoint**

```bash
curl http://localhost:3001/patterns
```

Expected: JSON array containing the 3 seeded patterns.

- [ ] **Step 4: Stop the server**

```bash
kill %1
```

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "chore: verify runtime works with SQLite backend"
```

---

## Self-Review

**Spec coverage:**
- ✅ Package dependencies added → Task 1
- ✅ Prisma schema updated (provider, previewFeatures) → Task 2
- ✅ Prisma client initialization rewritten with adapter → Task 3
- ✅ Better Auth provider changed to sqlite → Task 4
- ✅ Environment variables updated → Task 5
- ✅ Migrations deleted and regenerated → Tasks 0, 6
- ✅ Seed runs successfully → Task 7
- ✅ TypeScript compilation verified → Task 8
- ✅ Runtime verification → Task 9

**Placeholder scan:** No TBD, TODO, or vague instructions found. All code blocks contain complete code.

**Type consistency:** `TURSO_DATABASE_URL` used consistently in schema, prisma.ts, and env files. `provider: "sqlite"` used in both schema and auth.ts.
