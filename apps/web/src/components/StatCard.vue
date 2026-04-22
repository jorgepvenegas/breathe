<template>
  <div class="bg-breath-surface border border-breath-border rounded-2xl p-5">
    <div class="text-3xl font-bold text-breath-secondary">{{ value }}</div>
    <div class="text-xs opacity-50 mt-1 uppercase tracking-wide">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: string; label: string }>();
</script>
