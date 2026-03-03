// src/stores/animals.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  collection, onSnapshot, addDoc, deleteDoc,
  updateDoc, doc, query, orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";

// ── BREED DEFINITIONS ──────────────────────────────────────────────────────
export const GOAT_BREEDS = ["Anglo-Nubian", "Native"];
export const DUCK_BREEDS = ["Native", "Indo"];

/**
 * Compute offspring breed from two parents.
 * Returns a string like "50% Anglo-Nubian / 50% Native"
 * Supports percentage-based parents too.
 */
export function computeOffspringBreed(parentA, parentB) {
  // Parse breed percentages from a breed string
  function parseBreed(str) {
    if (!str) return {};
    // e.g. "50% Anglo-Nubian / 50% Native" → { "Anglo-Nubian": 50, "Native": 50 }
    // or "Anglo-Nubian" → { "Anglo-Nubian": 100 }
    const map = {};
    const parts = str.split("/").map((s) => s.trim());
    for (const part of parts) {
      const m = part.match(/^(\d+)%\s*(.+)$/);
      if (m) {
        map[m[2].trim()] = Number(m[1]);
      } else {
        // pure breed
        map[part] = 100;
      }
    }
    return map;
  }

  const a = parseBreed(parentA);
  const b = parseBreed(parentB);
  const combined = {};

  for (const [breed, pct] of Object.entries(a)) {
    combined[breed] = (combined[breed] || 0) + pct / 2;
  }
  for (const [breed, pct] of Object.entries(b)) {
    combined[breed] = (combined[breed] || 0) + pct / 2;
  }

  // Format: "50% Anglo-Nubian / 50% Native"
  return Object.entries(combined)
    .filter(([, pct]) => pct > 0)
    .map(([breed, pct]) => `${Math.round(pct)}% ${breed}`)
    .join(" / ");
}

