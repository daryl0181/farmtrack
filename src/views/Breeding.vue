<template>
  <div>
    <PageHeader greeting="Farm" title="Breeding & Eggs">
      <template #right>
        <div class="header-pills">
          <span class="header-pill goat">🐐 {{ breedingStore.pregnancyCount }} pregnant</span>
          <span class="header-pill duck">🥚 {{ animalStore.totalEggsProduced }} eggs</span>
        </div>
      </template>
      <div class="header-stats cols-4">
        <div class="header-stat">
          <div class="header-stat-val">{{ breedingStore.pregnancyCount }}</div>
          <div class="header-stat-label">Pregnant</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val">{{ breedingStore.birthRecords.length }}</div>
          <div class="header-stat-label">Births</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val">{{ animalStore.totalEggsProduced }}</div>
          <div class="header-stat-label">Eggs</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val">{{ animalStore.totalHatched }}</div>
          <div class="header-stat-label">Hatched</div>
        </div>
      </div>
    </PageHeader>

    <div class="page-content">

      <!-- MAIN TABS -->
      <div class="main-tabs">
        <button :class="['main-tab', activeTab === 'goats' ? 'active' : '']" @click="activeTab = 'goats'">
          🐐 Goats
        </button>
        <button :class="['main-tab', activeTab === 'ducks' ? 'active' : '']" @click="activeTab = 'ducks'">
          🦆 Ducks
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- GOATS TAB                                                   -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'goats'">

        <div class="sub-tabs">
          <button :class="['sub-tab', goatSub === 'pregnancies' ? 'active' : '']" @click="goatSub = 'pregnancies'">
            Pregnancies
            <span class="sub-count" v-if="breedingStore.pregnanciesWithProgress.length">
              {{ breedingStore.pregnanciesWithProgress.length }}
            </span>
          </button>
          <button :class="['sub-tab', goatSub === 'births' ? 'active' : '']" @click="goatSub = 'births'">
            Birth Records
            <span class="sub-count" v-if="breedingStore.birthRecords.length">
              {{ breedingStore.birthRecords.length }}
            </span>
          </button>
        </div>

        <!-- PREGNANCIES -->
        <template v-if="goatSub === 'pregnancies'">
          <div v-if="breedingStore.pregnanciesWithProgress.length" class="preg-list">
            <PregnancyItem
              v-for="p in breedingStore.pregnanciesWithProgress"
              :key="p.id"
              :pregnancy="p"
              @record-birth="openBirth"
            />
          </div>
          <div class="empty-state" v-else>
            <div class="empty-state-icon">🐐</div>
            <div class="empty-state-text">No active pregnancies.<br>Tap + to track a pregnancy.</div>
          </div>
        </template>

        <!-- BIRTH RECORDS -->
        <template v-if="goatSub === 'births'">
          <div v-if="breedingStore.birthRecords.length" class="births-list">
            <BirthRecordCard
              v-for="b in breedingStore.birthRecords"
              :key="b.id"
              :record="b"
            />
          </div>
          <div class="empty-state" v-else>
            <div class="empty-state-icon">🐣</div>
            <div class="empty-state-text">No birth records yet.</div>
          </div>
        </template>

      </template>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- DUCKS TAB                                                   -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'ducks'">

        <div class="sub-tabs">
          <button :class="['sub-tab', duckSub === 'eggs' ? 'active' : '']" @click="duckSub = 'eggs'">
            🥚 Eggs
            <span class="sub-count" v-if="animalStore.eggRecords.length">{{ animalStore.eggRecords.length }}</span>
          </button>
          <button :class="['sub-tab', duckSub === 'hatch' ? 'active' : '']" @click="duckSub = 'hatch'">
            🐥 Hatch & Chicks
            <span class="sub-count" v-if="animalStore.hatchRecords.length">{{ animalStore.hatchRecords.length }}</span>
          </button>
        </div>

        <!-- EGGS -->
        <template v-if="duckSub === 'eggs'">
          <div class="section-title">Egg Production by Flock</div>
          <div class="flock-egg-grid" v-if="animalStore.duckBatches.length">
            <div class="flock-egg-card card" v-for="b in animalStore.duckBatches" :key="b.id">
              <div class="fec-top">
                <div class="fec-icon">🦆</div>
                <div class="fec-info">
                  <div class="fec-name">{{ b.label || 'Duck Batch' }}</div>
                  <div class="fec-breed">{{ b.breed || 'Native' }} · {{ b.currentCount }} ducks</div>
                </div>
              </div>
              <div class="fec-stats">
                <div class="fec-stat">
                  <div class="fec-val">{{ animalStore.eggsByBatch[b.id] || 0 }}</div>
                  <div class="fec-label">Total Eggs</div>
                </div>
                <div class="fec-stat">
                  <div class="fec-val">{{ avgLayRateForBatch(b) }}%</div>
                  <div class="fec-label">Avg Lay Rate</div>
                </div>
                <div class="fec-stat">
                  <div class="fec-val">{{ lastEggDateForBatch(b.id) }}</div>
                  <div class="fec-label">Last Logged</div>
                </div>
              </div>
            </div>
          </div>

          <button class="log-eggs-btn" @click="ui.openModal('logEggs')">🥚 Log Today's Eggs</button>

          <div class="section-title" style="margin-top:20px;">
            All Egg Records
            <span class="total-eggs-badge">{{ animalStore.totalEggsProduced }} total eggs</span>
          </div>
          <div class="egg-list" v-if="animalStore.eggRecords.length">
            <div class="egg-item card" v-for="r in animalStore.eggRecords" :key="r.id">
              <div class="ei-icon">🥚</div>
              <div class="ei-info">
                <div class="ei-flock">{{ flockLabel(r.batchId) }}</div>
                <div class="ei-date">{{ r.date }}</div>
                <div class="ei-notes" v-if="r.notes">{{ r.notes }}</div>
              </div>
              <div class="ei-right">
                <div class="ei-count">{{ r.eggsCollected }}</div>
                <div class="ei-label">eggs</div>
              </div>
              <button class="ei-del" @click="animalStore.removeEggRecord(r.id)">×</button>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-state-icon">🥚</div>
            <div class="empty-state-text">No egg records yet.<br>Tap "Log Today's Eggs" to start tracking.</div>
          </div>
        </template>

        <!-- HATCH -->
        <template v-if="duckSub === 'hatch'">
          <div class="hatch-summary-grid">
            <div class="hatch-sum-card card">
              <div class="hs-val">{{ totalEggsSet }}</div>
              <div class="hs-label">Eggs Set</div>
            </div>
            <div class="hatch-sum-card card">
              <div class="hs-val" style="color:var(--green);">{{ animalStore.totalHatched }}</div>
              <div class="hs-label">Hatched</div>
            </div>
            <div class="hatch-sum-card card">
              <div class="hs-val" :style="{ color: overallHatchRate >= 70 ? 'var(--green)' : overallHatchRate >= 40 ? 'var(--amber)' : 'var(--red)' }">
                {{ overallHatchRate }}%
              </div>
              <div class="hs-label">Hatch Rate</div>
            </div>
          </div>

          <button class="log-eggs-btn green" @click="ui.openModal('logHatch')">🐥 Record a Hatch</button>

          <div class="section-title" style="margin-top:20px;">All Hatch Records</div>
          <div class="hatch-list" v-if="animalStore.hatchRecords.length">
            <div class="hatch-card card" v-for="h in animalStore.hatchRecords" :key="h.id">
              <div class="hc-top">
                <div class="hc-icon">🐥</div>
                <div class="hc-info">
                  <div class="hc-flock">{{ flockLabel(h.batchId) }}</div>
                  <div class="hc-date">{{ h.hatchDate }}</div>
                  <div class="hc-breed" v-if="h.offspringBreed">🧬 {{ h.offspringBreed }}</div>
                  <div class="hc-parents" v-if="h.fatherBreed && h.motherBreed">
                    ♀ {{ h.motherBreed }} × ♂ {{ h.fatherBreed }}
                  </div>
                </div>
                <div class="hc-rate-wrap">
                  <div class="hc-rate" :style="{ color: hatchRateOf(h) >= 70 ? 'var(--green)' : hatchRateOf(h) >= 40 ? 'var(--amber)' : 'var(--red)' }">
                    {{ hatchRateOf(h) }}%
                  </div>
                  <div class="hc-rate-label">hatch rate</div>
                </div>
              </div>
              <div class="hc-stats">
                <div class="hc-stat"><span class="hcs-icon">🥚</span><span>{{ h.eggsSet }} set</span></div>
                <span class="hcs-arrow">→</span>
                <div class="hc-stat success"><span class="hcs-icon">🐥</span><span>{{ h.hatched }} hatched</span></div>
                <div class="hc-stat fail" v-if="h.failedToHatch > 0"><span class="hcs-icon">❌</span><span>{{ h.failedToHatch }} failed</span></div>
              </div>
              <div class="hc-notes" v-if="h.notes">{{ h.notes }}</div>
              <button class="hc-del" @click="animalStore.removeHatchRecord(h.id)">🗑️ Remove</button>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-state-icon">🐥</div>
            <div class="empty-state-text">No hatch records yet.<br>Tap "Record a Hatch" to log chicks.</div>
          </div>
        </template>

      </template>
    </div>

    <!-- RECORD BIRTH MODAL -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="birthTarget" @click.self="birthTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <h2 class="modal-title">🐣 Record Birth</h2>
          <div class="modal-info-row">
            <span>🐐 {{ birthTarget.goatName }}</span>
            <span>{{ birthTarget.expectedKids }} expected</span>
          </div>
          <div class="form-group">
            <label class="form-label">Birth Date</label>
            <input class="form-input" type="date" v-model="birthForm.birthDate" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">♂ Male Kids</label>
              <div class="qty-row">
                <button class="qty-btn" @click="birthForm.maleKids = Math.max(0, birthForm.maleKids - 1)">−</button>
                <input class="form-input qty-input" type="number" v-model.number="birthForm.maleKids" min="0" />
                <button class="qty-btn" @click="birthForm.maleKids++">+</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">♀ Female Kids</label>
              <div class="qty-row">
                <button class="qty-btn" @click="birthForm.femaleKids = Math.max(0, birthForm.femaleKids - 1)">−</button>
                <input class="form-input qty-input" type="number" v-model.number="birthForm.femaleKids" min="0" />
                <button class="qty-btn" @click="birthForm.femaleKids++">+</button>
              </div>
            </div>
          </div>
          <div class="offspring-preview" v-if="birthTarget.offspringBreed">
            🧬 These kids will be: <strong>{{ birthTarget.offspringBreed }}</strong>
          </div>
          <div class="total-kids-row" v-if="birthForm.maleKids + birthForm.femaleKids > 0">
            🐐 {{ birthForm.maleKids + birthForm.femaleKids }} kid{{ birthForm.maleKids + birthForm.femaleKids > 1 ? 's' : '' }} born
          </div>
          <button class="btn-full" @click="doBirth" :disabled="birthForm.maleKids + birthForm.femaleKids === 0">
            Confirm Birth
          </button>
        </div>
      </div>
    </Transition>

    <button class="fab" @click="onFab">+</button>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader    from '@/components/PageHeader.vue'
