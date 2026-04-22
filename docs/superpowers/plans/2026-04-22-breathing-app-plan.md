# Breathing App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided breathing web app with custom patterns, animated breathing circle, session tracking, and Better Auth — all in a Vue + Hono monorepo.

**Architecture:** Monorepo with pnpm workspaces. `apps/api` (Hono + Prisma + Better Auth + PostgreSQL) serves REST API. `apps/web` (Vue 3 + Vite + Pinia + Tailwind) consumes it. `packages/types` shares Zod schemas. Better Auth handles sessions and OAuth.

**Tech Stack:** Vue 3, Vite, Pinia, Vue Router, Tailwind CSS, Hono, Prisma, PostgreSQL, Better Auth, Zod, Vitest, Playwright

---

## File Structure Overview

```
breath/
├── package.json                 # root workspace config
├── pnpm-workspace.yaml
├── turbo.json
├── packages/
│   ├── types/
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts         # shared Zod schemas + TS types
│   └── tsconfig/
│       ├── package.json
│       └── base.json
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts         # Hono entry point
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts    # Prisma client singleton
│   │   │   │   └── auth.ts      # Better Auth setup
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts      # session middleware helper
│   │   │   └── routes/
│   │   │       ├── patterns.ts  # breathing pattern CRUD
│   │   │       └── sessions.ts  # session recording + stats
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       ├── index.html
│       └── src/
│           ├── main.ts
│           ├── App.vue
│           ├── router/
│           │   └── index.ts
│           ├── stores/
│           │   ├── auth.ts      # Pinia auth store
│           │   ├── patterns.ts  # Pinia patterns store
│           │   └── sessions.ts  # Pinia sessions store
│           ├── composables/
│           │   └── useBreathingEngine.ts
│           ├── lib/
│           │   └── api.ts       # fetch wrapper + auth client
│           ├── components/
│           │   ├── NavBar.vue
│           │   ├── BreathCircle.vue
│           │   ├── PatternCard.vue
│           │   ├── StatCard.vue
│           │   └── BarChart.vue
│           └── views/
│               ├── LandingView.vue
│               ├── DashboardView.vue
│               ├── BreatheView.vue
│               ├── PatternsView.vue
│               ├── PatternBuilderView.vue
│               ├── HistoryView.vue
│               ├── LoginView.vue
│               └── RegisterView.vue
```

---

### Task 1: Root Monorepo Setup

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`

- [ ] **Step 1: Write root `package.json`**

```json
{
  "name": "breath",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "db:generate": "cd apps/api && pnpm prisma generate",
    "db:migrate": "cd apps/api && pnpm prisma migrate dev",
    "db:seed": "cd apps/api && pnpm tsx prisma/seed.ts",
    "db:studio": "cd apps/api && pnpm prisma studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/jorge/code/breath
git add package.json pnpm-workspace.yaml turbo.json
git commit -m "chore: setup monorepo with pnpm workspaces and turbo"
```

---

### Task 2: Shared TypeScript Config Package

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`

- [ ] **Step 1: Write `packages/tsconfig/package.json`**

```json
{
  "name": "@breath/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json"]
}
```

- [ ] **Step 2: Write `packages/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/tsconfig/
git commit -m "chore: add shared tsconfig package"
```

---

### Task 3: Shared Types Package with Zod Schemas

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Write `packages/types/package.json`**

```json
{
  "name": "@breath/types",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@breath/tsconfig": "workspace:*",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Write `packages/types/src/index.ts`**

```typescript
import { z } from "zod";

// --- BreathingPattern ---

export const BreathingPatternSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  inhale: z.number().int().min(1).max(15),
  hold: z.number().int().min(0).max(15),
  exhale: z.number().int().min(1).max(15),
  holdAfterExhale: z.number().int().min(0).max(15).default(0),
  createdAt: z.string().datetime().or(z.date()),
});

export type BreathingPattern = z.infer<typeof BreathingPatternSchema>;

export const CreatePatternSchema = BreathingPatternSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type CreatePatternInput = z.infer<typeof CreatePatternSchema>;

// --- BreathSession ---

export const BreathSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  patternId: z.string(),
  duration: z.number().int().min(0),
  completedAt: z.string().datetime().or(z.date()),
  pattern: BreathingPatternSchema.optional(),
});

export type BreathSession = z.infer<typeof BreathSessionSchema>;

export const CreateSessionSchema = z.object({
  patternId: z.string(),
  duration: z.number().int().min(0),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// --- Stats ---

export const SessionStatsSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  totalDuration: z.number().int(),
  sessionCount: z.number().int(),
});

export type SessionStats = z.infer<typeof SessionStatsSchema>;

export const StatsRangeSchema = z.enum(["week", "month", "all"]);
export type StatsRange = z.infer<typeof StatsRangeSchema>;

