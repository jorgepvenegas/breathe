<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8">Create Account</h1>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm opacity-60 mb-1">Name</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm opacity-60 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm opacity-60 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          />
        </div>

        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-lg bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {{ loading ? "Creating..." : "Create Account" }}
        </button>
      </form>

      <p class="text-center mt-6 text-sm opacity-50">
        Already have an account?
        <RouterLink to="/login" class="text-breath-secondary hover:underline">Sign In</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { getCsrfToken, API_BASE } from "../lib/api.js";

const router = useRouter();
const auth = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleRegister() {
  loading.value = true;
  error.value = "";

  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        csrfToken,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? "Registration failed");
    }

    await auth.fetchUser();
    router.push("/dashboard");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
