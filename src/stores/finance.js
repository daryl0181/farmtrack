// src/stores/finance.js  ── FULL REPLACEMENT
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
      createdAt: new Date().toISOString(),
    });
  }

  async function updateTransaction(id, data) {
    await updateDoc(doc(db, "transactions", id), data);
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

  // ── INCOME BREAKDOWN ──────────────────────────────────────────────────────
  const otherIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income" && t.category !== "Animal Sale")
      .reduce((s, t) => s + Number(t.amount), 0),
  );

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
  const totalExpenses = operatingExpenses;

  // ── DEATH LOSS ────────────────────────────────────────────────────────────
  const deathLoss = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.batches.reduce((sum, b) => {
      return sum + (Number(b.totalDied) || 0) * (Number(b.pricePerHead) || 0);
    }, 0);
  });

  // ── REALIZED SALE LOSS ────────────────────────────────────────────────────
  const realizedSaleLoss = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.soldBatches.reduce((sum, s) => {
      const p = Number(s.profit) || 0;
      return sum + (p < 0 ? Math.abs(p) : 0);
    }, 0);
  });

  // ── NET PROFIT ────────────────────────────────────────────────────────────
  const profit = computed(
    () => totalSaleProfit.value + otherIncome.value - operatingExpenses.value,
  );

  // ── ANIMAL INVESTMENT ─────────────────────────────────────────────────────
  const totalAnimalInvestment = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.batches.reduce(
      (s, b) =>
        s + (Number(b.pricePerHead) || 0) * (Number(b.originalCount) || 0),
      0,
    );
  });

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

  // ── MONTHLY TREND (last 6 months) ─────────────────────────────────────────
  const monthlyTrend = computed(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("en-PH", { month: "short" });
      const income = transactions.value
        .filter((t) => t.type === "Income" && t.date?.startsWith(key))
        .reduce((s, t) => s + Number(t.amount), 0);
      const expense = transactions.value
        .filter((t) => t.type === "Expense" && t.date?.startsWith(key))
        .reduce((s, t) => s + Number(t.amount), 0);
      months.push({ key, label, income, expense, net: income - expense });
    }
    return months;
  });

  // ── BREAKDOWNS ────────────────────────────────────────────────────────────
  const transactionBreakdown = computed(() => {
    const cats = {};
    transactions.value
      .filter((t) => t.type === "Expense")
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
      });
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => ({
        name,
        total: val,
        pct: Math.round((val / total) * 100),
        icon: categoryIcon(name),
      }));
  });

  const incomeBreakdown = computed(() => {
    const cats = {};
    transactions.value
      .filter((t) => t.type === "Income")
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
      });
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => ({
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

  // ── FILTERED TRANSACTIONS ─────────────────────────────────────────────────
  function getFilteredTransactions({ type, category, month, search } = {}) {
    return transactions.value.filter((t) => {
      if (type && t.type !== type) return false;
      if (category && t.category !== category) return false;
      if (month && !t.date?.startsWith(month)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
        );
      }
      return true;
    });
  }

  // ── ORPHAN CLEANUP ────────────────────────────────────────────────────────
  const orphanedSaleTransactions = computed(() => {
    const animalStore = useAnimalStore();
    const linkedIds = new Set(
      animalStore.soldBatches.map((s) => s.transactionId).filter(Boolean),
    );
    const coveredKeys = new Set(
      animalStore.soldBatches.map((s) => `${s.totalRevenue}__${s.soldDate}`),
    );
    return transactions.value.filter((t) => {
      if (t.category !== "Animal Sale") return false;
      if (linkedIds.has(t.id)) return false;
      if (coveredKeys.has(`${t.amount}__${t.date}`)) return false;
      return true;
    });
  });

  async function cleanupOrphanedSaleTransactions() {
    const orphans = orphanedSaleTransactions.value;
    await Promise.all(
      orphans.map((t) => deleteDoc(doc(db, "transactions", t.id))),
    );
    return orphans.length;
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function categoryIcon(cat) {
    return (
      {
        Feeds: "🌾",
        Medicine: "💊",
        Veterinary: "🩺",
        Labor: "👷",
        Equipment: "🔧",
        Utilities: "💡",
        Transport: "🚗",
        "Animal Sale": "💰",
        "Egg Sale": "🥚",
        "Milk Sale": "🥛",
        "Manure Sale": "🌿",
        Other: "📋",
      }[cat] ?? "💸"
    );
  }

  const EXPENSE_CATEGORIES = [
    "Feeds",
    "Medicine",
    "Veterinary",
    "Labor",
    "Equipment",
    "Utilities",
    "Transport",
    "Other",
  ];
  const INCOME_CATEGORIES = [
    "Animal Sale",
    "Egg Sale",
    "Milk Sale",
    "Manure Sale",
    "Other",
  ];

  function formatNum(n) {
    return Number(n || 0).toLocaleString("en-PH");
  }

  function formatCurrency(n) {
    return `₱${formatNum(n)}`;
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
    monthlyTrend,
    expenseBreakdown,
    incomeBreakdown,
    transactionBreakdown,
    saleProfitBreakdown,
    startListener,
    stopListener,
    addTransaction,
    updateTransaction,
    removeTransaction,
    getFilteredTransactions,
    categoryIcon,
    formatNum,
    formatCurrency,
    EXPENSE_CATEGORIES,
    INCOME_CATEGORIES,
    orphanedSaleTransactions,
    cleanupOrphanedSaleTransactions,
  };
});
