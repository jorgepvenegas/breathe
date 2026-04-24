# Anonymous Quick-Start Breathing Sessions

## Problem
Currently the `/breathe/:patternId` route requires authentication. A logged-out user who lands on the app cannot experience a breathing session without signing up first, which creates friction and reduces conversion.

## Goal
Let a logged-out user start and complete a breathing session immediately. After finishing, prompt them to save their progress, which requires signing up or logging in. The session data is held in `localStorage` and automatically synced to their account once authenticated.

## Design

### 1. Router & Entry Point
- Add a new route `/try` mapped to `QuickStartView.vue`. No `requiresAuth` meta flag.
- Add a "Try it now" button to the landing page (`LandingView.vue`) that routes to `/try`.
- The existing `/breathe/:patternId` route remains auth-gated and unchanged.

### 2. QuickStartView (`apps/web/src/views/QuickStartView.vue`)
- **Mount:** call `patternsStore.fetchPatterns()` and select the first built-in pattern (`userId === null`). The API returns built-ins ordered by `createdAt`, so the first one is deterministic.
- **Breathing UI:** reuse `BreathCircle.vue` and `useBreathingEngine()` — zero duplication of breathing logic.
- **End Session:**
  - If `duration > 0`, serialize `{ patternId, duration, completedAt }` into `localStorage` under key `anonymousSession`.
  - Display the result screen with two CTAs:
    1. **"Start Over"** — resets the engine and restarts the same pattern.
    2. **"Save Progress"** — navigates to `/register`.
- **localStorage contract:** only one session is ever stored. A newer session overwrites the previous entry.

### 3. Post-Auth Auto-Save
- After any successful sign-up or login (including OAuth), check `localStorage` for `anonymousSession`.
- If present:
  1. POST it via `sessionsStore.recordSession()`.
  2. On success, remove `anonymousSession` from `localStorage`.
  3. Redirect the user to `/dashboard`.
- This logic lives in a small helper (`flushAnonymousSession`) invoked from the auth success handlers in `LoginView.vue`, `RegisterView.vue`, and any OAuth callback flow.

### 4. Auth-Aware Flows
| Path | Behavior |
|------|----------|
| `/try` → finish → "Save Progress" → `/register` | After registration, auto-save session, redirect to `/dashboard` |
| `/try` → finish → "Save Progress" → `/login` | After login, auto-save session, redirect to `/dashboard` |
| `/try` → finish → leave site | `anonymousSession` remains in `localStorage`; flushes on next login |
| Multiple `/try` sessions | Last one wins; older data is overwritten |

### 5. API Changes
- **None.** `GET /patterns` is already public. `POST /sessions` is already protected and ready to accept the flushed session.

### 6. Edge Cases
- **Flush fails (network error):** keep `anonymousSession` in `localStorage` and surface a toast. It will retry on the next login.
- **User starts `/try`, then logs in mid-session:** the in-progress session is not saved. Only completed sessions (user clicks "End Session") are persisted to `localStorage`.
- **Pattern deleted after anonymous session:** if the built-in pattern referenced by `anonymousSession` is removed, `recordSession()` will fail with 404. In that case, discard the stale `anonymousSession` and redirect to `/dashboard` without blocking the user.

### 7. Files Changed
- `apps/web/src/router/index.ts` — add `/try` route
- `apps/web/src/views/LandingView.vue` — add "Try it now" button
- `apps/web/src/views/QuickStartView.vue` — new view
- `apps/web/src/stores/sessions.ts` — add `flushAnonymousSession()` helper
- `apps/web/src/views/RegisterView.vue` — call flush on auth success
- `apps/web/src/views/LoginView.vue` — call flush on auth success

## Success Criteria
- A logged-out user can click "Try it now" and complete a full breathing session without any auth prompt.
- After finishing, they see "Start Over" and "Save Progress".
- Clicking "Save Progress" leads to `/register` (or `/login`).
- After creating an account or logging in, the session appears in their history on `/dashboard`.
- Only the most recent anonymous session is ever stored in `localStorage`.
