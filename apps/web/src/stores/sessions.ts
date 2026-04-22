import { ref } from "vue";
import { defineStore } from "pinia";
import type { BreathSession, CreateSessionInput, SessionStats, StatsRange } from "@breath/types";
import { apiFetch } from "../lib/api.js";

export const useSessionsStore = defineStore("sessions", () => {
  const sessions = ref<BreathSession[]>([]);
  const stats = ref<SessionStats[]>([]);
  const loading = ref(false);

  async function fetchSessions() {
    loading.value = true;
    sessions.value = await apiFetch<BreathSession[]>("/sessions");
    loading.value = false;
  }

  async function recordSession(data: CreateSessionInput) {
    const session = await apiFetch<BreathSession>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    sessions.value.unshift(session);
    return session;
  }

  async function fetchStats(range: StatsRange = "week") {
    stats.value = await apiFetch<SessionStats[]>(`/sessions/stats?range=${range}`);
  }

  function getTodayDuration(): number {
    const today = new Date().toISOString().split("T")[0];
    return sessions.value
      .filter((s) => {
        const date = new Date(s.completedAt).toISOString().split("T")[0];
        return date === today;
      })
      .reduce((sum, s) => sum + s.duration, 0);
  }

  return {
    sessions,
    stats,
    loading,
    fetchSessions,
    recordSession,
    fetchStats,
    getTodayDuration,
  };
});
