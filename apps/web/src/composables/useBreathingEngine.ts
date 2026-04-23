import { ref, computed } from "vue";
import type { BreathingPattern } from "@breath/types";

export type Phase = "idle" | "inhale" | "hold" | "exhale" | "holdAfterExhale";

export function useBreathingEngine(pattern: BreathingPattern) {
  const phase = ref<Phase>("idle");
  const phaseElapsed = ref(0); // seconds into current phase
  const totalElapsed = ref(0); // total seconds of the session
  const cycleCount = ref(0);

  let timer: ReturnType<typeof setInterval> | null = null;
  let phaseStartTime = 0;
  let sessionStartTime = 0;
  let pausedDuration = 0;
  let pauseStartTime = 0;

  const phaseDuration = computed(() => {
    switch (phase.value) {
      case "inhale":
        return pattern.inhale;
      case "hold":
        return pattern.hold;
      case "exhale":
        return pattern.exhale;
      case "holdAfterExhale":
        return pattern.holdAfterExhale;
      default:
        return 0;
    }
  });

  const phaseProgress = computed(() => {
    if (phaseDuration.value === 0) return 1;
    return phaseElapsed.value / phaseDuration.value;
  });

  const phaseLabel = computed(() => {
    switch (phase.value) {
      case "inhale":
        return "Inhale";
      case "hold":
        return "Hold";
      case "exhale":
        return "Exhale";
      case "holdAfterExhale":
        return "Hold";
      default:
        return "";
    }
  });

  const phaseTimeRemaining = computed(() =>
    Math.max(0, Math.ceil(phaseDuration.value - phaseElapsed.value))
  );

  function nextPhase(): Phase {
    switch (phase.value) {
      case "idle":
        return "inhale";
      case "inhale":
        return pattern.hold > 0 ? "hold" : "exhale";
      case "hold":
        return "exhale";
      case "exhale":
        return pattern.holdAfterExhale > 0 ? "holdAfterExhale" : "inhale";
      case "holdAfterExhale":
        return "inhale";
      default:
        return "idle";
    }
  }

  function tick() {
    const now = Date.now();
    const delta = (now - phaseStartTime) / 1000;
    const currentPhaseDuration = phaseDuration.value;
    phaseElapsed.value = Math.min(delta, currentPhaseDuration);
    totalElapsed.value = Math.floor((now - sessionStartTime) / 1000 - pausedDuration);

    if (delta >= currentPhaseDuration) {
      const oldPhase = phase.value;
      phase.value = nextPhase();
      // Carry overshoot into the next phase so time doesn't drift
      phaseStartTime += currentPhaseDuration * 1000;
      phaseElapsed.value = (now - phaseStartTime) / 1000;

      if (oldPhase === "holdAfterExhale" || (oldPhase === "exhale" && pattern.holdAfterExhale === 0)) {
        cycleCount.value++;
      }
    }
  }

  function start() {
    if (timer) return;
    phase.value = "inhale";
    phaseStartTime = Date.now();
    sessionStartTime = Date.now();
    pausedDuration = 0;
    phaseElapsed.value = 0;
    totalElapsed.value = 0;
    cycleCount.value = 0;
    timer = setInterval(tick, 100);
  }

  function pause() {
    if (timer) {
      clearInterval(timer);
      timer = null;
      pauseStartTime = Date.now();
    }
  }

  function resume() {
    if (!timer && phase.value !== "idle") {
      pausedDuration += (Date.now() - pauseStartTime) / 1000;
      phaseStartTime = Date.now() - phaseElapsed.value * 1000;
      timer = setInterval(tick, 100);
    }
  }

  function stop() {
    pause();
    phase.value = "idle";
    phaseElapsed.value = 0;
  }

  return {
    phase,
    phaseElapsed,
    totalElapsed,
    cycleCount,
    phaseDuration,
    phaseProgress,
    phaseLabel,
    phaseTimeRemaining,
    start,
    pause,
    resume,
    stop,
  };
}
