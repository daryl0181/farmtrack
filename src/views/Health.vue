<template>
  <div>
    <PageHeader greeting="Animal" title="Health & Reminders">
      <template #right>
        <div class="header-right-counts">
          <span v-if="healthStore.activeAlerts.length" class="alert-badge">
            {{ healthStore.activeAlerts.length }} due
          </span>
          <span class="header-total">{{ healthStore.reminders.length }} reminders</span>
        </div>
      </template>
    </PageHeader>

    <div class="page-content">

      <!-- ── ACTIVE ALERTS (overdue / today / within 7 days) ── -->
      <template v-if="healthStore.activeAlerts.length">
        <div class="section-title">🔔 Needs Attention</div>
        <div class="alert-stack">
          <div
            v-for="r in healthStore.activeAlerts" :key="r.id"
            :class="['reminder-alert', r.urgency]"
          >
            <div class="ra-left">
              <div class="ra-icon">{{ treatmentIcon(r.treatmentType) }}</div>
              <div class="ra-info">
                <div class="ra-animal">{{ r.animal }}</div>
                <div class="ra-treatment">
                  {{ r.treatmentType === 'Custom' ? r.customTreatment : r.treatmentType }}
                  <span v-if="r.medicine"> · {{ r.medicine }}</span>
                </div>
                <div class="ra-due-label">
                  <span v-if="r.urgency === 'overdue'" class="badge red">Overdue by {{ Math.abs(r.daysUntil) }}d</span>
                  <span v-else-if="r.urgency === 'today'" class="badge amber">Due TODAY</span>
                  <span v-else class="badge yellow">Due in {{ r.daysUntil }}d ({{ r.nextDueDate }})</span>
                </div>
              </div>
            </div>
            <button class="done-btn" @click="markDone(r)" :disabled="doneSaving === r.id">
              {{ doneSaving === r.id ? '…' : '✓ Done' }}
            </button>
          </div>
        </div>
      </template>

      <!-- ── TABS ── -->
      <div class="tabs">
        <button :class="['tab', activeTab === 'reminders' ? 'active' : '']" @click="activeTab = 'reminders'">
          📅 Reminders <span class="tab-count" v-if="healthStore.reminders.length">{{ healthStore.reminders.length }}</span>
        </button>
        <button :class="['tab', activeTab === 'records' ? 'active' : '']" @click="activeTab = 'records'">
          📋 History <span class="tab-count" v-if="healthStore.records.length">{{ healthStore.records.length }}</span>
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- REMINDERS TAB                                          -->
      <!-- ══════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'reminders'">

        <div class="reminder-list" v-if="healthStore.remindersWithStatus.length">
          <div
            class="reminder-card card"
            v-for="r in healthStore.remindersWithStatus"
            :key="r.id"
          >
            <!-- TOP ROW -->
            <div class="rc-top">
              <div :class="['rc-icon', r.urgency]">{{ treatmentIcon(r.treatmentType) }}</div>
              <div class="rc-info">
                <div class="rc-title">
                  {{ r.treatmentType === 'Custom' ? r.customTreatment : r.treatmentType }}
                  <span v-if="r.medicine" class="rc-medicine">· {{ r.medicine }}</span>
                </div>
                <div class="rc-animal">
                  {{ r.animalType === 'Goat' ? '🐐' : r.animalType === 'Duck' ? '🦆' : '🐾' }}
                  {{ r.animal }}
                </div>
              </div>
              <!-- COUNTDOWN BADGE -->
              <div :class="['rc-countdown', r.urgency]">
                <div class="rc-days" v-if="r.urgency === 'overdue'">{{ Math.abs(r.daysUntil) }}d</div>
                <div class="rc-days" v-else-if="r.urgency === 'today'">Today</div>
                <div class="rc-days" v-else>{{ r.daysUntil }}d</div>
                <div class="rc-days-label" v-if="r.urgency === 'overdue'">overdue</div>
                <div class="rc-days-label" v-else-if="r.urgency !== 'today'">left</div>
              </div>
            </div>

            <!-- DATE + REPEAT -->
            <div class="rc-meta-row">
              <span class="rc-date">📅 {{ r.nextDueDate }}</span>
              <span class="rc-repeat" v-if="r.repeatEveryDays > 0">
                🔁 every {{ r.repeatEveryDays }}d
              </span>
              <span class="rc-repeat" v-else>⏺ One-time</span>
            </div>

            <!-- NOTES -->
            <div class="rc-notes" v-if="r.notes">{{ r.notes }}</div>

            <!-- PROGRESS BAR (days until / 7 day window) -->
            <div class="rc-progress" v-if="r.urgency === 'soon' || r.urgency === 'today'">
              <div class="rc-prog-track">
                <div class="rc-prog-fill"
                  :style="{ width: Math.max(4, (1 - r.daysUntil / 7) * 100) + '%' }" />
              </div>
              <span class="rc-prog-label">{{ r.daysUntil === 0 ? 'Due today' : r.daysUntil + ' days away' }}</span>
            </div>

            <!-- ACTIONS -->
            <div class="rc-actions">
              <button class="rc-done-btn" @click="markDone(r)" :disabled="doneSaving === r.id">
                ✓ {{ doneSaving === r.id ? 'Saving…' : 'Mark Done' }}
              </button>
              <button class="rc-edit-btn" @click="openEdit(r)">✏️</button>
              <button class="rc-del-btn" @click="healthStore.removeReminder(r.id)">🗑️</button>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-text">No reminders set.<br>Tap + to schedule a treatment.</div>
        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- RECORDS / HISTORY TAB                                  -->
      <!-- ══════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'records'">

        <!-- FILTER -->
        <div class="filter-bar">
          <button v-for="f in filters" :key="f"
            :class="['filter-chip', activeFilter === f ? 'active' : '']"
            @click="activeFilter = f">{{ f }}</button>
        </div>

        <div class="health-list" v-if="filteredRecords.length">
          <div class="health-item card" v-for="r in filteredRecords" :key="r.id">
            <div class="hi-top">
              <div :class="['hi-icon', treatmentColor(r.treatment)]">
                {{ treatmentIcon(r.treatment) }}
              </div>
              <div class="hi-info">
                <div class="hi-name">{{ r.animal }}</div>
                <div class="hi-treatment">{{ r.treatment }}<span v-if="r.medicine"> · {{ r.medicine }}</span></div>
              </div>
              <div class="hi-right">
                <span :class="['tag', r.nextDate ? 'amber' : 'green']">
                  {{ r.nextDate ? 'Follow-up' : 'Done ✓' }}
                </span>
                <button class="hi-del" @click="healthStore.removeRecord(r.id)">×</button>
              </div>
            </div>
            <div class="hi-footer">
              <span class="hi-date">{{ r.date }}</span>
              <span class="hi-type">{{ r.animalType === 'Goat' ? '🐐' : r.animalType === 'Duck' ? '🦆' : '🐾' }} {{ r.animalType }}</span>
            </div>
            <div class="hi-notes" v-if="r.notes">{{ r.notes }}</div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No treatment records yet.<br>Records appear here when you mark a reminder done.</div>
        </div>
      </template>

    </div>

    <!-- ── EDIT REMINDER MODAL ── -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="editTarget" @click.self="editTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <h2 class="modal-title">✏️ Edit Reminder</h2>
          <div class="form-group">
            <label class="form-label">Animal / Batch</label>
            <input class="form-input" v-model="editForm.animal" />
          </div>
          <div class="form-group">
            <label class="form-label">Medicine / Product</label>
            <input class="form-input" v-model="editForm.medicine" />
          </div>
          <div class="form-group">
            <label class="form-label">Next Due Date</label>
            <input class="form-input" type="date" v-model="editForm.nextDueDate" />
          </div>
          <div class="form-group">
            <label class="form-label">Repeat Every (days)</label>
            <input class="form-input" type="number" v-model.number="editForm.repeatEveryDays" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input" v-model="editForm.notes" />
          </div>
          <div class="edit-actions">
            <button class="btn-cancel" @click="editTarget = null">Cancel</button>
            <button class="btn-save" @click="doEdit">Save</button>
          </div>
        </div>
      </div>
    </Transition>

    <button class="fab" @click="ui.openModal('addHealth')">+</button>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useHealthStore }  from '@/stores/health'
