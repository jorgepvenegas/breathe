# Dramatic GSAP Animations for BreathCircle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `BreathCircle` into a visually rich centerpiece with GSAP-driven particle fields, atmospheric vignettes, ripple rings, and dramatic glow effects.

**Architecture:** `BreathCircle.vue` becomes an orchestrator that receives the same 4 props and drives GSAP timelines. Three new child components handle specific visual layers: `ParticleField.vue` (canvas), `AtmosphereVignette.vue` (CSS gradient), and `RippleRing.vue` (SVG). The parent views (`BreatheView.vue`, `QuickStartView.vue`) require no changes.

**Tech Stack:** Vue 3, GSAP, Canvas 2D, SVG

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/package.json` | Modify | Add `gsap` dependency |
| `apps/web/src/components/ParticleField.vue` | Create | Canvas particle system: 40 particles orbit/spiral based on breath phase |
| `apps/web/src/components/AtmosphereVignette.vue` | Create | Full-viewport radial gradient that shifts color with phase |
| `apps/web/src/components/RippleRing.vue` | Create | SVG circle that expands outward and fades; triggered on phase transitions |
| `apps/web/src/components/BreathCircle.vue` | Rewrite | Orchestrator: GSAP timelines for circle scale, glow, label/timer animations; instantiates child components |

---

### Task 1: Install GSAP

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add `gsap` to dependencies**

In `apps/web/package.json`, add `"gsap": "^3.12.5"` to the `dependencies` object:

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
    "gsap": "^3.12.5",
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

- [ ] **Step 2: Install the dependency**

```bash
cd /Users/jorge/code/breath && pnpm install
```

Expected: `gsap` installs successfully, lockfile updated.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "deps: add gsap for dramatic animations"
```

---

### Task 2: Create ParticleField Component

**Files:**
- Create: `apps/web/src/components/ParticleField.vue`

- [ ] **Step 1: Create the file**

Create `apps/web/src/components/ParticleField.vue` with the following content:

```vue
<template>
  <canvas ref="canvasRef" class="absolute inset-0 w-full h-full pointer-events-none" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { Phase } from "../composables/useBreathingEngine.js";

const props = defineProps<{
  phase: Phase;
  phaseProgress: number;
}>();

interface Particle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  baseSpeed: number;
  size: number;
  opacity: number;
  hue: number;
  trail: { x: number; y: number }[];
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId = 0;
let particles: Particle[] = [];

const PARTICLE_COUNT = 40;
const TRAIL_LENGTH = 6;

function createParticles(width: number, height: number): Particle[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const minR = 60;
  const maxR = Math.min(width, height) * 0.4;

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const seed = i * 137.5; // golden angle for distribution
    return {
      angle: (seed * Math.PI) / 180,
      radius: minR + ((seed % 1) * (maxR - minR)),
      baseRadius: minR + ((seed % 1) * (maxR - minR)),
      speed: 0.003 + ((seed * 0.01) % 0.004),
      baseSpeed: 0.003 + ((seed * 0.01) % 0.004),
      size: 2 + ((seed * 0.1) % 3),
      opacity: 0.4 + ((seed * 0.05) % 0.4),
      hue: 200 + ((seed * 0.5) % 60),
      trail: [],
    };
  });
}

function getPhaseParams(phase: Phase) {
  switch (phase) {
    case "inhale":
      return { speedMult: 2.0, radiusTarget: 0.3, opacityMult: 1.2, hueShift: 10 };
    case "hold":
      return { speedMult: 0.3, radiusTarget: 1.0, opacityMult: 0.9, hueShift: 30 };
    case "exhale":
      return { speedMult: 0.5, radiusTarget: 1.5, opacityMult: 0.7, hueShift: 50 };
    case "holdAfterExhale":
      return { speedMult: 0.1, radiusTarget: 1.5, opacityMult: 0.3, hueShift: 50 };
    default:
      return { speedMult: 0, radiusTarget: 1.0, opacityMult: 0, hueShift: 0 };
  }
}

function draw() {
  if (!ctx || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  if (props.phase === "idle") {
    animationId = requestAnimationFrame(draw);
    return;
  }

  const params = getPhaseParams(props.phase);

  for (const p of particles) {
    // Update angle
    p.angle += p.speed;

    // Calculate target radius based on phase
    const targetRadius = p.baseRadius * params.radiusTarget;
    const radiusDiff = targetRadius - p.radius;
    p.radius += radiusDiff * 0.02;

    // Speed interpolation
    const targetSpeed = p.baseSpeed * params.speedMult;
    const speedDiff = targetSpeed - p.speed;
    p.speed += speedDiff * 0.03;

    // Position
    const x = cx + Math.cos(p.angle) * p.radius;
    const y = cy + Math.sin(p.angle) * p.radius;

    // Update trail
    p.trail.push({ x, y });
    if (p.trail.length > TRAIL_LENGTH) p.trail.shift();

    // Draw trail
    if (p.trail.length > 1) {
      for (let i = 0; i < p.trail.length - 1; i++) {
        const t = i / p.trail.length;
        const trailOpacity = t * p.opacity * params.opacityMult * 0.3;
        ctx.beginPath();
        ctx.moveTo(p.trail[i].x, p.trail[i].y);
        ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
        ctx.strokeStyle = `hsla(${p.hue + params.hueShift}, 80%, 70%, ${trailOpacity})`;
        ctx.lineWidth = p.size * t;
        ctx.stroke();
      }
    }

    // Draw particle
    const currentOpacity = p.opacity * params.opacityMult;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2);
    gradient.addColorStop(0, `hsla(${p.hue + params.hueShift}, 80%, 80%, ${currentOpacity})`);
    gradient.addColorStop(1, `hsla(${p.hue + params.hueShift}, 80%, 70%, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, p.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  animationId = requestAnimationFrame(draw);
}

