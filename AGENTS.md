# AGENTS.md — Coding Agent Guide

> This file helps coding agents work effectively with the **Breathe** codebase. Read it before making changes.

---

## Project Identity

**Breathe** is a guided breathing web app with animated visual feedback, customizable patterns, session tracking, and auth. It's a monorepo with a Vue 3 SPA frontend and a Hono.js API backend using SQLite.

**Core user flow:** Landing → Try/Register → Dashboard → Breathe Session → History/Stats.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS, GSAP |
| Backend | Hono.js, Prisma 5, SQLite (libSQL adapter) |
| Auth | Better Auth (email/password + Google OAuth) |
| Shared | `@breath/types` — Zod schemas + TypeScript types |
| Monorepo | pnpm workspaces, Turbo |

**Package manager:** `pnpm` (never `npm` or `yarn`).

---

## Monorepo Structure

```
breath/
├── apps/
│   ├── web/              # Vue 3 frontend (Vite, port 5173)
│   │   ├── src/
│   │   │   ├── views/       # Pages (Landing, Login, Dashboard, Breathe, etc.)
│   │   │   ├── components/  # Vue SFCs (BreathCircle, BarChart, NavBar, etc.)
│   │   │   ├── composables/ # Reusable logic (useBreathingEngine, useTheme)
│   │   │   ├── stores/      # Pinia stores (auth, patterns, sessions)
│   │   │   └── lib/         # API client (apiFetch, getCsrfToken)
│   │   ├── tailwind.config.js
│   │   └── style.css
│   └── api/              # Hono.js backend (port 3001)
│       ├── src/
│       │   ├── routes/      # Hono sub-routers (patterns.ts, sessions.ts)
│       │   ├── lib/         # prisma.ts, auth.ts
│       │   └── index.ts     # App entry + route mounting
│       └── prisma/
│           ├── schema.prisma
│           ├── seed.ts
│           └── dev.db
├── packages/
│   ├── types/            # Shared Zod schemas + TS types (builds to dist/)
│   └── tsconfig/         # Shared tsconfig base
└── docs/superpowers/     # Design specs & implementation plans
```

**Workspace deps:** Use `workspace:*` for internal packages.

---

## How to Make Changes

### Frontend (Vue 3)

**Always use Composition API + `<script setup lang="ts">`**. Options API is not used.

**Add a new page:**
1. Create `apps/web/src/views/NewPageView.vue`
2. Add route in `apps/web/src/router/index.ts`
3. Lazy-load if not part of the core flow: `component: () => import("../views/NewPageView.vue")`

**Add a new component:**
1. Create `apps/web/src/components/MyComponent.vue`
2. Import with `.js` extension: `import MyComponent from "./MyComponent.vue"` (Vite resolves it)

**Add a new store:**
1. Create `apps/web/src/stores/myStore.ts`
2. Use `defineStore` with the setup-store pattern (refs + functions, not the object-return form)
3. Export a typed interface if other stores/components need it

**Add a new composable:**
1. Create `apps/web/src/composables/useMyFeature.ts`
2. Return readonly refs and action functions
3. Initialize side effects in an `init()` function, call it from `main.ts` if global

**API calls:** Always use `apiFetch<T>(path, options)` from `lib/api.ts`. It handles JSON headers, credentials, and error throwing. For state-changing requests, fetch a CSRF token first via `getCsrfToken()`.

**Styling rules:**
- Use Tailwind utility classes everywhere.
- The `breath-*` color tokens are semantic CSS custom properties that swap in light/dark mode. **Never hardcode `rgba(255,255,255,…)`, `bg-white/5`, `border-white/10`, or `#0f172a` directly.** Use `breath-surface`, `breath-border`, `breath-input-bg`, etc.
- Inline styles in components (e.g., GSAP-driven values) should reference CSS variables where possible.
- Dark mode is toggled via a `.dark` class on `<html>`. See `useTheme.ts`.

### Backend (Hono.js)

**Add a new route:**
1. Create `apps/api/src/routes/myFeature.ts`
2. Use `new Hono()`, define handlers, export default
3. Mount in `apps/api/src/index.ts` with `app.route("/myfeature", myFeature)`

