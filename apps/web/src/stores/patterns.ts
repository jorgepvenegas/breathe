import { ref } from "vue";
import { defineStore } from "pinia";
import type { BreathingPattern, CreatePatternInput } from "@breath/types";
import { apiFetch } from "../lib/api.js";

export const usePatternsStore = defineStore("patterns", () => {
  const patterns = ref<BreathingPattern[]>([]);
  const loading = ref(false);

  async function fetchPatterns() {
    loading.value = true;
    patterns.value = await apiFetch<BreathingPattern[]>("/patterns");
    loading.value = false;
  }

  async function createPattern(data: CreatePatternInput) {
    const pattern = await apiFetch<BreathingPattern>("/patterns", {
      method: "POST",
      body: JSON.stringify(data),
    });
    patterns.value.push(pattern);
    return pattern;
  }

  async function deletePattern(id: string) {
    await apiFetch(`/patterns/${id}`, { method: "DELETE" });
    patterns.value = patterns.value.filter((p) => p.id !== id);
  }

  function getPatternById(id: string) {
    return patterns.value.find((p) => p.id === id);
  }

  return {
    patterns,
    loading,
    fetchPatterns,
    createPattern,
    deletePattern,
    getPatternById,
  };
});
