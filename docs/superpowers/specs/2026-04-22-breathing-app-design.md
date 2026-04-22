# Breathing App — Design Spec

**Date:** 2026-04-22  
**Topic:** Guided breathing web application with custom patterns, animated UI, and session tracking.

---

## 1. Purpose & Goals

Build a web app that guides users through breathing exercises using an animated circle that expands and contracts in sync with each breath phase. Users can track completed sessions, save them to their account, and view progress over time.

**Success criteria:**
- Smooth, visually calming breathing animation that accurately reflects the selected pattern
- Custom pattern builder with at least 3 built-in presets ready to go
- Responsive experience on both mobile and desktop
- Session data persisted server-side per authenticated user
- Simple history/stats view showing breath work time over time

---

## 2. Architecture

### Monorepo Layout (pnpm workspaces)

```
breath/
├── apps/
│   ├── web/              # Vue 3 + Vite + Pinia + Vue Router
│   └── api/              # Hono.js + Prisma + PostgreSQL
├── packages/
│   ├── types/            # Shared Zod schemas + TypeScript interfaces
│   └── tsconfig/         # Shared TypeScript configs
├── pnpm-workspace.yaml
└── turbo.json
```

### Rationale

A monorepo keeps both frontend and backend in one repository with a shared `packages/types` module. This ensures Zod schemas used for API validation and frontend form validation always stay in sync. Both apps run independently in development and deploy separately in production.

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS |
| Backend | Hono.js, Prisma ORM, PostgreSQL |
| Shared | Zod, TypeScript |
| Auth | JWT in httpOnly cookie, bcrypt for passwords, Google OAuth |
| Animation | CSS transitions driven by a JavaScript `BreathingEngine` composable |
| Charts | Lightweight SVG bar chart (no heavy chart library) |
| Testing | Vitest (unit + integration), Vue Test Utils, Playwright (e2e) |

---

## 4. Data Model (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?   // null for OAuth-only users
  provider      String?   // "google"
  providerId    String?
  createdAt     DateTime  @default(now())
  sessions      BreathSession[]
}

model BreathingPattern {
  id              String  @id @default(cuid())
  userId          String? // null = built-in preset; non-null = user-created
  name            String
  description     String?
  inhale          Int     // seconds
  hold            Int     // seconds
  exhale          Int     // seconds
  holdAfterExhale Int     @default(0) // optional 4th phase
  createdAt       DateTime @default(now())
  sessions        BreathSession[]
}

model BreathSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  patternId   String
  pattern     BreathingPattern @relation(fields: [patternId], references: [id])
  duration    Int      // total seconds actually completed
  completedAt DateTime @default(now())
}
```

### Key Decisions

- **`BreathingPattern.userId` is nullable**: `null` means a built-in preset visible to all users. A non-null value means a user-created custom pattern.
- **`BreathSession.duration` stores actual seconds**: Not derived from pattern × cycles. This accurately records early stops and partial sessions.
- **`holdAfterExhale`**: Enables box breathing (4-4-4-4) and any 4-phase pattern without schema changes.

---

## 5. API Design (Hono Routes)

```
POST /auth/register              → { email, password, name }
POST /auth/login                 → { email, password }
POST /auth/logout                → (clears cookie)
GET  /auth/me                    → current user (protected)

