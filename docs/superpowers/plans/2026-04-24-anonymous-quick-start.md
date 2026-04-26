# Anonymous Quick-Start Breathing Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow logged-out users to complete a breathing session via `/try`, store the session in `localStorage`, and automatically sync it to their account after sign-up or login.

**Architecture:** A new unauthenticated `/try` route reuses the existing `BreathCircle` and `useBreathingEngine` components. A small `localStorage` bridge in the sessions store holds the pending session. Login and registration views flush the pending session after auth succeeds.

**Tech Stack:** Vue 3, Pinia, Vue Router, Tailwind CSS, localStorage

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/stores/sessions.ts` | Modify | Add `saveAnonymousSession`, `getAnonymousSession`, `clearAnonymousSession`, `flushAnonymousSession` helpers |
| `apps/web/src/views/QuickStartView.vue` | Create | Full anonymous breathing session UI: fetch default pattern, run engine, show result screen with "Start Over" / "Save Progress" |
| `apps/web/src/router/index.ts` | Modify | Add `/try` route (no auth guard) |
| `apps/web/src/views/LandingView.vue` | Modify | Add "Try it now" button beside existing CTAs |
| `apps/web/src/views/RegisterView.vue` | Modify | Call `flushAnonymousSession` after `fetchUser`, then redirect to `/dashboard` |
| `apps/web/src/views/LoginView.vue` | Modify | Call `flushAnonymousSession` after `fetchUser`, then redirect to `/dashboard` |

---

### Task 1: Add Anonymous Session Helpers to Sessions Store

**Files:**
- Modify: `apps/web/src/stores/sessions.ts`

- [ ] **Step 1: Add the localStorage helpers and `flushAnonymousSession`**

Insert the following constants and functions inside the `defineStore` callback, before the `return` statement:

```ts
const ANONYMOUS_SESSION_KEY = "anonymousSession";

export interface AnonymousSession {
  patternId: string;
  duration: number;
  completedAt: string;
}

function saveAnonymousSession(session: AnonymousSession) {
  localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(session));
}

function getAnonymousSession(): AnonymousSession | null {
  const raw = localStorage.getItem(ANONYMOUS_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnonymousSession;
  } catch {
    return null;
  }
}

function clearAnonymousSession() {
  localStorage.removeItem(ANONYMOUS_SESSION_KEY);
}

