<template>
  <div>
    <PageHeader greeting="Manage" title="All Animals">
      <template #right>
        <div class="header-counts">
          <span>🐐 {{ animalStore.totalGoats }}</span>
          <span>🦆 {{ animalStore.totalDucks }}</span>
        </div>
      </template>
      <div class="header-stats cols-3">
        <div class="header-stat">
          <div class="header-stat-val">{{ animalStore.totalAnimals }}</div>
          <div class="header-stat-label">Total Live</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val" style="color:#f8a09d;">
            ₱{{ formatNum(animalStore.totalAnimalCosts) }}
          </div>
          <div class="header-stat-label">Total Cost</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val" style="color:#7ee787;">
            {{ totalSold }}
          </div>
          <div class="header-stat-label">Total Sold</div>
        </div>
      </div>
    </PageHeader>

    <div class="page-content">

      <!-- FILTER TABS -->
      <div class="filter-bar">
        <button
          v-for="f in filters" :key="f.key"
          :class="['filter-chip', activeFilter === f.key ? 'active' : '']"
          @click="activeFilter = f.key"
        >{{ f.label }}</button>
      </div>

      <!-- ── BATCHES LIST ── -->
      <template v-if="activeFilter !== 'flagged' && activeFilter !== 'sold'">
        <div v-if="filteredBatches.length" class="batch-list">
          <div
            class="batch-card card"
            v-for="batch in filteredBatches"
            :key="batch.id"
          >
            <!-- BATCH HEADER -->
            <div class="batch-header" @click="toggleExpand(batch.id)">
              <div class="batch-left">
                <span class="batch-emoji">{{ animalStore.animalEmoji(batch.type) }}</span>
                <div class="batch-title-group">
                  <div class="batch-label">{{ batch.label || batch.type }}</div>
                  <div class="batch-meta">
                    {{ animalStore.batchSexLabel(batch.sex) }} ·
                    Added {{ batch.addedDate }}
                  </div>
                </div>
              </div>
              <div class="batch-right">
                <div class="batch-count">{{ batch.currentCount }}</div>
                <div class="batch-count-label">alive</div>
              </div>
            </div>

            <!-- BATCH STATS ROW -->
            <div class="batch-stats">
              <div class="bs-pill">
                <span class="bs-icon">💰</span>
                <span>₱{{ formatNum(batch.pricePerHead) }}/head</span>
              </div>
              <div class="bs-pill" v-if="batch.breed">
                <span class="bs-icon">{{ batch.type === 'Goat' ? '🐐' : '🦆' }}</span>
                <span>{{ batch.breed }}</span>
              </div>
              <div class="bs-pill" v-if="batch.totalSold">
                <span class="bs-icon">💸</span>
                <span>{{ batch.totalSold }} sold</span>
              </div>
              <div class="bs-pill" v-if="batch.totalDied">
                <span class="bs-icon">💀</span>
                <span>{{ batch.totalDied }} died</span>
              </div>
              <span :class="['tag', animalStore.healthTagColor(batch.health)]">
                {{ batch.health }}
              </span>
            </div>

            <!-- TOTAL COST BAR -->
            <div class="cost-row">
              <span class="cost-label">Total cost</span>
              <span class="cost-val">₱{{ formatNum(batch.pricePerHead * batch.originalCount) }}</span>
            </div>

            <!-- FLAGGED INDIVIDUALS (goat batches only) -->
            <div
              class="flagged-strip"
              v-if="batch.type === 'Goat' && flaggedInBatch(batch.id).length"
            >
              <div class="flagged-title">🚩 Flagged individuals</div>
              <div class="flagged-list">
                <div
                  class="flagged-item"
                  v-for="f in flaggedInBatch(batch.id)"
                  :key="f.id"
                >
                  <span class="fi-name">{{ f.name }}</span>
                  <span :class="['tag', animalStore.healthTagColor(f.health)]" style="font-size:9px;">
                    {{ f.health }}
                  </span>
                  <button class="fi-remove" @click.stop="animalStore.removeFlagged(f.id)">×</button>
                </div>
              </div>
            </div>

            <!-- NOTES -->
            <div class="batch-notes" v-if="batch.notes">📝 {{ batch.notes }}</div>

            <!-- ACTION BUTTONS -->
            <div class="batch-actions">
              <button class="act-btn sell" @click="openSell(batch)">
                💰 Sell
              </button>
              <button class="act-btn death" @click="openDeath(batch)">
                💀 Death
              </button>
              <button
                class="act-btn flag"
                v-if="batch.type === 'Goat'"
                @click="openFlag(batch)"
              >
                🚩 Flag
              </button>
              <button class="act-btn edit" @click="openEdit(batch)">
                ✏️ Edit
              </button>
              <button class="act-btn delete" @click="confirmDelete(batch)">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <div class="empty-state-icon">{{ activeFilter === 'Goat' ? '🐐' : activeFilter === 'Duck' ? '🦆' : '🐾' }}</div>
          <div class="empty-state-text">No {{ activeFilter === 'All' ? '' : activeFilter }} batches yet.<br>Tap + to add animals.</div>
        </div>
      </template>

      <!-- ── FLAGGED INDIVIDUALS TAB ── -->
      <template v-if="activeFilter === 'flagged'">
        <div class="section-title">🚩 Flagged Goats</div>
        <div v-if="animalStore.flagged.length" class="flagged-full-list">
          <div class="flagged-card card" v-for="f in animalStore.flagged" :key="f.id">
            <div class="fc-top">
              <span class="fc-emoji">🐐</span>
              <div class="fc-info">
                <div class="fc-name">{{ f.name }}</div>
                <div class="fc-batch">{{ batchLabel(f.batchId) }}</div>
              </div>
              <span :class="['tag', animalStore.healthTagColor(f.health)]">{{ f.health }}</span>
            </div>
            <div class="fc-detail" v-if="f.notes">{{ f.notes }}</div>
            <div class="fc-date">Flagged: {{ f.flaggedDate }}</div>
            <div class="fc-actions">
              <button class="act-btn edit" @click="openEditFlagged(f)">✏️ Edit</button>
              <button class="act-btn delete" @click="animalStore.removeFlagged(f.id)">🗑️ Remove</button>
            </div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <div class="empty-state-icon">🚩</div>
          <div class="empty-state-text">No flagged individuals.<br>Flag pregnant or sick goats from a batch.</div>
        </div>
      </template>

      <!-- ── SOLD / SALES HISTORY TAB ── -->
      <template v-if="activeFilter === 'sold'">
        <div class="section-title">
          💰 All Sales
          <span class="section-hint">Tap 🔄 to undo a sale and restore animals</span>
        </div>

        <div v-if="animalStore.soldBatches.length" class="sold-full-list">
          <div class="sold-card card" v-for="s in animalStore.soldBatches" :key="s.id">
            <div class="sc-top">
              <span class="sc-emoji">{{ animalStore.animalEmoji(s.type) }}</span>
              <div class="sc-info">
                <div class="sc-label">{{ s.quantity }}× {{ s.batchLabel }}</div>
                <div class="sc-meta">
                  {{ s.soldDate }}{{ s.soldTo ? ' → ' + s.soldTo : '' }}
                  <span v-if="s.sexSold && s.sexSold !== 'Mixed'"> · {{ s.sexSold }} only</span>
                </div>
              </div>
              <div :class="['sc-profit', s.profit >= 0 ? 'pos' : 'neg']">
                {{ s.profit >= 0 ? '+' : '' }}₱{{ formatNum(s.profit) }}
              </div>
            </div>

            <div class="sc-prices">
              <span>Cost: ₱{{ formatNum(s.costBasis) }}</span>
              <span class="sc-arrow">→</span>
              <span>Revenue: ₱{{ formatNum(s.totalRevenue) }}</span>
              <span class="sc-pph">(₱{{ formatNum(s.pricePerHead) }}/head)</span>
            </div>

            <!-- UNDO BUTTON -->
            <div class="sc-actions">
              <button
                class="undo-btn"
                @click="openUndoConfirm(s)"
              >
                🔄 Undo Sale
              </button>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <div class="empty-state-icon">💰</div>
          <div class="empty-state-text">No sales yet.</div>
        </div>
      </template>

      <!-- SOLD MINI PREVIEW (on All tab) -->
      <template v-if="activeFilter === 'All' && animalStore.soldBatches.length">
        <div class="section-title" style="margin-top:8px;">
          Recent Sales
          <span class="section-link" @click="activeFilter = 'sold'">See all →</span>
        </div>
        <div class="sold-mini">
          <div class="sold-mini-item" v-for="s in animalStore.soldBatches.slice(0,3)" :key="s.id">
            <span class="sm-emoji">{{ animalStore.animalEmoji(s.type) }}</span>
            <div class="sm-info">
              <div class="sm-label">{{ s.quantity }}× {{ s.batchLabel }}</div>
              <div class="sm-date">{{ s.soldDate }}{{ s.soldTo ? ' → ' + s.soldTo : '' }}</div>
            </div>
            <div :class="['sm-profit', s.profit >= 0 ? 'pos' : 'neg']">
              {{ s.profit >= 0 ? '+' : '' }}₱{{ formatNum(s.profit) }}
            </div>
          </div>
        </div>
      </template>

    </div>

    <!-- ── SELL MODAL ── -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="sellTarget" @click.self="sellTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <div class="modal-title">💰 Sell from {{ sellTarget.label || sellTarget.type }}</div>

          <div class="modal-info-row">
            <span>{{ sellTarget.currentCount }} available</span>
            <span>₱{{ formatNum(sellTarget.pricePerHead) }}/head cost</span>
          </div>

          <div class="form-group" v-if="sellTarget.sex === 'Mixed'">
            <label class="form-label">Selling which sex?</label>
            <div class="seg-ctrl">
              <button
                v-for="s in ['Mixed','Male','Female']" :key="s"
                :class="['seg-btn', sellForm.sexSold === s ? 'active' : '']"
                @click="sellForm.sexSold = s"
              >{{ s === 'Mixed' ? '⚥ Both' : s === 'Male' ? '♂ Male' : '♀ Female' }}</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">How many to sell?</label>
            <div class="qty-row">
              <button class="qty-btn" @click="sellForm.quantity = Math.max(1, sellForm.quantity - 1)">−</button>
              <input class="form-input qty-input" type="number" v-model.number="sellForm.quantity" :max="sellTarget.currentCount" min="1" />
              <button class="qty-btn" @click="sellForm.quantity = Math.min(sellTarget.currentCount, sellForm.quantity + 1)">+</button>
            </div>
            <div class="qty-hint">Selling <strong>{{ sellForm.quantity }}</strong> of {{ sellTarget.currentCount }} — <strong>{{ sellTarget.currentCount - sellForm.quantity }}</strong> remaining</div>
          </div>

          <div class="form-group">
            <label class="form-label">Selling price</label>
            <div class="seg-ctrl">
              <button :class="['seg-btn', sellForm.priceMode === 'each' ? 'active' : '']" @click="sellForm.priceMode = 'each'">Per Head</button>
              <button :class="['seg-btn', sellForm.priceMode === 'total' ? 'active' : '']" @click="sellForm.priceMode = 'total'">Total Amount</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              {{ sellForm.priceMode === 'each' ? 'Price per head (₱)' : 'Total amount (₱)' }}
            </label>
            <input class="form-input" type="number" v-model.number="sellForm.price" placeholder="0" />
          </div>

          <div class="profit-preview" v-if="sellForm.price">
            <div class="pp-row">
              <span class="pp-label">Total Revenue</span>
              <span class="pp-val pos">₱{{ formatNum(sellRevenue) }}</span>
            </div>
            <div class="pp-row">
              <span class="pp-label">Cost Basis</span>
              <span class="pp-muted">₱{{ formatNum(sellCostBasis) }}</span>
            </div>
            <div class="pp-row total-row">
              <span class="pp-label" style="font-weight:700;">Profit / Loss</span>
              <span :class="['pp-val', sellProfit >= 0 ? 'pos' : 'neg']">
                {{ sellProfit >= 0 ? '+' : '' }}₱{{ formatNum(sellProfit) }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Sold To <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="sellForm.soldTo" placeholder="Buyer name" />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="sellForm.soldDate" />
          </div>

          <button class="btn-full" @click="doSell" :disabled="sellSaving || !sellForm.price">
            {{ sellSaving ? 'Saving…' : `Sell ${sellForm.quantity} ${sellTarget.type}${sellForm.quantity > 1 ? 's' : ''}` }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── DEATH MODAL ── -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="deathTarget" @click.self="deathTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <div class="modal-title">💀 Record Deaths</div>
          <div class="modal-info-row">
            <span>{{ deathTarget.label || deathTarget.type }}</span>
            <span>{{ deathTarget.currentCount }} alive</span>
          </div>

          <div class="form-group">
            <label class="form-label">How many died?</label>
            <div class="qty-row">
              <button class="qty-btn" @click="deathForm.quantity = Math.max(1, deathForm.quantity - 1)">−</button>
              <input class="form-input qty-input" type="number" v-model.number="deathForm.quantity" :max="deathTarget.currentCount" min="1" />
              <button class="qty-btn" @click="deathForm.quantity = Math.min(deathTarget.currentCount, deathForm.quantity + 1)">+</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Cause of Death</label>
            <select class="form-select" v-model="deathForm.cause">
              <option>Disease</option>
              <option>Injury</option>
              <option>Natural</option>
              <option>Unknown</option>
              <option>Predator Attack</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="deathForm.date" />
          </div>

          <button class="btn-full danger" @click="doDeath" :disabled="deathSaving">
            {{ deathSaving ? 'Saving…' : `Record ${deathForm.quantity} Death${deathForm.quantity > 1 ? 's' : ''}` }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── FLAG INDIVIDUAL MODAL ── -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="flagTarget" @click.self="flagTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <div class="modal-title">🚩 Flag Individual Goat</div>
          <div class="modal-info-row">
            <span>From: {{ flagTarget.label || 'Goat Batch' }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Name / Tag</label>
            <input class="form-input" v-model="flagForm.name" placeholder="e.g. Bella or Tag #5" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sex</label>
              <select class="form-select" v-model="flagForm.sex">
                <option>Female</option>
                <option>Male</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" v-model="flagForm.health">
                <option>Pregnant</option>
                <option>Sick</option>
                <option>Under Treatment</option>
                <option>For Breeding</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input" v-model="flagForm.notes" placeholder="e.g. mated March 1, due July 29" />
          </div>

          <button class="btn-full" @click="doFlag">Save Flag</button>
        </div>
      </div>
    </Transition>

    <!-- ── EDIT BATCH MODAL ── -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="editTarget" @click.self="editTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <div class="modal-title">✏️ Edit Batch</div>

          <div class="form-group">
            <label class="form-label">Batch Label</label>
            <input class="form-input" v-model="editForm.label" placeholder="e.g. Flock A, Batch 2" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" v-model="editForm.type">
                <option>Goat</option>
                <option>Duck</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Sex</label>
              <select class="form-select" v-model="editForm.sex">
                <option>Mixed</option>
                <option>Female</option>
                <option>Male</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Current Count</label>
              <input class="form-input" type="number" v-model.number="editForm.currentCount" />
            </div>
            <div class="form-group">
              <label class="form-label">Price/Head (₱)</label>
              <input class="form-input" type="number" v-model.number="editForm.pricePerHead" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Health Status</label>
            <select class="form-select" v-model="editForm.health">
              <option>Healthy</option>
              <option>Sick</option>
              <option>Under Treatment</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input" v-model="editForm.notes" placeholder="Optional..." />
          </div>
          <div class="edit-actions">
            <button class="btn-cancel" @click="editTarget = null">Cancel</button>
            <button class="btn-save" @click="doEdit">Save Changes</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── EDIT FLAGGED MODAL ── -->
    <Transition name="modal-slide">
      <div class="overlay" v-if="editFlaggedTarget" @click.self="editFlaggedTarget = null">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <div class="modal-title">✏️ Edit Flagged Goat</div>
          <div class="form-group">
            <label class="form-label">Name / Tag</label>
            <input class="form-input" v-model="editFlaggedForm.name" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sex</label>
              <select class="form-select" v-model="editFlaggedForm.sex">
                <option>Female</option><option>Male</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" v-model="editFlaggedForm.health">
                <option>Pregnant</option>
                <option>Sick</option>
                <option>Under Treatment</option>
                <option>For Breeding</option>
                <option>Healthy</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input" v-model="editFlaggedForm.notes" />
          </div>
          <div class="edit-actions">
            <button class="btn-cancel" @click="editFlaggedTarget = null">Cancel</button>
            <button class="btn-save" @click="doEditFlagged">Save</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── DELETE BATCH CONFIRM ── -->
    <Transition name="confirm">
      <div class="overlay confirm-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
        <div class="confirm-box">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-title">Delete Batch?</div>
          <div class="confirm-msg">
            Remove <strong>{{ deleteTarget.label || deleteTarget.type }}</strong> ({{ deleteTarget.currentCount }} animals) from records? This cannot be undone.
          </div>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button class="btn-delete" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── UNDO SALE CONFIRM ── -->
    <Transition name="confirm">
      <div class="overlay confirm-overlay" v-if="undoTarget" @click.self="undoTarget = null">
        <div class="confirm-box">
          <div class="confirm-icon">🔄</div>
          <div class="confirm-title">Undo This Sale?</div>
          <div class="confirm-msg">
            This will remove the sale of
            <strong>{{ undoTarget?.quantity }}× {{ undoTarget?.batchLabel }}</strong>
            and restore the animals back to the batch.
            <br><br>
            <span class="confirm-sub">
              Sold on {{ undoTarget?.soldDate }}
              {{ undoTarget?.soldTo ? '→ ' + undoTarget?.soldTo : '' }}
              · Revenue ₱{{ formatNum(undoTarget?.totalRevenue) }}
            </span>
          </div>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="undoTarget = null">Cancel</button>
            <button class="btn-delete" @click="doUndoSale" :disabled="undoSaving">
              {{ undoSaving ? 'Undoing…' : 'Undo Sale' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <button class="fab" @click="ui.openModal('addAnimal')">+</button>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAnimalStore } from '@/stores/animals'
import { useUIStore }     from '@/stores/ui'

const animalStore = useAnimalStore()
const ui          = useUIStore()
const today       = new Date().toISOString().slice(0, 10)

// ── FILTERS ───────────────────────────────────────────────────────────────────
const filters = [
  { key: 'All',     label: 'All' },
  { key: 'Goat',    label: '🐐 Goats' },
  { key: 'Duck',    label: '🦆 Ducks' },
  { key: 'flagged', label: '🚩 Flagged' },
  { key: 'sold',    label: '💰 Sales' },
]
const activeFilter = ref('All')

const filteredBatches = computed(() => {
  const active = (list) => list.filter((b) => (b.currentCount || 0) > 0)
  if (activeFilter.value === 'All')  return active(animalStore.batches)
  if (activeFilter.value === 'Goat') return active(animalStore.goatBatches)
  if (activeFilter.value === 'Duck') return active(animalStore.duckBatches)
  return []
})

const totalSold = computed(() =>
  animalStore.soldBatches.reduce((s, b) => s + (b.quantity || 0), 0)
)

function formatNum(n) {
  return Number(n || 0).toLocaleString('en-PH')
}

function flaggedInBatch(batchId) {
  return animalStore.flaggedByBatch[batchId] || []
}

function batchLabel(batchId) {
  const b = animalStore.batches.find(b => b.id === batchId)
  return b ? (b.label || b.type + ' Batch') : 'Unknown Batch'
}

function toggleExpand() {} // placeholder if you add expand later

// ── SELL ──────────────────────────────────────────────────────────────────────
const sellTarget = ref(null)
const sellSaving = ref(false)
const sellForm   = reactive({
  quantity: 1,
  priceMode: 'each',
  price: '',
  sexSold: 'Mixed',
  soldTo: '',
  soldDate: today,
})

const sellRevenue   = computed(() => {
  if (!sellForm.price) return 0
  return sellForm.priceMode === 'each'
    ? Number(sellForm.price) * sellForm.quantity
    : Number(sellForm.price)
})
const sellCostBasis = computed(() =>
  (sellTarget.value?.pricePerHead || 0) * sellForm.quantity
)
const sellProfit    = computed(() => sellRevenue.value - sellCostBasis.value)
const sellPPH       = computed(() =>
  sellForm.priceMode === 'each'
    ? Number(sellForm.price)
    : sellForm.quantity > 0 ? Number(sellForm.price) / sellForm.quantity : 0
)

function openSell(batch) {
  sellTarget.value = batch
  Object.assign(sellForm, {
    quantity: 1,
    priceMode: 'each',
    price: '',
    sexSold: batch.sex === 'Mixed' ? 'Mixed' : batch.sex,
    soldTo: '',
    soldDate: today,
  })
}

async function doSell() {
  if (!sellForm.price || sellSaving.value) return
  sellSaving.value = true
  try {
    await animalStore.sellFromBatch({
      batchId:      sellTarget.value.id,
      quantity:     sellForm.quantity,
      pricePerHead: sellPPH.value,
      soldTo:       sellForm.soldTo,
      soldDate:     sellForm.soldDate,
      sexSold:      sellForm.sexSold,
    })
    ui.showToast(`💰 ${sellForm.quantity} ${sellTarget.value.type}s sold!`)
    sellTarget.value = null
  } finally {
    sellSaving.value = false
  }
}

// ── DEATH ─────────────────────────────────────────────────────────────────────
const deathTarget = ref(null)
const deathSaving = ref(false)
const deathForm   = reactive({ quantity: 1, cause: 'Disease', date: today })

function openDeath(batch) {
  deathTarget.value = batch
  Object.assign(deathForm, { quantity: 1, cause: 'Disease', date: today })
}

async function doDeath() {
  if (deathSaving.value) return
  deathSaving.value = true
  try {
    await animalStore.recordDeaths({
      batchId:  deathTarget.value.id,
      quantity: deathForm.quantity,
      cause:    deathForm.cause,
      date:     deathForm.date,
    })
    ui.showToast(`🙏 ${deathForm.quantity} death${deathForm.quantity > 1 ? 's' : ''} recorded`)
    deathTarget.value = null
  } finally {
    deathSaving.value = false
  }
}

// ── FLAG ──────────────────────────────────────────────────────────────────────
const flagTarget = ref(null)
const flagForm   = reactive({ name: '', sex: 'Female', health: 'Pregnant', notes: '' })

function openFlag(batch) {
  flagTarget.value = batch
  Object.assign(flagForm, { name: '', sex: 'Female', health: 'Pregnant', notes: '' })
}

async function doFlag() {
  if (!flagForm.name.trim()) { ui.showToast('⚠️ Enter a name or tag'); return }
  await animalStore.flagIndividual({
    batchId: flagTarget.value.id,
    ...flagForm,
  })
  ui.showToast('🚩 Individual flagged!')
  flagTarget.value = null
}

// ── EDIT BATCH ─────────────────────────────────────────────────────────────────
const editTarget = ref(null)
const editForm   = reactive({ label: '', type: '', sex: '', currentCount: 0, pricePerHead: 0, health: '', notes: '' })

function openEdit(batch) {
  editTarget.value = batch
  Object.assign(editForm, {
    label: batch.label,
    type: batch.type,
    sex: batch.sex,
    currentCount: batch.currentCount,
    pricePerHead: batch.pricePerHead,
    health: batch.health,
    notes: batch.notes || '',
  })
}

async function doEdit() {
  await animalStore.updateBatch(editTarget.value.id, { ...editForm })
  ui.showToast('✅ Batch updated!')
  editTarget.value = null
}

// ── EDIT FLAGGED ───────────────────────────────────────────────────────────────
const editFlaggedTarget = ref(null)
const editFlaggedForm   = reactive({ name: '', sex: '', health: '', notes: '' })

function openEditFlagged(f) {
  editFlaggedTarget.value = f
  Object.assign(editFlaggedForm, { name: f.name, sex: f.sex, health: f.health, notes: f.notes || '' })
}

async function doEditFlagged() {
  await animalStore.updateFlagged(editFlaggedTarget.value.id, { ...editFlaggedForm })
  ui.showToast('✅ Updated!')
  editFlaggedTarget.value = null
}

// ── DELETE BATCH ──────────────────────────────────────────────────────────────
const deleteTarget = ref(null)
function confirmDelete(batch) { deleteTarget.value = batch }
async function doDelete() {
  await animalStore.removeBatch(deleteTarget.value.id)
  ui.showToast('🗑️ Batch removed')
  deleteTarget.value = null
}

// ── UNDO SALE ─────────────────────────────────────────────────────────────────
const undoTarget = ref(null)
const undoSaving = ref(false)

function openUndoConfirm(sale) {
  undoTarget.value = sale
}

async function doUndoSale() {
  if (undoSaving.value) return
  undoSaving.value = true
  try {
    await animalStore.removeSoldBatch(undoTarget.value)
    ui.showToast(`🔄 Sale undone — ${undoTarget.value.quantity} ${undoTarget.value.type}s restored!`)
    undoTarget.value = null
  } catch (e) {
    ui.showToast('⚠️ Failed to undo sale')
    console.error(e)
  } finally {
    undoSaving.value = false
  }
}
</script>

<style scoped>
/* HEADER */
.header-counts {
  display: flex; gap: 10px;
  color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 600;
  padding-top: 6px;
}
.cols-3 { grid-template-columns: 1fr 1fr 1fr !important; }
.cols-3 .header-stat-val { font-size: 15px; }
.cols-3 .header-stat-label { font-size: 10px; }

/* FILTER */
.filter-bar {
  display: flex; gap: 6px; overflow-x: auto;
  padding-bottom: 4px; margin-bottom: 16px;
}
.filter-bar::-webkit-scrollbar { display: none; }
.filter-chip {
  flex-shrink: 0; padding: 7px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--surface); color: var(--muted);
  font-family: 'Outfit', sans-serif; transition: all 0.15s; white-space: nowrap;
}
.filter-chip.active { background: var(--green); border-color: var(--green); color: #fff; }

/* BATCH LIST */
.batch-list { display: flex; flex-direction: column; gap: 12px; }
.batch-card { padding: 0; overflow: hidden; }

.batch-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 0; cursor: pointer;
}
.batch-left  { display: flex; align-items: center; gap: 12px; }
.batch-emoji { font-size: 32px; flex-shrink: 0; }
.batch-title-group { flex: 1; }
.batch-label { font-weight: 700; font-size: 16px; line-height: 1.2; }
.batch-meta  { font-size: 11px; color: var(--muted); margin-top: 3px; }
.batch-right { text-align: right; flex-shrink: 0; }
.batch-count { font-size: 32px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1; color: var(--green); }
.batch-count-label { font-size: 10px; color: var(--muted); }

.batch-stats {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  padding: 12px 16px 0;
}
.bs-pill {
  display: flex; align-items: center; gap: 4px;
  background: var(--bg2); border-radius: 20px;
  padding: 4px 10px; font-size: 11px; color: var(--muted);
}
.bs-icon { font-size: 12px; }

.cost-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px 0; font-size: 12px;
}
.cost-label { color: var(--muted); }
.cost-val   { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--text); }

/* FLAGGED STRIP */
.flagged-strip {
  margin: 10px 16px 0;
  background: var(--purple-pale); border-radius: 10px; padding: 10px 12px;
}
.flagged-title { font-size: 11px; font-weight: 700; color: var(--purple); margin-bottom: 8px; }
.flagged-list  { display: flex; flex-direction: column; gap: 6px; }
.flagged-item  { display: flex; align-items: center; gap: 8px; }
.fi-name       { flex: 1; font-size: 13px; font-weight: 500; }
.fi-remove     {
  width: 20px; height: 20px; border-radius: 50%;
  border: none; background: rgba(0,0,0,0.1); color: var(--muted);
  cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;
}

.batch-notes { padding: 8px 16px 0; font-size: 12px; color: var(--muted); }

/* BATCH ACTIONS */
.batch-actions {
  display: flex; gap: 6px; padding: 14px 16px; flex-wrap: wrap;
}
.act-btn {
  padding: 7px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: 'Outfit', sans-serif; border: 1.5px solid;
  transition: all 0.15s; white-space: nowrap;
}
.act-btn:active { transform: scale(0.95); }
.act-btn.sell   { background: var(--green-pale);  border-color: var(--green);  color: var(--green); }
.act-btn.death  { background: var(--red-pale);    border-color: var(--red);    color: var(--red); }
.act-btn.flag   { background: var(--purple-pale); border-color: var(--purple); color: var(--purple); }
.act-btn.edit   { background: var(--bg2);         border-color: var(--border); color: var(--muted); }
.act-btn.delete { background: var(--bg2);         border-color: var(--border); color: var(--red); padding: 7px 10px; }

/* SECTION HINT */
.section-hint { font-size: 11px; color: var(--muted); font-weight: 400; margin-left: 4px; }

/* SOLD FULL LIST */
.sold-full-list { display: flex; flex-direction: column; gap: 10px; }
.sold-card { padding: 14px 16px; }
.sc-top    { display: flex; align-items: center; gap: 10px; }
.sc-emoji  { font-size: 26px; flex-shrink: 0; }
.sc-info   { flex: 1; }
.sc-label  { font-weight: 600; font-size: 14px; }
.sc-meta   { font-size: 11px; color: var(--muted); margin-top: 2px; }
.sc-profit { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; flex-shrink: 0; }
.sc-profit.pos { color: var(--green); }
.sc-profit.neg { color: var(--red); }
.sc-prices {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--bg2);
  font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace;
}
.sc-arrow { color: var(--green); font-weight: 700; }
.sc-pph   { color: var(--muted); font-size: 10px; }

/* UNDO BUTTON */
.sc-actions { margin-top: 12px; }
.undo-btn {
  width: 100%; padding: 9px 14px; border-radius: 10px;
  border: 1.5px solid var(--amber); background: var(--amber-pale); color: var(--amber);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.undo-btn:active { background: var(--amber); color: #fff; }

/* SOLD MINI */
.section-link { font-size: 12px; color: var(--green); cursor: pointer; font-weight: 500; }
.sold-mini { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.sold-mini-item {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 12px 14px;
}
.sm-emoji  { font-size: 20px; }
.sm-info   { flex: 1; }
.sm-label  { font-size: 13px; font-weight: 500; }
.sm-date   { font-size: 11px; color: var(--muted); margin-top: 2px; }
.sm-profit { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; }
.sm-profit.pos { color: var(--green); }
.sm-profit.neg { color: var(--red); }

/* FLAGGED FULL */
.flagged-full-list { display: flex; flex-direction: column; gap: 10px; }
.flagged-card { padding: 14px 16px; }
.fc-top   { display: flex; align-items: center; gap: 10px; }
.fc-emoji { font-size: 26px; }
.fc-info  { flex: 1; }
.fc-name  { font-weight: 600; font-size: 14px; }
.fc-batch { font-size: 11px; color: var(--muted); margin-top: 2px; }
.fc-detail { font-size: 12px; color: var(--muted); margin-top: 8px; }
.fc-date   { font-size: 11px; color: var(--muted); margin-top: 4px; font-family: 'JetBrains Mono', monospace; }
.fc-actions { display: flex; gap: 8px; margin-top: 10px; }

/* OVERLAYS / MODALS */
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
.modal-handle {
  width: 40px; height: 4px; border-radius: 2px;
  background: var(--border); margin: 0 auto 20px;
}
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.modal-info-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--muted);
  background: var(--bg2); border-radius: 8px; padding: 8px 12px;
  margin-bottom: 14px;
}

/* SEGMENTED CONTROL */
.seg-ctrl {
  display: flex; background: var(--bg2); border-radius: 10px;
  padding: 3px; gap: 2px;
}
.seg-btn {
  flex: 1; padding: 8px; border-radius: 8px; border: none;
  font-size: 12px; font-weight: 600; color: var(--muted);
  font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.15s;
  background: none;
}
.seg-btn.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }

/* QTY */
.qty-row { display: flex; align-items: center; gap: 10px; }
.qty-btn {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-size: 22px; font-weight: 700; color: var(--text);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.qty-btn:active { background: var(--border); }
.qty-input { text-align: center; font-size: 18px !important; font-weight: 700 !important; }
.qty-hint  { font-size: 12px; color: var(--muted); margin-top: 6px; background: var(--bg2); border-radius: 8px; padding: 7px 10px; }
.qty-hint strong { color: var(--text); }

/* PROFIT PREVIEW */
.profit-preview {
  background: var(--bg2); border-radius: 10px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px;
}
.pp-row     { display: flex; justify-content: space-between; align-items: center; }
.pp-label   { font-size: 12px; color: var(--muted); }
.pp-val     { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; }
.pp-muted   { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--muted); }
.pp-val.pos { color: var(--green); }
.pp-val.neg { color: var(--red); }
.total-row  { padding-top: 8px; border-top: 1px solid var(--border); }

/* CONFIRM */
.confirm-box {
  background: var(--surface); border-radius: 20px;
  padding: 24px 20px; width: 100%; max-width: 320px;
}
.confirm-icon  { font-size: 32px; text-align: center; margin-bottom: 8px; }
.confirm-title { font-size: 17px; font-weight: 700; text-align: center; margin-bottom: 6px; }
.confirm-msg   { font-size: 13px; color: var(--muted); text-align: center; margin-bottom: 16px; line-height: 1.6; }
.confirm-sub   { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
.confirm-btns  { display: flex; gap: 10px; }

/* BUTTONS */
.btn-full {
  width: 100%; padding: 14px; border-radius: 12px; border: none;
  background: var(--green); color: #fff; font-family: 'Outfit', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 6px;
}
.btn-full:disabled { opacity: 0.45; cursor: default; }
.btn-full.danger { background: var(--red); }

.btn-cancel {
  flex: 1; padding: 11px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  color: var(--muted); cursor: pointer;
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
.btn-delete:disabled { opacity: 0.5; }
.edit-actions { display: flex; gap: 8px; margin-top: 8px; }

.optional { font-size: 11px; color: var(--muted); font-weight: 400; }

/* TRANSITIONS */
.modal-slide-enter-active, .modal-slide-leave-active { transition: all 0.25s ease; }
.modal-slide-enter-from .modal-sheet,
.modal-slide-leave-to .modal-sheet { transform: translateY(100%); }
.modal-slide-enter-from, .modal-slide-leave-to { opacity: 0; }

.confirm-enter-active, .confirm-leave-active { transition: all 0.2s ease; }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-box, .confirm-leave-to .confirm-box { transform: scale(0.92); }
</style>