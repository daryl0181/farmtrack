<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-logo">🐐 FarmTrack</div>
      <p class="login-sub">Sign in to your farm</p>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" type="email" v-model="email" placeholder="you@example.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" type="password" v-model="password" placeholder="••••••••" />
      </div>

      <div class="error-msg" v-if="error">{{ error }}</div>

      <button class="btn-full" :disabled="loading" @click="handleLogin">
        {{ loading ? 'Signing in…' : 'Sign In' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh; display: flex;
  align-items: center; justify-content: center;
  background: var(--bg); padding: 20px;
}
.login-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 32px 24px;
  width: 100%; max-width: 380px;
  box-shadow: var(--shadow-lg);
}
.login-logo { font-size: 28px; font-weight: 800; font-family: 'Outfit', sans-serif; text-align: center; margin-bottom: 4px; }
.login-sub  { text-align: center; color: var(--muted); font-size: 14px; margin-bottom: 28px; }
.error-msg  { background: var(--red-pale); color: var(--red); border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; }
</style>