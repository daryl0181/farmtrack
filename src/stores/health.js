// src/stores/health.js
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

export const useHealthStore = defineStore("health", () => {
  const records = ref([]); // past treatment records
  const reminders = ref([]); // user-defined scheduled reminders

  let unsubRecords = null,
    unsubReminders = null;

  // ── LISTENERS ──────────────────────────────────────────────────────────────
  function startListener() {
    unsubRecords = onSnapshot(
      query(collection(db, "healthRecords"), orderBy("date", "desc")),
      (snap) => {
        records.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
    );

    unsubReminders = onSnapshot(
      query(collection(db, "healthReminders"), orderBy("nextDueDate", "asc")),
      (snap) => {
        reminders.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
    );
  }

  function stopListener() {
    unsubRecords?.();
    unsubReminders?.();
  }

  // ── COMPUTED ───────────────────────────────────────────────────────────────

  /**
   * Enrich reminders with daysUntil and urgency.
   * Alerts fire 7 days before, up to and including the due date (+1 day grace).
   */
  const remindersWithStatus = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reminders.value.map((r) => {
      const due = new Date(r.nextDueDate);
      due.setHours(0, 0, 0, 0);
      const daysUntil = Math.round((due - today) / 86400000);

      let urgency = "ok"; // > 7 days away
      if (daysUntil < 0) urgency = "overdue";
      else if (daysUntil === 0) urgency = "today";
      else if (daysUntil <= 7) urgency = "soon";

      return { ...r, daysUntil, urgency };
    });
  });

  /**
   * Only the reminders that should show as alerts:
   * overdue, today, or within 7 days.
   */
  const activeAlerts = computed(() =>
    remindersWithStatus.value.filter((r) => r.urgency !== "ok"),
  );

  /**
   * Legacy: upcoming from treatment records (nextDate field)
   * Keep for backward compat with HealthPage
   */
  const upcoming = computed(() => {
    const today = new Date();
    return records.value
      .filter((r) => r.nextDate)
      .map((r) => {
        const diff = Math.round((new Date(r.nextDate) - today) / 86400000);
        return { ...r, daysUntil: diff };
      })
      .filter((r) => r.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  });

  // ── TREATMENT RECORDS ──────────────────────────────────────────────────────
  async function addRecord(data) {
    await addDoc(collection(db, "healthRecords"), { ...data });
  }

  async function removeRecord(id) {
    await deleteDoc(doc(db, "healthRecords", id));
  }

  // ── SCHEDULED REMINDERS ────────────────────────────────────────────────────
  /**
   * Add a custom reminder.
   * data: {
   *   animal: string,       // batch name or individual
   *   animalType: string,   // Goat | Duck | All
   *   treatmentType: string,// Vaccination | Deworming | Vitamins | etc.
   *   customTreatment: string, // if treatmentType = "Custom"
   *   medicine: string,     // optional product name
   *   notes: string,
   *   nextDueDate: string,  // YYYY-MM-DD — the NEXT scheduled date
   *   repeatEveryDays: number | null,  // 0 = no repeat
   * }
   */
  async function addReminder(data) {
    await addDoc(collection(db, "healthReminders"), {
      animal: data.animal || "",
      animalType: data.animalType || "All",
      treatmentType: data.treatmentType || "Vaccination",
      customTreatment: data.customTreatment || "",
      medicine: data.medicine || "",
      notes: data.notes || "",
      nextDueDate: data.nextDueDate,
      repeatEveryDays: Number(data.repeatEveryDays) || 0,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  async function updateReminder(id, data) {
    await updateDoc(doc(db, "healthReminders", id), data);
  }

  async function removeReminder(id) {
    await deleteDoc(doc(db, "healthReminders", id));
  }

  /**
   * Mark a reminder as done — logs a health record, then advances the nextDueDate
   * by repeatEveryDays. If no repeat, deletes the reminder.
   */
  async function markReminderDone(reminder) {
    const today = new Date().toISOString().slice(0, 10);

    // Log it as a health record
    await addRecord({
      animal: reminder.animal,
      animalType: reminder.animalType,
      treatment:
        reminder.treatmentType === "Custom"
          ? reminder.customTreatment
          : reminder.treatmentType,
      medicine: reminder.medicine,
      notes: reminder.notes,
      date: today,
      nextDate: reminder.repeatEveryDays
        ? advanceDateByDays(today, reminder.repeatEveryDays)
        : "",
      fromReminder: reminder.id,
    });

    if (reminder.repeatEveryDays > 0) {
      // Advance the reminder
      const newDue = advanceDateByDays(
        reminder.nextDueDate,
        reminder.repeatEveryDays,
      );
      await updateReminder(reminder.id, { nextDueDate: newDue });
    } else {
      // One-time reminder — remove it
      await removeReminder(reminder.id);
    }
  }

  function advanceDateByDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // Preset repeat options
  const repeatPresets = [
    { label: "No repeat (one-time)", days: 0 },
    { label: "Every week", days: 7 },
    { label: "Every 2 weeks", days: 14 },
    { label: "Every month (30d)", days: 30 },
    { label: "Every 3 months (90d)", days: 90 },
    { label: "Every 6 months", days: 180 },
    { label: "Every year", days: 365 },
    { label: "Custom interval", days: -1 },
  ];

  return {
    records,
    reminders,
    remindersWithStatus,
    activeAlerts,
    upcoming,
    repeatPresets,
    startListener,
    stopListener,
    addRecord,
    removeRecord,
    addReminder,
    updateReminder,
    removeReminder,
    markReminderDone,
  };
});
