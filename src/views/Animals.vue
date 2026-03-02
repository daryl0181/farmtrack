<template>
  <div>
    <PageHeader greeting="Manage" title="All Animals">
      <template #right>
        <div style="color:rgba(255,255,255,0.7); font-size:13px; padding-top:6px;">
          {{ animalStore.totalAnimals }} total
        </div>
      </template>
    </PageHeader>

    <div class="page-content">

      <!-- FILTER CHIPS + BULK SELL TOGGLE -->
      <div class="top-bar">
        <div class="filter-bar">
          <button
            v-for="f in filters" :key="f"
            :class="['filter-chip', activeFilter === f ? 'active' : '']"
            @click="activeFilter = f; selectedIds = new Set()"
          >{{ f }}</button>
        </div>
        <button
          :class="['bulk-btn', bulkMode ? 'active' : '']"
          @click="toggleBulkMode"
        >{{ bulkMode ? 'Cancel' : 'Bulk Sell' }}</button>
      </div>

      <!-- BULK ACTION BAR -->
      <Transition name="slide-down">
        <div class="bulk-bar" v-if="bulkMode">
          <div class="bulk-info">
            <span v-if="selectedIds.size === 0">Tap animals to select</span>
            <span v-else><strong>{{ selectedIds.size }}</strong> selected</span>
          </div>
          <div class="bulk-actions">
            <button class="bulk-select-all" @click="selectAll">
              {{ selectedIds.size === filteredAnimals.length ? 'Deselect All' : 'Select All' }}
            </button>
            <button class="bulk-sell-btn" :disabled="selectedIds.size === 0" @click="openBulkSell">
              💰 Sell {{ selectedIds.size > 0 ? selectedIds.size : '' }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- ANIMAL LIST -->
      <div class="animal-list" v-if="filteredAnimals.length">
        <div
          class="animal-item card"
          v-for="a in filteredAnimals"
          :key="a.id"
          :class="{ 'selected': bulkMode && selectedIds.has(a.id), 'selectable': bulkMode }"
          @click="bulkMode ? toggleSelect(a.id) : null"
        >
          <!-- BULK CHECKBOX -->
          <div v-if="bulkMode" class="bulk-check">
            <div :class="['check-circle', selectedIds.has(a.id) ? 'checked' : '']">
              <span v-if="selectedIds.has(a.id)">✓</span>
            </div>
          </div>

          <!-- BULK VIEW (simplified) -->
          <template v-if="bulkMode">
            <div class="ai-emoji">{{ animalStore.animalEmoji(a.type) }}</div>
            <div class="ai-info">
              <div class="ai-name">{{ a.name || '(unnamed)' }}</div>
              <div class="ai-meta">{{ a.type }} · {{ a.sex }}</div>
              <div class="ai-tags">
                <span class="tag amber" v-if="a.boughtFor">Cost ₱{{ formatNum(a.boughtFor) }}</span>
              </div>
            </div>
          </template>

          <!-- NORMAL VIEW MODE -->
          <template v-if="!bulkMode && editingId !== a.id">
            <div class="ai-emoji">{{ animalStore.animalEmoji(a.type) }}</div>
            <div class="ai-info">
              <div class="ai-name">{{ a.name || '(unnamed)' }}</div>
              <div class="ai-meta">
                {{ a.age ? a.age + ' months' : '' }}{{ a.age && a.weight ? ' · ' : '' }}{{ a.weight ? a.weight + ' kg' : '' }}
              </div>
              <div class="ai-tags">
                <span :class="['tag', animalStore.healthTagColor(a.health)]">{{ a.health }}</span>
                <span class="tag blue" v-if="a.sex === 'Male'">Male</span>
                <span class="tag purple" v-else>Female</span>
                <span class="tag green" v-if="a.addedDate">{{ a.addedDate }}</span>
                <span class="tag amber" v-if="a.boughtFor">₱{{ formatNum(a.boughtFor) }} cost</span>
              </div>
              <div class="ai-notes" v-if="a.notes">📝 {{ a.notes }}</div>
            </div>
            <div class="ai-actions">
              <button class="icon-btn" @click.stop="ui.openModal('addHealth')" title="Health record">💊</button>
              <button class="icon-btn green" @click.stop="openSell(a)" title="Sell">💰</button>
              <button class="icon-btn" @click.stop="startEdit(a)" title="Edit">✏️</button>
              <button class="icon-btn red" @click.stop="confirmDelete(a)" title="Delete">🗑️</button>
            </div>
          </template>

          <!-- EDIT MODE -->
          <template v-if="!bulkMode && editingId === a.id">
            <div class="edit-form">
              <div class="edit-title">✏️ Edit Animal</div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Name</label>
                  <input class="form-input" v-model="editForm.name" placeholder="Name / Tag" />
                </div>
                <div class="form-group">
                  <label class="form-label">Type</label>
                  <select class="form-select" v-model="editForm.type">
                    <option value="Goat">🐐 Goat</option>
                    <option value="Duck">🦆 Duck</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Sex</label>
                  <select class="form-select" v-model="editForm.sex">
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Health</label>
                  <select class="form-select" v-model="editForm.health">
                    <option>Healthy</option>
                    <option>Sick</option>
                    <option>Under Treatment</option>
                    <option>Pregnant</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Age (mo)</label>
                  <input class="form-input" type="number" v-model="editForm.age" />
                </div>
                <div class="form-group">
                  <label class="form-label">Weight (kg)</label>
                  <input class="form-input" type="number" v-model="editForm.weight" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Bought For (₱)</label>
                <input class="form-input" type="number" v-model="editForm.boughtFor" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <input class="form-input" v-model="editForm.notes" placeholder="Optional..." />
              </div>
              <div class="edit-actions">
                <button class="btn-cancel" @click="cancelEdit">Cancel</button>
                <button class="btn-save" @click="saveEdit(a.id)">Save</button>
              </div>
            </div>
          </template>

        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-state-icon">🐾</div>
        <div class="empty-state-text">No {{ activeFilter === 'All' ? '' : activeFilter }} animals yet.<br>Tap + to add one.</div>
      </div>

    </div>

    <!-- ── SINGLE SELL MODAL ── -->
    <Transition name="confirm">
      <div class="confirm-overlay" v-if="sellTarget" @click.self="sellTarget = null">
        <div class="confirm-box">
          <div class="confirm-icon">💰</div>
          <div class="confirm-title">Sell Animal</div>
          <div class="confirm-msg">
            <strong>{{ sellTarget.name || sellTarget.type }}</strong>
            <span v-if="sellTarget.boughtFor"> · Cost: ₱{{ formatNum(sellTarget.boughtFor) }}</span>
          </div>
          <div class="sell-form">
            <div class="form-group">
              <label class="form-label">Sold For (₱)</label>
              <input class="form-input" type="number" v-model.number="sellForm.soldFor" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Sold To <span class="optional">(optional)</span></label>
              <input class="form-input" v-model="sellForm.soldTo" placeholder="Buyer name" />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" type="date" v-model="sellForm.soldDate" />
            </div>
            <div class="profit-preview" v-if="sellForm.soldFor">
              <div class="pp-row">
                <span class="pp-label">Profit / Loss:</span>
                <span :class="['pp-val', sellProfit >= 0 ? 'pos' : 'neg']">
                  {{ sellProfit >= 0 ? '+' : '' }}₱{{ formatNum(sellProfit) }}
                </span>
              </div>
            </div>
          </div>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="sellTarget = null">Cancel</button>
            <button class="btn-sell" @click="doSell" :disabled="sellingSaving">
              {{ sellingSaving ? 'Saving…' : 'Confirm Sale' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── BULK SELL MODAL ── -->
    <Transition name="confirm">
      <div class="confirm-overlay" v-if="showBulkSellModal" @click.self="showBulkSellModal = false">
        <div class="confirm-box bulk-sell-box">
          <div class="confirm-icon">💰</div>
          <div class="confirm-title">Bulk Sell — {{ selectedIds.size }} Animals</div>

          <!-- SELECTED PREVIEW -->
          <div class="bulk-preview">
            <div class="bp-item" v-for="a in selectedAnimals" :key="a.id">
              <span class="bp-emoji">{{ animalStore.animalEmoji(a.type) }}</span>
              <span class="bp-name">{{ a.name || a.type }}</span>
              <span class="bp-cost" v-if="a.boughtFor">₱{{ formatNum(a.boughtFor) }}</span>
            </div>
          </div>

          <div class="sell-form" style="margin-top:14px;">
            <!-- PRICE MODE -->
            <div class="price-mode-row">
              <button :class="['mode-btn', bulkPriceMode === 'total' ? 'active' : '']" @click="bulkPriceMode = 'total'">Total Price</button>
              <button :class="['mode-btn', bulkPriceMode === 'each' ? 'active' : '']" @click="bulkPriceMode = 'each'">Price Each</button>
            </div>

            <div class="form-group">
              <label class="form-label">
                {{ bulkPriceMode === 'total' ? `Total for all ${selectedIds.size} animals (₱)` : 'Price per animal (₱)' }}
              </label>
              <input class="form-input" type="number" v-model.number="bulkForm.price" placeholder="0" />
            </div>

            <div class="profit-preview" v-if="bulkForm.price">
              <div class="pp-row">
                <span class="pp-label">Total Revenue:</span>
                <span class="pp-val pos">₱{{ formatNum(bulkTotalRevenue) }}</span>
              </div>
              <div class="pp-row" style="margin-top:5px;">
                <span class="pp-label">Total Cost:</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted);">₱{{ formatNum(bulkTotalCost) }}</span>
              </div>
              <div class="pp-row" style="margin-top:5px;padding-top:8px;border-top:1px solid var(--border);">
                <span class="pp-label">Net Profit / Loss:</span>
                <span :class="['pp-val', bulkNetProfit >= 0 ? 'pos' : 'neg']">
                  {{ bulkNetProfit >= 0 ? '+' : '' }}₱{{ formatNum(bulkNetProfit) }}
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Sold To <span class="optional">(optional)</span></label>
              <input class="form-input" v-model="bulkForm.soldTo" placeholder="Buyer name" />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" type="date" v-model="bulkForm.soldDate" />
            </div>
          </div>

          <div class="confirm-btns">
            <button class="btn-cancel" @click="showBulkSellModal = false">Cancel</button>
            <button class="btn-sell" @click="doBulkSell" :disabled="bulkSaving || !bulkForm.price">
              {{ bulkSaving ? 'Saving…' : `Sell ${selectedIds.size} Animals` }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- DELETE CONFIRM -->
    <Transition name="confirm">
      <div class="confirm-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
        <div class="confirm-box">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-title">Delete Animal?</div>
          <div class="confirm-msg">
            Remove <strong>{{ deleteTarget.name || deleteTarget.type }}</strong> from your records? This cannot be undone.
          </div>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button class="btn-delete" @click="doDelete">Delete</button>
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

const filters      = ['All', 'Goat', 'Duck']
const activeFilter = ref('All')

const filteredAnimals = computed(() =>
  activeFilter.value === 'All'
    ? animalStore.animals.filter(a => ['Goat', 'Duck'].includes(a.type))
    : animalStore.animals.filter(a => a.type === activeFilter.value)
)

function formatNum(n) {
  return Number(n || 0).toLocaleString('en-PH')
}

// ── BULK MODE ─────────────────────────────────────────
const bulkMode    = ref(false)
const selectedIds = ref(new Set())

function toggleBulkMode() {
  bulkMode.value = !bulkMode.value
  selectedIds.value = new Set()
  editingId.value = null
}

function toggleSelect(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function selectAll() {
  if (selectedIds.value.size === filteredAnimals.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredAnimals.value.map(a => a.id))
  }
}

const selectedAnimals = computed(() =>
  filteredAnimals.value.filter(a => selectedIds.value.has(a.id))
)

// ── BULK SELL ─────────────────────────────────────────
const showBulkSellModal = ref(false)
const bulkPriceMode     = ref('total')
const bulkSaving        = ref(false)
const bulkForm          = reactive({ price: '', soldTo: '', soldDate: today })

const bulkTotalRevenue = computed(() => {
  if (!bulkForm.price) return 0
  return bulkPriceMode.value === 'total'
    ? Number(bulkForm.price)
    : Number(bulkForm.price) * selectedIds.value.size
})
const bulkTotalCost = computed(() =>
  selectedAnimals.value.reduce((s, a) => s + (Number(a.boughtFor) || 0), 0)
)
const bulkNetProfit = computed(() => bulkTotalRevenue.value - bulkTotalCost.value)

function openBulkSell() {
  if (!selectedIds.value.size) return
  Object.assign(bulkForm, { price: '', soldTo: '', soldDate: today })
  bulkPriceMode.value = 'total'
  showBulkSellModal.value = true
}

async function doBulkSell() {
  if (!bulkForm.price || bulkSaving.value) return
  bulkSaving.value = true
  try {
    const animals  = selectedAnimals.value
    const priceEach = bulkPriceMode.value === 'each'
      ? Number(bulkForm.price)
      : Number(bulkForm.price) / animals.length

    await Promise.all(
      animals.map(animal => animalStore.sellAnimal({
        animal,
        soldFor:  priceEach,
        soldTo:   bulkForm.soldTo,
        soldDate: bulkForm.soldDate,
      }))
    )
    ui.showToast(`💰 ${animals.length} animals sold!`)
    showBulkSellModal.value = false
    bulkMode.value = false
    selectedIds.value = new Set()
  } finally {
    bulkSaving.value = false
  }
}

// ── EDIT ──────────────────────────────────────────────
const editingId = ref(null)
const editForm  = reactive({ name: '', type: '', sex: '', health: '', age: '', weight: '', boughtFor: '', notes: '' })

function startEdit(a) {
  editingId.value = a.id
  Object.assign(editForm, { name: a.name, type: a.type, sex: a.sex, health: a.health, age: a.age, weight: a.weight, boughtFor: a.boughtFor || '', notes: a.notes })
}
function cancelEdit() { editingId.value = null }
async function saveEdit(id) {
  await animalStore.updateAnimal(id, { ...editForm })
  editingId.value = null
  ui.showToast('✅ Animal updated!')
}

// ── SINGLE SELL ───────────────────────────────────────
const sellTarget    = ref(null)
const sellingSaving = ref(false)
const sellForm      = reactive({ soldFor: '', soldTo: '', soldDate: today })

const sellProfit = computed(() =>
  (Number(sellForm.soldFor) || 0) - (Number(sellTarget.value?.boughtFor) || 0)
)

function openSell(a) {
  sellTarget.value = a
  Object.assign(sellForm, { soldFor: '', soldTo: '', soldDate: today })
}

async function doSell() {
  if (!sellForm.soldFor) { ui.showToast('⚠️ Enter sold price'); return }
  if (sellingSaving.value) return
  sellingSaving.value = true
  try {
    await animalStore.sellAnimal({ animal: sellTarget.value, soldFor: sellForm.soldFor, soldTo: sellForm.soldTo, soldDate: sellForm.soldDate })
    ui.showToast('💰 Animal sold & recorded!')
    sellTarget.value = null
  } finally {
    sellingSaving.value = false
  }
}

// ── DELETE ────────────────────────────────────────────
const deleteTarget = ref(null)
function confirmDelete(a) { deleteTarget.value = a }
async function doDelete() {
  await animalStore.removeAnimal(deleteTarget.value.id)
  ui.showToast('🗑️ Animal removed')
  deleteTarget.value = null
}
</script>

<style scoped>
.top-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; overflow-x: auto; flex: 1; }
.filter-bar::-webkit-scrollbar { display: none; }
.filter-chip {
  flex-shrink: 0; padding: 7px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--surface); color: var(--muted);
  font-family: 'Outfit', sans-serif; transition: all 0.15s;
}
.filter-chip.active { background: var(--green); border-color: var(--green); color: #fff; }
.bulk-btn {
  flex-shrink: 0; padding: 7px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  border: 1.5px solid var(--green); background: transparent; color: var(--green);
  font-family: 'Outfit', sans-serif; transition: all 0.15s; white-space: nowrap;
}
.bulk-btn.active { border-color: var(--red); color: var(--red); }

/* BULK BAR */
.bulk-bar {
  background: var(--surface); border: 1px solid var(--green);
  border-radius: 12px; padding: 12px 14px;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; gap: 10px;
}
.bulk-info { font-size: 13px; color: var(--muted); }
.bulk-info strong { color: var(--green); }
.bulk-actions { display: flex; gap: 8px; }
.bulk-select-all {
  padding: 7px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--border); background: var(--bg2); color: var(--muted);
  font-family: 'Outfit', sans-serif; cursor: pointer;
}
.bulk-sell-btn {
  padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
  border: none; background: var(--green); color: #fff;
  font-family: 'Outfit', sans-serif; cursor: pointer;
}
.bulk-sell-btn:disabled { opacity: 0.4; cursor: default; }

/* LIST */
.animal-list { display: flex; flex-direction: column; gap: 10px; }
.animal-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; transition: all 0.15s; }
.animal-item.selectable { cursor: pointer; user-select: none; }
.animal-item.selected { border-color: var(--green) !important; background: var(--green-pale) !important; }
.ai-emoji { font-size: 30px; flex-shrink: 0; padding-top: 2px; }
.ai-info  { flex: 1; min-width: 0; }
.ai-name  { font-weight: 600; font-size: 15px; }
.ai-meta  { font-size: 12px; color: var(--muted); margin-top: 2px; }
.ai-tags  { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 6px; }
.ai-notes { font-size: 11px; color: var(--muted); margin-top: 6px; }
.ai-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.icon-btn {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  cursor: pointer; border: 1px solid var(--border); background: var(--bg2); transition: all 0.15s;
}
.icon-btn:active { transform: scale(0.92); }
.icon-btn.red   { border-color: var(--red);   background: var(--red-pale); }
.icon-btn.green { border-color: var(--green); background: var(--green-pale); }

