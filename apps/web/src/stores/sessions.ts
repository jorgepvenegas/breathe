import { ref } from "vue";
import { defineStore } from "pinia";
import type { BreathSession, CreateSessionInput, SessionStats, StatsRange } from "@breath/types";
import { apiFetch } from "../lib/api.js";

export interface AnonymousSession {
  patternId: string;
  duration: number;
  completedAt: string;
}

const ANONYMOUS_SESSION_KEY = "anonymousSession";

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

  function saveAnonymousSession(session: AnonymousSession) {
    localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(session));
  }

  function getAnonymousSession(): AnonymousSession | null {
    const raw = localStorage.getItem(ANONYMOUS_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AnonymousSession;
    } catch {
      return null;
    }
  }

  function clearAnonymousSession() {
    localStorage.removeItem(ANONYMOUS_SESSION_KEY);
  }

  async function flushAnonymousSession() {
    const pending = getAnonymousSession();
    if (!pending) return;

    try {
      await recordSession({
        patternId: pending.patternId,
        duration: pending.duration,
      });
      clearAnonymousSession();
    } catch (e: any) {
      const msg = e.message ?? "";
      if (msg.includes("404") || msg.includes("not found")) {
        clearAnonymousSession();
      }
      // Network or other errors: keep in localStorage for retry on next login
    }
  }

  return {
    sessions,
    stats,
    loading,
    fetchSessions,
    recordSession,
    fetchStats,
    getTodayDuration,
    saveAnonymousSession,
    flushAnonymousSession,
  };
});
