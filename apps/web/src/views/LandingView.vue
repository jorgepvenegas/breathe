<template>
  <div class="h-full flex flex-col items-center justify-center px-4 text-center relative">
    <button
      @click="theme.toggle()"
      class="absolute top-4 right-4 p-2 opacity-40 hover:opacity-100 transition-opacity"
      aria-label="Toggle theme"
    >
      <svg v-if="theme.mode.value === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </button>
    <div class="w-24 h-24 rounded-full bg-breath-primary/20 flex items-center justify-center mb-8">
      <div class="w-16 h-16 rounded-full bg-breath-primary/40 animate-pulse" />
    </div>

    <h1 class="text-5xl font-bold mb-4">breathe</h1>
    <p class="text-lg opacity-60 max-w-md mb-10">
      Guided breathing exercises to help you focus, relax, and build a daily practice.
    </p>

    <div class="flex flex-col sm:flex-row gap-4">
      <RouterLink
        to="/try"
        class="px-6 py-3 rounded-full bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors text-center"
      >
        Try it now
      </RouterLink>
      <RouterLink
        to="/register"
        class="px-6 py-3 rounded-full border border-breath-border-dashed hover:bg-breath-surface-hover transition-colors text-center"
      >
        Get Started
      </RouterLink>
      <RouterLink
        to="/login"
        class="px-6 py-3 rounded-full border border-breath-border-dashed hover:bg-breath-surface-hover transition-colors text-center"
      >
        Sign In
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "../composables/useTheme.js";
const theme = useTheme();
</script>
