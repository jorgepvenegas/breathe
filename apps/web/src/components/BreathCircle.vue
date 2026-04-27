<template>
  <div ref="containerRef" class="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
    <!-- Atmosphere vignette -->
    <AtmosphereVignette :phase="phase" :phase-progress="phaseProgress" />

    <!-- Particle field -->
    <ParticleField :phase="phase" :phase-progress="phaseProgress" />

    <!-- Progress ring -->
    <svg class="absolute w-full h-full -rotate-90" viewBox="0 0 360 360">
      <circle cx="180" cy="180" r="175" fill="none" stroke="var(--breath-ring-stroke)" stroke-width="4" />
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
      class="rounded-full flex flex-col items-center justify-center"
      :style="{
        width: `${circleSize}px`,
        height: `${circleSize}px`,
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

const MIN_SIZE = 140;
const MAX_SIZE = 280;

const containerRef = ref<HTMLDivElement | null>(null);
const circleRef = ref<HTMLDivElement | null>(null);
const labelRef = ref<HTMLDivElement | null>(null);
const timerRef = ref<HTMLDivElement | null>(null);
const circleSize = ref(MIN_SIZE);

const circumference = 2 * Math.PI * 175;
let ringIdCounter = 0;

interface ActiveRing {
  id: number;
  color: string;
  startRadius: number;
  delay: number;
}

const activeRings = ref<ActiveRing[]>([]);

const colorMap: Record<Phase, { primary: string; glow: string; bg: string }> = {
  idle: { primary: "#60a5fa", glow: "rgba(96,165,250,", bg: "rgba(96,165,250,0.5)" },
  inhale: { primary: "#60a5fa", glow: "rgba(96,165,250,", bg: "rgba(96,165,250,0.5)" },
  hold: { primary: "#a78bfa", glow: "rgba(167,139,250,", bg: "rgba(167,139,250,0.4)" },
  exhale: { primary: "#34d399", glow: "rgba(52,211,153,", bg: "rgba(52,211,153,0.4)" },
  holdAfterExhale: { primary: "#34d399", glow: "rgba(52,211,153,", bg: "rgba(52,211,153,0.3)" },
};

const ringColor = computed(() => colorMap[props.phase].primary);

const currentBg = computed(() => {
  const c = colorMap[props.phase];
  return `radial-gradient(circle at 30% 30%, ${c.bg}, ${c.glow}0.2))`;
});

const currentShadow = computed(() => {
  const c = colorMap[props.phase];
  return [
    `0 0 20px ${c.glow}0.6)`,
    `0 0 60px ${c.glow}0.3)`,
    `0 0 120px ${c.glow}0.15)`,
    `inset 0 0 40px var(--breath-ring-stroke)`,
  ].join(", ");
});

function getTargetSize(phase: Phase, progress: number): number {
  switch (phase) {
    case "inhale":
      return MIN_SIZE + (MAX_SIZE - MIN_SIZE) * progress;
    case "hold":
      return MAX_SIZE;
    case "exhale":
      return MAX_SIZE - (MAX_SIZE - MIN_SIZE) * progress;
    case "holdAfterExhale":
      return MIN_SIZE;
    default:
      return MIN_SIZE;
  }
}

function spawnRipples(phase: Phase) {
  const color = colorMap[phase].primary;
  const startRadius = phase === "inhale" ? MIN_SIZE / 2 : MAX_SIZE / 2;

  activeRings.value.push({ id: ringIdCounter++, color, startRadius, delay: 0 });
  setTimeout(() => {
    activeRings.value.push({ id: ringIdCounter++, color, startRadius, delay: 0 });
  }, 300);
}

let lastPhase: Phase = "idle";

watch(
  () => props.phase,
  (newPhase) => {
    // Ripples on inhale/exhale transitions
    if (newPhase !== lastPhase && (newPhase === "inhale" || newPhase === "exhale")) {
      spawnRipples(newPhase);
    }
    lastPhase = newPhase;

    // Animate circle to phase start size
    gsap.to(circleSize, {
      value: getTargetSize(newPhase, 0),
      duration: 0.4,
      ease: "elastic.out(1, 0.5)",
      overwrite: true,
    });

    // Label float
    if (labelRef.value) {
      gsap.fromTo(
        labelRef.value,
        { y: -6, opacity: 0.5 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
      );
    }
  }
);

// Smooth size tracking during inhale/exhale progress
watch(
  () => props.phaseProgress,
  (progress) => {
    if (props.phase !== "inhale" && props.phase !== "exhale") return;
    gsap.to(circleSize, {
      value: getTargetSize(props.phase, progress),
      duration: 0.15,
      ease: "none",
      overwrite: "auto",
    });
  }
);

// Timer tick pop
let lastTimer = -1;
watch(
  () => props.timeRemaining,
  (val) => {
    if (val !== lastTimer && timerRef.value) {
      gsap.fromTo(
        timerRef.value,
        { scale: 1.18 },
        { scale: 1, duration: 0.25, ease: "power2.out" }
      );
      lastTimer = val;
    }
  }
);

function removeRing(id: number) {
  activeRings.value = activeRings.value.filter((r) => r.id !== id);
}

onUnmounted(() => {
  gsap.killTweensOf(circleSize);
  gsap.killTweensOf(labelRef.value);
  gsap.killTweensOf(timerRef.value);
});
</script>
