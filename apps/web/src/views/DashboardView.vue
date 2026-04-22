<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <StatCard :value="todayMinutes" label="Today" />
      <StatCard :value="String(sessionsStore.sessions.length)" label="Sessions" />
      <StatCard value="0d" label="Streak" />
    </div>

    <h2 class="text-lg font-semibold mb-4">Quick Start</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <PatternCard
        v-for="pattern in presetPatterns"
        :key="pattern.id"
        :pattern="pattern"
        @start="startPattern"
      />
      <RouterLink
        to="/patterns/new"
        class="flex items-center justify-center gap-2 bg-breath-surface border border-dashed border-white/15 rounded-2xl p-5 opacity-60 hover:opacity-100 hover:bg-white/[0.06] transition-all"
      >
        <span class="text-lg">+</span>
        <span class="text-sm">Create Custom Pattern</span>
      </RouterLink>
    </div>

    <h2 class="text-lg font-semibold mb-4">Recent Sessions</h2>
    <div class="bg-breath-surface border border-breath-border rounded-2xl overflow-hidden">
      <div
        v-for="session in recentSessions"
        :key="session.id"
        class="flex justify-between items-center px-5 py-3 border-b border-white/[0.04] last:border-b-0"
      >
        <div>
          <div class="font-medium">{{ session.pattern?.name ?? "Unknown" }}</div>
          <div class="text-xs opacity-40">{{ formatDate(session.completedAt) }}</div>
        </div>
        <div class="text-sm opacity-60">{{ formatDuration(session.duration) }}</div>
      </div>
      <div v-if="recentSessions.length === 0" class="px-5 py-8 text-center opacity-40 text-sm">
        No sessions yet. Start breathing!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import { useSessionsStore } from "../stores/sessions.js";
import StatCard from "../components/StatCard.vue";
import PatternCard from "../components/PatternCard.vue";

const router = useRouter();
const patternsStore = usePatternsStore();
const sessionsStore = useSessionsStore();

onMounted(() => {
  patternsStore.fetchPatterns();
  sessionsStore.fetchSessions();
});

const presetPatterns = computed(() =>
  patternsStore.patterns.filter((p) => p.userId === null)
);

const todayMinutes = computed(() => {
  const secs = sessionsStore.getTodayDuration();
  return secs >= 60 ? `${Math.floor(secs / 60)}m` : `${secs}s`;
});

const recentSessions = computed(() => sessionsStore.sessions.slice(0, 5));

function startPattern(id: string) {
  router.push(`/breathe/${id}`);
}

function formatDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(seconds: number) {
  return seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds}s`;
}
</script>
