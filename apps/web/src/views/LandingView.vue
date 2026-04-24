<template>
  <div class="h-full flex flex-col items-center justify-center px-4 text-center">
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
        class="px-6 py-3 rounded-full border border-white/15 hover:bg-white/5 transition-colors text-center"
      >
        Get Started
      </RouterLink>
      <RouterLink
        to="/login"
        class="px-6 py-3 rounded-full border border-white/15 hover:bg-white/5 transition-colors text-center"
      >
        Sign In
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// No script needed
</script>
