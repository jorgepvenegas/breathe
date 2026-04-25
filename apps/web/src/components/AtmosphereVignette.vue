<template>
  <div
    ref="vignetteRef"
    class="absolute inset-0 pointer-events-none transition-all duration-700"
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

const currentOpacity = ref(0.1);

const colorMap: Record<Phase, string> = {
  idle: "rgba(96,165,250,0.05)",
  inhale: "rgba(96,165,250,0.18)",
  hold: "rgba(167,139,250,0.14)",
  exhale: "rgba(52,211,153,0.12)",
  holdAfterExhale: "rgba(52,211,153,0.06)",
};

const gradient = computed(() => {
  const color = colorMap[props.phase];
  return `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`;
});

watch(
  () => [props.phase, props.phaseProgress] as const,
  ([phase, progress]) => {
    let target = 0.3;
    if (phase === "idle") target = 0.1;
    else if (phase === "inhale") target = 0.3 + progress * 0.25;
    else if (phase === "hold") target = 0.55;
    else if (phase === "exhale") target = 0.55 - progress * 0.25;
    else if (phase === "holdAfterExhale") target = 0.3;

    gsap.to(currentOpacity, { value: target, duration: 0.5, ease: "power2.out" });
  }
);
</script>
