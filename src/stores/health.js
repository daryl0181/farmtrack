// src/stores/health.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";

export const useHealthStore = defineStore("health", () => {
  const records = ref([]);
  let unsubscribe = null;

  // ── LISTENERS ──────────────────────────────────────────
  function startListener() {
    unsubscribe = onSnapshot(
      query(collection(db, "healthRecords"), orderBy("date", "desc")),
      (snapshot) => {
        records.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
    );
  }

  function stopListener() {
    if (unsubscribe) unsubscribe();
  }

  // ── COMPUTED ───────────────────────────────────────────
  const upcoming = computed(() => {
    const today = new Date();
    return records.value
      .filter((r) => r.nextDate)
      .map((r) => {
        const diff = Math.round((new Date(r.nextDate) - today) / 86400000);
        return { ...r, daysUntil: diff };
      })
      .filter((r) => r.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  });

  // ── ACTIONS ────────────────────────────────────────────
  async function addRecord(data) {
    await addDoc(collection(db, "healthRecords"), { ...data });
  }

  async function removeRecord(id) {
    await deleteDoc(doc(db, "healthRecords", id));
  }

  return {
    records,
    upcoming,
    startListener,
    stopListener,
    addRecord,
    removeRecord,
  };
});
