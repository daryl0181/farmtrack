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
  let unsubPregnancies = null,
    unsubBirthRecords = null;

  // ── LISTENERS ──────────────────────────────────────────────────────────────
  function startListener() {
    unsubPregnancies = onSnapshot(
      query(collection(db, "pregnancies"), orderBy("mateDate", "desc")),
      (snap) => {
        pregnancies.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
    );
    unsubBirthRecords = onSnapshot(
      query(collection(db, "birthRecords"), orderBy("birthDate", "desc")),
      (snap) => {
        birthRecords.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
    );
  }

  function stopListener() {
    unsubPregnancies?.();
    unsubBirthRecords?.();
  }

  // ── COMPUTED ───────────────────────────────────────────────────────────────
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
        msg: `<strong>${p.goatName}</strong> is due in ${p.daysLeft} day${p.daysLeft !== 1 ? "s" : ""}! Prepare the birthing area. 🐐`,
      })),
  );

  // Total kids born across all records
  const totalKidsBorn = computed(() =>
    birthRecords.value.reduce((s, b) => s + (b.kidsCount || 0), 0),
  );

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  /**
   * data: {
   *   goatName, mateDate, expectedKids,
   *   motherBreed, fatherBreed, offspringBreed
   * }
   */
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
      motherBreed: data.motherBreed || "",
      fatherBreed: data.fatherBreed || "",
      offspringBreed: data.offspringBreed || "",
    });
  }

  /**
   * data: {
   *   pregnancyId, birthDate, maleKids, femaleKids, offspringBreed
   * }
   */
  async function recordBirth({
    pregnancyId,
    birthDate,
    maleKids,
    femaleKids,
    offspringBreed,
  }) {
    const p = pregnancies.value.find((x) => x.id === pregnancyId);
    if (!p) return;

    await addDoc(collection(db, "birthRecords"), {
      goatName: p.goatName,
      birthDate,
      kidsCount: Number(maleKids) + Number(femaleKids),
      maleKids: Number(maleKids),
      femaleKids: Number(femaleKids),
      motherBreed: p.motherBreed || "",
      fatherBreed: p.fatherBreed || "",
      offspringBreed: offspringBreed || p.offspringBreed || "",
    });

    await deleteDoc(doc(db, "pregnancies", pregnancyId));
  }

  async function removePregnancy(id) {
    await deleteDoc(doc(db, "pregnancies", id));
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
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
    totalKidsBorn,
    startListener,
    stopListener,
    addPregnancy,
    recordBirth,
    removePregnancy,
    expectedBirthFromDate,
  };
});
