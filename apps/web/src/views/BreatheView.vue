<template>
  <div v-if="pattern" class="h-full flex flex-col items-center justify-center px-4 relative">
    <!-- Header -->
    <div class="absolute top-6 text-center">
      <div class="text-lg font-semibold opacity-80">{{ pattern.name }}</div>
      <div class="text-sm opacity-40 mt-1">{{ formatTime(totalElapsed) }}</div>
    </div>

    <!-- Circle -->
    <BreathCircle
      :phase="ePhase"
      :phase-progress="ePhaseProgress"
      :phase-label="ePhaseLabel"
      :time-remaining="ePhaseTimeRemaining"
    />

    <!-- Phase indicators -->
    <div class="absolute bottom-28 flex gap-6 text-xs uppercase tracking-widest opacity-40">
      <span :class="{ 'opacity-100 text-breath-secondary': ePhase === 'inhale' }">Inhale</span>
      <span v-if="pattern.hold > 0" :class="{ 'opacity-100 text-breath-secondary': ePhase === 'hold' }">Hold</span>
      <span :class="{ 'opacity-100 text-breath-secondary': ePhase === 'exhale' }">Exhale</span>
      <span v-if="pattern.holdAfterExhale > 0" :class="{ 'opacity-100 text-breath-secondary': ePhase === 'holdAfterExhale' }">Hold</span>
    </div>

    <!-- Controls -->
    <div class="absolute bottom-10 flex gap-4">
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
          class="px-6 py-2.5 rounded-full border border-breath-border-dashed hover:bg-breath-surface-hover transition-colors"
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
    <p class="opacity-50">Pattern not found</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import { useSessionsStore } from "../stores/sessions.js";
import { useBreathingEngine, type Phase } from "../composables/useBreathingEngine.js";
import BreathCircle from "../components/BreathCircle.vue";

const route = useRoute();
const router = useRouter();
const patternsStore = usePatternsStore();
const sessionsStore = useSessionsStore();

const patternId = route.params.patternId as string;
const isPaused = ref(false);

onMounted(() => {
  if (patternsStore.patterns.length === 0) {
    patternsStore.fetchPatterns();
  }
});

const pattern = computed(() => patternsStore.getPatternById(patternId));

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

async function endSession() {
  const duration = (engine.value?.totalElapsed as any) ?? 0;
  engine.value?.stop();

  if (duration > 0) {
    // Queue in localStorage in case of network failure
    const pending = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
    pending.push({ patternId, duration });
    localStorage.setItem("pendingSessions", JSON.stringify(pending));

    try {
      await sessionsStore.recordSession({ patternId, duration });
      // Remove from pending if successful
      const updated = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
      const idx = updated.findIndex(
        (s: any) => s.patternId === patternId && s.duration === duration
      );
      if (idx >= 0) {
        updated.splice(idx, 1);
        localStorage.setItem("pendingSessions", JSON.stringify(updated));
      }
    } catch {
      // Will retry on next page load
    }
  }

  router.push("/dashboard");
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Try to flush pending sessions on mount
onMounted(async () => {
  const pending = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
  if (pending.length > 0) {
    for (const session of pending) {
      try {
        await sessionsStore.recordSession(session);
      } catch {
        break;
      }
    }
    // Re-read and clear successfully sent ones
    const remaining = JSON.parse(localStorage.getItem("pendingSessions") ?? "[]");
    localStorage.setItem("pendingSessions", JSON.stringify(remaining));
  }
});

onUnmounted(() => {
  engine.value?.stop();
});
</script>
