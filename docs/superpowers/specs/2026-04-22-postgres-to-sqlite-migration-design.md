# PostgreSQL to SQLite Migration Design

## Context

The breathing app backend currently uses PostgreSQL via Prisma. To prepare for Railway deployment with Turso (SQLite-compatible), we need to migrate the database layer to SQLite. This app has zero users and no production data, so this is a clean-slate migration.

## Goals

1. Replace PostgreSQL with SQLite (file-based for local dev)
2. Use Prisma's libSQL driver adapter for Turso compatibility
3. Update Better Auth adapter provider to SQLite
4. Regenerate migrations cleanly

## Non-Goals

- Turso cloud deployment (separate step after local migration works)
- Data migration (no data exists)
- Changes to frontend code
- Changes to API route logic

## Architecture Changes

### Package Dependencies

Add to `apps/api/package.json`:
- `@libsql/client` — libSQL client for SQLite/Turso
- `@prisma/adapter-libsql` — Prisma driver adapter

### Database Schema

The existing schema is already SQLite-compatible. Only the Prisma configuration changes:

**`prisma/schema.prisma` changes:**
- `generator client` → add `previewFeatures = ["driverAdapters"]`
- `datasource db` → change `provider = "postgresql"` to `provider = "sqlite"`
- `datasource db` → change `url = env("DATABASE_URL")` to `url = env("TURSO_DATABASE_URL")`

All model fields (`DateTime`, `Boolean`, `String`, `@default(cuid()`) work identically in SQLite.

### Prisma Client Initialization

**`src/lib/prisma.ts` changes:**
Replace direct `PrismaClient()` instantiation with libSQL adapter pattern:

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

Note: No `authToken` needed for local file-based SQLite (`file:./dev.db`).

### Authentication Adapter

**`src/lib/auth.ts` changes:**
Change `provider: "postgresql"` to `provider: "sqlite"` in the Better Auth adapter config.

### Environment Variables

**`apps/api/.env` changes:**
Replace:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/breath
```
With:
```
TURSO_DATABASE_URL=file:./dev.db
```

### Migrations

1. Delete existing `prisma/migrations/` directory (PostgreSQL migrations are invalid for SQLite)
2. Run `prisma migrate dev --name init` to generate fresh SQLite migration
3. Run `prisma db seed` to populate built-in breathing patterns

## Verification Steps

1. `pnpm install` in `apps/api` picks up new dependencies
2. `pnpm prisma generate` succeeds with driver adapters
3. `pnpm prisma migrate dev` creates SQLite migration
4. `pnpm prisma db seed` populates patterns
5. `pnpm dev` starts API server
6. `curl http://localhost:3001/health` returns `{"status":"ok"}`
7. `pnpm lint` passes (no TypeScript errors)

## Rollback Plan

Since no data exists, rollback is trivial:
1. Revert the commit
2. Delete `dev.db` file
3. Restore PostgreSQL `.env` value

## Future Turso Step

When ready for Railway + Turso:
1. Create Turso database: `turso db create breath-prod`
2. Update `.env`:
   ```
   TURSO_DATABASE_URL=libsql://breath-prod-xxx.turso.io
   TURSO_AUTH_TOKEN=xxx
   ```
3. Update `prisma.ts` to include `authToken` in `createClient()`
4. Run `prisma migrate deploy` against Turso URL
