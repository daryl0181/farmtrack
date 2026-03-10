<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-brand">
        <div class="login-logo-icon">🐐</div>
        <div class="login-logo-text">FarmTrack</div>
      </div>
      <p class="login-sub">Sign in to manage your farm</p>

      <div class="form-group">
        <label class="form-label">Email</label>
        <div class="input-wrap">
          <span class="input-icon">📧</span>
          <input
            class="form-input with-icon"
            type="email"
            v-model="email"
            placeholder="you@example.com"
            @keydown.enter="handleLogin"
            autocomplete="email"
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <div class="input-wrap">
          <span class="input-icon">🔒</span>
          <input
            class="form-input with-icon"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="••••••••"
            @keydown.enter="handleLogin"
            autocomplete="current-password"
          />
          <button class="input-toggle" @click="showPassword = !showPassword" type="button" tabindex="-1">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <Transition name="fade">
        <div class="error-msg" v-if="error">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </Transition>

      <button
        class="btn-login"
        :class="{ loading }"
        :disabled="loading || !email || !password"
        @click="handleLogin"
      >
        <span v-if="!loading">Sign In →</span>
        <span v-else class="loading-dots">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div class="login-footer">
        <span>Severino Farm Management System</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const email        = ref('')
const password     = ref('')
const error        = ref('')
const loading      = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  error.value   = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await new Promise(r => setTimeout(r, 100))
    router.push('/')
  } catch (e) {
    if (
      e.code === 'auth/user-not-found' ||
      e.code === 'auth/wrong-password'  ||
      e.code === 'auth/invalid-credential'
    ) {
      error.value = 'Invalid email or password.'
    } else if (e.code === 'auth/too-many-requests') {
      error.value = 'Too many attempts. Please wait and try again.'
    } else if (e.code === 'auth/network-request-failed') {
      error.value = 'Network error. Check your connection.'
    } else {
      error.value = 'Something went wrong. Please try again.'
    }
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
  background-image: radial-gradient(circle at 20% 50%, rgba(45,106,79,0.08) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(29,111,165,0.06) 0%, transparent 40%);
}
.login-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 20px; padding: 36px 28px;
  width: 100%; max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.05) inset;
}

.login-brand {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; margin-bottom: 6px;
}
.login-logo-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, var(--green), #1a4d36);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(45,106,79,0.4);
}
.login-logo-text {
  font-size: 24px; font-weight: 800;
  font-family: 'Outfit', sans-serif; color: var(--text);
}
.login-sub {
  text-align: center; color: var(--muted);
  font-size: 13px; margin-bottom: 28px;
}

/* INPUT */
.input-wrap {
  display: flex; align-items: center;
  background: var(--bg2); border: 1.5px solid var(--border);
  border-radius: 10px; overflow: hidden;
  transition: border-color 0.15s;
}
.input-wrap:focus-within {
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(45,106,79,0.15);
}
.input-icon { padding: 0 10px 0 14px; font-size: 16px; flex-shrink: 0; }
.form-input.with-icon {
  flex: 1; border: none; background: transparent;
  padding: 12px 8px; font-family: 'Outfit', sans-serif;
  font-size: 14px; color: var(--text); outline: none;
}
.form-input.with-icon::placeholder { color: var(--muted); }
.input-toggle {
  width: 40px; height: 40px; border: none; background: transparent;
  font-size: 16px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  opacity: 0.6; transition: opacity 0.15s;
}
.input-toggle:hover { opacity: 1; }

/* ERROR */
.error-msg {
  display: flex; align-items: center; gap: 8px;
  background: var(--red-pale); color: var(--red);
  border: 1px solid rgba(193,18,31,0.2);
  border-radius: 8px; padding: 10px 14px;
  font-size: 13px; margin-bottom: 12px;
}
.error-icon { font-size: 16px; flex-shrink: 0; }

/* BUTTON */
.btn-login {
  width: 100%; padding: 14px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, var(--green), #1a4d36);
  color: #fff; font-family: 'Outfit', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer;
  transition: all 0.2s; margin-top: 4px;
  box-shadow: 0 4px 12px rgba(45,106,79,0.35);
}
.btn-login:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(45,106,79,0.4); }
.btn-login:active:not(:disabled) { transform: translateY(0); }
.btn-login:disabled { opacity: 0.45; cursor: default; transform: none; }

/* LOADING DOTS */
.loading-dots { display: flex; gap: 5px; align-items: center; justify-content: center; }
.loading-dots span {
  width: 7px; height: 7px; border-radius: 50%; background: #fff;
  animation: dot-bounce 0.9s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.15s; }
.loading-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40%           { transform: scale(1);   opacity: 1; }
}

.login-footer {
  text-align: center; margin-top: 24px; padding-top: 20px;
  border-top: 1px solid var(--border);
  font-size: 11px; color: var(--muted);
}

/* TRANSITIONS */
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>