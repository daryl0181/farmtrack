<template>
  <div>
    <!-- Global Toast -->
    <Transition name="toast">
      <div v-if="ui.toast" class="toast">{{ ui.toast }}</div>
    </Transition>

    <!-- Global Modal -->
    <Teleport to="body">
      <AppModal v-if="ui.activeModal" />
    </Teleport>

    <!-- Loading screen while Firebase checks session -->
    <div v-if="auth.loading" class="loading-screen">
      <div class="loading-icon">🐐</div>
      <div class="loading-text">Loading FarmTrack…</div>
    </div>

    <template v-else>
      <RouterView />
      <!-- Only show BottomNav when logged in AND not on login page -->
      <BottomNav v-if="auth.isLoggedIn && route.path !== '/login'" />
    </template>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore }       from '@/stores/ui'
import { useAuthStore }     from '@/stores/auth'
import { useAnimalStore }   from '@/stores/animals'
import { useFinanceStore }  from '@/stores/finance'
import { useBreedingStore } from '@/stores/breeding'
import { useHealthStore }   from '@/stores/health'
import BottomNav from '@/components/BottomNav.vue'
import AppModal  from '@/components/AppModal.vue'

const route    = useRoute()
const ui       = useUIStore()
const auth     = useAuthStore()
const animals  = useAnimalStore()
const finance  = useFinanceStore()
const breeding = useBreedingStore()
const health   = useHealthStore()

watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      animals.startListener()
      finance.startListener()
      breeding.startListener()
      health.startListener()
    } else {
      animals.stopListener()
      finance.stopListener()
      breeding.stopListener()
      health.stopListener()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px; left: 50%;
  transform: translateX(-50%);
  background: var(--text); color: var(--bg);
  padding: 12px 20px; border-radius: 12px;
  font-size: 13px; font-weight: 500;
  z-index: 999;
  box-shadow: var(--shadow-lg);
  white-space: nowrap;
}
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; top: 8px; }
.toast-leave-to   { opacity: 0; top: 8px; }

.loading-screen {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: var(--bg); gap: 12px;
}
.loading-icon { font-size: 48px; animation: bounce 1s infinite; }
.loading-text { font-size: 14px; color: var(--muted); }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
</style>