// src/stores/auth.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const loading = ref(true);

  const isLoggedIn = computed(() => !!user.value);

  // Resolves once Firebase has confirmed the initial auth state.
  // The router guard awaits this before allowing any navigation,
  // which prevents the 404 flash on page load / refresh.
  const authReady = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser;
      loading.value = false;
      resolve(firebaseUser);
      unsub(); // unsubscribe after first resolution — the watcher below takes over
    });
  });

  // Continuous listener for login/logout changes after initial load
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser;
    loading.value = false;
  });

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    user.value = result.user;
  }

  async function register(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    user.value = result.user;
  }

  async function logout() {
    await signOut(auth);
    user.value = null;
  }

  return { user, loading, isLoggedIn, authReady, login, register, logout };
});
