<template>
  <div class="w-full">
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full" preserveAspectRatio="none">
      <!-- Bars -->
      <rect
        v-for="(bar, i) in bars"
        :key="i"
        :x="bar.x"
        :y="bar.y"
        :width="bar.width"
        :height="bar.height"
        rx="3"
        fill="#60a5fa"
        opacity="0.8"
      />
      <!-- X axis labels -->
      <text
        v-for="(bar, i) in bars"
        :key="`label-${i}`"
        :x="bar.x + bar.width / 2"
        :y="height - 4"
        text-anchor="middle"
        fill="var(--breath-text-muted)"
        font-size="10"
      >
        {{ bar.label }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SessionStats } from "@breath/types";

const props = defineProps<{
  data: SessionStats[];
}>();

const width = 600;
const height = 200;
const padding = { top: 10, right: 10, bottom: 24, left: 10 };

const chartWidth = width - padding.left - padding.right;
const chartHeight = height - padding.top - padding.bottom;

const maxValue = computed(() => {
  if (props.data.length === 0) return 1;
  return Math.max(...props.data.map((d) => d.totalDuration), 1);
});

const bars = computed(() => {
  const barWidth = props.data.length > 0 ? chartWidth / props.data.length * 0.6 : 0;
  const gap = props.data.length > 0 ? chartWidth / props.data.length * 0.4 : 0;

  return props.data.map((d, i) => {
    const barHeight = (d.totalDuration / maxValue.value) * chartHeight;
    return {
      x: padding.left + i * (barWidth + gap) + gap / 2,
      y: padding.top + chartHeight - barHeight,
      width: barWidth,
      height: barHeight,
      label: formatLabel(d.date),
    };
  });
});

function formatLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
</script>
