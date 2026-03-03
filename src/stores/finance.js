// src/stores/finance.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, query, orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAnimalStore } from "@/stores/animals";

export const useFinanceStore = defineStore("finance", () => {
  const transactions = ref([]);
  let unsubscribe = null;

  function startListener() {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    unsubscribe = onSnapshot(q, (snap) => {
      transactions.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }, (e) => console.error("[finance]", e.message));
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
  // Profit per sale = (selling price − cost price) × quantity
  // This is already computed and stored in soldBatches.profit when a sale is recorded.
  // Positive = sold above cost. Negative = sold below cost (a loss).
  const totalSaleProfit = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.soldBatches.reduce(
      (sum, s) => sum + (Number(s.profit) || 0), 0
    );
  });

  // ── OTHER INCOME (non-animal-sale: eggs, milk, manure, etc.) ─────────────
  const otherIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income" && t.category !== "Animal Sale")
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  // Total income shown in header = animal sale revenue + other income
  // (for display purposes — actual profit uses sale PROFIT not revenue)
  const totalIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  // ── OPERATING EXPENSES ────────────────────────────────────────────────────
  // Cash costs: feeds, medicine, vet, labor, equipment, etc.
  // Does NOT include animal purchase costs (those are tracked as investment).
  const operatingExpenses = computed(() =>
    transactions.value
      .filter((t) => t.type === "Expense")
      .reduce((s, t) => s + Number(t.amount), 0)
  );
  const totalExpenses = operatingExpenses; // alias

  // ── NET PROFIT / LOSS ─────────────────────────────────────────────────────
  // = (Sell price − Buy price) for all animal sales
  // + Other income (eggs, milk, etc.)
  // − Operating expenses (feeds, medicine, etc.)
  //
  // Animal purchase cost is NOT subtracted here — buying animals is an
  // investment. The profit/loss from animals is captured when you SELL them
  // (sell price minus what you paid = profit or loss).
  const profit = computed(() =>
    totalSaleProfit.value + otherIncome.value - operatingExpenses.value
  );

  // ── ANIMAL INVESTMENT (for reference, not in P&L) ─────────────────────────
  // Total money spent buying animals. Shown separately as "Capital Invested".
  const totalAnimalInvestment = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.batches.reduce(
      (s, b) => s + (Number(b.pricePerHead) || 0) * (Number(b.originalCount) || 0), 0
    );
  });

  // ROI = profit vs total capital invested in animals
  const roi = computed(() =>
    totalAnimalInvestment.value > 0
      ? (profit.value / totalAnimalInvestment.value) * 100
      : 0
  );

  // ── MONTHLY ───────────────────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income" && t.date?.startsWith(currentMonth))
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  const monthExpenses = computed(() =>
    transactions.value
      .filter((t) => t.type === "Expense" && t.date?.startsWith(currentMonth))
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  // ── BREAKDOWNS ────────────────────────────────────────────────────────────
  // Operating expense breakdown by category
  const transactionBreakdown = computed(() => {
    const cats = {};
    transactions.value
      .filter((t) => t.type === "Expense")
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
      });
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(cats).map(([name, val]) => ({
      name, total: val,
      pct: Math.round((val / total) * 100),
      icon: categoryIcon(name),
    }));
  });

  // Animal investment breakdown by type (for display only)
  const expenseBreakdown = computed(() => {
    const animalStore = useAnimalStore();
    const cats = {};
    animalStore.batches.forEach((b) => {
      if (!b.pricePerHead) return;
      const key = b.type || "Other";
      cats[key] = (cats[key] || 0) + Number(b.pricePerHead) * Number(b.originalCount || 0);
    });
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(cats).map(([name, val]) => ({
      name, total: val,
      pct: Math.round((val / total) * 100),
      icon: name === "Goat" ? "🐐" : name === "Duck" ? "🦆" : "🐾",
    }));
  });

  // Per-sale profit/loss for display in reports
  const saleProfitBreakdown = computed(() => {
    const animalStore = useAnimalStore();
    return animalStore.soldBatches.map((s) => ({
      ...s,
      profitPerHead: s.quantity ? (s.profit / s.quantity) : 0,
    }));
  });

  function categoryIcon(cat) {
    return ({
      Feeds: "🌾", Medicine: "💊", Veterinary: "🩺",
      Labor: "👷", Equipment: "🔧", "Animal Sale": "💰",
      "Egg Sale": "🥚", "Milk Sale": "🥛", "Manure Sale": "🌿", Other: "📋",
    }[cat] ?? "💸");
  }

  function formatNum(n) {
    return Number(n || 0).toLocaleString("en-PH");
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
  };
});