import PregnancyItem    from '@/components/PregnancyCard.vue'
import BirthRecordCard from '@/components/BirthRecordCard.vue'
import { useBreedingStore } from '@/stores/breeding'
import { useAnimalStore }   from '@/stores/animals'
import { useUIStore }       from '@/stores/ui'

const breedingStore = useBreedingStore()
const animalStore   = useAnimalStore()
const ui            = useUIStore()
const today         = new Date().toISOString().slice(0, 10)

const activeTab = ref('goats')
const goatSub   = ref('pregnancies')
const duckSub   = ref('eggs')

function onFab() {
  if (activeTab.value === 'goats') {
    ui.openModal('markPregnant')
  } else if (duckSub.value === 'eggs') {
    ui.openModal('logEggs')
  } else {
    ui.openModal('logHatch')
  }
}

function flockLabel(batchId) {
  const b = animalStore.duckBatches.find(b => b.id === batchId)
  return b ? (b.label || (b.breed || 'Duck') + ' Flock') : 'Unknown Flock'
}

function hatchRateOf(h) {
  if (!h.eggsSet) return 0
  return Math.round((h.hatched / h.eggsSet) * 100)
}

function eggRecordsForBatch(batchId) {
  return animalStore.eggRecords.filter(r => r.batchId === batchId)
}

