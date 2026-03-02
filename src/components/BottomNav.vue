<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-btn"
      :class="{ active: route.path === item.path }"
    >
      <div class="nav-icon-wrap">
        <span class="nav-icon">{{ item.icon }}</span>
      </div>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/',         icon: '🏠', label: 'Home'     },
  { path: '/animals',  icon: '🐾', label: 'Animals'  },
  { path: '/finance',  icon: '💰', label: 'Finance'  },
  { path: '/breeding', icon: '🤰', label: 'Breeding' },
  { path: '/health',   icon: '💊', label: 'Health'   },
  { path: '/reports',  icon: '📊', label: 'Reports'  },
]
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  padding: 10px 4px calc(10px + env(safe-area-inset-bottom));
  z-index: 200;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
  text-decoration: none;
}

.nav-btn {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  cursor: pointer; padding: 4px 2px;
  border-radius: 10px;
  text-decoration: none;
}

.nav-icon-wrap {
  width: 40px; height: 28px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}

.nav-icon { font-size: 18px; }

.nav-label {
  font-size: 10px; color: var(--muted); font-weight: 500;
  font-family: 'Outfit', sans-serif;
}

.nav-btn.active .nav-icon-wrap { background: var(--green-pale); }
.nav-btn.active .nav-label     { color: var(--green); }
</style>