/* CHECKBOX */
.bulk-check { flex-shrink: 0; display: flex; align-items: center; padding-top: 4px; }
.check-circle {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid var(--border); background: var(--bg2);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff; transition: all 0.15s;
}
.check-circle.checked { background: var(--green); border-color: var(--green); }

/* EDIT FORM */
.edit-form { width: 100%; }
.edit-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; color: var(--muted); }
.edit-actions { display: flex; gap: 8px; margin-top: 12px; }
.btn-cancel {
  flex: 1; padding: 10px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; color: var(--muted); cursor: pointer;
}
.btn-save {
  flex: 2; padding: 10px; border-radius: 10px; border: none; background: var(--green);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer;
}

/* OVERLAYS */
.confirm-overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.confirm-box {
  background: var(--surface); border-radius: 20px;
  padding: 24px 20px; width: 100%; max-width: 340px;
  max-height: 88vh; overflow-y: auto;
}
.bulk-sell-box { max-width: 380px; }
.confirm-icon  { font-size: 32px; text-align: center; margin-bottom: 8px; }
.confirm-title { font-size: 17px; font-weight: 700; margin-bottom: 6px; text-align: center; }
.confirm-msg   { font-size: 13px; color: var(--muted); margin-bottom: 16px; text-align: center; }
.confirm-btns  { display: flex; gap: 10px; margin-top: 16px; }
.optional { font-size: 11px; color: var(--muted); font-weight: 400; }

