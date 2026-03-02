// src/stores/breeding.js
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

export const useBreedingStore = defineStore("breeding", () => {
  const pregnancies = ref([]);
  const birthRecords = ref([]);
  let unsubPregnancies = null;
  let unsubBirthRecords = null;

  // ── LISTENERS ──────────────────────────────────────────
  function startListener() {
    unsubPregnancies = onSnapshot(
      query(collection(db, "pregnancies"), orderBy("mateDate", "desc")),
      (snapshot) => {
        pregnancies.value = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      },
    );

    unsubBirthRecords = onSnapshot(
      query(collection(db, "birthRecords"), orderBy("birthDate", "desc")),
      (snapshot) => {
        birthRecords.value = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      },
    );
  }

  function stopListener() {
    if (unsubPregnancies) unsubPregnancies();
    if (unsubBirthRecords) unsubBirthRecords();
  }

  // ── COMPUTED ───────────────────────────────────────────
  const pregnancyCount = computed(() => pregnancies.value.length);

  const pregnanciesWithProgress = computed(() => {
    const today = new Date();
    return pregnancies.value.map((p) => {
      const birth = new Date(p.expectedBirth);
      const daysLeft = Math.max(0, Math.round((birth - today) / 86400000));
      const progress = Math.min(
        100,
        Math.round(((150 - daysLeft) / 150) * 100),
      );
      return { ...p, daysLeft, progress };
    });
  });

  const alerts = computed(() =>
    pregnanciesWithProgress.value
      .filter((p) => p.daysLeft <= 14)
      .map((p) => ({
        type: "warn",
        msg: `<strong>${p.goatName}</strong> is due in ${p.daysLeft} days! Prepare the birthing area. 🐐`,
      })),
  );

  // ── ACTIONS ────────────────────────────────────────────
  async function addPregnancy(data) {
    const mate = new Date(data.mateDate);
    const birth = new Date(mate);
    birth.setDate(birth.getDate() + 150);
    const mid = new Date(mate);
    mid.setDate(mid.getDate() + 75);

    await addDoc(collection(db, "pregnancies"), {
      goatName: data.goatName,
      mateDate: data.mateDate,
      expectedBirth: birth.toISOString().slice(0, 10),
      midDate: mid.toISOString().slice(0, 10),
      expectedKids: Number(data.expectedKids),
    });
  }

  async function recordBirth({ pregnancyId, birthDate, maleKids, femaleKids }) {
    const p = pregnancies.value.find((x) => x.id === pregnancyId);
    if (p) {
      await addDoc(collection(db, "birthRecords"), {
        goatName: p.goatName,
        birthDate,
        kidsCount: maleKids + femaleKids,
        maleKids: Number(maleKids),
        femaleKids: Number(femaleKids),
      });
      await deleteDoc(doc(db, "pregnancies", pregnancyId));
    }
  }

  async function removePregnancy(id) {
    await deleteDoc(doc(db, "pregnancies", id));
  }

  // ── HELPERS ────────────────────────────────────────────
  function expectedBirthFromDate(mateDateStr) {
    if (!mateDateStr) return "—";
    const d = new Date(mateDateStr);
    d.setDate(d.getDate() + 150);
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return {
    pregnancies,
    birthRecords,
    pregnancyCount,
    pregnanciesWithProgress,
    alerts,
    startListener,
    stopListener,
    addPregnancy,
    recordBirth,
    removePregnancy,
    expectedBirthFromDate,
  };
});
