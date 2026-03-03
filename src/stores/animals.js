// src/stores/animals.js
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
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";

// ── BREED DEFINITIONS ──────────────────────────────────────────────────────
export const GOAT_BREEDS = ["Anglo-Nubian", "Native"];
export const DUCK_BREEDS = ["Native", "Indo"];

export function computeOffspringBreed(parentA, parentB) {
  function parseBreed(str) {
    if (!str) return {};
    const map = {};
    const parts = str.split("/").map((s) => s.trim());
    for (const part of parts) {
      const m = part.match(/^(\d+)%\s*(.+)$/);
      if (m) {
        map[m[2].trim()] = Number(m[1]);
      } else {
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

  return Object.entries(combined)
    .filter(([, pct]) => pct > 0)
    .map(([breed, pct]) => `${Math.round(pct)}% ${breed}`)
    .join(" / ");
}

export const useAnimalStore = defineStore("animals", () => {
  const batches = ref([]);
  const soldBatches = ref([]);
  const flagged = ref([]);
  const eggRecords = ref([]);
  const hatchRecords = ref([]);

  // Tracks which Firestore collection each batch doc actually lives in.
  // Handles the migration where old docs were written to "animalBatches"
  // and new docs go into "batches".
  const _batchColMap = ref({}); // { [docId]: "batches" | "animalBatches" }

  let unsubBatches = null,
    unsubBatches2 = null,
    unsubSold = null;
  let unsubFlagged = null,
    unsubEggs = null,
    unsubHatch = null;

  // ── LISTENERS ──────────────────────────────────────────────────────────────
  function startListener() {
    // Merges docs from one collection into the batches ref,
    // keeping docs from the other collection intact.
    function makeMerger(colName) {
      return (snap) => {
        const incoming = snap.docs.map((d) => {
          _batchColMap.value[d.id] = colName;
          return { id: d.id, ...d.data() };
        });
        // Replace only the entries that came from this collection
        const others = batches.value.filter(
          (b) => _batchColMap.value[b.id] !== colName,
        );
        batches.value = [...others, ...incoming].sort((a, b) =>
          (b.addedDate || "").localeCompare(a.addedDate || ""),
        );
      };
    }

    // Listen to BOTH collections so existing "animalBatches" docs still appear
    unsubBatches = onSnapshot(
      query(collection(db, "batches"), orderBy("addedDate", "desc")),
      makeMerger("batches"),
      (e) => console.error("[batches]", e.message),
    );

    unsubBatches2 = onSnapshot(
      query(collection(db, "animalBatches"), orderBy("addedDate", "desc")),
      makeMerger("animalBatches"),
      (e) => console.error("[animalBatches]", e.message),
    );

    unsubSold = onSnapshot(
      query(collection(db, "soldBatches"), orderBy("soldDate", "desc")),
      (snap) => {
        soldBatches.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (e) => console.error("[soldBatches]", e.message),
    );

    unsubFlagged = onSnapshot(
      query(collection(db, "flaggedAnimals"), orderBy("flaggedDate", "desc")),
      (snap) => {
        flagged.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (e) => console.error("[flagged]", e.message),
    );

    unsubEggs = onSnapshot(
      query(collection(db, "eggRecords"), orderBy("date", "desc")),
      (snap) => {
        eggRecords.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (e) => console.error("[eggRecords]", e.message),
    );

    unsubHatch = onSnapshot(
      query(collection(db, "hatchRecords"), orderBy("hatchDate", "desc")),
      (snap) => {
        hatchRecords.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (e) => console.error("[hatchRecords]", e.message),
    );
  }

  function stopListener() {
    [
      unsubBatches,
      unsubBatches2,
      unsubSold,
      unsubFlagged,
      unsubEggs,
      unsubHatch,
    ].forEach((u) => u?.());
  }

  // Returns the correct Firestore collection name for a given batch id
  function _colFor(batchId) {
    return _batchColMap.value[batchId] || "batches";
  }

  // ── BATCH ACTIONS ──────────────────────────────────────────────────────────
  async function addBatch(data) {
    const count = Number(data.count) || 1;
    // All new batches go into "batches"
    const docRef = await addDoc(collection(db, "batches"), {
      type: data.type || "Goat",
      breed: data.breed || "Native",
      sex: data.sex || "Mixed",
      label: data.label || "",
      originalCount: count,
      currentCount: count,
      pricePerHead: Number(data.pricePerHead) || 0,
      health: data.health || "Healthy",
      addedDate: data.addedDate || new Date().toISOString().slice(0, 10),
      notes: data.notes || "",
      totalSold: 0,
      totalDied: 0,
    });
    _batchColMap.value[docRef.id] = "batches";
  }

  async function updateBatch(id, data) {
    await updateDoc(doc(db, _colFor(id), id), data);
  }

  async function removeBatch(id) {
    await deleteDoc(doc(db, _colFor(id), id));
  }

  // ── SELL ───────────────────────────────────────────────────────────────────
  async function sellFromBatch({
    batchId,
    quantity,
    pricePerHead,
    soldTo,
    soldDate,
    sexSold,
  }) {
    const batch = batches.value.find((b) => b.id === batchId);
    if (!batch) return;

    const qty = Number(quantity);
    const pph = Number(pricePerHead);
    const total = qty * pph;
    const costBasis = (Number(batch.pricePerHead) || 0) * qty;
    const today = soldDate || new Date().toISOString().slice(0, 10);
    const col = _colFor(batchId); // ← correct collection for THIS batch

    // Create income transaction first so we can link its ID to the sale record
    const txRef = await addDoc(collection(db, "transactions"), {
      type: "Income",
      category: "Animal Sale",
      amount: total,
      description: `Sold ${qty} ${batch.type}${batch.breed ? ` (${batch.breed})` : ""}${batch.label ? " from " + batch.label : ""}${soldTo ? " to " + soldTo : ""}`,
      date: today,
    });

    await addDoc(collection(db, "soldBatches"), {
      batchId,
      batchLabel: batch.label || batch.type,
      type: batch.type,
      breed: batch.breed || "",
      sexSold: sexSold || batch.sex,
      quantity: qty,
      pricePerHead: pph,
      totalRevenue: total,
      costBasis,
      profit: total - costBasis,
      soldTo: soldTo || "",
      soldDate: today,
      transactionId: txRef.id,
    });

    await updateDoc(doc(db, col, batchId), {
      currentCount: Math.max(0, (Number(batch.currentCount) || 0) - qty),
      totalSold: (Number(batch.totalSold) || 0) + qty,
    });
  }

  // ── UNDO SALE ──────────────────────────────────────────────────────────────
  async function removeSoldBatch(soldBatch) {
    const qty = Number(soldBatch.quantity) || 0;
    const sourceBatch = batches.value.find((b) => b.id === soldBatch.batchId);

    // 1. Restore animal count on the source batch
    if (sourceBatch) {
      const col = _colFor(soldBatch.batchId);
      await updateDoc(doc(db, col, soldBatch.batchId), {
        currentCount: (Number(sourceBatch.currentCount) || 0) + qty,
        totalSold: Math.max(0, (Number(sourceBatch.totalSold) || 0) - qty),
      });
    }

    // 2. Delete the linked income transaction
    //    - New sales: use stored transactionId (exact match)
    //    - Old sales (no transactionId): query by amount + date + category
    if (soldBatch.transactionId) {
      await deleteDoc(doc(db, "transactions", soldBatch.transactionId));
    } else {
      // Fallback: find the matching Animal Sale transaction by amount and date
      const q = query(
        collection(db, "transactions"),
        where("category", "==", "Animal Sale"),
        where("amount", "==", Number(soldBatch.totalRevenue)),
        where("date", "==", soldBatch.soldDate),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "transactions", d.id));
      }
    }

    // 3. Delete the sold record itself
    await deleteDoc(doc(db, "soldBatches", soldBatch.id));
  }

  // ── DEATHS ─────────────────────────────────────────────────────────────────
  async function recordDeaths({ batchId, quantity, cause, date }) {
    const batch = batches.value.find((b) => b.id === batchId);
    if (!batch) return;
    const qty = Number(quantity);
    const col = _colFor(batchId);
    await updateDoc(doc(db, col, batchId), {
      currentCount: Math.max(0, (Number(batch.currentCount) || 0) - qty),
      totalDied: (Number(batch.totalDied) || 0) + qty,
      lastDeathCause: cause,
      lastDeathDate: date || new Date().toISOString().slice(0, 10),
    });
  }

  // ── EGG RECORDS ────────────────────────────────────────────────────────────
  async function addEggRecord(data) {
    await addDoc(collection(db, "eggRecords"), {
      batchId: data.batchId,
      date: data.date,
      eggsCollected: Number(data.eggsCollected) || 0,
      notes: data.notes || "",
    });
    const batch = batches.value.find((b) => b.id === data.batchId);
    if (batch) {
      await updateDoc(doc(db, _colFor(data.batchId), data.batchId), {
        totalEggsProduced:
          (Number(batch.totalEggsProduced) || 0) +
          (Number(data.eggsCollected) || 0),
      });
    }
  }

  async function removeEggRecord(id) {
    await deleteDoc(doc(db, "eggRecords", id));
  }

  // ── HATCH RECORDS ──────────────────────────────────────────────────────────
  async function addHatchRecord(data) {
    const offspringBreed =
      data.fatherBreed && data.motherBreed
        ? computeOffspringBreed(data.fatherBreed, data.motherBreed)
        : data.breed || "";

    await addDoc(collection(db, "hatchRecords"), {
      batchId: data.batchId,
      hatchDate: data.hatchDate,
      eggsSet: Number(data.eggsSet) || 0,
      hatched: Number(data.hatched) || 0,
      failedToHatch: (Number(data.eggsSet) || 0) - (Number(data.hatched) || 0),
      offspringBreed,
      fatherBreed: data.fatherBreed || "",
      motherBreed: data.motherBreed || "",
      notes: data.notes || "",
    });

    const batch = batches.value.find((b) => b.id === data.batchId);
    if (batch) {
      await updateDoc(doc(db, _colFor(data.batchId), data.batchId), {
        totalHatched:
          (Number(batch.totalHatched) || 0) + (Number(data.hatched) || 0),
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
  const goatBatches = computed(() =>
    batches.value.filter((b) => b.type === "Goat"),
  );
  const duckBatches = computed(() =>
    batches.value.filter((b) => b.type === "Duck"),
  );

  const totalGoats = computed(() =>
    goatBatches.value.reduce((s, b) => s + (b.currentCount || 0), 0),
  );
  const totalDucks = computed(() =>
    duckBatches.value.reduce((s, b) => s + (b.currentCount || 0), 0),
  );
  const totalAnimals = computed(() => totalGoats.value + totalDucks.value);

  const maleGoats = computed(() =>
    goatBatches.value
      .filter((b) => b.sex === "Male")
      .reduce((s, b) => s + (b.currentCount || 0), 0),
  );
  const femaleGoats = computed(() =>
    goatBatches.value
      .filter((b) => b.sex === "Female")
      .reduce((s, b) => s + (b.currentCount || 0), 0),
  );
  const maleDucks = computed(() =>
    duckBatches.value
      .filter((b) => b.sex === "Male")
      .reduce((s, b) => s + (b.currentCount || 0), 0),
  );
  const femaleDucks = computed(() =>
    duckBatches.value
      .filter((b) => b.sex === "Female")
      .reduce((s, b) => s + (b.currentCount || 0), 0),
  );

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

  const totalEggsProduced = computed(() =>
    eggRecords.value.reduce((s, r) => s + (r.eggsCollected || 0), 0),
  );
  const totalHatched = computed(() =>
    hatchRecords.value.reduce((s, r) => s + (r.hatched || 0), 0),
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
    flagged.value.filter((f) => f.health === "Pregnant").map((f) => f.name),
  );

  const totalAnimalCosts = computed(() =>
    batches.value.reduce(
      (s, b) =>
        s + (Number(b.pricePerHead) || 0) * (Number(b.originalCount) || 0),
      0,
    ),
  );

  const totalSaleProfit = computed(() =>
    soldBatches.value.reduce((s, s2) => s + (Number(s2.profit) || 0), 0),
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
  function animalEmoji(type) {
    return { Goat: "🐐", Duck: "🦆" }[type] ?? "🐾";
  }

  function healthTagColor(health) {
    return (
      {
        Healthy: "green",
        Pregnant: "purple",
        Sick: "red",
        "Under Treatment": "amber",
      }[health] ?? "green"
    );
  }

  function batchSexLabel(sex) {
    return { Male: "♂ Male", Female: "♀ Female" }[sex] ?? sex;
  }

  function breedLabel(type, breed) {
    if (!breed) return "";
    if (breed.includes("%")) return "🔀 " + breed;
    const icons = { "Anglo-Nubian": "🐐", Native: "🌿", Indo: "🦆" };
    return (icons[breed] ?? "") + " " + breed;
  }

  return {
    batches,
    soldBatches,
    flagged,
    eggRecords,
    hatchRecords,
    goatBatches,
    duckBatches,
    totalGoats,
    totalDucks,
    totalAnimals,
    maleGoats,
    femaleGoats,
    maleDucks,
    femaleDucks,
    goatByBreed,
    duckByBreed,
    totalEggsProduced,
    totalHatched,
    eggsByBatch,
    flaggedByBatch,
    pregnantGoatNames,
    totalAnimalCosts,
    totalSaleProfit,
    byType,
    startListener,
    stopListener,
    addBatch,
    updateBatch,
    removeBatch,
    removeSoldBatch,
    sellFromBatch,
    recordDeaths,
    addEggRecord,
    removeEggRecord,
    addHatchRecord,
    removeHatchRecord,
    flagIndividual,
    updateFlagged,
    removeFlagged,
    animalEmoji,
    healthTagColor,
    batchSexLabel,
    breedLabel,
  };
});
