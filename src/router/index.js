// src/router/index.js
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

router.beforeEach((to) => {
  const user = getAuth().currentUser;
  if (to.meta.requiresAuth && !user) return "/login";
});

export default router;
