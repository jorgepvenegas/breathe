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