export const useAnimalStore = defineStore("animals", () => {
  const batches     = ref([]);
  const soldBatches = ref([]);
  const flagged     = ref([]);
  const eggRecords  = ref([]);   // daily egg production logs
  const hatchRecords = ref([]); // hatch events

  let unsubBatches = null, unsubSold = null, unsubFlagged = null;
  let unsubEggs = null, unsubHatch = null;

  // ── LISTENERS ──────────────────────────────────────────────────────────────
  function startListener() {
    unsubBatches = onSnapshot(
      query(collection(db, "batches"), orderBy("addedDate", "desc")),
      (snap) => { batches.value = snap.docs.map((d) => ({ id: d.id, ...d.data() })); },
      (e) => console.error("[batches]", e.message),
    );

    unsubSold = onSnapshot(
      query(collection(db, "soldBatches"), orderBy("soldDate", "desc")),
      (snap) => { soldBatches.value = snap.docs.map((d) => ({ id: d.id, ...d.data() })); },
      (e) => console.error("[soldBatches]", e.message),
    );

    unsubFlagged = onSnapshot(
      query(collection(db, "flaggedAnimals"), orderBy("flaggedDate", "desc")),
      (snap) => { flagged.value = snap.docs.map((d) => ({ id: d.id, ...d.data() })); },
      (e) => console.error("[flagged]", e.message),
    );

    unsubEggs = onSnapshot(
      query(collection(db, "eggRecords"), orderBy("date", "desc")),
      (snap) => { eggRecords.value = snap.docs.map((d) => ({ id: d.id, ...d.data() })); },
      (e) => console.error("[eggRecords]", e.message),
    );

    unsubHatch = onSnapshot(
      query(collection(db, "hatchRecords"), orderBy("hatchDate", "desc")),
      (snap) => { hatchRecords.value = snap.docs.map((d) => ({ id: d.id, ...d.data() })); },
      (e) => console.error("[hatchRecords]", e.message),
    );
  }

  function stopListener() {
    [unsubBatches, unsubSold, unsubFlagged, unsubEggs, unsubHatch]
      .forEach((u) => u?.());
  }

  // ── BATCH ACTIONS ──────────────────────────────────────────────────────────
  /**
   * data: { label, type, breed, sex, count, pricePerHead, health, notes, addedDate }
   * breed: e.g. "Anglo-Nubian", "Native", "50% Anglo-Nubian / 50% Native"
   */
  async function addBatch(data) {
    const count = Number(data.count) || 1;
    const pricePerHead = Number(data.pricePerHead) || 0;
    await addDoc(collection(db, "batches"), {
      label:         data.label || "",
      type:          data.type || "Duck",
      breed:         data.breed || (data.type === "Goat" ? "Native" : "Native"),
      sex:           data.sex || "Female",
      originalCount: count,
      currentCount:  count,
      pricePerHead,
      totalCost:     pricePerHead * count,
      health:        data.health || "Healthy",
      notes:         data.notes || "",
      addedDate:     data.addedDate || new Date().toISOString().slice(0, 10),
      totalSold:     0,
      totalDied:     0,
      // Duck-specific
      totalEggsProduced: 0,
      totalHatched:      0,
    });
  }

  async function updateBatch(id, data) {
    await updateDoc(doc(db, "batches", id), data);
  }

  async function removeBatch(id) {
    await deleteDoc(doc(db, "batches", id));
  }

  async function removeSoldBatch(id) {
    await deleteDoc(doc(db, "soldBatches", id));
  }

  async function sellFromBatch({ batchId, quantity, pricePerHead, soldTo, soldDate, sexSold }) {
    const batch = batches.value.find((b) => b.id === batchId);
    if (!batch) return;
    const qty   = Number(quantity);
    const pph   = Number(pricePerHead);
    const total = qty * pph;
    const costBasis = batch.pricePerHead * qty;
    const today = soldDate || new Date().toISOString().slice(0, 10);

    await addDoc(collection(db, "soldBatches"), {
      batchId, batchLabel: batch.label || batch.type,
      type: batch.type, breed: batch.breed || "",
      sexSold: sexSold || batch.sex,
      quantity: qty, pricePerHead: pph, totalRevenue: total,
      costBasis, profit: total - costBasis,
      soldTo: soldTo || "", soldDate: today,
    });

    await addDoc(collection(db, "transactions"), {
      type: "Income", category: "Animal Sale",
      amount: total,
      description: `Sold ${qty} ${batch.type}${batch.breed ? ` (${batch.breed})` : ""}${batch.label ? " from " + batch.label : ""}${soldTo ? " to " + soldTo : ""}`,
      date: today,
    });

    await updateDoc(doc(db, "batches", batchId), {
      currentCount: Math.max(0, batch.currentCount - qty),
      totalSold: (batch.totalSold || 0) + qty,
    });
  }

  async function recordDeaths({ batchId, quantity, cause, date }) {
    const batch = batches.value.find((b) => b.id === batchId);
    if (!batch) return;
    const qty = Number(quantity);
    await updateDoc(doc(db, "batches", batchId), {
      currentCount:   Math.max(0, batch.currentCount - qty),
      totalDied:      (batch.totalDied || 0) + qty,
      lastDeathCause: cause,
      lastDeathDate:  date || new Date().toISOString().slice(0, 10),
    });
  }

  // ── EGG RECORDS ────────────────────────────────────────────────────────────
  /**
   * Log daily egg production for a duck batch.
   * data: { batchId, date, eggsCollected, notes }
   */
  async function addEggRecord(data) {
    await addDoc(collection(db, "eggRecords"), {
      batchId:       data.batchId,
      date:          data.date,
      eggsCollected: Number(data.eggsCollected) || 0,
      notes:         data.notes || "",
    });
    // Update batch total
    const batch = batches.value.find((b) => b.id === data.batchId);
    if (batch) {
      await updateDoc(doc(db, "batches", data.batchId), {
        totalEggsProduced: (batch.totalEggsProduced || 0) + (Number(data.eggsCollected) || 0),
      });
    }
  }

  async function removeEggRecord(id) {
    await deleteDoc(doc(db, "eggRecords", id));
  }

  // ── HATCH RECORDS ──────────────────────────────────────────────────────────
  /**
   * Record a hatch event.
   * data: { batchId, hatchDate, eggsSet, hatched, breed, notes }
   * breed is auto-computed if parentBreeds provided
   */
  async function addHatchRecord(data) {
    const offspringBreed = data.fatherBreed && data.motherBreed
      ? computeOffspringBreed(data.fatherBreed, data.motherBreed)
      : (data.breed || "");

    await addDoc(collection(db, "hatchRecords"), {
      batchId:        data.batchId,
      hatchDate:      data.hatchDate,
      eggsSet:        Number(data.eggsSet) || 0,
      hatched:        Number(data.hatched) || 0,
      failedToHatch:  (Number(data.eggsSet) || 0) - (Number(data.hatched) || 0),
      offspringBreed,
      fatherBreed:    data.fatherBreed || "",
      motherBreed:    data.motherBreed || "",
      notes:          data.notes || "",
    });

    const batch = batches.value.find((b) => b.id === data.batchId);
    if (batch) {
      await updateDoc(doc(db, "batches", data.batchId), {
        totalHatched: (batch.totalHatched || 0) + (Number(data.hatched) || 0),
      });
    }
  }

  async function removeHatchRecord(id) {
    await deleteDoc(doc(db, "hatchRecords", id));
  }

  // ── FLAGGED INDIVIDUALS ────────────────────────────────────────────────────
  async function flagIndividual(data) {
    await addDoc(collection(db, "flaggedAnimals"), {
      ...data,
      flaggedDate: new Date().toISOString().slice(0, 10),
    });
  }

  async function updateFlagged(id, data) {
    await updateDoc(doc(db, "flaggedAnimals", id), data);
  }

  async function removeFlagged(id) {
    await deleteDoc(doc(db, "flaggedAnimals", id));
  }

  // ── COMPUTED ───────────────────────────────────────────────────────────────
  const goatBatches = computed(() => batches.value.filter((b) => b.type === "Goat"));
  const duckBatches = computed(() => batches.value.filter((b) => b.type === "Duck"));

  const totalGoats   = computed(() => goatBatches.value.reduce((s, b) => s + (b.currentCount || 0), 0));
  const totalDucks   = computed(() => duckBatches.value.reduce((s, b) => s + (b.currentCount || 0), 0));
  const totalAnimals = computed(() => totalGoats.value + totalDucks.value);

  // Sex counts
  const maleGoats = computed(() =>
    goatBatches.value.filter((b) => b.sex === "Male").reduce((s, b) => s + (b.currentCount || 0), 0)
  );
  const femaleGoats = computed(() =>
    goatBatches.value.filter((b) => b.sex === "Female").reduce((s, b) => s + (b.currentCount || 0), 0)
  );
  const maleDucks = computed(() =>
    duckBatches.value.filter((b) => b.sex === "Male").reduce((s, b) => s + (b.currentCount || 0), 0)
  );
  const femaleDucks = computed(() =>
    duckBatches.value.filter((b) => b.sex === "Female").reduce((s, b) => s + (b.currentCount || 0), 0)
  );

  // Breed breakdowns
  const goatByBreed = computed(() => {
    const map = {};
    goatBatches.value.forEach((b) => {
      const key = b.breed || "Unknown";
      map[key] = (map[key] || 0) + (b.currentCount || 0);
    });
    return map;
  });
  const duckByBreed = computed(() => {
    const map = {};
    duckBatches.value.forEach((b) => {
      const key = b.breed || "Unknown";
      map[key] = (map[key] || 0) + (b.currentCount || 0);
    });
    return map;
  });

  // Egg stats
  const totalEggsProduced = computed(() =>
    eggRecords.value.reduce((s, r) => s + (r.eggsCollected || 0), 0)
  );
  const totalHatched = computed(() =>
    hatchRecords.value.reduce((s, r) => s + (r.hatched || 0), 0)
  );
  const eggsByBatch = computed(() => {
    const map = {};
    eggRecords.value.forEach((r) => {
      map[r.batchId] = (map[r.batchId] || 0) + (r.eggsCollected || 0);
    });
    return map;
  });

  const flaggedByBatch = computed(() => {
    const map = {};
    flagged.value.forEach((f) => {
      if (!map[f.batchId]) map[f.batchId] = [];
      map[f.batchId].push(f);
    });
    return map;
  });

  const pregnantGoatNames = computed(() =>
    flagged.value.filter((f) => f.health === "Pregnant").map((f) => f.name)
  );

  const totalAnimalCosts = computed(() =>
    batches.value.reduce(
      (s, b) => s + (Number(b.pricePerHead) || 0) * (Number(b.originalCount) || 0), 0,
    )
  );

  const totalSaleProfit = computed(() =>
    soldBatches.value.reduce((s, s2) => s + (Number(s2.profit) || 0), 0)
  );

  const byType = computed(() => {
    const total = totalAnimals.value || 1;
    return [
      { type: "Goat", emoji: "🐐", color: "#2d6a4f", count: totalGoats.value },
      { type: "Duck", emoji: "🦆", color: "#1d6fa5", count: totalDucks.value },
    ]
      .filter((t) => t.count > 0)
      .map((t) => ({ ...t, pct: Math.round((t.count / total) * 100) }));
  });

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function animalEmoji(type) { return { Goat: "🐐", Duck: "🦆" }[type] ?? "🐾"; }

  function healthTagColor(health) {
    return { Healthy: "green", Pregnant: "purple", Sick: "red", "Under Treatment": "amber" }[health] ?? "green";
  }

  function batchSexLabel(sex) {
    return { Male: "♂ Male", Female: "♀ Female" }[sex] ?? sex;
  }

  function breedLabel(type, breed) {
    if (!breed) return "";
    // If it already has %, it's a crossbreed — show it shortened
    if (breed.includes("%")) return "🔀 " + breed;
    const icons = { "Anglo-Nubian": "🐐", Native: "🌿", Indo: "🦆" };
    return (icons[breed] ?? "") + " " + breed;
  }

  return {
    batches, soldBatches, flagged, eggRecords, hatchRecords,
    goatBatches, duckBatches,
    totalGoats, totalDucks, totalAnimals,
    maleGoats, femaleGoats, maleDucks, femaleDucks,
    goatByBreed, duckByBreed,
    totalEggsProduced, totalHatched, eggsByBatch,
    flaggedByBatch, pregnantGoatNames,
    totalAnimalCosts, totalSaleProfit, byType,
    startListener, stopListener,
    addBatch, updateBatch, removeBatch, removeSoldBatch,
    sellFromBatch, recordDeaths,
    addEggRecord, removeEggRecord,
    addHatchRecord, removeHatchRecord,
    flagIndividual, updateFlagged, removeFlagged,
    animalEmoji, healthTagColor, batchSexLabel, breedLabel,
  };
});