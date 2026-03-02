import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

// Wait for Firebase to resolve the initial session on page load
const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
    unsubscribe();
    resolve();
  });
});

router.beforeEach(async (to) => {
  // Always wait for Firebase to finish loading the session first
  await authReady;

  // Now currentUser is accurate
  const user = getAuth().currentUser;

  if (to.meta.requiresAuth && !user) return "/login";
  if (to.path === "/login" && user) return "/";
});

export default router;
