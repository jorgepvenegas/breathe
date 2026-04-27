<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">History</h1>

    <!-- Range selector -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="r in ranges"
        :key="r"
        @click="range = r"
        :class="[
          'px-4 py-1.5 rounded-full text-sm transition-colors',
          range === r
            ? 'bg-breath-primary text-white'
            : 'bg-breath-surface border border-breath-input-border hover:bg-breath-surface-hover',
        ]"
      >
        {{ r === "all" ? "All Time" : r === "week" ? "This Week" : "This Month" }}
      </button>
    </div>

    <!-- Chart -->
    <div class="bg-breath-surface border border-breath-border rounded-2xl p-5 mb-6">
      <BarChart :data="sessionsStore.stats" />
    </div>

    <!-- Stats summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <StatCard :value="totalMinutes" label="Total Minutes" />
      <StatCard :value="String(sessionsStore.sessions.length)" label="Sessions" />
      <StatCard value="—" label="Streak" />
      <StatCard :value="avgDuration" label="Avg Session" />
    </div>

    <!-- Session list -->
    <h2 class="text-lg font-semibold mb-4">All Sessions</h2>
    <div class="bg-breath-surface border border-breath-border rounded-2xl overflow-hidden">
      <div
        v-for="session in sessionsStore.sessions"
        :key="session.id"
        class="flex justify-between items-center px-5 py-3 border-b border-breath-border last:border-b-0"
      >
        <div>
          <div class="font-medium">{{ session.pattern?.name ?? "Unknown" }}</div>
          <div class="text-xs opacity-40">{{ formatDate(session.completedAt) }}</div>
        </div>
        <div class="text-sm opacity-60">{{ formatDuration(session.duration) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useSessionsStore } from "../stores/sessions.js";
import type { StatsRange } from "@breath/types";
import StatCard from "../components/StatCard.vue";
import BarChart from "../components/BarChart.vue";

const sessionsStore = useSessionsStore();
const range = ref<StatsRange>("week");
const ranges: StatsRange[] = ["week", "month", "all"];

onMounted(() => {
  sessionsStore.fetchSessions();
  sessionsStore.fetchStats(range.value);
});

watch(range, (r) => {
  sessionsStore.fetchStats(r);
});

const totalMinutes = computed(() => {
  const total = sessionsStore.sessions.reduce((sum, s) => sum + s.duration, 0);
  return `${Math.round(total / 60)}`;
});

const avgDuration = computed(() => {
  if (sessionsStore.sessions.length === 0) return "—";
  const avg =
    sessionsStore.sessions.reduce((sum, s) => sum + s.duration, 0) /
    sessionsStore.sessions.length;
  return avg >= 60 ? `${Math.round(avg / 60)}m` : `${Math.round(avg)}s`;
});

function formatDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  return seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds}s`;
}
</script>
