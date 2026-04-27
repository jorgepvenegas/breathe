<template>
  <div>
    <div class="flex justify-between mb-1.5">
      <label class="text-sm opacity-60">{{ label }}</label>
      <span class="text-sm font-medium">{{ modelValue }}{{ unit }}</span>
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      class="w-full h-2 rounded-lg appearance-none bg-breath-input-border accent-breath-primary cursor-pointer"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number;
  label: string;
  min: number;
  max: number;
  unit: string;
}>();

defineEmits<{ "update:modelValue": [value: number] }>();
</script>