function resize() {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const parent = canvas.parentElement;
  if (!parent) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = parent.clientWidth * dpr;
  canvas.height = parent.clientHeight * dpr;
  canvas.style.width = `${parent.clientWidth}px`;
  canvas.style.height = `${parent.clientHeight}px`;
  if (ctx) ctx.scale(dpr, dpr);
  particles = createParticles(parent.clientWidth, parent.clientHeight);
}

onMounted(() => {
  if (!canvasRef.value) return;
  ctx = canvasRef.value.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  animationId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", resize);
});

watch(() => props.phase, () => {
  // Phase transitions trigger natural animation changes via getPhaseParams
});
</script>
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/jorge/code/breath/apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ParticleField.vue
git commit -m "feat(animations): add ParticleField canvas component"
```

---

### Task 3: Create AtmosphereVignette Component

**Files:**
- Create: `apps/web/src/components/AtmosphereVignette.vue`

- [ ] **Step 1: Create the file**

Create `apps/web/src/components/AtmosphereVignette.vue` with the following content:

```vue
<template>
  <div
    ref="vignetteRef"
    class="absolute inset-0 pointer-events-none"
    :style="{ background: gradient, opacity: currentOpacity }"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import gsap from "gsap";
import type { Phase } from "../composables/useBreathingEngine.js";

const props = defineProps<{
  phase: Phase;
  phaseProgress: number;
}>();

const vignetteRef = ref<HTMLDivElement | null>(null);
const currentOpacity = ref(0.3);

const colorMap: Record<Phase, string> = {
  idle: "rgba(96,165,250,0.05)",
  inhale: "rgba(96,165,250,0.15)",
  hold: "rgba(167,139,250,0.12)",
  exhale: "rgba(52,211,153,0.10)",
  holdAfterExhale: "rgba(52,211,153,0.05)",
};

const gradient = computed(() => {
  const color = colorMap[props.phase];
  return `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`;
});

function animateOpacity() {
  if (props.phase === "idle") {
    gsap.to(currentOpacity, { value: 0.1, duration: 1, ease: "power2.out" });
    return;
  }

  let target = 0.3;
  if (props.phase === "inhale") target = 0.3 + props.phaseProgress * 0.2;
  else if (props.phase === "hold") target = 0.5;
  else if (props.phase === "exhale") target = 0.5 - props.phaseProgress * 0.2;
  else if (props.phase === "holdAfterExhale") target = 0.3;

  gsap.to(currentOpacity, { value: target, duration: 0.5, ease: "power2.out" });
}

watch(() => props.phase, animateOpacity);
watch(() => props.phaseProgress, animateOpacity);
</script>
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/jorge/code/breath/apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/AtmosphereVignette.vue
git commit -m "feat(animations): add AtmosphereVignette component"
```

---

### Task 4: Create RippleRing Component

**Files:**
- Create: `apps/web/src/components/RippleRing.vue`

- [ ] **Step 1: Create the file**

Create `apps/web/src/components/RippleRing.vue` with the following content:

```vue
<template>
  <svg
    class="absolute w-full h-full pointer-events-none"
    viewBox="0 0 360 360"
    :style="{ transform: `rotate(${rotation}deg)` }"
  >
    <circle
      cx="180"
      cy="180"
      :r="radius"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      :stroke-opacity="opacity"
    />
  </svg>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import gsap from "gsap";

