import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "landing", component: () => import("../views/LandingView.vue") },
    { path: "/login", name: "login", component: () => import("../views/LoginView.vue") },
    { path: "/register", name: "register", component: () => import("../views/RegisterView.vue") },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/breathe/:patternId",
      name: "breathe",
      component: () => import("../views/BreatheView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/patterns",
      name: "patterns",
      component: () => import("../views/PatternsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/patterns/new",
      name: "pattern-builder",
      component: () => import("../views/PatternBuilderView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/history",
      name: "history",
      component: () => import("../views/HistoryView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.user) {
    await auth.fetchUser();
  }
  if (to.meta.requiresAuth && !auth.user) {
    return { name: "login" };
  }
  return true;
});

export default router;
