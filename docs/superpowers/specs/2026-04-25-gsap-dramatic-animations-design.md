# Dramatic GSAP Animations for BreathCircle

## Problem
The current `BreathCircle` uses simple CSS transitions for scaling and color changes. The animation feels static and utilitarian — it doesn't create the immersive, dramatic atmosphere that would help users sink into their breathing practice.

## Goal
Transform `BreathCircle` into a visually rich, dramatic centerpiece using GSAP. The circle should feel alive: particles orbit and respond to breath phases, deep atmospheric glows pulse with the rhythm, and ripple rings emanate outward at transitions. The overall effect should feel immersive and meditative without being distracting.

## Design

### 1. Architecture

**File decomposition:**

| File | Responsibility |
|------|----------------|
| `apps/web/src/components/BreathCircle.vue` | Main container. Orchestrates GSAP timelines. Manages lifecycle (mount/unmount). Receives same 4 props. |
| `apps/web/src/components/ParticleField.vue` | Canvas-based particle system. Renders 40 soft particles that orbit/spiral based on breath phase. |
| `apps/web/src/components/AtmosphereVignette.vue` | Full-viewport radial gradient background that shifts color with the phase. |
| `apps/web/src/components/RippleRing.vue` | SVG ring that expands outward from the circle edge and fades. Triggered on phase transitions. |

**Data flow:** `BreathCircle` receives `phase`, `phaseProgress`, `phaseLabel`, `timeRemaining` from parent. It derives animation targets from these and drives GSAP timelines that control child components via template refs and exposed methods.

### 2. Particle Field (Canvas)

- **40 particles**, each a soft radial gradient circle (no sharp edges).
- Particles exist in a polar coordinate system around the center.
- **Inhale:** spiral inward toward center, speed increases to 2x baseline, brightness increases, trail length increases.
- **Hold:** gentle oscillation (±10px), slow rotation, soft pulse in opacity.
- **Exhale:** drift outward, speed decreases to 0.5x baseline, dim slightly, shorter trails.
- **holdAfterExhale:** minimal motion, dimmed to ~20% opacity, barely visible.
- **idle:** all particles hidden or frozen.
- Canvas renders at 60fps via `requestAnimationFrame`. Animation loop pauses when `phase === 'idle'`.
- Particles are seeded deterministically so the pattern looks the same each session.

### 3. Central Circle

- Size scales from 140px to 280px using GSAP `elastic.out(1, 0.5)` ease for a living, organic overshoot.
- **Three layered glows** (CSS `box-shadow` animated via GSAP):
  - Inner: tight, bright glow (20px blur)
  - Middle: medium spread (60px blur)
  - Outer: diffuse atmospheric bloom (120px blur)
- Glow intensity pulses: stronger on inhale peak and exhale start, softer during holds.
- Subtle continuous rotation (2° back-and-forth) during holds.
- Color interpolation:
  - Inhale: `#60a5fa` (blue-400)
  - Hold: `#a78bfa` (violet-400)
  - Exhale: `#34d399` (emerald-400)
  - holdAfterExhale: `#34d399` (emerald-400)
- Background gradient also interpolates color via GSAP.

### 4. Ripple Rings

- **2 SVG `<circle>` elements** that spawn at phase transitions (inhale start, exhale start).
- Start at the edge of the central circle's current size.
- Expand outward to 1.5x the central circle's max size over ~1.5s.
- Fade opacity from 0.6 to 0 during expansion.
- Stroke color matches the phase: blue for inhale, green for exhale.
- Stroke width starts at 3px and thins to 0.5px.
- GSAP timeline: `scale` + `opacity` + `strokeWidth`.
- Multiple ripples can exist simultaneously (staggered spawning).

### 5. Atmosphere Vignette

- Full-size `position: absolute` div behind everything.
- Large radial gradient: `radial-gradient(circle at center, <phase-color> 0%, transparent 70%)`.
- Color interpolates with GSAP to match the current phase.
- Overall opacity breathes: `0.3 → 0.5 → 0.3` over the course of a full breath cycle.
- `pointer-events: none` so it doesn't block interactions.

### 6. Phase Label & Timer

- Label text floats with a subtle `translateY(-4px)` pop animation on each phase change.
- Timer digits have a quick `scale(1.1) → scale(1)` pop on each second tick.
- Both use GSAP with `duration: 0.2`, `ease: "power2.out"`.

### 7. Color Palette

| Phase | Primary | Glow | Atmosphere | Particle |
|-------|---------|------|------------|----------|
| Inhale | `#60a5fa` (blue-400) | `rgba(96,165,250,0.4)` | `rgba(96,165,250,0.15)` | bright blue |
| Hold | `#a78bfa` (violet-400) | `rgba(167,139,250,0.35)` | `rgba(167,139,250,0.12)` | soft violet |
| Exhale | `#34d399` (emerald-400) | `rgba(52,211,153,0.3)` | `rgba(52,211,153,0.1)` | dim green |
| holdAfterExhale | `#34d399` | `rgba(52,211,153,0.15)` | `rgba(52,211,153,0.05)` | very dim green |

### 8. Performance

- Canvas particles: single `requestAnimationFrame` loop, pauses on idle.
- All DOM animations use `transform` and `opacity` only (GPU-accelerated).
- GSAP `will-change` applied to animated elements.
- Ripple rings removed from DOM after animation completes.
- Atmosphere vignette uses CSS gradient (not animated box-shadow).

### 9. GSAP Plugins Used

- `gsap` core — timelines, tweens
- `gsap/ScrollTrigger` — not needed
- No additional plugins required; standard easing functions (`elastic.out`, `power2.inOut`, `sine.inOut`) cover all needs.

### 10. Files Changed

- `apps/web/package.json` — add `gsap` dependency
- `apps/web/src/components/BreathCircle.vue` — complete rewrite as orchestrator
- `apps/web/src/components/ParticleField.vue` — new canvas particle component
- `apps/web/src/components/AtmosphereVignette.vue` — new background vignette component
- `apps/web/src/components/RippleRing.vue` — new ripple SVG component

## Success Criteria
- Breathing session feels immersive and dramatic, not static.
- Particles respond visibly to inhale/hold/exhale phases.
- Ripple rings trigger at phase transitions.
- Atmosphere color shifts smoothly with the breath.
- All animations run at 60fps on modern devices.
- No regressions: `BreatheView.vue` and `QuickStartView.vue` still work unchanged.
