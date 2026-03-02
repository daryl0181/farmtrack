import { createRouter, createWebHistory } from "vue-router";
import { getAuth } from "firebase/auth";
import Dashboard from "@/views/Dashboard.vue";
import Animals from "@/views/Animals.vue";
import Finance from "@/views/Finance.vue";
import Breeding from "@/views/Breeding.vue";
import Health from "@/views/Health.vue";
import Reports from "@/views/Reports.vue";
import Login from "@/views/Login.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/", component: Dashboard, meta: { requiresAuth: true } },
  { path: "/animals", component: Animals, meta: { requiresAuth: true } },
  { path: "/finance", component: Finance, meta: { requiresAuth: true } },
  { path: "/breeding", component: Breeding, meta: { requiresAuth: true } },
  { path: "/health", component: Health, meta: { requiresAuth: true } },
  { path: "/reports", component: Reports, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// This promise resolves once Firebase has finished loading the saved session
// It only runs once on app startup
let authReady = null;

function waitForAuthReady() {
  if (authReady) return authReady;
  authReady = new Promise((resolve) => {
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      unsubscribe(); // stop listening after the first result
      resolve(user);
    });
  });
  return authReady;
}

router.beforeEach(async (to) => {
  const user = await waitForAuthReady();

  // Not logged in and trying to access a protected page → go to login
  if (to.meta.requiresAuth && !user) return "/login";

  // Already logged in and trying to go to /login → go to home
  if (to.path === "/login" && user) return "/";
});

export default router;
