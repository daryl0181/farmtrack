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

export const useAnimalStore = defineStore("animals", () => {
  const animals = ref([]);
  const soldAnimals = ref([]);
  let unsubscribe = null;
  let unsubSold = null;

  function startListener() {
    const q = query(collection(db, "animals"), orderBy("addedDate", "desc"));
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        animals.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (e) => console.error("[animals]", e.message),
    );

    const qs = query(
      collection(db, "soldAnimals"),
      orderBy("soldDate", "desc"),
    );
    unsubSold = onSnapshot(
      qs,
      (snapshot) => {
        soldAnimals.value = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      },
      (e) => console.error("[soldAnimals]", e.message),
    );
  }

  function stopListener() {
    if (unsubscribe) unsubscribe();
    if (unsubSold) unsubSold();
  }

  async function addAnimal(data) {
    await addDoc(collection(db, "animals"), {
      ...data,
      addedDate: new Date().toISOString().slice(0, 10),
    });
  }

  async function removeAnimal(id) {
    await deleteDoc(doc(db, "animals", id));
  }

  async function updateAnimal(id, data) {
    await updateDoc(doc(db, "animals", id), data);
  }

  // Sell an animal: move to soldAnimals, auto-record income transaction
  async function sellAnimal({ animal, soldFor, soldTo, soldDate }) {
    const today = soldDate || new Date().toISOString().slice(0, 10);

    // 1. Save to soldAnimals collection
    await addDoc(collection(db, "soldAnimals"), {
      name: animal.name || "",
      type: animal.type || "",
      sex: animal.sex || "",
      age: animal.age || "",
      weight: animal.weight || "",
      boughtFor: Number(animal.boughtFor) || 0,
      soldFor: Number(soldFor),
      soldTo: soldTo || "",
      soldDate: today,
      profit: Number(soldFor) - (Number(animal.boughtFor) || 0),
      addedDate: animal.addedDate || "",
    });

    // 2. Record as Income transaction in finance
    await addDoc(collection(db, "transactions"), {
      type: "Income",
      category: "Animal Sale",
      amount: Number(soldFor),
      description: `Sold ${animal.type}${animal.name ? " – " + animal.name : ""}${soldTo ? " to " + soldTo : ""}`,
      date: today,
    });

    // 3. Remove from active animals
    await deleteDoc(doc(db, "animals", animal.id));
  }

  const totalAnimals = computed(() => animals.value.length);
  const goats = computed(() => animals.value.filter((a) => a.type === "Goat"));
  const ducks = computed(() => animals.value.filter((a) => a.type === "Duck"));
  const others = computed(() =>
    animals.value.filter((a) => !["Goat", "Duck"].includes(a.type)),
  );
  const femaleGoats = computed(() =>
    goats.value.filter((a) => a.sex === "Female"),
  );
  const maleGoats = computed(() => goats.value.filter((a) => a.sex === "Male"));

  const byType = computed(() => {
    const total = animals.value.length || 1;
    const types = [
      {
        type: "Goat",
        emoji: "🐐",
        color: "#2d6a4f",
        count: goats.value.length,
      },
      {
        type: "Duck",
        emoji: "🦆",
        color: "#1d6fa5",
        count: ducks.value.length,
      },
      {
        type: "Other",
        emoji: "🐾",
        color: "#888888",
        count: others.value.length,
      },
    ];
    return types
      .filter((t) => t.count > 0)
      .map((t) => ({ ...t, pct: Math.round((t.count / total) * 100) }));
  });

  // Total profit from all sales
  const totalSaleProfit = computed(() =>
    soldAnimals.value.reduce((s, a) => s + (Number(a.profit) || 0), 0),
  );

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

  return {
    animals,
    soldAnimals,
    totalAnimals,
    totalSaleProfit,
    goats,

    ducks,
    others,
    femaleGoats,
    maleGoats,
    byType,
    startListener,
    stopListener,
    addAnimal,
    removeAnimal,
    updateAnimal,
    sellAnimal,
    animalEmoji,
    healthTagColor,
  };
});
