<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Your Patterns</h1>
      <RouterLink
        to="/patterns/new"
        class="px-4 py-2 rounded-full bg-breath-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
      >
        + New Pattern
      </RouterLink>
    </div>

    <div class="space-y-3">
      <div
        v-for="pattern in customPatterns"
        :key="pattern.id"
        class="flex items-center justify-between bg-breath-surface border border-breath-border rounded-xl px-5 py-4"
      >
        <div>
          <div class="font-medium">{{ pattern.name }}</div>
          <div class="text-xs opacity-50 mt-0.5">{{ formatTiming(pattern) }}</div>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="startPattern(pattern.id)"
            class="w-8 h-8 rounded-full bg-breath-primary/20 text-breath-primary flex items-center justify-center text-xs hover:bg-breath-primary/30 transition-colors"
          >
            ▶
          </button>
          <button
            @click="deletePattern(pattern.id)"
            class="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xs hover:bg-red-500/20 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div v-if="customPatterns.length === 0" class="text-center py-12 opacity-40">
      <p class="text-sm">No custom patterns yet.</p>
      <RouterLink to="/patterns/new" class="text-breath-secondary text-sm hover:underline mt-2 inline-block">
        Create your first pattern
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import type { BreathingPattern } from "@breath/types";

const router = useRouter();
const patternsStore = usePatternsStore();

onMounted(() => {
  patternsStore.fetchPatterns();
});

const customPatterns = computed(() =>
  patternsStore.patterns.filter((p) => p.userId !== null)
);

function formatTiming(p: BreathingPattern) {
  const parts = [p.inhale, p.hold, p.exhale];
  if (p.holdAfterExhale > 0) parts.push(p.holdAfterExhale);
  return parts.join(" · ");
}

function startPattern(id: string) {
  router.push(`/breathe/${id}`);
}

async function deletePattern(id: string) {
  if (!confirm("Delete this pattern?")) return;
  await patternsStore.deletePattern(id);
}
</script>
