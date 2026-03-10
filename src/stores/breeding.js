// src/stores/breeding.js  ── FULL REPLACEMENT
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAnimalStore } from "@/stores/animals";

// Goat gestation is ~150 days
const GESTATION_DAYS = 150;

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
    today.setHours(0, 0, 0, 0);

    return pregnancies.value.map((p) => {
      const mateDate = new Date(p.mateDate);
      const birthDate = new Date(p.expectedBirth);
      birthDate.setHours(0, 0, 0, 0);

      const totalDays = GESTATION_DAYS;
      const elapsed = Math.round((today - mateDate) / 86400000);
      const daysLeft = Math.max(0, Math.round((birthDate - today) / 86400000));
      const progress = Math.min(
        100,
        Math.max(0, Math.round((elapsed / totalDays) * 100)),
      );

      // Trimester classification
      let trimester = 1;
      if (elapsed > totalDays * 0.66) trimester = 3;
      else if (elapsed > totalDays * 0.33) trimester = 2;

      // Urgency flag
      let urgency = "normal";
      if (daysLeft === 0) urgency = "today";
      else if (daysLeft <= 7) urgency = "critical";
      else if (daysLeft <= 14) urgency = "soon";
      else if (daysLeft < 0) urgency = "overdue";

      return { ...p, daysLeft, elapsed, progress, trimester, urgency };
    });
  });

  const alerts = computed(() =>
    pregnanciesWithProgress.value
      .filter((p) => p.daysLeft <= 14)
      .map((p) => {
        const isOverdue = p.daysLeft < 0;
        return {
          type: isOverdue ? "danger" : "warn",
          msg: isOverdue
            ? `🐐 <strong>${p.goatName}</strong> is overdue by ${Math.abs(p.daysLeft)} day${Math.abs(p.daysLeft) !== 1 ? "s" : ""}! Check immediately.`
            : `🐐 <strong>${p.goatName}</strong> is due in <strong>${p.daysLeft}</strong> day${p.daysLeft !== 1 ? "s" : ""}! Prepare the birthing area.`,
        };
      }),
  );

  const totalKidsBorn = computed(() =>
    birthRecords.value.reduce((s, b) => s + (b.kidsCount || 0), 0),
  );

  const avgLitterSize = computed(() => {
    if (!birthRecords.value.length) return 0;
    return (totalKidsBorn.value / birthRecords.value.length).toFixed(1);
  });

  const birthsByMonth = computed(() => {
    const map = {};
    birthRecords.value.forEach((b) => {
      const month = (b.birthDate || "").slice(0, 7);
      if (month) map[month] = (map[month] || 0) + (b.kidsCount || 0);
    });
    return map;
  });

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  async function addPregnancy(data) {
    const mate = new Date(data.mateDate);
    const birth = new Date(mate);
    birth.setDate(birth.getDate() + GESTATION_DAYS);
    const mid = new Date(mate);
    mid.setDate(mid.getDate() + Math.round(GESTATION_DAYS / 2));

    await addDoc(collection(db, "pregnancies"), {
      goatName: data.goatName,
      mateDate: data.mateDate,
      expectedBirth: birth.toISOString().slice(0, 10),
      midDate: mid.toISOString().slice(0, 10),
      expectedKids: Number(data.expectedKids) || 1,
      motherBreed: data.motherBreed || "",
      fatherBreed: data.fatherBreed || "",
      offspringBreed: data.offspringBreed || "",
      batchId: data.batchId || "",
      notes: data.notes || "",
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  async function updatePregnancy(id, data) {
    await updateDoc(doc(db, "pregnancies", id), data);
  }

  async function recordBirth({
    pregnancyId,
    birthDate,
    maleKids,
    femaleKids,
    offspringBreed,
    notes,
    addToAnimalBatch,
  }) {
    const p = pregnancies.value.find((x) => x.id === pregnancyId);
    if (!p) return;

    const kidsCount = Number(maleKids) + Number(femaleKids);

    const birthRef = await addDoc(collection(db, "birthRecords"), {
      goatName: p.goatName,
      batchId: p.batchId || "",
      birthDate,
      kidsCount,
      maleKids: Number(maleKids),
      femaleKids: Number(femaleKids),
      motherBreed: p.motherBreed || "",
      fatherBreed: p.fatherBreed || "",
      offspringBreed: offspringBreed || p.offspringBreed || "",
      notes: notes || "",
      pregnancyId,
    });

    // Optionally add newborns to an existing animal batch
    if (addToAnimalBatch && p.batchId && kidsCount > 0) {
      const animalStore = useAnimalStore();
      const batch = animalStore.batches.find((b) => b.id === p.batchId);
      if (batch) {
        await animalStore.updateBatch(p.batchId, {
          currentCount: (Number(batch.currentCount) || 0) + kidsCount,
          originalCount: (Number(batch.originalCount) || 0) + kidsCount,
        });
      }
    }

    await deleteDoc(doc(db, "pregnancies", pregnancyId));
    return birthRef;
  }

  async function removePregnancy(id) {
    await deleteDoc(doc(db, "pregnancies", id));
  }

  async function removeBirthRecord(id) {
    await deleteDoc(doc(db, "birthRecords", id));
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function expectedBirthFromDate(mateDateStr) {
    if (!mateDateStr) return "—";
    const d = new Date(mateDateStr);
    d.setDate(d.getDate() + GESTATION_DAYS);
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function trimesterLabel(trimester) {
    return ["", "Early (1st)", "Mid (2nd)", "Late (3rd)"][trimester] || "";
  }

  return {
    pregnancies,
    birthRecords,
    pregnancyCount,
    pregnanciesWithProgress,
    alerts,
    totalKidsBorn,
    avgLitterSize,
    birthsByMonth,
    startListener,
    stopListener,
    addPregnancy,
    updatePregnancy,
    recordBirth,
    removePregnancy,
    removeBirthRecord,
    expectedBirthFromDate,
    trimesterLabel,
  };
});
