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
  const ducksSold = ref(0);
  let unsubscribe = null;

  // Start real-time listener
  function startListener() {
    const q = query(collection(db, "animals"), orderBy("addedDate", "desc"));
    unsubscribe = onSnapshot(q, (snapshot) => {
      animals.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    });
  }

  // Stop listener when no longer needed
  function stopListener() {
    if (unsubscribe) unsubscribe();
  }

  async function addAnimal(data) {
    await addDoc(collection(db, "animals"), {
      ...data,
      addedDate: new Date().toISOString().slice(0, 10),
    });
    // No need to update animals.value — the onSnapshot listener does it automatically
  }

  async function removeAnimal(id) {
    await deleteDoc(doc(db, "animals", id));
  }

  async function updateAnimal(id, data) {
    await updateDoc(doc(db, "animals", id), data);
  }

  // All your computed values stay exactly the same
  const totalAnimals = computed(() => animals.value.length);
  const goats = computed(() => animals.value.filter((a) => a.type === "Goat"));
  const chickens = computed(() =>
    animals.value.filter((a) => a.type === "Chicken"),
  );
  const ducks = computed(() => animals.value.filter((a) => a.type === "Duck"));
  const others = computed(() =>
    animals.value.filter((a) => !["Goat", "Chicken", "Duck"].includes(a.type)),
  );
  const femaleGoats = computed(() =>
    goats.value.filter((a) => a.sex === "Female"),
  );
  const maleGoats = computed(() => goats.value.filter((a) => a.sex === "Male"));
  const femaleChickens = computed(
    () => chickens.value.filter((a) => a.sex === "Female").length,
  );
  const maleChickens = computed(
    () => chickens.value.filter((a) => a.sex === "Male").length,
  );

  function animalEmoji(type) {
    return (
      { Goat: "🐐", Chicken: "🐔", Duck: "🦆", Pig: "🐷", Cow: "🐄" }[type] ??
      "🐾"
    );
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
    ducksSold,
    totalAnimals,
    goats,
    chickens,
    ducks,
    others,
    femaleGoats,
    maleGoats,
    femaleChickens,
    maleChickens,
    startListener,
    stopListener,
    addAnimal,
    removeAnimal,
    updateAnimal,
    animalEmoji,
    healthTagColor,
  };
});