const props = defineProps<{
  color: string;
  startRadius: number;
  delay?: number;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const radius = ref(props.startRadius);
const opacity = ref(0.6);
const strokeWidth = ref(3);
const rotation = ref(-90);

onMounted(() => {
  const tl = gsap.timeline({
    delay: props.delay ?? 0,
    onComplete: () => emit("complete"),
  });

  tl.to(radius, {
    value: props.startRadius * 1.5 + 60,
    duration: 1.5,
    ease: "power2.out",
  });

  tl.to(
    opacity,
    {
      value: 0,
      duration: 1.5,
      ease: "power2.in",
    },
    0
  );

  tl.to(
    strokeWidth,
    {
      value: 0.5,
      duration: 1.5,
      ease: "power2.out",
    },
    0
  );
});
</script>
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/jorge/code/breath/apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/RippleRing.vue
git commit -m "feat(animations): add RippleRing component"
```

---

### Task 5: Rewrite BreathCircle as Orchestrator

**Files:**
- Rewrite: `apps/web/src/components/BreathCircle.vue`

- [ ] **Step 1: Replace the entire file**

Write the new `apps/web/src/components/BreathCircle.vue`:

```vue
<template>
  <div ref="containerRef" class="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
    <!-- Atmosphere vignette -->
    <AtmosphereVignette :phase="phase" :phase-progress="phaseProgress" />

    <!-- Particle field -->
    <ParticleField :phase="phase" :phase-progress="phaseProgress" />

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

    <!-- Ripple rings -->
    <RippleRing
      v-for="ring in activeRings"
      :key="ring.id"
      :color="ring.color"
      :start-radius="ring.startRadius"
      :delay="ring.delay"
      @complete="removeRing(ring.id)"
    />

    <!-- Breath circle -->
    <div
      ref="circleRef"
      class="rounded-full flex flex-col items-center justify-center will-change-transform"
      :style="{
        width: '140px',
        height: '140px',
        background: currentBg,
        boxShadow: currentShadow,
      }"
    >
      <div ref="labelRef" class="text-lg sm:text-xl font-semibold tracking-wider uppercase">
        {{ phaseLabel }}
      </div>
      <div ref="timerRef" class="text-3xl sm:text-4xl font-light tabular-nums mt-1">
        {{ timeRemaining }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import gsap from "gsap";
import type { Phase } from "../composables/useBreathingEngine.js";
import ParticleField from "./ParticleField.vue";
import AtmosphereVignette from "./AtmosphereVignette.vue";
import RippleRing from "./RippleRing.vue";

const props = defineProps<{
  phase: Phase;
  phaseProgress: number;
  phaseLabel: string;
  timeRemaining: number;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const circleRef = ref<HTMLDivElement | null>(null);
const labelRef = ref<HTMLDivElement | null>(null);
const timerRef = ref<HTMLDivElement | null>(null);

const circumference = 2 * Math.PI * 175;
let ringIdCounter = 0;

interface ActiveRing {
  id: number;
  color: string;
  startRadius: number;
  delay: number;
}

const activeRings = ref<ActiveRing[]>([]);

const colorMap = {
  inhale: { primary: "#60a5fa", glow: "rgba(96,165,250,", bg: "rgba(96,165,250,0.5)" },
  hold: { primary: "#a78bfa", glow: "rgba(167,139,250,", bg: "rgba(167,139,250,0.4)" },
  exhale: { primary: "#34d399", glow: "rgba(52,211,153,", bg: "rgba(52,211,153,0.4)" },
  holdAfterExhale: { primary: "#34d399", glow: "rgba(52,211,153,", bg: "rgba(52,211,153,0.4)" },
  idle: { primary: "#60a5fa", glow: "rgba(96,165,250,", bg: "rgba(96,165,250,0.5)" },
};

const ringColor = computed(() => colorMap[props.phase].primary);

const currentBg = computed(() => {
  const c = colorMap[props.phase];
  return `radial-gradient(circle at 30% 30%, ${c.bg}, ${c.glow}0.2))`;
});

const currentShadow = computed(() => {
  const c = colorMap[props.phase];
  return `
    0 0 20px ${c.glow}0.6),
    0 0 60px ${c.glow}0.3),
    0 0 120px ${c.glow}0.15),
    inset 0 0 40px rgba(255,255,255,0.05)
  `;
});

// Animate circle scale based on phase and progress
function updateCircleScale() {
  if (!circleRef.value) return;

  const minSize = 140;
  const maxSize = 280;
  let targetScale = 1;

  if (props.phase === "inhale") {
    targetScale = minSize / 140 + ((maxSize - minSize) / 140) * props.phaseProgress;
  } else if (props.phase === "hold") {
    targetScale = maxSize / 140;
  } else if (props.phase === "exhale") {
    targetScale = maxSize / 140 - ((maxSize - minSize) / 140) * props.phaseProgress;
  } else if (props.phase === "holdAfterExhale") {
    targetScale = minSize / 140;
  }

  gsap.to(circleRef.value, {
    scale: targetScale,
    duration: 0.3,
    ease: props.phase === "inhale" ? "elastic.out(1, 0.5)" : "power2.out",
  });
}

// Trigger ripple on phase transitions
let lastPhase: Phase = "idle";
watch(() => props.phase, (newPhase) => {
  if (newPhase !== lastPhase && (newPhase === "inhale" || newPhase === "exhale")) {
    const color = colorMap[newPhase].primary;
    const baseRadius = newPhase === "inhale" ? 140 : 280;

    activeRings.value.push({
      id: ringIdCounter++,
      color,
      startRadius: baseRadius / 2,
      delay: 0,
    });

    // Second staggered ripple
    setTimeout(() => {
      activeRings.value.push({
        id: ringIdCounter++,
        color,
        startRadius: baseRadius / 2,
        delay: 0.1,
      });
    }, 200);
  }
  lastPhase = newPhase;

  updateCircleScale();

  // Label pop animation
  if (labelRef.value) {
    gsap.fromTo(
      labelRef.value,
      { y: -4, opacity: 0.7 },
      { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
    );
  }
});

// Timer tick pop
let lastTimeRemaining = -1;
watch(() => props.timeRemaining, (newVal) => {
  if (newVal !== lastTimeRemaining && timerRef.value) {
    gsap.fromTo(
      timerRef.value,
      { scale: 1.15 },
      { scale: 1, duration: 0.2, ease: "power2.out" }
    );
    lastTimeRemaining = newVal;
  }
});

// Continuous progress-based scale updates
watch(() => props.phaseProgress, updateCircleScale);

function removeRing(id: number) {
  activeRings.value = activeRings.value.filter((r) => r.id !== id);
}

onUnmounted(() => {
  gsap.killTweensOf(circleRef.value);
  gsap.killTweensOf(labelRef.value);
  gsap.killTweensOf(timerRef.value);
});
</script>
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/jorge/code/breath/apps/web && npx vue-tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/BreathCircle.vue
git commit -m "feat(animations): rewrite BreathCircle as GSAP orchestrator"
```

---

### Task 6: Build and Manual Verification

- [ ] **Step 1: Build the frontend**

```bash
cd /Users/jorge/code/breath/apps/web && npm run build
```
Expected: Build completes with zero errors.

- [ ] **Step 2: Start the dev server and verify**

```bash
cd /Users/jorge/code/breath/apps/web && npm run dev
```

Open `http://localhost:5173` in a browser and verify:

1. **Landing page** loads with "Try it now" button.
2. Click "Try it now" → `/try` loads.
3. Click **Start**.
4. Confirm:
   - Central circle scales up with elastic ease during inhale.
   - Particles are visible orbiting the center.
   - Atmosphere vignette shifts color (blue → purple → green).
   - Ripple rings emit at the start of inhale and exhale.
   - Timer digits pop on each second tick.
   - Label text floats on phase changes.
5. Let it run through a full cycle (inhale → hold → exhale → hold).
6. Click **End Session** → result screen appears.
7. Go to `/dashboard`, log in, start a pattern from presets.
8. Confirm `/breathe/:patternId` shows the same dramatic animations.

- [ ] **Step 3: Final commit**

```bash
cd /Users/jorge/code/breath && git commit --allow-empty -m "feat(gsap-animations): verify dramatic BreathCircle animations e2e"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Particle field with 40 particles responding to phases — Task 2
- ✅ Atmosphere vignette shifting color — Task 3
- ✅ Ripple rings on phase transitions — Task 4
- ✅ Central circle with elastic scale, layered glows — Task 5
- ✅ Label float and timer pop animations — Task 5
- ✅ Color palette (blue → purple → green) — Tasks 2, 3, 4, 5
- ✅ Performance: canvas pauses on idle, GPU-accelerated transforms — Task 2, 5
- ✅ No parent view changes — verified (same 4 props interface)

**2. Placeholder scan:** No TBDs, TODOs, or vague steps found.

**3. Type consistency:**
- `Phase` type imported from `../composables/useBreathingEngine.js` in all components
- `ActiveRing` interface defined inline in BreathCircle
- Props match existing interface: `phase`, `phaseProgress`, `phaseLabel`, `timeRemaining`
- `RippleRing` emits `complete` event consistently
- All file paths exact and consistent.
