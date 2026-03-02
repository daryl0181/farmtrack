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

export const useFinanceStore = defineStore("finance", () => {
  const transactions = ref([]);
  let unsubscribe = null;

  function startListener() {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        transactions.value = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      },
      (error) => {
        // "requires an index" → click the URL printed in console to create it
        // "Missing or insufficient permissions" → fix Firestore security rules
        console.error("[finance] onSnapshot error:", error.code, error.message);
      },
    );
  }

  function stopListener() {
    if (unsubscribe) unsubscribe();
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

  const totalInvested = computed(() =>
    transactions.value
      .filter((t) => t.category === "Capital")
      .reduce((s, t) => s + Number(t.amount), 0),
  );
  const totalIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + Number(t.amount), 0),
  );
  const totalExpenses = computed(() =>
    transactions.value
      .filter((t) => t.type === "Expense" && t.category !== "Capital")
      .reduce((s, t) => s + Number(t.amount), 0),
  );
  const profit = computed(() => totalIncome.value - totalExpenses.value);
  const roi = computed(() =>
    totalInvested.value > 0 ? (profit.value / totalInvested.value) * 100 : 0,
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthIncome = computed(() =>
    transactions.value
      .filter((t) => t.type === "Income" && t.date?.startsWith(currentMonth))
      .reduce((s, t) => s + Number(t.amount), 0),
  );
  const monthExpenses = computed(() =>
    transactions.value
      .filter(
        (t) =>
          t.type === "Expense" &&
          t.category !== "Capital" &&
          t.date?.startsWith(currentMonth),
      )
      .reduce((s, t) => s + Number(t.amount), 0),
  );

  const expenseBreakdown = computed(() => {
    const cats = {};
    transactions.value
      .filter((t) => t.type === "Expense" && t.category !== "Capital")
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

  function categoryIcon(cat) {
    return (
      {
        Feeds: "🌾",
        Medicine: "💊",
        Veterinary: "🩺",
        Labor: "👷",
        Equipment: "🔧",
        Capital: "🏦",
        "Animal Sale": "💰",
        "Egg Sale": "🥚",
        "Milk Sale": "🥛",
        "Manure Sale": "🌿",
        Other: "📋",
      }[cat] ?? "💸"
    );
  }

  function formatNum(n) {
    return Number(n || 0).toLocaleString("en-PH");
  }

  return {
    transactions,
    totalInvested,
    totalIncome,
    totalExpenses,
    profit,
    roi,
    monthIncome,
    monthExpenses,
    expenseBreakdown,
    startListener,
    stopListener,
    addTransaction,
    removeTransaction,
    categoryIcon,
    formatNum,
  };
});
