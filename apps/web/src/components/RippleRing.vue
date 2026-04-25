<template>
  <svg
    class="absolute w-full h-full pointer-events-none -rotate-90"
    viewBox="0 0 360 360"
  >
    <circle
      cx="180"
      cy="180"
      :r="radius"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      :stroke-opacity="opacity"
    />
  </svg>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import gsap from "gsap";

const props = defineProps<{
  color: string;
  startRadius: number;
  delay?: number;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const radius = ref(props.startRadius);
const opacity = ref(0.6);
const strokeWidth = ref(3);

onMounted(() => {
  const tl = gsap.timeline({
    delay: props.delay ?? 0,
    onComplete: () => emit("complete"),
  });

  tl.to(radius, {
    value: props.startRadius * 1.5 + 80,
    duration: 1.5,
    ease: "power2.out",
  }, 0);

  tl.to(opacity, {
    value: 0,
    duration: 1.5,
    ease: "power2.in",
  }, 0);

  tl.to(strokeWidth, {
    value: 0.5,
    duration: 1.5,
    ease: "power2.out",
  }, 0);
});
</script>
