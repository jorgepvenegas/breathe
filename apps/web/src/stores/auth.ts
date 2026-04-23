import { ref } from "vue";
import { defineStore } from "pinia";
import type { User } from "@breath/types";
import { getCsrfToken, API_BASE } from "../lib/api.js";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  async function fetchUser() {
    loading.value = true;
    try {
      const res = await fetch(`${API_BASE}/api/auth/get-session`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        user.value = data.user ?? null;
      } else {
        user.value = null;
      }
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API_BASE}/api/auth/sign-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ csrfToken }),
      });
    } catch {
      // Ignore errors on sign-out
    }
    user.value = null;
  }

  return { user, loading, fetchUser, signOut };
});