function avgLayRateForBatch(batch) {
  const recs = eggRecordsForBatch(batch.id)
  if (!recs.length || !batch.currentCount) return 0
  const avg = recs.reduce((s, r) => s + r.eggsCollected, 0) / recs.length
  return Math.min(100, Math.round((avg / batch.currentCount) * 100))
}

function lastEggDateForBatch(batchId) {
  const recs = eggRecordsForBatch(batchId)
  if (!recs.length) return '—'
  return recs[0].date
}

const totalEggsSet = computed(() =>
  animalStore.hatchRecords.reduce((s, h) => s + (h.eggsSet || 0), 0)
)
const overallHatchRate = computed(() => {
  if (!totalEggsSet.value) return 0
  return Math.round((animalStore.totalHatched / totalEggsSet.value) * 100)
})

// Birth modal — opened by PregnancyItem emitting 'record-birth'
const birthTarget = ref(null)
const birthForm   = reactive({ birthDate: today, maleKids: 0, femaleKids: 0 })

function openBirth(pregnancy) {
  birthTarget.value = pregnancy
  Object.assign(birthForm, { birthDate: today, maleKids: 0, femaleKids: 0 })
}

async function doBirth() {
  const total = birthForm.maleKids + birthForm.femaleKids
  if (!total) return
  await breedingStore.recordBirth({
    pregnancyId:    birthTarget.value.id,
    birthDate:      birthForm.birthDate,
    maleKids:       birthForm.maleKids,
    femaleKids:     birthForm.femaleKids,
    offspringBreed: birthTarget.value.offspringBreed || '',
  })
  ui.showToast(`🐣 ${total} kid${total > 1 ? 's' : ''} born!`)
  birthTarget.value = null
}
</script>

