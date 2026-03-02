<template>
  <div>
    <PageHeader greeting="Animal" title="Health Records" />

    <div class="page-content">

      <!-- UPCOMING ALERTS -->
      <template v-if="healthStore.upcoming.length">
        <div class="section-title">⚠️ Upcoming Due</div>
        <div class="alert-stack">
          <div
            v-for="r in healthStore.upcoming"
            :key="r.id"
            :class="['alert', r.daysUntil <= 7 ? 'danger' : 'warn']"
          >
            <div class="alert-dot" />
            <div class="alert-text">
              <strong>{{ r.animal }}</strong> — {{ r.treatment }} due in
              <strong>{{ r.daysUntil }} days</strong> ({{ r.nextDate }})
            </div>
          </div>
        </div>
      </template>

      <!-- GENERAL REMINDERS -->
      <div class="section-title">📅 Standing Reminders</div>
      <div class="alert-stack">
        <div class="alert info">
          <div class="alert-dot" />
          <div class="alert-text">Deworm all goats every <strong>90 days</strong>.</div>
        </div>
        <div class="alert info">
          <div class="alert-dot" />
          <div class="alert-text">Newcastle Disease vaccine for chickens every <strong>6 months</strong>.</div>
        </div>
        <div class="alert info">
          <div class="alert-dot" />
          <div class="alert-text">Vitamin supplement recommended monthly for ducks.</div>
        </div>
      </div>

      <!-- HEALTH RECORDS -->
      <div class="section-title" style="margin-top:8px;">All Health Records</div>
      <div class="health-list" v-if="healthStore.records.length">
        <div class="health-item card" v-for="r in healthStore.records" :key="r.id">
          <div class="hi-top">
            <div class="hi-emoji">{{ animalEmoji(r.animalType) }}</div>
            <div class="hi-info">
              <div class="hi-name">{{ r.animal }}</div>
              <div class="hi-status">{{ r.treatment }}</div>
            </div>
            <span :class="['tag', r.nextDate ? 'amber' : 'green']">
              {{ r.nextDate ? 'Follow-up' : 'Done ✓' }}
            </span>
          </div>
          <div class="hi-detail" v-if="r.medicine || r.notes || r.nextDate">
            <span v-if="r.medicine">💊 {{ r.medicine }}</span>
            <span v-if="r.notes"> · {{ r.notes }}</span>
            <br v-if="r.nextDate" />
            <span v-if="r.nextDate" style="color:var(--amber);">📅 Next due: {{ r.nextDate }}</span>
          </div>
          <div class="hi-date">Recorded: {{ r.date }}</div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-state-icon">💊</div>
        <div class="empty-state-text">No health records yet.<br>Tap + to add a treatment record.</div>
      </div>

    </div>

    <button class="fab" @click="ui.openModal('addHealth')">+</button>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import { useHealthStore } from '@/stores/health'
import { useUIStore }     from '@/stores/ui'

const healthStore = useHealthStore()
const ui          = useUIStore()

function animalEmoji(type) {
  return { Goat:'🐐', Duck:'🦆' }[type] ?? '🐾'
}
</script>

<style scoped>
.alert-stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.health-list { display: flex; flex-direction: column; gap: 10px; }
.health-item { padding: 14px 16px; }
.hi-top   { display: flex; align-items: center; gap: 10px; }
.hi-emoji { font-size: 26px; flex-shrink: 0; }
.hi-info  { flex: 1; }
.hi-name  { font-weight: 600; font-size: 14px; }
.hi-status { font-size: 12px; color: var(--muted); margin-top: 2px; }
.hi-detail {
  font-size: 12px; color: var(--muted);
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid var(--bg2);
  line-height: 1.6;
}
.hi-date { font-size: 11px; color: var(--muted); margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
</style>