/* BULK PREVIEW */
.bulk-preview {
  max-height: 130px; overflow-y: auto;
  background: var(--bg2); border-radius: 10px; padding: 8px 10px;
  display: flex; flex-direction: column; gap: 6px;
}
.bp-item  { display: flex; align-items: center; gap: 8px; }
.bp-emoji { font-size: 16px; }
.bp-name  { flex: 1; font-size: 13px; font-weight: 500; }
.bp-cost  { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

/* PRICE MODE */
.price-mode-row { display: flex; gap: 6px; background: var(--bg2); border-radius: 10px; padding: 4px; }
.mode-btn {
  flex: 1; padding: 8px; border-radius: 7px; font-size: 12px; font-weight: 600;
  border: none; background: none; color: var(--muted);
  font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.15s;
}
.mode-btn.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }

/* SELL FORM */
.sell-form { display: flex; flex-direction: column; gap: 12px; }
.profit-preview { background: var(--bg2); border-radius: 10px; padding: 12px 14px; }
.pp-row   { display: flex; align-items: center; justify-content: space-between; }
.pp-label { font-size: 12px; color: var(--muted); }
.pp-val   { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; }
.pp-val.pos { color: var(--green); }
.pp-val.neg { color: var(--red); }

.btn-sell {
  flex: 2; padding: 12px; border-radius: 10px; border: none; background: var(--green);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer;
}
.btn-sell:disabled { opacity: 0.5; cursor: default; }
.btn-delete {
  flex: 2; padding: 12px; border-radius: 10px; border: none; background: var(--red);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer;
}

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.confirm-enter-active, .confirm-leave-active { transition: all 0.2s ease; }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-box, .confirm-leave-to .confirm-box { transform: scale(0.92); }
</style>