GET  /patterns                   → list all (built-ins + user's custom)
POST /patterns                   → create custom pattern (protected)
DELETE /patterns/:id             → delete user's custom pattern (protected)

POST /sessions                   → record a completed session (protected)
GET  /sessions                   → list user's sessions with patterns (protected)
GET  /sessions/stats             → daily/weekly aggregates (protected)
```

### Auth Details

- JWT stored in an httpOnly cookie with `SameSite=lax` and `Secure` in production.
- CORS configured for the frontend origin.
- A middleware extracts the user from the JWT on protected routes.

### Validation

All request and response bodies are validated with Zod schemas from `packages/types`. The frontend uses the same schemas for form validation before sending requests to the API.

### Stats Endpoint

`GET /sessions/stats` returns simple aggregations — total duration per day/week — so the frontend can render a progress chart without heavy client-side computation.

---

## 6. Frontend Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page with login/signup CTAs |
| `/dashboard` | Today's stats, quick-start presets, custom patterns, recent sessions |
| `/breathe/:patternId` | Full-screen guided breathing session |
| `/patterns` | Manage custom patterns (create / edit / delete / preview) |
| `/history` | Session history list + stats chart |
| `/login` | Login page (email/password + Google OAuth) |
| `/register` | Registration page |

### Auth Flow

- Registration and login forms accept email and password. A "Sign in with Google" button triggers OAuth.
- JWT is stored in an httpOnly cookie with a 14-day expiry, refreshed on active use.
- `GET /auth/me` returns `{ id, email, name }`, used by the Pinia auth store to hydrate user state on page load.
- Unauthenticated users attempting to access protected routes are redirected to `/login`.

---

## 7. Breathing Animation Design

### Visual Elements

- A large, centered circle on a dark background.
- A progress ring around the circle indicating phase completion.
- Phase label ("Inhale", "Hold", "Exhale") centered inside the circle with a countdown timer.
- Phase indicator dots or text below the circle showing which phase is active.
- Session timer and pause/end controls at the bottom.

### Phase Behavior

| Phase | Visual |
|-------|--------|
| **Inhale** | Circle grows from small to large, color shifts to calming blue |
| **Hold** | Circle holds at large size, subtle pulse/glow animation |
| **Exhale** | Circle shrinks from large to small, color shifts to soft green |
| **Hold after exhale** (optional) | Circle stays at small size |

### Animation Implementation

- A `BreathingEngine` Vue composable manages the state machine: `idle → inhale → hold → exhale → (holdAfterExhale) → repeat`.
- Timing is driven by `requestAnimationFrame` or precisely scheduled `setTimeout` calls, not CSS transitions alone, to allow pause/resume and dynamic phase durations.
- CSS `@keyframes` or inline style transitions animate the circle size and color based on the current phase and elapsed time.

---

## 8. Built-in Presets

Three presets are seeded in the database on first setup:

1. **Box Breathing** — `4-4-4-4` (inhale, hold, exhale, hold after exhale)
2. **4-7-8 Relax** — `4-7-8` (inhale, hold, exhale)
3. **Coherent Breathing** — `5-5` (inhale, exhale)

### Custom Pattern Builder (`/patterns/new`)

A form with sliders or number inputs for:
- Pattern name
- Inhale duration (1–15 seconds)
- Hold duration (0–15 seconds)
- Exhale duration (1–15 seconds)
- Hold after exhale (0–15 seconds, optional)

A **Preview** button opens a mini 1-cycle animation. A **Save** button stores the pattern server-side.

---

## 9. History & Stats Page (`/history`)

- **Date range selector:** This week / This month / All time.
- **Bar chart:** Daily total breath minutes, rendered as a lightweight SVG bar chart.
- **Stats summary:** Total lifetime minutes, total sessions, longest streak, average session length.
- **Session list:** Scrollable list with date, pattern name, and duration. Filterable by pattern.

---

## 10. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Network failure on session save | Queue session data in `localStorage`, retry on next successful API call |
| Tab/browser close during breathing | Save elapsed time + current phase to `sessionStorage`; offer "Resume?" on return within 5 minutes |
| Invalid pattern input | Zod validation on both frontend and backend rejects negative or out-of-range durations |
| OAuth email already has password account | Prompt user to link accounts or reject the OAuth sign-in |
| Phone locks during session | Accept slight timing drift; `setInterval`/`requestAnimationFrame` may pause in background |
| User ends session early | Record `BreathSession.duration` as actual seconds breathed |

---

## 11. Testing Strategy

| Type | Tool | Scope |
|------|------|-------|
| Unit | Vitest | Composables, utilities, Zod schemas |
| Component | Vitest + Vue Test Utils | Form components, pattern builder |
| Integration | Vitest + Prisma (in-memory SQLite) | Hono route handlers, database queries |
| E2E | Playwright | Critical path: signup → create pattern → start session → view history |

---

## 12. Deployment

- **Frontend:** Static build deployed to Vercel, Netlify, or Cloudflare Pages.
- **Backend:** Hono deployed to Railway, Render, Fly.io, or Vercel Edge Functions.
- **Database:** Managed PostgreSQL (Railway, Supabase, Neon).

---

## 13. Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo vs. separate repos | Monorepo (pnpm workspaces) | Shared types prevent API drift; single repo is easier to manage at this scale |
| Animation driver | JS composable + CSS transitions | Allows pause/resume and dynamic durations; pure CSS cannot handle custom patterns |
| Auth methods | Email/password + Google OAuth | User requested both; Apple OAuth explicitly excluded |
| Session duration storage | Actual seconds, not pattern × cycles | Accurately records partial/early-stopped sessions |
| Chart library | Lightweight SVG | Avoids heavy dependency; bar chart is simple enough to build inline |
| Offline queue | localStorage for failed session saves | Simple fallback for network failures |
