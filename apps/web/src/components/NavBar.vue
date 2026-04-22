<template>
  <nav class="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
    <RouterLink to="/dashboard" class="text-xl font-bold text-breath-secondary">
      breathe
    </RouterLink>

    <div class="flex items-center gap-6 text-sm">
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
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const auth = useAuthStore();
const router = useRouter();

async function handleSignOut() {
  await auth.signOut();
  router.push("/login");
}
</script>
