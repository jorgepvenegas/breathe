<template>
  <div class="min-h-screen">
    <NavBar v-if="!isLanding" />
    <main>
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