async function flushAnonymousSession() {
  const pending = getAnonymousSession();
  if (!pending) return;

  try {
    await recordSession({
      patternId: pending.patternId,
      duration: pending.duration,
    });
    clearAnonymousSession();
  } catch (e: any) {
    const msg = e.message ?? "";
    if (msg.includes("404") || msg.includes("not found")) {
      clearAnonymousSession();
    }
    // Network or other errors: keep in localStorage for retry on next login
  }
}
```

- [ ] **Step 2: Expose `saveAnonymousSession` and `flushAnonymousSession` from the store**

Add them to the `return` object:

```ts
return {
  sessions,
  stats,
  loading,
  fetchSessions,
  recordSession,
  fetchStats,
  getTodayDuration,
  saveAnonymousSession,
  flushAnonymousSession,
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/sessions.ts
git commit -m "feat(sessions): add anonymous session localStorage helpers"
```

---

### Task 2: Create QuickStartView

**Files:**
- Create: `apps/web/src/views/QuickStartView.vue`

- [ ] **Step 1: Scaffold the full view**

Create `apps/web/src/views/QuickStartView.vue` with the following content:

```vue
<template>
  <div v-if="pattern" class="h-full flex flex-col items-center justify-center px-4 relative">
    <!-- Result screen -->
    <div v-if="showResult" class="text-center z-10">
      <div class="text-2xl font-bold mb-2">Session Complete</div>
      <div class="text-lg opacity-60 mb-8">{{ formatTime(totalElapsed) }}</div>
      <div class="flex gap-4 justify-center">
        <button
          @click="startOver"
          class="px-6 py-2.5 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
        >
          Start Over
        </button>
        <button
          @click="saveProgress"
          class="px-6 py-2.5 rounded-full bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors"
        >
          Save Progress
        </button>
      </div>
      <p class="mt-6 text-sm opacity-40">
        Already have an account?
        <RouterLink to="/login" class="text-breath-secondary hover:underline">Sign In</RouterLink>
      </p>
    </div>

    <!-- Header -->
    <div v-if="!showResult" class="absolute top-6 text-center">
      <div class="text-lg font-semibold opacity-80">{{ pattern.name }}</div>
      <div class="text-sm opacity-40 mt-1">{{ formatTime(totalElapsed) }}</div>
    </div>

    <!-- Circle -->
    <BreathCircle
      v-if="!showResult"
      :phase="ePhase"
      :phase-progress="ePhaseProgress"
      :phase-label="ePhaseLabel"
      :time-remaining="ePhaseTimeRemaining"
    />

    <!-- Phase indicators -->
    <div v-if="!showResult" class="absolute bottom-28 flex gap-6 text-xs uppercase tracking-widest opacity-40">
      <span :class="{ 'opacity-100 text-breath-secondary': ePhase === 'inhale' }">Inhale</span>
      <span v-if="pattern.hold > 0" :class="{ 'opacity-100 text-breath-secondary': ePhase === 'hold' }">Hold</span>
      <span :class="{ 'opacity-100 text-breath-secondary': ePhase === 'exhale' }">Exhale</span>
      <span v-if="pattern.holdAfterExhale > 0" :class="{ 'opacity-100 text-breath-secondary': ePhase === 'holdAfterExhale' }">Hold</span>
    </div>

    <!-- Controls -->
    <div v-if="!showResult" class="absolute bottom-10 flex gap-4">
      <button
        v-if="ePhase === 'idle'"
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

  <div v-else class="h-full flex items-center justify-center">
    <p class="opacity-50">Loading pattern...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import { useSessionsStore } from "../stores/sessions.js";
import { useBreathingEngine, type Phase } from "../composables/useBreathingEngine.js";
import BreathCircle from "../components/BreathCircle.vue";

const router = useRouter();
const patternsStore = usePatternsStore();
const sessionsStore = useSessionsStore();

const isPaused = ref(false);
const showResult = ref(false);

onMounted(() => {
  if (patternsStore.patterns.length === 0) {
    patternsStore.fetchPatterns();
  }
});

const pattern = computed(() => {
  const presets = patternsStore.patterns.filter((p) => p.userId === null);
  return presets[0] ?? null;
});

const engine = ref<ReturnType<typeof useBreathingEngine> | null>(null);

watch(
  pattern,
  (p) => {
    if (p) {
      engine.value = useBreathingEngine(p);
    }
  },
  { immediate: true }
);

const ePhase = computed<Phase>(() => (engine.value?.phase as any) ?? "idle");
const ePhaseProgress = computed(() => (engine.value?.phaseProgress as any) ?? 0);
const ePhaseLabel = computed(() => (engine.value?.phaseLabel as any) ?? "");
const ePhaseTimeRemaining = computed(() => (engine.value?.phaseTimeRemaining as any) ?? 0);
const totalElapsed = computed(() => (engine.value?.totalElapsed as any) ?? 0);

function start() {
  showResult.value = false;
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

function endSession() {
  const duration = (engine.value?.totalElapsed as any) ?? 0;
  engine.value?.stop();

  if (duration > 0 && pattern.value) {
    sessionsStore.saveAnonymousSession({
      patternId: pattern.value.id,
      duration,
      completedAt: new Date().toISOString(),
    });
  }

  showResult.value = true;
}

function startOver() {
  showResult.value = false;
  engine.value?.start();
  isPaused.value = false;
}

function saveProgress() {
  router.push("/register");
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

onUnmounted(() => {
  engine.value?.stop();
});
</script>
```

- [ ] **Step 2: Verify no TypeScript errors**

Run:
```bash
cd apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/QuickStartView.vue
git commit -m "feat(try): add QuickStartView for anonymous breathing sessions"
```

---

### Task 3: Add `/try` Route

**Files:**
- Modify: `apps/web/src/router/index.ts`

- [ ] **Step 1: Add the `/try` route**

Insert the new route into the `routes` array before the `/dashboard` route:

```ts
{
  path: "/try",
  name: "try",
  component: () => import("../views/QuickStartView.vue"),
},
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/router/index.ts
git commit -m "feat(router): add /try route for anonymous quick-start"
```

---

### Task 4: Add "Try it now" Button to Landing Page

**Files:**
- Modify: `apps/web/src/views/LandingView.vue`

- [ ] **Step 1: Add the new CTA button**

Replace the existing button group `<div class="flex gap-4">...</div>` with:

```vue
<div class="flex flex-col sm:flex-row gap-4">
  <RouterLink
    to="/try"
    class="px-6 py-3 rounded-full bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors text-center"
  >
    Try it now
  </RouterLink>
  <RouterLink
    to="/register"
    class="px-6 py-3 rounded-full border border-white/15 hover:bg-white/5 transition-colors text-center"
  >
    Get Started
  </RouterLink>
  <RouterLink
    to="/login"
    class="px-6 py-3 rounded-full border border-white/15 hover:bg-white/5 transition-colors text-center"
  >
    Sign In
  </RouterLink>
</div>
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/LandingView.vue
git commit -m "feat(landing): add Try it now button leading to /try"
```

---

### Task 5: Wire Flush into RegisterView

**Files:**
- Modify: `apps/web/src/views/RegisterView.vue`

- [ ] **Step 1: Import the sessions store and call flush after auth success**

Add the import:

```ts
import { useSessionsStore } from "../stores/sessions.js";
```

Instantiate it:

```ts
const sessionsStore = useSessionsStore();
```

Update the success path in `handleRegister` (after `await auth.fetchUser()` and before `router.push`):

```ts
    await auth.fetchUser();
    try {
      await sessionsStore.flushAnonymousSession();
    } catch {
      // keep in localStorage for retry
    }
    router.push("/dashboard");
```

The full `handleRegister` should now read:

```ts
async function handleRegister() {
  loading.value = true;
  error.value = "";

  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        csrfToken,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? "Registration failed");
    }

    await auth.fetchUser();
    try {
      await sessionsStore.flushAnonymousSession();
    } catch {
      // keep in localStorage for retry
    }
    router.push("/dashboard");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/RegisterView.vue
git commit -m "feat(register): flush anonymous session after successful registration"
```

---

### Task 6: Wire Flush into LoginView

**Files:**
- Modify: `apps/web/src/views/LoginView.vue`

- [ ] **Step 1: Import the sessions store and call flush after auth success**

Add the import:

```ts
import { useSessionsStore } from "../stores/sessions.js";
```

Instantiate it:

```ts
const sessionsStore = useSessionsStore();
```

Update the success path in `handleLogin` (after `await auth.fetchUser()` and before `router.push`):

```ts
    await auth.fetchUser();
    try {
      await sessionsStore.flushAnonymousSession();
    } catch {
      // keep in localStorage for retry
    }
    router.push("/dashboard");
```

The full `handleLogin` should now read:

```ts
async function handleLogin() {
  loading.value = true;
  error.value = "";

  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.value, password: password.value, csrfToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? "Login failed");
    }

    await auth.fetchUser();
    try {
      await sessionsStore.flushAnonymousSession();
    } catch {
      // keep in localStorage for retry
    }
    router.push("/dashboard");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/LoginView.vue
git commit -m "feat(login): flush anonymous session after successful login"
```

---

### Task 7: Manual End-to-End Verification

- [ ] **Step 1: Build the frontend**

```bash
cd apps/web && npm run build
```
Expected: `dist/` generated with no errors.

- [ ] **Step 2: Start the dev stack**

```bash
# In one terminal
cd apps/api && npm run dev
# In another terminal
cd apps/web && npm run dev
```

- [ ] **Step 3: Verify the logged-out flow**

1. Open `http://localhost:5173` in an incognito window.
2. Confirm the landing page shows **"Try it now"**, **"Get Started"**, and **"Sign In"** buttons.
3. Click **"Try it now"** — you should land on `/try` with the default pattern loaded.
4. Click **Start** → let it run for a few seconds → click **End Session**.
5. Confirm the **"Session Complete"** screen appears with **"Start Over"** and **"Save Progress"**.
6. Open DevTools → Application → Local Storage → confirm key `anonymousSession` exists with `patternId`, `duration`, and `completedAt`.
7. Click **"Start Over"** — the breathing animation should restart.
8. Click **End Session** again, then open Local Storage — confirm the old value was overwritten by the new session.
9. Click **"Save Progress"** — you should be redirected to `/register`.

- [ ] **Step 4: Verify the post-registration flush**

1. Fill out the registration form and submit.
2. After redirect to `/dashboard`, confirm the session appears in the **Recent Sessions** list.
3. Open DevTools → Local Storage → confirm `anonymousSession` is gone.

- [ ] **Step 5: Verify the post-login flush**

1. In a fresh incognito window, go through `/try` again to create a pending session.
2. Click **"Save Progress"** → click **"Sign In"** → log in with existing credentials.
3. After redirect to `/dashboard`, confirm the new session appears in **Recent Sessions**.
4. Confirm `anonymousSession` is gone from Local Storage.

- [ ] **Step 6: Verify no regression on authenticated `/breathe/:patternId`**

1. Log in normally.
2. Go to `/dashboard` and start a pattern.
3. Confirm `/breathe/:patternId` still works exactly as before (Start, Pause, End Session, auto-save, redirect to `/dashboard`).

- [ ] **Step 7: Final commit**

```bash
git commit --allow-empty -m "feat(anonymous-quick-start): complete e2e verification"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ `/try` route with no auth — Task 3
- ✅ Quick-start view reusing breathing components — Task 2
- ✅ "Start Over" and "Save Progress" CTAs — Task 2
- ✅ localStorage stores exactly one session, overwritten on new session — Task 1 (`saveAnonymousSession` always calls `setItem`)
- ✅ Auto-save after sign-up — Task 5
- ✅ Auto-save after login — Task 6
- ✅ Landing page "Try it now" button — Task 4

**2. Placeholder scan:** No TBDs, TODOs, or vague steps found.

**3. Type consistency:**
- `AnonymousSession` interface uses `patternId: string`, `duration: number`, `completedAt: string`
- `flushAnonymousSession` passes `{ patternId, duration }` to `recordSession`, matching `CreateSessionInput`
- All file paths are exact and consistent throughout the plan.