import { useUIStore }      from '@/stores/ui'

const healthStore = useHealthStore()
const ui          = useUIStore()

const activeTab    = ref('reminders')
const doneSaving   = ref(null)
const activeFilter = ref('All')
const filters      = ['All', 'Goat', 'Duck', 'Vaccination', 'Deworming', 'Vitamins']

const filteredRecords = computed(() => {
  const recs = healthStore.records
  if (activeFilter.value === 'All') return recs
  if (['Goat','Duck'].includes(activeFilter.value)) return recs.filter(r => r.animalType === activeFilter.value)
  return recs.filter(r => r.treatment === activeFilter.value)
})

function treatmentIcon(t) {
  return { Vaccination:'💉', Deworming:'🪱', Antibiotic:'💊', Vitamins:'🌿', 'Wound Treatment':'🩹', 'Check-up':'🩺', Custom:'✏️' }[t] ?? '💊'
}

function treatmentColor(t) {
  return { Vaccination:'green', Deworming:'blue', Antibiotic:'red', Vitamins:'green', 'Wound Treatment':'amber', 'Check-up':'blue' }[t] ?? 'green'
}

async function markDone(reminder) {
  doneSaving.value = reminder.id
  try {
    await healthStore.markReminderDone(reminder)
    ui.showToast('✅ Marked done!')
  } finally {
    doneSaving.value = null
  }
}