**Auth-protected routes:** Check session with `auth.api.getSession({ headers: c.req.raw.headers })`. Return 401 if no user, 403 if resource ownership mismatch.

**Validation:** Use `@hono/zod-validator` with schemas from `@breath/types`. Example:
```ts
patterns.post("/", zValidator("json", CreatePatternSchema), async (c) => { ... });
```

**Database access:** Import `prisma` from `../lib/prisma.js`. Never create a new PrismaClient instance.

**Add a new model:**
1. Edit `apps/api/prisma/schema.prisma`
2. Run `pnpm db:migrate` (from repo root)
3. Export Zod schema in `packages/types/src/index.ts`
4. Run `pnpm db:generate` to regenerate the client
5. Use the new model in routes

### Shared Types (`packages/types`)

- Define Zod schemas first, then infer TypeScript types with `z.infer<typeof MySchema>`.
- Export both the schema and the type.
- After editing, run `pnpm build` in `packages/types` or `pnpm lint` from root to verify.

---

## Build & Verification

Before declaring a task complete, run these from the repo root:

```bash
# Type-check everything
pnpm lint

# Build everything (catches Vite/TS errors in both apps)
pnpm build
```

If working on the frontend only:
```bash
cd apps/web && npx vue-tsc --noEmit
```

If working on the backend only:
```bash
cd apps/api && pnpm lint
```

**Do not skip type-checking.** The project has no runtime test suite; TypeScript is the safety net.

---

## Architecture Patterns

### BreathingEngine (`useBreathingEngine.ts`)
A phase state machine driven by `requestAnimationFrame`: idle → inhale → hold → exhale → holdAfterExhale → repeat. Exposes reactive refs (`phase`, `phaseProgress`, `phaseLabel`, `timeRemaining`, `totalElapsed`) consumed by `BreathCircle` for GSAP animations.

### Session Recording Resilience
When a session ends, the duration is queued in `localStorage` (`pendingSessions`) and sent to `/sessions`. If the API call fails, the queue remains and retries on next page load (see `BreatheView.vue` and `sessions.ts`).

### Pattern Ownership
- `userId = null` → built-in preset (everyone sees it)
- `userId = <userId>` → custom pattern (only the owner can delete it)

### API Proxying
In production, Caddy proxies `/api/*`, `/patterns/*`, `/sessions/*` to the backend. In dev, the frontend uses relative paths (see `api.ts` — `API_BASE = ""`).

---

## Common Gotchas

1. **File extensions in imports:** TypeScript is configured with `"moduleResolution": "bundler"`, so you can (and should) use `.js` extensions on all imports, including `.vue` and `.ts` files. Vite resolves them.

2. **CSRF tokens:** Better Auth requires a CSRF token for `POST`/`DELETE` requests. Always call `getCsrfToken()` first for state-changing operations.

3. **Prisma client regeneration:** After any `schema.prisma` change, run `pnpm db:generate` before type-checking will pass.

4. **Theme-aware colors:** The `breath-*` Tailwind colors map to CSS custom properties. Adding new surface/border/text tokens requires updating both `style.css` (`:root` and `:root.dark`) and `tailwind.config.js`.

5. **No tests:** This project has no test suite. Verify correctness by:
   - Running `pnpm lint` (type-checking)
   - Running `pnpm build`
   - Manual browser verification with `pnpm dev`

6. **SQLite is local:** The dev database is `apps/api/prisma/dev.db`. It is NOT committed to git. Seeding is required after a fresh clone.

---

## Agent Communication Preferences

- **Be concise.** No long preambles or summaries unless asked.
- **Show file paths clearly** when reading or editing.
- **Use `edit` for precise changes**, not rewrites of whole files.
- **Verify with `pnpm lint` and `pnpm build`** after non-trivial changes.
- **Ask before adding new dependencies.** Prefer built-in or already-installed packages.
- **When suggesting UI changes, describe the placement** (e.g., "add a button in the NavBar right side, next to Sign Out") rather than just the component code.
