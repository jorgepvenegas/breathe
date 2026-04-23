<template>
  <div class="h-screen flex flex-col">
    <NavBar v-if="!isLanding" />
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import NavBar from "./components/NavBar.vue";

const route = useRoute();
const isLanding = computed(() => route.path === "/");
</script>
