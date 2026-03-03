// src/stores/finance.js  ── FULL REPLACEMENT
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
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAnimalStore } from "@/stores/animals";

export const useFinanceStore = defineStore("finance", () => {
  const transactions = ref([]);
  let unsubscribe = null;

  function startListener() {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    unsubscribe = onSnapshot(
      q,
      (snap) => {
        transactions.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (e) => console.error("[finance]", e.message),
    );
  }

  function stopListener() {
    unsubscribe?.();
  }

  async function addTransaction(data) {
    await addDoc(collection(db, "transactions"), {
      ...data,
      amount: Number(data.amount),
    });
  }

  async function removeTransaction(id) {
    await deleteDoc(doc(db, "transactions", id));
  }

  // ── ANIMAL SALE PROFIT ────────────────────────────────────────────────────
  const totalSaleProfit = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.soldBatches.reduce(
      (sum, s) => sum + (Number(s.profit) || 0),
      0,
    );
  });

  // ── OTHER INCOME (non-animal-sale: eggs, milk, manure, etc.) ─────────────
  const otherIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income" && t.category !== "Animal Sale")
      .reduce((s, t) => s + Number(t.amount), 0),
  );

  // Total income = all income transactions (for display in header)
  const totalIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + Number(t.amount), 0),
  );

  // ── OPERATING EXPENSES ────────────────────────────────────────────────────
  const operatingExpenses = computed(() =>
    transactions.value
      .filter((t) => t.type === "Expense")
      .reduce((s, t) => s + Number(t.amount), 0),
  );
  const totalExpenses = operatingExpenses; // alias

  // ── DEATH LOSS ────────────────────────────────────────────────────────────
  // Total investment value lost to animal deaths
  const deathLoss = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.batches.reduce((sum, b) => {
      const died = Number(b.totalDied) || 0;
      const costPerHead = Number(b.pricePerHead) || 0;
      return sum + died * costPerHead;
    }, 0);
  });

  // ── REALIZED SALE LOSS ────────────────────────────────────────────────────
  // Sum of negative sale profits (sold below cost)
  const realizedSaleLoss = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.soldBatches.reduce((sum, s) => {
      const p = Number(s.profit) || 0;
      return sum + (p < 0 ? Math.abs(p) : 0);
    }, 0);
  });

  // ── NET PROFIT / LOSS ─────────────────────────────────────────────────────
  const profit = computed(
    () => totalSaleProfit.value + otherIncome.value - operatingExpenses.value,
  );

  // ── ANIMAL INVESTMENT (asset, not in P&L) ─────────────────────────────────
  const totalAnimalInvestment = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.batches.reduce(
      (s, b) =>
        s + (Number(b.pricePerHead) || 0) * (Number(b.originalCount) || 0),
      0,
    );
  });

  // ROI = profit vs total capital invested in animals
  const roi = computed(() =>
    totalAnimalInvestment.value > 0
      ? (profit.value / totalAnimalInvestment.value) * 100
      : 0,
  );

  // ── MONTHLY ───────────────────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income" && t.date?.startsWith(currentMonth))
      .reduce((s, t) => s + Number(t.amount), 0),
  );

  const monthExpenses = computed(() =>
    transactions.value
      .filter((t) => t.type === "Expense" && t.date?.startsWith(currentMonth))
      .reduce((s, t) => s + Number(t.amount), 0),
  );

  // ── BREAKDOWNS ────────────────────────────────────────────────────────────
  const transactionBreakdown = computed(() => {
    const cats = {};
    transactions.value
      .filter((t) => t.type === "Expense")
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
      });
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(cats).map(([name, val]) => ({
      name,
      total: val,
      pct: Math.round((val / total) * 100),
      icon: categoryIcon(name),
    }));
  });

  const expenseBreakdown = computed(() => {
    const animalStore = useAnimalStore();
    const cats = {};
    animalStore.batches.forEach((b) => {
      if (!b.pricePerHead) return;
      const key = b.type || "Other";
      cats[key] =
        (cats[key] || 0) +
        Number(b.pricePerHead) * Number(b.originalCount || 0);
    });
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(cats).map(([name, val]) => ({
      name,
      total: val,
      pct: Math.round((val / total) * 100),
      icon: name === "Goat" ? "🐐" : name === "Duck" ? "🦆" : "🐾",
    }));
  });

  const saleProfitBreakdown = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.soldBatches.map((s) => ({
      ...s,
      profitPerHead: s.quantity ? s.profit / s.quantity : 0,
    }));
  });

  function categoryIcon(cat) {
    return (
      {
        Feeds: "🌾",
        Medicine: "💊",
        Veterinary: "🩺",
        Labor: "👷",
        Equipment: "🔧",
        "Animal Sale": "💰",
        "Egg Sale": "🥚",
        "Milk Sale": "🥛",
        "Manure Sale": "🌿",
        Other: "📋",
      }[cat] ?? "💸"
    );
  }

  // ── ORPHAN CLEANUP ───────────────────────────────────────────────────────
  // Animal Sale transactions that exist in "transactions" but have no matching
  // soldBatch. These are leftovers from before the transactionId fix.
  const orphanedSaleTransactions = computed(() => {
    const animalStore = useAnimalStore();
    const linkedIds = new Set(
      animalStore.soldBatches.map((s) => s.transactionId).filter(Boolean),
    );
    // Also treat soldBatches without transactionId as "covered" by matching amount+date
    const coveredKeys = new Set(
      animalStore.soldBatches.map((s) => `${s.totalRevenue}__${s.soldDate}`),
    );
    return transactions.value.filter((t) => {
      if (t.category !== "Animal Sale") return false;
      if (linkedIds.has(t.id)) return false; // has direct link
      if (coveredKeys.has(`${t.amount}__${t.date}`)) return false; // matched by amount+date
      return true; // truly orphaned
    });
  });

  async function cleanupOrphanedSaleTransactions() {
    const orphans = orphanedSaleTransactions.value;
    await Promise.all(
      orphans.map((t) => deleteDoc(doc(db, "transactions", t.id))),
    );
    return orphans.length;
  }

  function formatNum(n) {
    return Number(n || 0).toLocaleString("en-PH");
  }

  // ── ORPHANED SALE TRANSACTIONS ────────────────────────────────────────────
  

  // Delete all orphaned Animal Sale transactions in one shot
  async function cleanupOrphanedSaleTransactions() {
    const orphans = orphanedSaleTransactions.value;
    await Promise.all(
      orphans.map((t) => deleteDoc(doc(db, "transactions", t.id))),
    );
    return orphans.length;
  }

  return {
    transactions,
    totalIncome,
    totalExpenses,
    operatingExpenses,
    otherIncome,
    totalSaleProfit,
    profit,
    roi,
    deathLoss,
    realizedSaleLoss,
    totalAnimalInvestment,
    monthIncome,
    monthExpenses,
    expenseBreakdown,
    transactionBreakdown,
    saleProfitBreakdown,
    startListener,
    stopListener,
    addTransaction,
    removeTransaction,
    categoryIcon,
    formatNum,
    orphanedSaleTransactions,
    cleanupOrphanedSaleTransactions,
  };
});
