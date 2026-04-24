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