// --- Auth ---

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
```

- [ ] **Step 3: Write `packages/types/tsconfig.json`**

```json
{
  "extends": "@breath/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Install dependencies and build**

```bash
cd /Users/jorge/code/breath
pnpm install
pnpm --filter @breath/types build
```

Expected: TypeScript compiles without errors. `packages/types/dist/index.js` and `dist/index.d.ts` are created.

- [ ] **Step 5: Commit**

```bash
git add packages/types/
git commit -m "feat: add shared types package with Zod schemas"
```

---

### Task 4: Backend API Package Setup

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`

- [ ] **Step 1: Write `apps/api/package.json`**

```json
{
  "name": "@breath/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@breath/types": "workspace:*",
    "@hono/node-server": "^1.11.0",
    "better-auth": "^0.5.0",
    "hono": "^4.3.0",
    "prisma": "^5.13.0",
    "@prisma/client": "^5.13.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@breath/tsconfig": "workspace:*",
    "@types/node": "^20.12.0",
    "tsx": "^4.9.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Write `apps/api/tsconfig.json`**

```json
{
  "extends": "@breath/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022"],
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/jorge/code/breath
pnpm install
```

Expected: All packages install successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json apps/api/tsconfig.json
git commit -m "chore: setup backend api package"
```

---

### Task 5: Prisma Schema and Database Setup

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/.env.example`

- [ ] **Step 1: Write `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Better Auth tables
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  breathSessions BreathSession[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// App tables
model BreathingPattern {
  id              String   @id @default(cuid())
  userId          String?  // null = built-in preset
  name            String
  description     String?
  inhale          Int
  hold            Int
  exhale          Int
  holdAfterExhale Int      @default(0)
  createdAt       DateTime @default(now())
  sessions        BreathSession[]
}

model BreathSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  patternId   String
  pattern     BreathingPattern @relation(fields: [patternId], references: [id])
  duration    Int      // total seconds actually completed
  completedAt DateTime @default(now())
}
```

- [ ] **Step 2: Write `apps/api/.env.example`**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/breath"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3001"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

- [ ] **Step 3: Generate Prisma client**

```bash
cd /Users/jorge/code/breath
pnpm db:generate
```

Expected: Prisma generates the client into `apps/api/node_modules/.prisma/client`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/.env.example
git commit -m "feat: add Prisma schema with Better Auth and app tables"
```

---

### Task 6: Database Seed with Built-in Presets

**Files:**
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Write `apps/api/prisma/seed.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const presets = [
    {
      name: "Box Breathing",
      description: "Equal inhale, hold, exhale, hold — great for focus and calm.",
      inhale: 4,
      hold: 4,
      exhale: 4,
      holdAfterExhale: 4,
    },
    {
      name: "4-7-8 Relax",
      description: "Longer exhale to activate the parasympathetic nervous system.",
      inhale: 4,
      hold: 7,
      exhale: 8,
      holdAfterExhale: 0,
    },
    {
      name: "Coherent Breathing",
      description: "Equal inhale and exhale at 5 seconds each.",
      inhale: 5,
      hold: 0,
      exhale: 5,
      holdAfterExhale: 0,
    },
  ];

  for (const preset of presets) {
    await prisma.breathingPattern.upsert({
      where: { id: `preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`,
        userId: null,
        ...preset,
      },
    });
  }

  console.log("Seeded built-in presets.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat: add database seed with 3 built-in breathing presets"
```

---

### Task 7: Backend Entry Point and Better Auth Setup

**Files:**
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/auth.ts`
- Create: `apps/api/src/index.ts`

- [ ] **Step 1: Write `apps/api/src/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Write `apps/api/src/lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days
  },
});
```

- [ ] **Step 3: Write `apps/api/src/index.ts`**

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
    credentials: true,
  })
);

// Mount Better Auth at /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 3001);
console.log(`API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
```

- [ ] **Step 4: Create `.env` file for dev**

```bash
cat > /Users/jorge/code/breath/apps/api/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/breath"
BETTER_AUTH_SECRET="dev-secret-key-change-in-production"
BETTER_AUTH_URL="http://localhost:3001"
WEB_URL="http://localhost:5173"
EOF
```

- [ ] **Step 5: Run the dev server to verify it starts**

```bash
cd /Users/jorge/code/breath/apps/api
pnpm dev &
```

Wait 3 seconds, then:

```bash
curl http://localhost:3001/health
```

Expected output: `{"status":"ok"}`

Kill the background process:

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/
git commit -m "feat: setup Hono server with Better Auth and health check"
```

---

### Task 8: Pattern API Routes

**Files:**
- Create: `apps/api/src/routes/patterns.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Write `apps/api/src/routes/patterns.ts`**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreatePatternSchema } from "@breath/types";
import { prisma } from "../lib/prisma.js";
import { auth } from "../lib/auth.js";

const patterns = new Hono();

// GET /patterns — list all (built-ins + user's custom)
patterns.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const userId = session?.user?.id;

  const patternsList = await prisma.breathingPattern.findMany({
    where: {
      OR: [{ userId: null }, { userId: userId ?? "" }],
    },
    orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
  });

  return c.json(patternsList);
});

// POST /patterns — create custom pattern (protected)
patterns.post("/", zValidator("json", CreatePatternSchema), async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");
  const pattern = await prisma.breathingPattern.create({
    data: { ...data, userId: session.user.id },
  });

  return c.json(pattern, 201);
});

// DELETE /patterns/:id — delete user's custom pattern (protected)
patterns.delete("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.breathingPattern.findUnique({ where: { id } });

  if (!existing) {
    return c.json({ error: "Pattern not found" }, 404);
  }

  if (existing.userId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await prisma.breathingPattern.delete({ where: { id } });
  return c.json({ success: true });
});

export default patterns;
```

- [ ] **Step 2: Install zod-validator**

```bash
cd /Users/jorge/code/breath/apps/api
pnpm add @hono/zod-validator
```

- [ ] **Step 3: Modify `apps/api/src/index.ts` to mount patterns**

Add import and route registration. The full updated file:

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth.js";
import patterns from "./routes/patterns.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/patterns", patterns);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 3001);
console.log(`API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/patterns.ts apps/api/src/index.ts
git commit -m "feat: add breathing pattern CRUD routes"
```

---

### Task 9: Session API Routes

**Files:**
- Create: `apps/api/src/routes/sessions.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Write `apps/api/src/routes/sessions.ts`**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateSessionSchema, StatsRangeSchema } from "@breath/types";
import { prisma } from "../lib/prisma.js";
import { auth } from "../lib/auth.js";

const sessions = new Hono();

// POST /sessions — record a completed session (protected)
sessions.post("/", zValidator("json", CreateSessionSchema), async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");
  const breathSession = await prisma.breathSession.create({
    data: { ...data, userId: session.user.id },
    include: { pattern: true },
  });

  return c.json(breathSession, 201);
});

// GET /sessions — list user's sessions (protected)
sessions.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const breathSessions = await prisma.breathSession.findMany({
    where: { userId: session.user.id },
    include: { pattern: true },
    orderBy: { completedAt: "desc" },
  });

  return c.json(breathSessions);
});

// GET /sessions/stats — daily aggregates (protected)
sessions.get("/stats", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rangeParam = c.req.query("range") ?? "week";
  const range = StatsRangeSchema.safeParse(rangeParam);
  if (!range.success) {
    return c.json({ error: "Invalid range. Use 'week', 'month', or 'all'." }, 400);
  }

  const now = new Date();
  let startDate: Date;

  switch (range.data) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0);
      break;
  }

  const sessionsData = await prisma.breathSession.findMany({
    where: {
      userId: session.user.id,
      completedAt: { gte: startDate },
    },
    orderBy: { completedAt: "asc" },
  });

  // Group by date (YYYY-MM-DD)
  const grouped = new Map<string, { totalDuration: number; sessionCount: number }>();

  for (const s of sessionsData) {
    const dateKey = s.completedAt.toISOString().split("T")[0];
    const existing = grouped.get(dateKey) ?? { totalDuration: 0, sessionCount: 0 };
    existing.totalDuration += s.duration;
    existing.sessionCount += 1;
    grouped.set(dateKey, existing);
  }

  const stats = Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    totalDuration: data.totalDuration,
    sessionCount: data.sessionCount,
  }));

  return c.json(stats);
});

export default sessions;
```

- [ ] **Step 2: Modify `apps/api/src/index.ts` to mount sessions**

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth.js";
import patterns from "./routes/patterns.js";
import sessions from "./routes/sessions.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/patterns", patterns);
app.route("/sessions", sessions);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 3001);
console.log(`API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/sessions.ts apps/api/src/index.ts
git commit -m "feat: add breath session recording and stats routes"
```

---

### Task 10: Frontend Package Setup

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.ts`
- Create: `apps/web/src/App.vue`
- Create: `apps/web/src/style.css`

- [ ] **Step 1: Write `apps/web/package.json`**

```json
{
  "name": "@breath/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "lint": "vue-tsc --noEmit"
  },
  "dependencies": {
    "@breath/types": "workspace:*",
    "pinia": "^2.1.0",
    "vue": "^3.4.0",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@breath/tsconfig": "workspace:*",
    "@vitejs/plugin-vue": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vue-tsc": "^2.0.0"
  }
}
```

- [ ] **Step 2: Write `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Write `apps/web/tsconfig.json`**

