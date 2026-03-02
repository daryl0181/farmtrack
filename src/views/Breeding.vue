<template>
  <div>
    <PageHeader greeting="Goat" title="Breeding & Birth">
      <template #right>
        <div style="color:rgba(255,255,255,0.7); font-size:13px; padding-top:6px;">
          {{ breedingStore.pregnancyCount }} pregnant
        </div>
      </template>
    </PageHeader>

    <div class="page-content">

      <!-- ACTIVE PREGNANCIES -->
      <div class="section-title">Active Pregnancies</div>

      <div v-if="breedingStore.pregnanciesWithProgress.length" class="preg-list">
        <div class="breed-card card" v-for="p in breedingStore.pregnanciesWithProgress" :key="p.id">
          <div class="breed-header">
            <div class="breed-title">🐐 {{ p.goatName }}</div>
            <span :class="['tag', p.daysLeft <= 14 ? 'amber' : 'green']">{{ p.daysLeft }}d left</span>
          </div>

          <div class="breed-grid">
            <div class="breed-stat">
              <div class="bs-val">{{ p.mateDate }}</div>
              <div class="bs-label">Mated Date</div>
            </div>
            <div class="breed-stat">
              <div class="bs-val">{{ p.expectedBirth }}</div>
              <div class="bs-label">Expected Birth</div>
            </div>
            <div class="breed-stat">
              <div class="bs-val">{{ p.expectedKids }}</div>
              <div class="bs-label">Expected Kids</div>
            </div>
            <div class="breed-stat">
              <div class="bs-val">{{ Math.round(p.progress) }}%</div>
              <div class="bs-label">Progress</div>
            </div>
          </div>

          <div class="progress-track" style="height:8px; border-radius:4px; margin-top:14px;">
            <div
              class="progress-fill"
              :style="{ width: p.progress + '%', height:'8px', background: p.daysLeft <= 14 ? 'var(--amber)' : 'var(--green)' }"
            />
          </div>

          <div class="timeline">
            <div class="tl-row">
              <div class="tl-dot done" />
              <div class="tl-label">Mating recorded</div>
              <div class="tl-date">{{ p.mateDate }}</div>
            </div>
            <div class="tl-row">
              <div :class="['tl-dot', p.progress > 50 ? 'done' : 'pending']" />
              <div class="tl-label">Mid-term check (75 days)</div>
              <div class="tl-date">{{ p.midDate }}</div>
            </div>
            <div class="tl-row">
              <div class="tl-dot pending" />
              <div class="tl-label">Expected birth</div>
              <div class="tl-date">{{ p.expectedBirth }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-state-icon">🐐</div>
        <div class="empty-state-text">No active pregnancies.<br>Tap + to track a pregnancy.</div>
      </div>

      <!-- BIRTH RECORDS -->
      <div class="section-title" style="margin-top:24px;">📋 Birth Records</div>
      <div class="card" v-if="breedingStore.birthRecords.length">
        <div class="birth-item" v-for="b in breedingStore.birthRecords" :key="b.id">
          <div class="birth-icon">🐣</div>
          <div class="birth-info">
            <div class="birth-name">{{ b.goatName }} gave birth</div>
            <div class="birth-meta">{{ b.birthDate }} · {{ b.kidsCount }} kids ({{ b.maleKids }}♂ {{ b.femaleKids }}♀)</div>
          </div>
          <span class="tag green">Done ✓</span>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-state-icon">🐣</div>
        <div class="empty-state-text">No birth records yet.</div>
      </div>

    </div>

    <button class="fab" @click="ui.openModal('markPregnant')">+</button>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import { useBreedingStore } from '@/stores/breeding'
import { useUIStore }       from '@/stores/ui'

const breedingStore = useBreedingStore()
const ui            = useUIStore()
</script>

<style scoped>
.preg-list { display: flex; flex-direction: column; gap: 14px; }
.breed-card { padding: 18px; }
.breed-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.breed-title  { font-weight: 700; font-size: 16px; }

.breed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.breed-stat { background: var(--bg2); border-radius: 10px; padding: 12px; }
.bs-val     { font-size: 15px; font-weight: 700; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.bs-label   { font-size: 11px; color: var(--muted); margin-top: 4px; }

.timeline { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--bg2); display: flex; flex-direction: column; gap: 10px; }
.tl-row   { display: flex; align-items: center; gap: 10px; }
.tl-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tl-dot.done    { background: var(--green); }
.tl-dot.pending { border: 2px solid var(--muted); }
.tl-label { flex: 1; font-size: 12px; color: var(--muted); }
.tl-date  { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--text); }

.birth-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.birth-item:last-child { border-bottom: none; }
.birth-icon { font-size: 24px; }
.birth-info { flex: 1; }
.birth-name { font-weight: 600; font-size: 14px; }
.birth-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
</style>
