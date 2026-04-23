# Breath

A guided breathing web application with animated visual feedback, customizable breathing patterns, session tracking, and user authentication.

Built as a monorepo with a Vue 3 frontend and Hono.js backend, using SQLite via Prisma's libSQL driver adapter.

## Features

- **Animated breathing sessions** — Visual circle expands/contracts with SVG progress ring and phase indicators
- **Built-in patterns** — Box Breathing (4-4-4-4), 4-7-8 Relax, Coherent Breathing (5-5)
- **Custom pattern builder** — Create and save your own breathing rhythms with live preview
- **Session history & stats** — Track completed sessions with an SVG bar chart and per-pattern breakdown
- **User authentication** — Email/password and Google OAuth via Better Auth
- **Offline resilience** — Session recording queues in localStorage and syncs when connectivity returns
- **Responsive design** — Works on mobile and desktop with a dark, calming UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS |
| Backend | Hono.js, Prisma 5, SQLite (libSQL) |
| Auth | Better Auth (email/password + Google OAuth) |
| Monorepo | pnpm workspaces, Turbo |
| Shared | `@breath/types` — Zod schemas + TypeScript types |

## Project Structure

```
breath/
├── apps/
│   ├── web/              # Vue 3 frontend
│   │   ├── src/
│   │   │   ├── views/    # Pages (Landing, Login, Dashboard, Breathe, etc.)
│   │   │   ├── components/  # BreathCircle, BarChart, NavBar, etc.
│   │   │   ├── composables/ # useBreathingEngine
│   │   │   ├── stores/   # Pinia stores (auth, patterns, sessions)
│   │   │   └── lib/      # API client
│   │   └── ...
│   └── api/              # Hono.js backend
│       ├── src/
│       │   ├── routes/   # /patterns, /sessions
│       │   └── lib/      # prisma.ts, auth.ts
│       └── prisma/
│           ├── schema.prisma
│           ├── seed.ts
│           └── dev.db    # SQLite database
├── packages/
│   ├── types/            # Shared Zod schemas + TS types
│   └── tsconfig/         # Shared tsconfig base
└── docs/superpowers/     # Design specs & implementation plans
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- SQLite (included via `@libsql/client`)

### Install dependencies

```bash
pnpm install
```

### Set up environment variables

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
TURSO_DATABASE_URL="file:./prisma/dev.db"
BETTER_AUTH_SECRET="generate-a-strong-secret-here"
BETTER_AUTH_URL="http://localhost:3001"
GOOGLE_CLIENT_ID=""      # Optional: for Google OAuth
GOOGLE_CLIENT_SECRET=""  # Optional: for Google OAuth
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations (creates SQLite database)
pnpm db:migrate

# Seed built-in breathing patterns
pnpm db:seed

# (Optional) Open Prisma Studio
pnpm db:studio
```

### Run in development

Start both frontend and backend concurrently:

```bash
pnpm dev
```

Or individually:

```bash
# Terminal 1 — API (http://localhost:3001)
cd apps/api && pnpm dev

# Terminal 2 — Web (http://localhost:5173)
cd apps/web && pnpm dev
```

### Build for production

```bash
pnpm build
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Start all dev servers (via Turbo) |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Type-check all packages and apps |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed built-in breathing patterns |
| `pnpm db:studio` | Open Prisma Studio |

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | SQLite database URL. Local: `file:./prisma/dev.db` | Yes |
| `BETTER_AUTH_SECRET` | Secret for signing sessions/tokens | Yes |
| `BETTER_AUTH_URL` | Base URL of the API server | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

### Web (`apps/web/.env` — optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `http://localhost:3001` |

## Database

The app uses **SQLite** via Prisma's libSQL driver adapter. The schema includes:

- **Better Auth tables**: `User`, `Session`, `Account`, `Verification`
- **App tables**: `BreathingPattern`, `BreathSession`

### Migrations

Migrations live in `apps/api/prisma/migrations/`. To create a new migration after schema changes:

```bash
cd apps/api && pnpm prisma migrate dev --name <name>
```

### Switching to Turso (cloud)

To use [Turso](https://turso.tech/) instead of local SQLite:

1. Create a database: `turso db create breath-prod`
2. Update `.env`:
   ```env
   TURSO_DATABASE_URL=libsql://breath-prod-xxx.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```
3. Update `apps/api/src/lib/prisma.ts` to include the auth token:
   ```typescript
   const libsql = createClient({
     url: process.env.TURSO_DATABASE_URL!,
     authToken: process.env.TURSO_AUTH_TOKEN,
   });
   ```

## Architecture Notes

- **BreathingEngine** (`useBreathingEngine.ts`) — A composable that manages the phase state machine (idle → inhale → hold → exhale → holdAfterExhale) using `requestAnimationFrame` for smooth progress updates. Drives the `BreathCircle` animation via reactive refs.
- **API client** (`lib/api.ts`) — Thin wrapper around `fetch` with JSON headers. All stores use it.
- **Pattern ownership** — Patterns with `userId = null` are built-in presets. Custom patterns are tied to the authenticated user.
- **Session recording** — On session end, the duration is queued in `localStorage` and sent to the API. If the API call fails, it retries on next page load.

## License

MIT