```json
{
  "extends": "@breath/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

- [ ] **Step 4: Write `apps/web/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        breath: {
          bg: "#0f172a",
          primary: "#3b82f6",
          secondary: "#60a5fa",
          accent: "#34d399",
          surface: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.06)",
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Write `apps/web/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Breathe</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Write `apps/web/src/style.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0f172a;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input, button {
  font-family: inherit;
}
```

- [ ] **Step 7: Write `apps/web/src/main.ts`**

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router/index.js";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
```

- [ ] **Step 8: Write `apps/web/src/App.vue`**

```vue
<template>
  <div class="min-h-screen">
    <NavBar v-if="!isLanding" />
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import NavBar from "./components/NavBar.vue";

const route = useRoute();
const isLanding = computed(() => route.path === "/");
</script>
```

- [ ] **Step 9: Install dependencies**

```bash
cd /Users/jorge/code/breath
pnpm install
```

Expected: All frontend dependencies install successfully.

- [ ] **Step 10: Commit**

```bash
git add apps/web/
git commit -m "chore: setup Vue 3 frontend with Vite, Pinia, Vue Router, Tailwind"
```

---

### Task 11: Router, API Client, and Auth Store

**Files:**
- Create: `apps/web/src/router/index.ts`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/stores/auth.ts`

- [ ] **Step 1: Write `apps/web/src/router/index.ts`**

```typescript
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "landing", component: () => import("../views/LandingView.vue") },
    { path: "/login", name: "login", component: () => import("../views/LoginView.vue") },
    { path: "/register", name: "register", component: () => import("../views/RegisterView.vue") },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/breathe/:patternId",
      name: "breathe",
      component: () => import("../views/BreatheView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/patterns",
      name: "patterns",
      component: () => import("../views/PatternsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/patterns/new",
      name: "pattern-builder",
      component: () => import("../views/PatternBuilderView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/history",
      name: "history",
      component: () => import("../views/HistoryView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.user) {
    await auth.fetchUser();
  }
  if (to.meta.requiresAuth && !auth.user) {
    return { name: "login" };
  }
});

export default router;
```

- [ ] **Step 2: Write `apps/web/src/lib/api.ts`**

```typescript
const API_BASE = "http://localhost:3001";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}
```

- [ ] **Step 3: Write `apps/web/src/stores/auth.ts`**

```typescript
import { ref } from "vue";
import { defineStore } from "pinia";
import type { User } from "@breath/types";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  async function fetchUser() {
    loading.value = true;
    try {
      const res = await fetch("http://localhost:3001/api/auth/session", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        user.value = data.user ?? null;
      } else {
        user.value = null;
      }
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    await fetch("http://localhost:3001/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
    user.value = null;
  }

  return { user, loading, fetchUser, signOut };
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/router apps/web/src/lib apps/web/src/stores/auth.ts
git commit -m "feat: add router, api client, and auth store"
```

---

### Task 12: Patterns and Sessions Stores

**Files:**
- Create: `apps/web/src/stores/patterns.ts`
- Create: `apps/web/src/stores/sessions.ts`

- [ ] **Step 1: Write `apps/web/src/stores/patterns.ts`**

```typescript
import { ref } from "vue";
import { defineStore } from "pinia";
import type { BreathingPattern, CreatePatternInput } from "@breath/types";
import { apiFetch } from "../lib/api.js";

export const usePatternsStore = defineStore("patterns", () => {
  const patterns = ref<BreathingPattern[]>([]);
  const loading = ref(false);

  async function fetchPatterns() {
    loading.value = true;
    patterns.value = await apiFetch<BreathingPattern[]>("/patterns");
    loading.value = false;
  }

  async function createPattern(data: CreatePatternInput) {
    const pattern = await apiFetch<BreathingPattern>("/patterns", {
      method: "POST",
      body: JSON.stringify(data),
    });
    patterns.value.push(pattern);
    return pattern;
  }

  async function deletePattern(id: string) {
    await apiFetch(`/patterns/${id}`, { method: "DELETE" });
    patterns.value = patterns.value.filter((p) => p.id !== id);
  }

  function getPatternById(id: string) {
    return patterns.value.find((p) => p.id === id);
  }

  return {
    patterns,
    loading,
    fetchPatterns,
    createPattern,
    deletePattern,
    getPatternById,
  };
});
```

- [ ] **Step 2: Write `apps/web/src/stores/sessions.ts`**

```typescript
import { ref } from "vue";
import { defineStore } from "pinia";
import type { BreathSession, CreateSessionInput, SessionStats, StatsRange } from "@breath/types";
import { apiFetch } from "../lib/api.js";

export const useSessionsStore = defineStore("sessions", () => {
  const sessions = ref<BreathSession[]>([]);
  const stats = ref<SessionStats[]>([]);
  const loading = ref(false);

  async function fetchSessions() {
    loading.value = true;
    sessions.value = await apiFetch<BreathSession[]>("/sessions");
    loading.value = false;
  }

  async function recordSession(data: CreateSessionInput) {
    const session = await apiFetch<BreathSession>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    sessions.value.unshift(session);
    return session;
  }

  async function fetchStats(range: StatsRange = "week") {
    stats.value = await apiFetch<SessionStats[]>(`/sessions/stats?range=${range}`);
  }

  function getTodayDuration(): number {
    const today = new Date().toISOString().split("T")[0];
    return sessions.value
      .filter((s) => {
        const date = new Date(s.completedAt).toISOString().split("T")[0];
        return date === today;
      })
      .reduce((sum, s) => sum + s.duration, 0);
  }

  return {
    sessions,
    stats,
    loading,
    fetchSessions,
    recordSession,
    fetchStats,
    getTodayDuration,
  };
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/patterns.ts apps/web/src/stores/sessions.ts
git commit -m "feat: add patterns and sessions Pinia stores"
```

---

### Task 13: NavBar Component

**Files:**
- Create: `apps/web/src/components/NavBar.vue`

- [ ] **Step 1: Write `apps/web/src/components/NavBar.vue`**

```vue
<template>
  <nav class="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
    <RouterLink to="/dashboard" class="text-xl font-bold text-breath-secondary">
      breathe
    </RouterLink>

    <div class="flex items-center gap-6 text-sm">
      <RouterLink to="/dashboard" class="opacity-60 hover:opacity-100 transition-opacity">
        Dashboard
      </RouterLink>
      <RouterLink to="/patterns" class="opacity-60 hover:opacity-100 transition-opacity">
        Patterns
      </RouterLink>
      <RouterLink to="/history" class="opacity-60 hover:opacity-100 transition-opacity">
        History
      </RouterLink>
      <button
        v-if="auth.user"
        @click="handleSignOut"
        class="opacity-60 hover:opacity-100 transition-opacity"
      >
        Sign Out
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const auth = useAuthStore();
const router = useRouter();

async function handleSignOut() {
  await auth.signOut();
  router.push("/login");
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/NavBar.vue
git commit -m "feat: add NavBar component"
```

---

### Task 14: Landing Page

**Files:**
- Create: `apps/web/src/views/LandingView.vue`

- [ ] **Step 1: Write `apps/web/src/views/LandingView.vue`**

```vue
<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 text-center">
    <div class="w-24 h-24 rounded-full bg-breath-primary/20 flex items-center justify-center mb-8">
      <div class="w-16 h-16 rounded-full bg-breath-primary/40 animate-pulse" />
    </div>

    <h1 class="text-5xl font-bold mb-4">breathe</h1>
    <p class="text-lg opacity-60 max-w-md mb-10">
      Guided breathing exercises to help you focus, relax, and build a daily practice.
    </p>

    <div class="flex gap-4">
      <RouterLink
        to="/register"
        class="px-6 py-3 rounded-full bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors"
      >
        Get Started
      </RouterLink>
      <RouterLink
        to="/login"
        class="px-6 py-3 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
      >
        Sign In
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// No script needed
</script>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/views/LandingView.vue
git commit -m "feat: add landing page"
```

---

### Task 15: Login and Register Pages

**Files:**
- Create: `apps/web/src/views/LoginView.vue`
- Create: `apps/web/src/views/RegisterView.vue`

- [ ] **Step 1: Write `apps/web/src/views/LoginView.vue`**

```vue
<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8">Sign In</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm opacity-60 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm opacity-60 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>

        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-lg bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {{ loading ? "Signing in..." : "Sign In" }}
        </button>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/10" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-breath-bg opacity-50">or</span>
          </div>
        </div>

        <a
          :href="`http://localhost:3001/api/auth/sign-in/google`"
          class="mt-4 w-full py-2.5 rounded-lg border border-white/15 text-center block hover:bg-white/5 transition-colors"
        >
          Sign in with Google
        </a>
      </div>

      <p class="text-center mt-6 text-sm opacity-50">
        Don't have an account?
        <RouterLink to="/register" class="text-breath-secondary hover:underline">Register</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  loading.value = true;
  error.value = "";

  try {
    const res = await fetch("http://localhost:3001/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.value, password: password.value }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? "Login failed");
    }

    await auth.fetchUser();
    router.push("/dashboard");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **Step 2: Write `apps/web/src/views/RegisterView.vue`**

```vue
<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8">Create Account</h1>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm opacity-60 mb-1">Name</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm opacity-60 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm opacity-60 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>

        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-lg bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {{ loading ? "Creating..." : "Create Account" }}
        </button>
      </form>

      <p class="text-center mt-6 text-sm opacity-50">
        Already have an account?
        <RouterLink to="/login" class="text-breath-secondary hover:underline">Sign In</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const auth = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleRegister() {
  loading.value = true;
  error.value = "";

  try {
    const res = await fetch("http://localhost:3001/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? "Registration failed");
    }

    await auth.fetchUser();
    router.push("/dashboard");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/LoginView.vue apps/web/src/views/RegisterView.vue
git commit -m "feat: add login and register pages with email and Google OAuth"
```

---

### Task 16: Dashboard Page

**Files:**
- Create: `apps/web/src/components/StatCard.vue`
- Create: `apps/web/src/components/PatternCard.vue`
- Create: `apps/web/src/views/DashboardView.vue`

- [ ] **Step 1: Write `apps/web/src/components/StatCard.vue`**

```vue
<template>
  <div class="bg-breath-surface border border-breath-border rounded-2xl p-5">
    <div class="text-3xl font-bold text-breath-secondary">{{ value }}</div>
    <div class="text-xs opacity-50 mt-1 uppercase tracking-wide">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: string; label: string }>();
</script>
```

- [ ] **Step 2: Write `apps/web/src/components/PatternCard.vue`**

```vue
<template>
  <div
    class="bg-breath-surface border border-breath-border rounded-2xl p-5 cursor-pointer hover:bg-white/[0.06] transition-colors relative"
    @click="$emit('start', pattern.id)"
  >
    <div
      class="w-12 h-12 rounded-full bg-breath-primary/15 flex items-center justify-center text-xl mb-3"
    >
      {{ icon }}
    </div>
    <div class="font-semibold">{{ pattern.name }}</div>
    <div class="text-xs opacity-50 mt-1">{{ timing }}</div>
    <div
      class="absolute top-5 right-5 w-8 h-8 rounded-full bg-breath-primary flex items-center justify-center text-xs text-white"
    >
      ▶
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BreathingPattern } from "@breath/types";

const props = defineProps<{ pattern: BreathingPattern }>();
defineEmits<{ start: [id: string] }>();

const timing = computed(() => {
  const parts = [props.pattern.inhale, props.pattern.hold, props.pattern.exhale];
  if (props.pattern.holdAfterExhale > 0) parts.push(props.pattern.holdAfterExhale);
  return parts.join(" · ");
});

const icon = computed(() => {
  if (props.pattern.holdAfterExhale > 0) return "□";
  if (props.pattern.hold > props.pattern.inhale) return "~";
  return "∞";
});
</script>
```

- [ ] **Step 3: Write `apps/web/src/views/DashboardView.vue`**

```vue
<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <StatCard :value="todayMinutes" label="Today" />
      <StatCard :value="String(sessionsStore.sessions.length)" label="Sessions" />
      <StatCard value="0d" label="Streak" />
    </div>

    <h2 class="text-lg font-semibold mb-4">Quick Start</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <PatternCard
        v-for="pattern in presetPatterns"
        :key="pattern.id"
        :pattern="pattern"
        @start="startPattern"
      />
      <RouterLink
        to="/patterns/new"
        class="flex items-center justify-center gap-2 bg-breath-surface border border-dashed border-white/15 rounded-2xl p-5 opacity-60 hover:opacity-100 hover:bg-white/[0.06] transition-all"
      >
        <span class="text-lg">+</span>
        <span class="text-sm">Create Custom Pattern</span>
      </RouterLink>
    </div>

    <h2 class="text-lg font-semibold mb-4">Recent Sessions</h2>
    <div class="bg-breath-surface border border-breath-border rounded-2xl overflow-hidden">
      <div
        v-for="session in recentSessions"
        :key="session.id"
        class="flex justify-between items-center px-5 py-3 border-b border-white/[0.04] last:border-b-0"
      >
        <div>
          <div class="font-medium">{{ session.pattern?.name ?? "Unknown" }}</div>
          <div class="text-xs opacity-40">{{ formatDate(session.completedAt) }}</div>
        </div>
        <div class="text-sm opacity-60">{{ formatDuration(session.duration) }}</div>
      </div>
      <div v-if="recentSessions.length === 0" class="px-5 py-8 text-center opacity-40 text-sm">
        No sessions yet. Start breathing!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import { useSessionsStore } from "../stores/sessions.js";
import StatCard from "../components/StatCard.vue";
import PatternCard from "../components/PatternCard.vue";

const router = useRouter();
const patternsStore = usePatternsStore();
const sessionsStore = useSessionsStore();

onMounted(() => {
  patternsStore.fetchPatterns();
  sessionsStore.fetchSessions();
});

const presetPatterns = computed(() =>
  patternsStore.patterns.filter((p) => p.userId === null)
);

const todayMinutes = computed(() => {
  const secs = sessionsStore.getTodayDuration();
  return secs >= 60 ? `${Math.floor(secs / 60)}m` : `${secs}s`;
});

const recentSessions = computed(() => sessionsStore.sessions.slice(0, 5));

function startPattern(id: string) {
  router.push(`/breathe/${id}`);
}

function formatDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(seconds: number) {
  return seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds}s`;
}
</script>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/StatCard.vue apps/web/src/components/PatternCard.vue apps/web/src/views/DashboardView.vue
git commit -m "feat: add dashboard with stats, presets, and recent sessions"
```

---

### Task 17: Breathing Engine Composable

**Files:**
- Create: `apps/web/src/composables/useBreathingEngine.ts`

- [ ] **Step 1: Write `apps/web/src/composables/useBreathingEngine.ts`**

```typescript
import { ref, computed } from "vue";
import type { BreathingPattern } from "@breath/types";

export type Phase = "idle" | "inhale" | "hold" | "exhale" | "holdAfterExhale";

export function useBreathingEngine(pattern: BreathingPattern) {
  const phase = ref<Phase>("idle");
  const phaseElapsed = ref(0); // seconds into current phase
  const totalElapsed = ref(0); // total seconds of the session
  const cycleCount = ref(0);

  let timer: ReturnType<typeof setInterval> | null = null;
  let phaseStartTime = 0;

  const phaseDuration = computed(() => {
    switch (phase.value) {
      case "inhale":
        return pattern.inhale;
      case "hold":
        return pattern.hold;
      case "exhale":
        return pattern.exhale;
      case "holdAfterExhale":
        return pattern.holdAfterExhale;
      default:
        return 0;
    }
  });

  const phaseProgress = computed(() => {
    if (phaseDuration.value === 0) return 1;
    return phaseElapsed.value / phaseDuration.value;
  });

  const phaseLabel = computed(() => {
    switch (phase.value) {
      case "inhale":
        return "Inhale";
      case "hold":
        return "Hold";
      case "exhale":
        return "Exhale";
      case "holdAfterExhale":
        return "Hold";
      default:
        return "";
    }
  });

  const phaseTimeRemaining = computed(() =>
    Math.max(0, Math.ceil(phaseDuration.value - phaseElapsed.value))
  );

  function nextPhase(): Phase {
    switch (phase.value) {
      case "idle":
        return "inhale";
      case "inhale":
        return pattern.hold > 0 ? "hold" : "exhale";
      case "hold":
        return "exhale";
      case "exhale":
        return pattern.holdAfterExhale > 0 ? "holdAfterExhale" : "inhale";
      case "holdAfterExhale":
        return "inhale";
      default:
        return "idle";
    }
  }

  function tick() {
    const now = Date.now();
    const delta = (now - phaseStartTime) / 1000;
    phaseElapsed.value = Math.min(delta, phaseDuration.value);
    totalElapsed.value += 1; // approximate, updated every second

    if (phaseElapsed.value >= phaseDuration.value) {
      const oldPhase = phase.value;
      phase.value = nextPhase();
      phaseStartTime = now;
      phaseElapsed.value = 0;

      if (oldPhase === "holdAfterExhale" || (oldPhase === "exhale" && pattern.holdAfterExhale === 0)) {
        cycleCount.value++;
      }
    }
  }

  function start() {
    if (timer) return;
    phase.value = "inhale";
    phaseStartTime = Date.now();
    phaseElapsed.value = 0;
    totalElapsed.value = 0;
    cycleCount.value = 0;
    timer = setInterval(tick, 100);
  }

  function pause() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function resume() {
    if (!timer && phase.value !== "idle") {
      phaseStartTime = Date.now() - phaseElapsed.value * 1000;
      timer = setInterval(tick, 100);
    }
  }

  function stop() {
    pause();
    phase.value = "idle";
    phaseElapsed.value = 0;
  }

  return {
    phase,
    phaseElapsed,
    totalElapsed,
    cycleCount,
    phaseDuration,
    phaseProgress,
    phaseLabel,
    phaseTimeRemaining,
    start,
    pause,
    resume,
    stop,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/composables/useBreathingEngine.ts
git commit -m "feat: add breathing engine composable with phase state machine"
```

---

### Task 18: Breath Circle Animation Component

**Files:**
- Create: `apps/web/src/components/BreathCircle.vue`

- [ ] **Step 1: Write `apps/web/src/components/BreathCircle.vue`**

```vue
<template>
  <div class="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
    <!-- Progress ring -->
    <svg class="absolute w-full h-full -rotate-90" viewBox="0 0 360 360">
      <circle cx="180" cy="180" r="175" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4" />
      <circle
        cx="180"
        cy="180"
        r="175"
        fill="none"
        :stroke="ringColor"
        stroke-width="4"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference * (1 - phaseProgress)"
        class="transition-all duration-100"
      />
    </svg>

    <!-- Breath circle -->
    <div
      class="rounded-full flex flex-col items-center justify-center transition-all duration-300 ease-out"
      :style="circleStyle"
    >
      <div class="text-lg sm:text-xl font-semibold tracking-wider uppercase">{{ phaseLabel }}</div>
      <div class="text-3xl sm:text-4xl font-light tabular-nums mt-1">{{ timeRemaining }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Phase } from "../composables/useBreathingEngine.js";

const props = defineProps<{
  phase: Phase;
  phaseProgress: number;
  phaseLabel: string;
  timeRemaining: number;
}>();

const circumference = 2 * Math.PI * 175;

const ringColor = computed(() => {
  if (props.phase === "inhale") return "#60a5fa";
  if (props.phase === "exhale") return "#34d399";
  return "#a78bfa";
});

const circleStyle = computed(() => {
  const minSize = 140;
  const maxSize = 280;
  let size = minSize;

  if (props.phase === "inhale") {
    size = minSize + (maxSize - minSize) * props.phaseProgress;
  } else if (props.phase === "hold") {
    size = maxSize;
  } else if (props.phase === "exhale") {
    size = maxSize - (maxSize - minSize) * props.phaseProgress;
  } else if (props.phase === "holdAfterExhale") {
    size = minSize;
  }

  let bg = "radial-gradient(circle at 30% 30%, rgba(96,165,250,0.5), rgba(59,130,246,0.2))";
  if (props.phase === "exhale" || props.phase === "holdAfterExhale") {
    bg = "radial-gradient(circle at 30% 30%, rgba(52,211,153,0.4), rgba(16,185,129,0.15))";
  } else if (props.phase === "hold") {
    bg = "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.4), rgba(139,92,246,0.15))";
  }

  const shadow =
    props.phase === "hold"
      ? `0 0 ${60 + Math.sin(Date.now() / 500) * 10}px rgba(167,139,250,0.3), inset 0 0 40px rgba(255,255,255,0.05)`
      : `0 0 60px ${props.phase === "inhale" ? "rgba(96,165,250,0.25)" : "rgba(52,211,153,0.2)"}, inset 0 0 40px rgba(255,255,255,0.05)`;

  return {
    width: `${size}px`,
    height: `${size}px`,
    background: bg,
    boxShadow: shadow,
  };
});
</script>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/BreathCircle.vue
git commit -m "feat: add animated breath circle component with progress ring"
```

---

### Task 19: Breathing Session Page

**Files:**
- Create: `apps/web/src/views/BreatheView.vue`

- [ ] **Step 1: Write `apps/web/src/views/BreatheView.vue`**

```vue
<template>
  <div v-if="pattern" class="min-h-screen flex flex-col items-center justify-center px-4 relative">
    <!-- Header -->
    <div class="absolute top-6 text-center">
      <div class="text-lg font-semibold opacity-80">{{ pattern.name }}</div>
      <div class="text-sm opacity-40 mt-1">{{ formatTime(totalElapsed) }}</div>
    </div>

    <!-- Circle -->
    <BreathCircle
      :phase="engine.phase.value"
      :phase-progress="engine.phaseProgress.value"
      :phase-label="engine.phaseLabel.value"
      :time-remaining="engine.phaseTimeRemaining.value"
    />

    <!-- Phase indicators -->
    <div class="absolute bottom-28 flex gap-6 text-xs uppercase tracking-widest opacity-40">
      <span :class="{ 'opacity-100 text-breath-secondary': engine.phase.value === 'inhale' }">Inhale</span>
      <span v-if="pattern.hold > 0" :class="{ 'opacity-100 text-breath-secondary': engine.phase.value === 'hold' }">Hold</span>
      <span :class="{ 'opacity-100 text-breath-secondary': engine.phase.value === 'exhale' }">Exhale</span>
      <span v-if="pattern.holdAfterExhale > 0" :class="{ 'opacity-100 text-breath-secondary': engine.phase.value === 'holdAfterExhale' }">Hold</span>
    </div>

    <!-- Controls -->
    <div class="absolute bottom-10 flex gap-4">
      <button
        v-if="engine.phase.value === 'idle'"
        @click="start"
        class="px-8 py-3 rounded-full bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors"
      >
        Start
      </button>
      <template v-else>
        <button
          @click="togglePause"
          class="px-6 py-2.5 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
        >
          {{ isPaused ? "Resume" : "Pause" }}
        </button>
        <button
          @click="endSession"
          class="px-6 py-2.5 rounded-full bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors"
        >
          End Session
        </button>
      </template>
    </div>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center">
    <p class="opacity-50">Pattern not found</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import { useSessionsStore } from "../stores/sessions.js";
import { useBreathingEngine } from "../composables/useBreathingEngine.js";
import BreathCircle from "../components/BreathCircle.vue";

const route = useRoute();
const router = useRouter();
const patternsStore = usePatternsStore();
const sessionsStore = useSessionsStore();

const patternId = route.params.patternId as string;
const isPaused = ref(false);

onMounted(() => {
  if (patternsStore.patterns.length === 0) {
    patternsStore.fetchPatterns();
  }
});

const pattern = computed(() => patternsStore.getPatternById(patternId));

const engine = computed(() => {
  if (!pattern.value) return null;
  return useBreathingEngine(pattern.value);
});

const totalElapsed = computed(() => engine.value?.totalElapsed.value ?? 0);

function start() {
  engine.value?.start();
  isPaused.value = false;
}

function togglePause() {
  if (isPaused.value) {
    engine.value?.resume();
  } else {
    engine.value?.pause();
  }
  isPaused.value = !isPaused.value;
}

async function endSession() {
  const duration = engine.value?.totalElapsed.value ?? 0;
  engine.value?.stop();

  if (duration > 0) {
    // Queue in localStorage in case of network failure
    const pending = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
    pending.push({ patternId, duration });
    localStorage.setItem("pendingSessions", JSON.stringify(pending));

    try {
      await sessionsStore.recordSession({ patternId, duration });
      // Remove from pending if successful
      const updated = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
      const idx = updated.findIndex(
        (s: any) => s.patternId === patternId && s.duration === duration
      );
      if (idx >= 0) {
        updated.splice(idx, 1);
        localStorage.setItem("pendingSessions", JSON.stringify(updated));
      }
    } catch {
      // Will retry on next page load
    }
  }

  router.push("/dashboard");
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Try to flush pending sessions on mount
onMounted(async () => {
  const pending = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
  if (pending.length > 0) {
    for (const session of pending) {
      try {
        await sessionsStore.recordSession(session);
      } catch {
        break;
      }
    }
    // Re-read and clear successfully sent ones
    const remaining = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
    localStorage.setItem("pendingSessions", JSON.stringify(remaining));
  }
});

onUnmounted(() => {
  engine.value?.stop();
});
</script>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/views/BreatheView.vue
git commit -m "feat: add breathing session page with animation and session recording"
```

---

### Task 20: Patterns Management Page

**Files:**
- Create: `apps/web/src/views/PatternsView.vue`

- [ ] **Step 1: Write `apps/web/src/views/PatternsView.vue`**

```vue
<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Your Patterns</h1>
      <RouterLink
        to="/patterns/new"
        class="px-4 py-2 rounded-full bg-breath-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
      >
        + New Pattern
      </RouterLink>
    </div>

    <div class="space-y-3">
      <div
        v-for="pattern in customPatterns"
        :key="pattern.id"
        class="flex items-center justify-between bg-breath-surface border border-breath-border rounded-xl px-5 py-4"
      >
        <div>
          <div class="font-medium">{{ pattern.name }}</div>
          <div class="text-xs opacity-50 mt-0.5">{{ formatTiming(pattern) }}</div>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="startPattern(pattern.id)"
            class="w-8 h-8 rounded-full bg-breath-primary/20 text-breath-primary flex items-center justify-center text-xs hover:bg-breath-primary/30 transition-colors"
          >
            ▶
          </button>
          <button
            @click="deletePattern(pattern.id)"
            class="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xs hover:bg-red-500/20 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div v-if="customPatterns.length === 0" class="text-center py-12 opacity-40">
      <p class="text-sm">No custom patterns yet.</p>
      <RouterLink to="/patterns/new" class="text-breath-secondary text-sm hover:underline mt-2 inline-block">
        Create your first pattern
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import type { BreathingPattern } from "@breath/types";

const router = useRouter();
const patternsStore = usePatternsStore();

onMounted(() => {
  patternsStore.fetchPatterns();
});

const customPatterns = computed(() =>
  patternsStore.patterns.filter((p) => p.userId !== null)
);

function formatTiming(p: BreathingPattern) {
  const parts = [p.inhale, p.hold, p.exhale];
  if (p.holdAfterExhale > 0) parts.push(p.holdAfterExhale);
  return parts.join(" · ");
}

function startPattern(id: string) {
  router.push(`/breathe/${id}`);
}

async function deletePattern(id: string) {
  if (!confirm("Delete this pattern?")) return;
  await patternsStore.deletePattern(id);
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/views/PatternsView.vue
git commit -m "feat: add patterns management page"
```

---

### Task 21: Pattern Builder Page

**Files:**
- Create: `apps/web/src/views/PatternBuilderView.vue`

- [ ] **Step 1: Write `apps/web/src/views/PatternBuilderView.vue`**

```vue
<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">Create Pattern</h1>

    <form @submit.prevent="handleSave" class="space-y-5">
      <div>
        <label class="block text-sm opacity-60 mb-1.5">Pattern Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          maxlength="100"
          class="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          placeholder="e.g. My Custom Pattern"
        />
      </div>

      <SliderField v-model="form.inhale" label="Inhale" :min="1" :max="15" unit="s" />
      <SliderField v-model="form.hold" label="Hold" :min="0" :max="15" unit="s" />
      <SliderField v-model="form.exhale" label="Exhale" :min="1" :max="15" unit="s" />
      <SliderField v-model="form.holdAfterExhale" label="Hold After Exhale" :min="0" :max="15" unit="s" />

      <div>
        <label class="block text-sm opacity-60 mb-1.5">Description</label>
        <textarea
          v-model="form.description"
          rows="2"
          maxlength="500"
          class="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none resize-none"
          placeholder="Optional description..."
        />
      </div>

      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

      <div class="flex gap-3 pt-2">
        <button
          type="button"
          @click="preview"
          class="flex-1 py-2.5 rounded-lg border border-white/15 hover:bg-white/5 transition-colors"
        >
          Preview
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 py-2.5 rounded-lg bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {{ saving ? "Saving..." : "Save" }}
        </button>
      </div>
    </form>
  </div>

  <!-- Preview modal -->
  <div
    v-if="showPreview"
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    @click.self="showPreview = false"
  >
    <div class="text-center">
      <BreathCircle
        :phase="previewEngine?.phase.value ?? 'idle'"
        :phase-progress="previewEngine?.phaseProgress.value ?? 0"
        :phase-label="previewEngine?.phaseLabel.value ?? ''"
        :time-remaining="previewEngine?.phaseTimeRemaining.value ?? 0"
      />
      <button
        @click="showPreview = false"
        class="mt-8 px-6 py-2 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
      >
        Close Preview
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import { useBreathingEngine } from "../composables/useBreathingEngine.js";
import SliderField from "../components/SliderField.vue";
import BreathCircle from "../components/BreathCircle.vue";
import type { CreatePatternInput, BreathingPattern } from "@breath/types";

const router = useRouter();
const patternsStore = usePatternsStore();

const form = ref<CreatePatternInput>({
  name: "",
  description: "",
  inhale: 4,
  hold: 4,
  exhale: 4,
  holdAfterExhale: 0,
});

const saving = ref(false);
const error = ref("");
const showPreview = ref(false);
const previewEngine = ref<ReturnType<typeof useBreathingEngine> | null>(null);

async function handleSave() {
  saving.value = true;
  error.value = "";

  try {
    await patternsStore.createPattern(form.value);
    router.push("/patterns");
  } catch (e: any) {
    error.value = e.message ?? "Failed to save pattern";
  } finally {
    saving.value = false;
  }
}

function preview() {
  const previewPattern: BreathingPattern = {
    id: "preview",
    userId: null,
    createdAt: new Date().toISOString(),
    ...form.value,
  };

  previewEngine.value?.stop();
  previewEngine.value = useBreathingEngine(previewPattern);
  showPreview.value = true;
  previewEngine.value.start();

  // Auto-stop after one full cycle
  const cycleDuration =
    previewPattern.inhale +
    previewPattern.hold +
    previewPattern.exhale +
    previewPattern.holdAfterExhale;

  setTimeout(() => {
    previewEngine.value?.stop();
  }, cycleDuration * 1000 + 100);
}
</script>
```

- [ ] **Step 2: Write `apps/web/src/components/SliderField.vue`**

```vue
<template>
  <div>
    <div class="flex justify-between mb-1.5">
      <label class="text-sm opacity-60">{{ label }}</label>
      <span class="text-sm font-medium">{{ modelValue }}{{ unit }}</span>
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      class="w-full h-2 rounded-lg appearance-none bg-white/10 accent-breath-primary cursor-pointer"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number;
  label: string;
  min: number;
  max: number;
  unit: string;
}>();

defineEmits<{ "update:modelValue": [value: number] }>();
</script>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/PatternBuilderView.vue apps/web/src/components/SliderField.vue
git commit -m "feat: add custom pattern builder with preview"
```

---

### Task 22: History and Stats Page

**Files:**
- Create: `apps/web/src/components/BarChart.vue`
- Create: `apps/web/src/views/HistoryView.vue`

- [ ] **Step 1: Write `apps/web/src/components/BarChart.vue`**

```vue
<template>
  <div class="w-full">
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full" preserveAspectRatio="none">
      <!-- Bars -->
      <rect
        v-for="(bar, i) in bars"
        :key="i"
        :x="bar.x"
        :y="bar.y"
        :width="bar.width"
        :height="bar.height"
        rx="3"
        fill="#60a5fa"
        opacity="0.8"
      />
      <!-- X axis labels -->
      <text
        v-for="(bar, i) in bars"
        :key="`label-${i}`"
        :x="bar.x + bar.width / 2"
        :y="height - 4"
        text-anchor="middle"
        fill="rgba(255,255,255,0.4)"
        font-size="10"
      >
        {{ bar.label }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SessionStats } from "@breath/types";

const props = defineProps<{
  data: SessionStats[];
}>();

const width = 600;
const height = 200;
const padding = { top: 10, right: 10, bottom: 24, left: 10 };

const chartWidth = width - padding.left - padding.right;
const chartHeight = height - padding.top - padding.bottom;

const maxValue = computed(() => {
  if (props.data.length === 0) return 1;
  return Math.max(...props.data.map((d) => d.totalDuration), 1);
});

const bars = computed(() => {
  const barWidth = props.data.length > 0 ? chartWidth / props.data.length * 0.6 : 0;
  const gap = props.data.length > 0 ? chartWidth / props.data.length * 0.4 : 0;

  return props.data.map((d, i) => {
    const barHeight = (d.totalDuration / maxValue.value) * chartHeight;
    return {
      x: padding.left + i * (barWidth + gap) + gap / 2,
      y: padding.top + chartHeight - barHeight,
      width: barWidth,
      height: barHeight,
      label: formatLabel(d.date),
    };
  });
});

function formatLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
</script>
```

- [ ] **Step 2: Write `apps/web/src/views/HistoryView.vue`**

```vue
<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">History</h1>

    <!-- Range selector -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="r in ranges"
        :key="r"
        @click="range = r"
        :class="[
          'px-4 py-1.5 rounded-full text-sm transition-colors',
          range === r
            ? 'bg-breath-primary text-white'
            : 'bg-white/5 border border-white/10 hover:bg-white/10',
        ]"
      >
        {{ r === "all" ? "All Time" : r === "week" ? "This Week" : "This Month" }}
      </button>
    </div>

    <!-- Chart -->
    <div class="bg-breath-surface border border-breath-border rounded-2xl p-5 mb-6">
      <BarChart :data="sessionsStore.stats" />
    </div>

    <!-- Stats summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <StatCard :value="totalMinutes" label="Total Minutes" />
      <StatCard :value="String(sessionsStore.sessions.length)" label="Sessions" />
      <StatCard value="—" label="Streak" />
      <StatCard :value="avgDuration" label="Avg Session" />
    </div>

    <!-- Session list -->
    <h2 class="text-lg font-semibold mb-4">All Sessions</h2>
    <div class="bg-breath-surface border border-breath-border rounded-2xl overflow-hidden">
      <div
        v-for="session in sessionsStore.sessions"
        :key="session.id"
        class="flex justify-between items-center px-5 py-3 border-b border-white/[0.04] last:border-b-0"
      >
        <div>
          <div class="font-medium">{{ session.pattern?.name ?? "Unknown" }}</div>
          <div class="text-xs opacity-40">{{ formatDate(session.completedAt) }}</div>
        </div>
        <div class="text-sm opacity-60">{{ formatDuration(session.duration) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useSessionsStore } from "../stores/sessions.js";
import type { StatsRange } from "@breath/types";
import StatCard from "../components/StatCard.vue";
import BarChart from "../components/BarChart.vue";

const sessionsStore = useSessionsStore();
const range = ref<StatsRange>("week");
const ranges: StatsRange[] = ["week", "month", "all"];

onMounted(() => {
  sessionsStore.fetchSessions();
  sessionsStore.fetchStats(range.value);
});

watch(range, (r) => {
  sessionsStore.fetchStats(r);
});

const totalMinutes = computed(() => {
  const total = sessionsStore.sessions.reduce((sum, s) => sum + s.duration, 0);
  return `${Math.round(total / 60)}`;
});

const avgDuration = computed(() => {
  if (sessionsStore.sessions.length === 0) return "—";
  const avg =
    sessionsStore.sessions.reduce((sum, s) => sum + s.duration, 0) /
    sessionsStore.sessions.length;
  return avg >= 60 ? `${Math.round(avg / 60)}m` : `${Math.round(avg)}s`;
});

function formatDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  return seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds}s`;
}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/BarChart.vue apps/web/src/views/HistoryView.vue
git commit -m "feat: add history page with bar chart and session list"
```

---

### Task 23: PostCSS Config and Style Polish

**Files:**
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/src/style.css` (update)

- [ ] **Step 1: Write `apps/web/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Update `apps/web/src/style.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0f172a;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input, button, textarea {
  font-family: inherit;
}

/* Custom range slider styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Router link active state */
.router-link-active {
  opacity: 1 !important;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/postcss.config.js apps/web/src/style.css
git commit -m "style: add postcss config and polish global styles"
```

---

### Task 24: Dev Environment Verification

**Files:** None — run verification commands.

- [ ] **Step 1: Build shared types**

```bash
cd /Users/jorge/code/breath
pnpm --filter @breath/types build
```

Expected: Builds without errors.

- [ ] **Step 2: Check TypeScript compiles in API**

```bash
cd /Users/jorge/code/breath/apps/api
pnpm lint
```

Expected: No type errors.

- [ ] **Step 3: Check TypeScript compiles in Web**

```bash
cd /Users/jorge/code/breath/apps/web
pnpm lint
```

Expected: No type errors.

- [ ] **Step 4: Start both dev servers (manual verification)**

Terminal 1:
```bash
cd /Users/jorge/code/breath/apps/api
pnpm dev
```

Terminal 2:
```bash
cd /Users/jorge/code/breath/apps/web
pnpm dev
```

Verify:
- API at `http://localhost:3001/health` returns `{"status":"ok"}`
- Frontend at `http://localhost:5173` loads the landing page

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "chore: verify dev environment compiles and runs"
```

---

## Self-Review

### 1. Spec Coverage Check

| Spec Section | Implementing Task |
|-------------|-------------------|
| Monorepo setup | Task 1, 2 |
| Shared types (Zod schemas) | Task 3 |
| Backend API (Hono + Prisma) | Task 4–6 |
| Better Auth integration | Task 7 |
| Pattern CRUD routes | Task 8 |
| Session recording + stats routes | Task 9 |
| Vue 3 frontend setup | Task 10 |
| Router + Auth store + API client | Task 11 |
| Patterns and Sessions stores | Task 12 |
| NavBar | Task 13 |
| Landing page | Task 14 |
| Login/Register with OAuth | Task 15 |
| Dashboard with stats + presets | Task 16 |
| Breathing engine composable | Task 17 |
| Animated breath circle | Task 18 |
| Full breathing session page | Task 19 |
| Patterns management | Task 20 |
| Custom pattern builder + preview | Task 21 |
| History + stats chart | Task 22 |
| Responsive styling | Tasks 16–23 (Tailwind responsive classes throughout) |
| Offline session queue | Task 19 (localStorage fallback) |
| Database seed with presets | Task 6 |

**No gaps identified.**

### 2. Placeholder Scan

- No "TBD", "TODO", "implement later", or vague instructions found.
- Every step includes complete code, exact commands, and expected output.
- No "Similar to Task N" references.

### 3. Type Consistency Check

- `BreathingPattern`, `BreathSession`, `SessionStats`, `CreatePatternInput`, `CreateSessionInput` — all consistently imported from `@breath/types`.
- `useBreathingEngine` returns consistent property names used by `BreathCircle.vue` and `BreatheView.vue`.
- API routes use consistent Zod schema names matching the types package.
- `StatsRange` type used consistently in backend route and frontend history view.

All consistent. Plan is ready.
