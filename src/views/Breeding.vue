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

        <!-- GOAT STATS ROW -->
        <div class="breed-stats-row" v-if="breedingStore.birthRecords.length">
          <div class="bsr-card card">
            <div class="bsr-val">{{ breedingStore.totalKidsBorn }}</div>
            <div class="bsr-label">Total Kids Born</div>
          </div>
          <div class="bsr-card card">
            <div class="bsr-val">{{ breedingStore.avgLitterSize }}</div>
            <div class="bsr-label">Avg Litter Size</div>
          </div>
          <div class="bsr-card card">
            <div class="bsr-val">{{ breedingStore.birthRecords.length }}</div>
            <div class="bsr-label">Births Recorded</div>
          </div>
        </div>

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
            <div
              class="preg-card card"
              v-for="p in breedingStore.pregnanciesWithProgress"
              :key="p.id"
            >
              <!-- HEADER -->
              <div class="pc-header">
                <div class="pc-left">
                  <div class="pc-icon-wrap" :class="p.urgency">🐐</div>
                  <div class="pc-info">
                    <div class="pc-name">{{ p.goatName }}</div>
                    <div class="pc-breed" v-if="p.motherBreed">
                      ♀ {{ p.motherBreed }}
                      <span v-if="p.fatherBreed"> × ♂ {{ p.fatherBreed }}</span>
                    </div>
                  </div>
                </div>
                <div class="pc-countdown" :class="p.urgency">
                  <div class="pc-days">
                    <span v-if="p.urgency === 'today'">TODAY</span>
                    <span v-else-if="p.daysLeft < 0">{{ Math.abs(p.daysLeft) }}d<br><span class="pc-overdue">overdue</span></span>
                    <span v-else>{{ p.daysLeft }}d</span>
                  </div>
                  <div class="pc-days-sub" v-if="p.urgency !== 'today' && p.daysLeft >= 0">left</div>
                </div>
              </div>

              <!-- PROGRESS BAR -->
              <div class="pc-progress-wrap">
                <div class="pc-progress-track">
                  <div class="pc-progress-fill" :style="{ width: p.progress + '%' }" :class="p.urgency" />
                </div>
                <div class="pc-progress-labels">
                  <span>Mated {{ p.mateDate }}</span>
                  <span class="pc-pct">{{ p.progress }}% gestation</span>
                  <span>Due {{ p.expectedBirth }}</span>
                </div>
              </div>

              <!-- TRIMESTER + DETAILS -->
              <div class="pc-meta-row">
                <div class="pc-meta-item">
                  <span class="pc-meta-icon">📅</span>
                  <span>{{ breedingStore.trimesterLabel(p.trimester) }}</span>
                </div>
                <div class="pc-meta-item" v-if="p.expectedKids">
                  <span class="pc-meta-icon">🐣</span>
                  <span>{{ p.expectedKids }} expected kid{{ p.expectedKids > 1 ? 's' : '' }}</span>
                </div>
                <div class="pc-meta-item" v-if="p.offspringBreed">
                  <span class="pc-meta-icon">🧬</span>
                  <span>{{ p.offspringBreed }}</span>
                </div>
              </div>

              <div class="pc-notes" v-if="p.notes">📝 {{ p.notes }}</div>

              <!-- ACTIONS -->
              <div class="pc-actions">
                <button class="pc-btn birth" @click="openBirth(p)">🐣 Record Birth</button>
                <button class="pc-btn edit"  @click="openEditPregnancy(p)">✏️</button>
                <button class="pc-btn del"   @click="confirmRemovePregnancy(p)">🗑️</button>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-state-icon">🐐</div>
            <div class="empty-state-text">No active pregnancies.<br>Tap + to track a pregnancy.</div>
          </div>
        </template>

        <!-- BIRTH RECORDS -->
        <template v-if="goatSub === 'births'">
          <div v-if="breedingStore.birthRecords.length" class="births-list">
            <div class="birth-card card" v-for="b in breedingStore.birthRecords" :key="b.id">
              <div class="bc-top">
                <div class="bc-icon">🐣</div>
                <div class="bc-info">
                  <div class="bc-name">{{ b.goatName }}</div>
                  <div class="bc-meta">{{ b.birthDate }}</div>
                  <div class="bc-breed" v-if="b.offspringBreed">🧬 {{ b.offspringBreed }}</div>
                  <div class="bc-parents" v-if="b.motherBreed && b.fatherBreed">
                    ♀ {{ b.motherBreed }} × ♂ {{ b.fatherBreed }}
                  </div>
                </div>
                <div class="bc-kids-wrap">
                  <div class="bc-total-kids">{{ b.kidsCount }}</div>
                  <div class="bc-kids-label">kids</div>
                </div>
              </div>
              <div class="bc-kids">
                <div class="kid-pill male" v-if="b.maleKids > 0">♂ {{ b.maleKids }} male</div>
                <div class="kid-pill female" v-if="b.femaleKids > 0">♀ {{ b.femaleKids }} female</div>
                <div class="kid-pill total">{{ b.kidsCount }} total</div>
              </div>
              <div class="bc-notes" v-if="b.notes">📝 {{ b.notes }}</div>
              <button class="bc-del" @click="confirmRemoveBirth(b)">🗑️ Remove Record</button>
            </div>
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
              <!-- WEEKLY LAY RATE BAR -->
              <div class="lay-rate-bar" v-if="avgLayRateForBatch(b) > 0">
                <div class="lrb-track">
                  <div class="lrb-fill" :style="{ width: Math.min(100, avgLayRateForBatch(b)) + '%' }" />
                </div>
                <span class="lrb-label">{{ avgLayRateForBatch(b) }}% lay rate</span>
              </div>
            </div>
          </div>

          <button class="log-eggs-btn" @click="ui.openModal('logEggs')">🥚 Log Today's Eggs</button>

          <div class="section-title" style="margin-top:20px;">
            All Egg Records
            <span class="total-eggs-badge">{{ animalStore.totalEggsProduced }} total</span>
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
              <button class="ei-del" @click="animalStore.removeEggRecord(r.id)" title="Delete">×</button>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-state-icon">🥚</div>
            <div class="empty-state-text">No egg records yet.<br>Tap "Log Today's Eggs" to start.</div>
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
              <div class="hs-val"
                :style="{ color: overallHatchRate >= 70 ? 'var(--green)' : overallHatchRate >= 40 ? 'var(--amber)' : 'var(--red)' }">
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
                  <div class="hc-rate"
                    :style="{ color: hatchRateOf(h) >= 70 ? 'var(--green)' : hatchRateOf(h) >= 40 ? 'var(--amber)' : 'var(--red)' }">
                    {{ hatchRateOf(h) }}%
                  </div>
                  <div class="hc-rate-label">hatch rate</div>
                </div>
              </div>
              <div class="hc-stats">
                <div class="hc-stat"><span>🥚</span><span>{{ h.eggsSet }} set</span></div>
                <span class="hcs-arrow">→</span>
                <div class="hc-stat success"><span>🐥</span><span>{{ h.hatched }} hatched</span></div>
                <div class="hc-stat fail" v-if="h.failedToHatch > 0"><span>❌</span><span>{{ h.failedToHatch }} failed</span></div>
              </div>
              <div class="hc-notes" v-if="h.notes">{{ h.notes }}</div>
              <button class="hc-del" @click="animalStore.removeHatchRecord(h.id)">🗑️ Remove</button>
            </div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-state-icon">🐥</div>
            <div class="empty-state-text">No hatch records yet.</div>
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
          <div class="form-group" style="margin-top:4px;">
            <label class="form-label">Notes <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="birthForm.notes" placeholder="e.g. healthy, stillborn, etc." />
          </div>
          <!-- Add to batch option -->
          <div class="add-batch-toggle" v-if="birthTarget.batchId">
            <label class="toggle-label">
              <input type="checkbox" v-model="birthForm.addToAnimalBatch" />
              <span>Add {{ birthForm.maleKids + birthForm.femaleKids }} kids to animal batch count</span>
            </label>
          </div>
          <div class="total-kids-row" v-if="birthForm.maleKids + birthForm.femaleKids > 0">
            🐐 {{ birthForm.maleKids + birthForm.femaleKids }} kid{{ birthForm.maleKids + birthForm.femaleKids > 1 ? 's' : '' }} born
          </div>
          <button class="btn-full" @click="doBirth" :disabled="birthSaving || birthForm.maleKids + birthForm.femaleKids === 0">
            {{ birthSaving ? 'Saving…' : 'Confirm Birth' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- EDIT PREGNANCY MODAL -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="editPregnancyTarget" @click.self="editPregnancyTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <h2 class="modal-title">✏️ Edit Pregnancy</h2>
          <div class="form-group">
            <label class="form-label">Goat Name</label>
            <input class="form-input" v-model="editPregForm.goatName" />
          </div>
          <div class="form-group">
            <label class="form-label">Expected Birth Date</label>
            <input class="form-input" type="date" v-model="editPregForm.expectedBirth" />
          </div>
          <div class="form-group">
            <label class="form-label">Expected Kids</label>
            <input class="form-input" type="number" v-model.number="editPregForm.expectedKids" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input" v-model="editPregForm.notes" />
          </div>
          <div class="edit-actions">
            <button class="btn-cancel" @click="editPregnancyTarget = null">Cancel</button>
            <button class="btn-save" @click="doEditPregnancy">Save</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- REMOVE PREGNANCY CONFIRM -->
    <Transition name="confirm">
      <div class="overlay confirm-overlay" v-if="removePregnancyTarget" @click.self="removePregnancyTarget = null">
        <div class="confirm-box">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-title">Remove Pregnancy?</div>
          <div class="confirm-msg">
            Remove pregnancy tracking for <strong>{{ removePregnancyTarget?.goatName }}</strong>?
            This cannot be undone.
          </div>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="removePregnancyTarget = null">Cancel</button>
            <button class="btn-delete" @click="doRemovePregnancy">Remove</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- REMOVE BIRTH RECORD CONFIRM -->
    <Transition name="confirm">
      <div class="overlay confirm-overlay" v-if="removeBirthTarget" @click.self="removeBirthTarget = null">
        <div class="confirm-box">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-title">Delete Birth Record?</div>
          <div class="confirm-msg">
            Remove birth record for <strong>{{ removeBirthTarget?.goatName }}</strong>
            ({{ removeBirthTarget?.kidsCount }} kids on {{ removeBirthTarget?.birthDate }})? This cannot be undone.
          </div>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="removeBirthTarget = null">Cancel</button>
            <button class="btn-delete" @click="doRemoveBirth">Delete</button>
          </div>
        </div>
      </div>
    </Transition>

    <button class="fab" @click="onFab">+</button>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader    from '@/components/PageHeader.vue'
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

// ── BIRTH MODAL ──────────────────────────────────────────────────────────────
const birthTarget = ref(null)
const birthSaving = ref(false)
const birthForm   = reactive({
  birthDate: today, maleKids: 0, femaleKids: 0,
  notes: '', addToAnimalBatch: false,
})

function openBirth(pregnancy) {
  birthTarget.value = pregnancy
  Object.assign(birthForm, {
    birthDate: today, maleKids: 0, femaleKids: 0,
    notes: '', addToAnimalBatch: !!pregnancy.batchId,
  })
}

async function doBirth() {
  const total = birthForm.maleKids + birthForm.femaleKids
  if (!total || birthSaving.value) return
  birthSaving.value = true
  try {
    await breedingStore.recordBirth({
      pregnancyId:      birthTarget.value.id,
      birthDate:        birthForm.birthDate,
      maleKids:         birthForm.maleKids,
      femaleKids:       birthForm.femaleKids,
      offspringBreed:   birthTarget.value.offspringBreed || '',
      notes:            birthForm.notes,
      addToAnimalBatch: birthForm.addToAnimalBatch,
    })
    ui.showToast(`🐣 ${total} kid${total > 1 ? 's' : ''} born!`)
    birthTarget.value = null
  } finally {
    birthSaving.value = false
  }
}

// ── EDIT PREGNANCY ───────────────────────────────────────────────────────────
const editPregnancyTarget = ref(null)
const editPregForm = reactive({ goatName: '', expectedBirth: '', expectedKids: 1, notes: '' })

function openEditPregnancy(p) {
  editPregnancyTarget.value = p
  Object.assign(editPregForm, {
    goatName: p.goatName, expectedBirth: p.expectedBirth,
    expectedKids: p.expectedKids, notes: p.notes || '',
  })
}

async function doEditPregnancy() {
  await breedingStore.updatePregnancy(editPregnancyTarget.value.id, { ...editPregForm })
  ui.showToast('✅ Updated!')
  editPregnancyTarget.value = null
}

// ── REMOVE PREGNANCY ─────────────────────────────────────────────────────────
const removePregnancyTarget = ref(null)
function confirmRemovePregnancy(p) { removePregnancyTarget.value = p }
async function doRemovePregnancy() {
  await breedingStore.removePregnancy(removePregnancyTarget.value.id)
  ui.showToast('🗑️ Pregnancy removed')
  removePregnancyTarget.value = null
}

// ── REMOVE BIRTH RECORD ──────────────────────────────────────────────────────
const removeBirthTarget = ref(null)
function confirmRemoveBirth(b) { removeBirthTarget.value = b }
async function doRemoveBirth() {
  await breedingStore.removeBirthRecord(removeBirthTarget.value.id)
  ui.showToast('🗑️ Birth record removed')
  removeBirthTarget.value = null
}
</script>

<style scoped>
.header-pills { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; align-items: flex-end; }
.header-pill  { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px; background: rgba(255,255,255,0.15); color: #fff; }
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

/* BREED STATS */
.breed-stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.bsr-card { padding: 12px; text-align: center; }
.bsr-val  { font-size: 22px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.bsr-label { font-size: 10px; color: var(--muted); margin-top: 3px; }

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

/* PREGNANCY CARD */
.preg-list { display: flex; flex-direction: column; gap: 14px; }
.preg-card { padding: 16px; }

.pc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.pc-left   { display: flex; align-items: center; gap: 12px; flex: 1; }
.pc-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.pc-icon-wrap.normal   { background: var(--bg2); }
.pc-icon-wrap.soon     { background: var(--green-pale); }
.pc-icon-wrap.critical { background: var(--amber-pale); }
.pc-icon-wrap.today    { background: var(--amber-pale); }
.pc-icon-wrap.overdue  { background: var(--red-pale); }

.pc-info   { flex: 1; }
.pc-name   { font-weight: 700; font-size: 15px; }
.pc-breed  { font-size: 11px; color: var(--muted); margin-top: 3px; }

.pc-countdown { text-align: center; flex-shrink: 0; min-width: 50px; }
.pc-days {
  font-size: 20px; font-weight: 800; font-family: 'JetBrains Mono', monospace;
  line-height: 1.1;
}
.pc-countdown.normal   .pc-days { color: var(--muted); font-size: 14px; }
.pc-countdown.soon     .pc-days { color: var(--green); }
.pc-countdown.critical .pc-days { color: var(--amber); }
.pc-countdown.today    .pc-days { color: var(--amber); font-size: 12px; letter-spacing: -0.5px; }
.pc-countdown.overdue  .pc-days { color: var(--red); }
.pc-days-sub { font-size: 9px; color: var(--muted); margin-top: 2px; }
.pc-overdue { font-size: 9px; }

/* PROGRESS */
.pc-progress-wrap { margin-top: 14px; }
.pc-progress-track {
  height: 8px; background: var(--bg2); border-radius: 4px; overflow: hidden; margin-bottom: 6px;
}
.pc-progress-fill {
  height: 100%; border-radius: 4px; transition: width 0.6s ease;
}
.pc-progress-fill.normal   { background: var(--green); }
.pc-progress-fill.soon     { background: var(--green); }
.pc-progress-fill.critical { background: var(--amber); }
.pc-progress-fill.today    { background: var(--amber); }
.pc-progress-fill.overdue  { background: var(--red); width: 100% !important; }
.pc-progress-labels {
  display: flex; justify-content: space-between;
  font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace;
}
.pc-pct { font-weight: 700; color: var(--text); }

/* META ROW */
.pc-meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.pc-meta-item {
  display: flex; align-items: center; gap: 4px;
  background: var(--bg2); border-radius: 8px; padding: 5px 10px;
  font-size: 11px; color: var(--muted);
}
.pc-meta-icon { font-size: 12px; }
.pc-notes { font-size: 12px; color: var(--muted); margin-top: 8px; }

.pc-actions { display: flex; gap: 8px; margin-top: 14px; }
.pc-btn {
  padding: 9px 14px; border-radius: 10px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: 'Outfit', sans-serif; border: 1.5px solid; transition: all 0.15s;
}
.pc-btn:active { transform: scale(0.95); }
.pc-btn.birth { flex: 1; background: var(--green-pale); border-color: var(--green); color: var(--green); }
.pc-btn.edit  { background: var(--bg2); border-color: var(--border); color: var(--muted); padding: 9px 12px; }
.pc-btn.del   { background: var(--bg2); border-color: var(--border); color: var(--red); padding: 9px 12px; }

/* BIRTH RECORDS */
.births-list { display: flex; flex-direction: column; gap: 12px; }
.birth-card { padding: 16px; }
.bc-top  { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.bc-icon { font-size: 26px; flex-shrink: 0; }
.bc-info { flex: 1; }
.bc-name { font-weight: 700; font-size: 14px; }
.bc-meta { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
.bc-breed   { font-size: 11px; color: var(--purple); margin-top: 4px; }
.bc-parents { font-size: 10px; color: var(--muted); margin-top: 2px; }
.bc-kids-wrap { text-align: center; flex-shrink: 0; }
.bc-total-kids { font-size: 26px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1; color: var(--green); }
.bc-kids-label { font-size: 10px; color: var(--muted); }
.bc-kids { display: flex; gap: 6px; flex-wrap: wrap; }
.kid-pill { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
.kid-pill.male   { background: var(--blue-pale);   color: var(--blue); }
.kid-pill.female { background: var(--purple-pale);  color: var(--purple); }
.kid-pill.total  { background: var(--bg2); color: var(--muted); }
.bc-notes { font-size: 12px; color: var(--muted); margin-top: 8px; }
.bc-del {
  margin-top: 12px; padding: 7px 12px; border-radius: 8px;
  border: 1.5px solid var(--border); background: var(--bg2); color: var(--red);
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer;
}
.bc-del:active { background: var(--red); color: #fff; border-color: var(--red); }

/* EGGS */
.flock-egg-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.flock-egg-card { padding: 14px 16px; }
.fec-top   { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.fec-icon  { font-size: 24px; }
.fec-info  { flex: 1; }
.fec-name  { font-weight: 700; font-size: 14px; }
.fec-breed { font-size: 11px; color: var(--muted); margin-top: 2px; }
.fec-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.fec-stat  { background: var(--bg2); border-radius: 8px; padding: 10px; text-align: center; }
.fec-val   { font-size: 18px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.fec-label { font-size: 10px; color: var(--muted); margin-top: 3px; }

.lay-rate-bar { display: flex; align-items: center; gap: 8px; }
.lrb-track { flex: 1; background: var(--bg2); border-radius: 4px; height: 6px; overflow: hidden; }
.lrb-fill  { height: 100%; background: #1d6fa5; border-radius: 4px; transition: width 0.5s ease; }
.lrb-label { font-size: 10px; color: var(--muted); white-space: nowrap; flex-shrink: 0; }

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
}
.ei-del:active { background: var(--red-pale); color: var(--red); }

/* HATCH */
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
.hc-stats { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px 0; border-top: 1px solid var(--bg2); border-bottom: 1px solid var(--bg2); }
.hc-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--muted); }
.hc-stat.success { color: var(--green); }
.hc-stat.fail    { color: var(--red); }
.hcs-arrow { color: var(--border); font-size: 12px; }
.hc-notes { font-size: 12px; color: var(--muted); margin-top: 8px; }
.hc-del {
  margin-top: 10px; padding: 7px 12px; border-radius: 8px;
  border: 1.5px solid var(--border); background: var(--bg2); color: var(--muted);
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer;
}

/* OVERLAYS */
.overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.confirm-overlay { align-items: center; justify-content: center; padding: 24px; }
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
.add-batch-toggle {
  background: var(--bg2); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px;
}
.toggle-label {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; cursor: pointer;
}
.toggle-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--green); }
.total-kids-row {
  background: var(--green-pale); color: var(--green);
  border-radius: 10px; padding: 12px; text-align: center;
  font-size: 14px; font-weight: 700; margin-top: 4px; margin-bottom: 8px;
}
.optional { font-size: 11px; color: var(--muted); font-weight: 400; }
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

.confirm-box { background: var(--surface); border-radius: 20px; padding: 24px 20px; width: 100%; max-width: 320px; }
.confirm-icon  { font-size: 32px; text-align: center; margin-bottom: 8px; }
.confirm-title { font-size: 17px; font-weight: 700; text-align: center; margin-bottom: 6px; }
.confirm-msg   { font-size: 13px; color: var(--muted); text-align: center; margin-bottom: 16px; line-height: 1.6; }
.confirm-btns  { display: flex; gap: 10px; }
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
.btn-delete {
  flex: 2; padding: 11px; border-radius: 10px; border: none;
  background: var(--red); font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 700; color: #fff; cursor: pointer;
}
.edit-actions { display: flex; gap: 8px; margin-top: 8px; }

.modal-slide-enter-active, .modal-slide-leave-active { transition: all 0.25s ease; }
.modal-slide-enter-from .modal-sheet, .modal-slide-leave-to .modal-sheet { transform: translateY(100%); }
.modal-slide-enter-from, .modal-slide-leave-to { opacity: 0; }
.confirm-enter-active, .confirm-leave-active { transition: all 0.2s ease; }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-box, .confirm-leave-to .confirm-box { transform: scale(0.92); }
</style>