// EDIT
const editTarget = ref(null)
const editForm   = reactive({ animal: '', medicine: '', nextDueDate: '', repeatEveryDays: 0, notes: '' })

function openEdit(r) {
  editTarget.value = r
  Object.assign(editForm, { animal: r.animal, medicine: r.medicine, nextDueDate: r.nextDueDate, repeatEveryDays: r.repeatEveryDays, notes: r.notes })
}

async function doEdit() {
  await healthStore.updateReminder(editTarget.value.id, { ...editForm })
  ui.showToast('✅ Updated!')
  editTarget.value = null
}
</script>

<style scoped>
.header-right-counts { text-align: right; padding-top: 6px; display: flex; flex-direction: column; gap: 2px; }
.alert-badge {
  background: var(--red); color: #fff;
  font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 10px; align-self: flex-end;
}
.header-total { font-size: 12px; color: rgba(255,255,255,0.7); }

/* ALERT STACK */
.alert-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.reminder-alert {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  border-radius: 12px; padding: 12px 14px; border: 1.5px solid;
}
.reminder-alert.overdue { background: var(--red-pale);    border-color: var(--red); }
.reminder-alert.today   { background: var(--amber-pale);  border-color: var(--amber); }
.reminder-alert.soon    { background: var(--green-pale);  border-color: var(--green); }

.ra-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.ra-icon  { font-size: 22px; flex-shrink: 0; }
.ra-info  { flex: 1; min-width: 0; }
.ra-animal    { font-weight: 700; font-size: 14px; }
.ra-treatment { font-size: 12px; color: var(--muted); margin-top: 2px; }
.ra-due-label { margin-top: 4px; }

.badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; display: inline-block;
}
.badge.red    { background: var(--red);   color: #fff; }
.badge.amber  { background: var(--amber); color: #fff; }
.badge.yellow { background: var(--green); color: #fff; }

.done-btn {
  flex-shrink: 0; padding: 8px 14px; border-radius: 10px; border: none;
  background: var(--green); color: #fff;
  font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer;
}
.done-btn:disabled { opacity: 0.5; }

/* TABS */
.tabs {
  display: flex; gap: 4px; background: var(--bg2); border-radius: 12px;
  padding: 4px; margin-bottom: 16px;
}
.tab {
  flex: 1; text-align: center; padding: 9px;
  border-radius: 9px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; background: none;
  font-family: 'Outfit', sans-serif; color: var(--muted); transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.tab.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
.tab-count {
  background: var(--green-pale); color: var(--green);
  font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px;
}

/* REMINDER CARDS */
.reminder-list { display: flex; flex-direction: column; gap: 12px; }
.reminder-card { padding: 16px; }

.rc-top { display: flex; align-items: center; gap: 12px; }
.rc-icon {
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.rc-icon.ok      { background: var(--bg2); }
.rc-icon.soon    { background: var(--green-pale); }
.rc-icon.today   { background: var(--amber-pale); }
.rc-icon.overdue { background: var(--red-pale); }

.rc-info   { flex: 1; min-width: 0; }
.rc-title  { font-weight: 700; font-size: 14px; }
.rc-medicine { font-weight: 400; color: var(--muted); }
.rc-animal { font-size: 12px; color: var(--muted); margin-top: 2px; }

.rc-countdown { text-align: center; flex-shrink: 0; min-width: 44px; }
.rc-days {
  font-size: 20px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1;
}
.rc-countdown.ok      .rc-days { color: var(--muted); font-size: 14px; }
.rc-countdown.soon    .rc-days { color: var(--green); }
.rc-countdown.today   .rc-days { color: var(--amber); font-size: 14px; }
.rc-countdown.overdue .rc-days { color: var(--red); }
.rc-days-label { font-size: 9px; color: var(--muted); margin-top: 2px; }

.rc-meta-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--bg2);
}
.rc-date   { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--muted); }
.rc-repeat { font-size: 11px; color: var(--muted); }
.rc-notes  { font-size: 12px; color: var(--muted); margin-top: 6px; }

/* PROGRESS BAR */
.rc-progress { margin-top: 10px; display: flex; align-items: center; gap: 8px; }
.rc-prog-track {
  flex: 1; height: 5px; background: var(--bg2); border-radius: 3px; overflow: hidden;
}
.rc-prog-fill {
  height: 100%; background: var(--amber); border-radius: 3px; transition: width 0.4s ease;
}
.rc-prog-label { font-size: 10px; color: var(--muted); white-space: nowrap; }

/* ACTIONS */
.rc-actions { display: flex; gap: 8px; margin-top: 12px; }
.rc-done-btn {
  flex: 1; padding: 9px; border-radius: 10px; border: none;
  background: var(--green); color: #fff;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer;
}
.rc-done-btn:disabled { opacity: 0.5; }
.rc-edit-btn, .rc-del-btn {
  width: 38px; height: 38px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--bg2); font-size: 14px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

/* FILTER */
.filter-bar { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 12px; }
.filter-bar::-webkit-scrollbar { display: none; }
.filter-chip {
  flex-shrink: 0; padding: 6px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--surface); color: var(--muted);
  font-family: 'Outfit', sans-serif; white-space: nowrap;
}
.filter-chip.active { background: var(--green); border-color: var(--green); color: #fff; }

/* HISTORY RECORDS */
.health-list { display: flex; flex-direction: column; gap: 10px; }
.health-item { padding: 14px 16px; }
.hi-top  { display: flex; align-items: center; gap: 10px; }
.hi-icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.hi-icon.green  { background: var(--green-pale); }
.hi-icon.blue   { background: var(--blue-pale); }
.hi-icon.amber  { background: var(--amber-pale); }
.hi-icon.red    { background: var(--red-pale); }
.hi-info { flex: 1; min-width: 0; }
.hi-name      { font-weight: 600; font-size: 14px; }
.hi-treatment { font-size: 12px; color: var(--muted); margin-top: 2px; }
.hi-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.hi-del {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border);
  background: transparent; font-size: 16px; font-weight: 300; color: var(--muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;
}
.hi-del:active { background: var(--red-pale); color: var(--red); }
.hi-footer { display: flex; justify-content: space-between; margin-top: 8px; }
.hi-date { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
.hi-type { font-size: 11px; color: var(--muted); }
.hi-notes { font-size: 12px; color: var(--muted); margin-top: 6px; }

/* EDIT MODAL */
.overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.modal-sheet {
  background: var(--surface); border-radius: 24px 24px 0 0;
  width: 100%; max-width: 430px; margin: 0 auto;
  padding: 16px 20px 40px; max-height: 92vh; overflow-y: auto;
}
.modal-handle { width: 40px; height: 4px; border-radius: 2px; background: var(--border); margin: 0 auto 20px; }
.modal-title  { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.edit-actions { display: flex; gap: 8px; margin-top: 8px; }
.btn-cancel {
  flex: 1; padding: 11px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; color: var(--muted); cursor: pointer;
}
.btn-save {
  flex: 2; padding: 11px; border-radius: 10px; border: none;
  background: var(--green); font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 700; color: #fff; cursor: pointer;
}

.modal-slide-enter-active, .modal-slide-leave-active { transition: all 0.25s ease; }
.modal-slide-enter-from .modal-sheet, .modal-slide-leave-to .modal-sheet { transform: translateY(100%); }
.modal-slide-enter-from, .modal-slide-leave-to { opacity: 0; }
</style>