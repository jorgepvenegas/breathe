<template>
  <nav class="relative w-full">
    <div class="max-w-5xl mx-auto w-full px-6 py-4 flex items-center justify-between">
      <RouterLink to="/dashboard" class="text-xl font-bold text-breath-secondary">
        breathe
      </RouterLink>

      <!-- Desktop links -->
      <div class="hidden md:flex items-center gap-6 text-sm">
        <RouterLink to="/dashboard" class="opacity-60 hover:opacity-100 transition-opacity">
          Dashboard
        </RouterLink>
        <RouterLink to="/patterns" class="opacity-60 hover:opacity-100 transition-opacity">
          Patterns
        </RouterLink>
        <RouterLink to="/history" class="opacity-60 hover:opacity-100 transition-opacity">
          History
        </RouterLink>
        <button
          v-if="auth.user"
          @click="handleSignOut"
          class="opacity-60 hover:opacity-100 transition-opacity"
        >
          Sign Out
        </button>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 -mr-2 opacity-60 hover:opacity-100 transition-opacity"
        @click="menuOpen = !menuOpen"
        aria-label="Toggle menu"
      >
        <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

    </div>

    <!-- Mobile overlay menu -->
    <div
      v-show="menuOpen"
      class="md:hidden absolute top-full left-0 right-0 bg-[#0f172a] border-t border-b border-breath-border z-50"
    >
      <div class="flex flex-col text-sm">
        <RouterLink
          to="/dashboard"
          class="px-6 py-3 opacity-60 hover:opacity-100 hover:bg-white/[0.04] transition-opacity"
          @click="menuOpen = false"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/patterns"
          class="px-6 py-3 opacity-60 hover:opacity-100 hover:bg-white/[0.04] transition-opacity"
          @click="menuOpen = false"
        >
          Patterns
        </RouterLink>
        <RouterLink
          to="/history"
          class="px-6 py-3 opacity-60 hover:opacity-100 hover:bg-white/[0.04] transition-opacity"
          @click="menuOpen = false"
        >
          History
        </RouterLink>
        <button
          v-if="auth.user"
          @click="handleSignOutMobile"
          class="px-6 py-3 text-left opacity-60 hover:opacity-100 hover:bg-white/[0.04] transition-opacity"
        >
          Sign Out
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const auth = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

async function handleSignOut() {
  await auth.signOut();
  router.push("/login");
}

async function handleSignOutMobile() {
  menuOpen.value = false;
  await auth.signOut();
  router.push("/login");
}
</script>
