<template>
  <div
    class="bg-breath-surface border border-breath-border rounded-2xl p-5 cursor-pointer hover:bg-breath-surface-hover transition-colors relative"
    @click="$emit('start', pattern.id)"
  >
    <div
      class="w-12 h-12 rounded-full bg-breath-primary/15 flex items-center justify-center text-xl mb-3"
    >
      {{ icon }}
    </div>
    <div class="font-semibold">{{ pattern.name }}</div>
    <div class="text-xs opacity-50 mt-1">{{ timing }}</div>
    <div
      class="absolute top-5 right-5 w-8 h-8 rounded-full bg-breath-primary flex items-center justify-center text-xs text-white"
    >
      ▶
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BreathingPattern } from "@breath/types";

const props = defineProps<{ pattern: BreathingPattern }>();
defineEmits<{ start: [id: string] }>();

const timing = computed(() => {
  const parts = [props.pattern.inhale, props.pattern.hold, props.pattern.exhale];
  if (props.pattern.holdAfterExhale > 0) parts.push(props.pattern.holdAfterExhale);
  return parts.join(" · ");
});

const icon = computed(() => {
  if (props.pattern.holdAfterExhale > 0) return "□";
  if (props.pattern.hold > props.pattern.inhale) return "~";
  return "∞";
});
</script>
