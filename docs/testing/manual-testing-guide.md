# Manual Testing Guide — Breathing App

## Prerequisites

```bash
cd /Users/jorge/code/breath/.worktrees/implement

# 1. Start PostgreSQL (Docker)
docker run -d --name breath-db -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=breath \
  -p 5432:5432 postgres:16

# 2. Run migrations and seed
pnpm db:migrate     # When prompted, type: init
pnpm db:seed

# 3. Terminal 1 — Start API
cd apps/api && pnpm dev

# 4. Terminal 2 — Start Web
cd apps/web && pnpm dev
```

App: **http://localhost:5173** | API: **http://localhost:3001**

---

## Test 1: Landing Page

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open http://localhost:5173 | Dark page with "breathe" title, pulsing circle, "Get Started" + "Sign In" buttons |
| 1.2 | Click "Get Started" | Goes to /register |
| 1.3 | Click "Sign In" | Goes to /login |

## Test 2: Registration

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Enter name, email, password (8+ chars) on /register | Form accepts input |
| 2.2 | Click "Create Account" | Redirects to /dashboard, nav bar appears |
| 2.3 | Check Network tab | POST /api/auth/sign-up/email returns 200 |

## Test 3: Login / Logout

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Click "Sign Out" in nav bar | Redirects to /login |
| 3.2 | Enter correct credentials, click "Sign In" | Redirects to /dashboard |
| 3.3 | Enter wrong password | Error message appears below form |
| 3.4 | Refresh /dashboard while logged in | Stays on dashboard (session persisted via cookie) |

## Test 4: Dashboard

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Check "Today" card | Shows "0s" (no sessions yet) |
| 4.2 | Check "Quick Start" | 3 preset cards: Box Breathing (□), 4-7-8 Relax (~), Coherent Breathing (∞) |
| 4.3 | Check timings | Box = "4 · 4 · 4 · 4", 4-7-8 = "4 · 7 · 8", Coherent = "5 · 0 · 5" |
| 4.4 | Check "Recent Sessions" | "No sessions yet. Start breathing!" |
| 4.5 | Click "Create Custom Pattern" | Navigates to /patterns/new |

## Test 5: Breathing Session (4-7-8 Relax)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | From dashboard, click 4-7-8 Relax card | Goes to /breathe/preset-4-7-8-relax |
| 5.2 | Check layout | Pattern name at top, large circle center, phase labels bottom, "Start" button |
| 5.3 | Click "Start" | Circle expands, "Inhale" label, countdown from 4 |
| 5.4 | Wait ~4s | Circle at max size, label changes to "Hold", countdown from 7 |
| 5.5 | Wait ~7s | Circle holds at max size with glow, label "Hold", countdown 7→0 |
| 5.6 | Wait ~8s | Circle shrinks, label "Exhale", countdown 8→0 |
| 5.7 | After one cycle | Circle expands again, cycle repeats |
| 5.8 | Click "Pause" | Animation freezes, button changes to "Resume" |
| 5.9 | Click "Resume" | Animation resumes from paused state |
| 5.10 | Click "End Session" | Redirects to /dashboard |
| 5.11 | Check dashboard | "Today" shows duration (e.g., "12s"), Recent Sessions lists the session |

## Test 6: Box Breathing (4 phases)

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Start Box Breathing from dashboard | All 4 phases: Inhale → Hold → Exhale → Hold |
| 6.2 | Check phase indicators | Bottom shows 4 labels, active one highlighted |
| 6.3 | Check ring colors | Inhale = blue, Hold = purple, Exhale = green |

## Test 7: Custom Pattern Builder

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Go to /patterns/new | Form: name, 4 sliders, description |
| 7.2 | Drag sliders | Values update live (e.g., "Inhale 7s") |
| 7.3 | Click "Preview" | Modal opens, animation plays one full cycle, auto-stops |
| 7.4 | Click outside modal or "Close Preview" | Returns to form |
| 7.5 | Fill name, click "Save" | Redirects to /patterns, new pattern in list |
| 7.6 | Go to dashboard | New pattern appears in Quick Start |
| 7.7 | Start custom pattern | Animation follows your custom durations |

## Test 8: Patterns Management

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Go to /patterns | Lists only YOUR custom patterns (not built-ins) |
| 8.2 | Click ▶ on a pattern | Starts breathing session with that pattern |
| 8.3 | Click ✕ on a pattern | Browser confirm dialog appears |
| 8.4 | Confirm delete | Pattern removed, gone from dashboard |
| 8.5 | Try deleting built-in | Not possible — they don't appear here |

## Test 9: Session Recording & History

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Complete 2-3 sessions with different patterns | Each shows in dashboard's Recent Sessions |
| 9.2 | Go to /history | Shows range selector (This Week / This Month / All Time) |
| 9.3 | Check chart | Bar chart shows daily total minutes |
| 9.4 | Check stats cards | Total Minutes, Sessions count, Avg Session calculated |
| 9.5 | Check session list | All sessions listed with pattern name, date, duration |
| 9.6 | Switch range to "All Time" | Chart updates, stats recalculate |
| 9.7 | Switch range to "This Month" | Chart updates for last 30 days |

## Test 10: Auth Protection

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | Log out | Redirected to /login |
| 10.2 | Try to visit /dashboard directly | Redirected to /login |
| 10.3 | Try to visit /breathe/preset-box-breathing | Redirected to /login |
| 10.4 | Try to visit /patterns | Redirected to /login |
| 10.5 | Try to visit /history | Redirected to /login |
| 10.6 | Log in | Redirected back to /dashboard |

## Test 11: Offline Session Queue

| Step | Action | Expected |
|------|--------|----------|
| 11.1 | Start a session, then stop the API server (Ctrl+C) | |
| 11.2 | Click "End Session" | Redirects to dashboard. Session NOT saved yet |
| 11.3 | Restart API server | |
| 11.4 | Refresh dashboard or start another session | Pending session gets auto-sent to API |
| 11.5 | Check history | The offline session now appears |

## Test 12: Mobile Responsiveness

| Step | Action | Expected |
|------|--------|----------|
| 12.1 | Open DevTools, toggle device to iPhone SE | Layout adapts, no horizontal scroll |
| 12.2 | Check breathing circle | Scales down to fit screen |
| 12.3 | Check dashboard grid | 1-column layout on small screens |
| 12.4 | Check pattern builder sliders | Touch-friendly, easy to drag |

## Quick Smoke Test (5 minutes)

```
1. Open http://localhost:5173
2. Register a new account
3. Start Box Breathing session
4. Wait one full cycle (16s)
5. Click "End Session"
6. Verify dashboard shows the session
7. Go to /history, verify chart appears
8. Go to /patterns/new, create a custom pattern
9. Start the custom pattern, verify it works
10. Sign out, verify redirect to /login
```