<style scoped>
.header-pills { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; align-items: flex-end; }
.header-pill  { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px; }
.header-pill.goat { background: rgba(255,255,255,0.15); color: #fff; }
.header-pill.duck { background: rgba(255,255,255,0.15); color: #fff; }
.cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
.cols-4 .header-stat-val   { font-size: 16px; }
.cols-4 .header-stat-label { font-size: 9px; }

.main-tabs {
  display: flex; background: var(--bg2); border-radius: 14px;
  padding: 4px; gap: 4px; margin-bottom: 16px;
}
.main-tab {
  flex: 1; padding: 11px; border-radius: 11px; border: none;
  font-size: 14px; font-weight: 700;
  font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.15s;
  background: none; color: var(--muted);
}
.main-tab.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }

.sub-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
.sub-tab {
  flex: 1; padding: 9px 12px; border-radius: 10px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: 'Outfit', sans-serif; transition: all 0.15s;
  background: var(--bg2); color: var(--muted);
  display: flex; align-items: center; justify-content: center; gap: 5px;
}
.sub-tab.active { background: var(--green); color: #fff; }
.sub-count { background: rgba(255,255,255,0.25); border-radius: 8px; font-size: 10px; font-weight: 700; padding: 1px 5px; }
.sub-tab:not(.active) .sub-count { background: var(--border); color: var(--muted); }

.preg-list   { display: flex; flex-direction: column; gap: 12px; }
.births-list { display: flex; flex-direction: column; gap: 10px; }

.birth-card { padding: 16px; }
.bc-top  { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.bc-icon { font-size: 26px; }
.bc-info { flex: 1; }
.bc-name { font-weight: 700; font-size: 14px; }
.bc-meta { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
.bc-breed { font-size: 11px; color: var(--purple); margin-top: 3px; }
.bc-kids { display: flex; gap: 6px; }
.kid-pill { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
.kid-pill.male   { background: var(--blue-pale);   color: var(--blue); }
.kid-pill.female { background: var(--purple-pale);  color: var(--purple); }
.kid-pill.total  { background: var(--bg2); color: var(--muted); }

.flock-egg-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.flock-egg-card { padding: 14px 16px; }
.fec-top   { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.fec-icon  { font-size: 24px; }
.fec-info  { flex: 1; }
.fec-name  { font-weight: 700; font-size: 14px; }
.fec-breed { font-size: 11px; color: var(--muted); margin-top: 2px; }
.fec-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.fec-stat  { background: var(--bg2); border-radius: 8px; padding: 10px; text-align: center; }
.fec-val   { font-size: 18px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.fec-label { font-size: 10px; color: var(--muted); margin-top: 3px; }

.log-eggs-btn {
  width: 100%; padding: 13px; border-radius: 12px; border: none;
  background: #1d6fa5; color: #fff;
  font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
  cursor: pointer; margin-bottom: 4px; transition: opacity 0.15s;
}
.log-eggs-btn.green { background: var(--green); }
.log-eggs-btn:active { opacity: 0.85; }

.total-eggs-badge {
  font-size: 11px; color: var(--green); font-weight: 500;
  background: var(--green-pale); padding: 3px 8px; border-radius: 8px; margin-left: 4px;
}

.egg-list { display: flex; flex-direction: column; gap: 8px; }
.egg-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
.ei-icon  { font-size: 22px; flex-shrink: 0; }
.ei-info  { flex: 1; }
.ei-flock { font-weight: 600; font-size: 14px; }
.ei-date  { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
.ei-notes { font-size: 11px; color: var(--muted); margin-top: 2px; }
.ei-right { text-align: right; flex-shrink: 0; }
.ei-count { font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--text); line-height: 1; }
.ei-label { font-size: 10px; color: var(--muted); }
.ei-del {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border);
  background: transparent; font-size: 16px; color: var(--muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ei-del:active { background: var(--red-pale); color: var(--red); }

.bc-del {
  margin-top: 10px; padding: 7px 12px; border-radius: 8px;
  border: 1.5px solid var(--border); background: var(--bg2); color: var(--red);
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.bc-del:active { background: var(--red); color: #fff; border-color: var(--red); }

.hatch-summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.hatch-sum-card { padding: 14px; text-align: center; }
.hs-val   { font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
.hs-label { font-size: 10px; color: var(--muted); margin-top: 4px; }

.hatch-list { display: flex; flex-direction: column; gap: 12px; }
.hatch-card { padding: 16px; }
.hc-top  { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.hc-icon { font-size: 28px; flex-shrink: 0; }
.hc-info { flex: 1; }
.hc-flock   { font-weight: 700; font-size: 14px; }
.hc-date    { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
.hc-breed   { font-size: 11px; color: var(--purple); margin-top: 4px; font-weight: 500; }
.hc-parents { font-size: 10px; color: var(--muted); margin-top: 2px; }
.hc-rate-wrap { text-align: center; flex-shrink: 0; min-width: 52px; }
.hc-rate { font-size: 22px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.hc-rate-label { font-size: 9px; color: var(--muted); margin-top: 2px; }
.hc-stats {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 0; border-top: 1px solid var(--bg2); border-bottom: 1px solid var(--bg2);
}
.hc-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--muted); }
.hc-stat.success { color: var(--green); }
.hc-stat.fail    { color: var(--red); }
.hcs-icon  { font-size: 14px; }
.hcs-arrow { color: var(--border); font-size: 12px; }
.hc-notes { font-size: 12px; color: var(--muted); margin-top: 8px; }
.hc-del {
  margin-top: 10px; padding: 7px 12px; border-radius: 8px;
  border: 1.5px solid var(--border); background: var(--bg2); color: var(--muted);
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer;
}

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
.modal-info-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--muted);
  background: var(--bg2); border-radius: 8px; padding: 8px 12px; margin-bottom: 14px;
}
.offspring-preview {
  background: var(--purple-pale); border-radius: 10px; padding: 10px 12px;
  font-size: 12px; color: var(--purple); margin-bottom: 12px;
}
.total-kids-row {
  background: var(--green-pale); color: var(--green);
  border-radius: 10px; padding: 12px; text-align: center;
  font-size: 14px; font-weight: 700; margin-top: 4px; margin-bottom: 8px;
}
.qty-row { display: flex; align-items: center; gap: 8px; }
.qty-btn {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-size: 20px; font-weight: 700; color: var(--text);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.qty-input { text-align: center; font-size: 18px !important; font-weight: 700 !important; }
.btn-full {
  width: 100%; padding: 14px; border-radius: 12px; border: none;
  background: var(--green); color: #fff; font-family: 'Outfit', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer;
}
.btn-full:disabled { opacity: 0.45; cursor: default; }
.modal-slide-enter-active, .modal-slide-leave-active { transition: all 0.25s ease; }
.modal-slide-enter-from .modal-sheet, .modal-slide-leave-to .modal-sheet { transform: translateY(100%); }
.modal-slide-enter-from, .modal-slide-leave-to { opacity: 0; }
</style>