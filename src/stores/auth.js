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

  // Listen for auth state changes (runs on app start)
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

  return { user, loading, isLoggedIn, login, register, logout };
});
