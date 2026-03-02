<template>
  <Transition name="modal">
    <div class="modal-overlay" @click.self="ui.closeModal()">
      <div class="modal">
        <div class="modal-handle" />

        <!-- ── ADD ANIMAL ── -->
        <template v-if="ui.activeModal === 'addAnimal'">
          <h2 class="modal-title">➕ Add Animal</h2>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" v-model="animalForm.type">
              <option value="Goat">🐐 Goat</option>
             
              <option value="Duck">🦆 Duck</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Name / Tag ID <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="animalForm.name" placeholder="e.g. Bella or Goat #12" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sex</label>
              <select class="form-select" v-model="animalForm.sex">
                <option>Female</option>
                <option>Male</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Age (months)</label>
              <input class="form-input" type="number" v-model="animalForm.age" placeholder="12" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Weight (kg)</label>
              <input class="form-input" type="number" v-model="animalForm.weight" placeholder="25" />
            </div>
            <div class="form-group">
              <label class="form-label">Health Status</label>
              <select class="form-select" v-model="animalForm.health">
                <option>Healthy</option>
                <option>Sick</option>
                <option>Under Treatment</option>
                <option>Pregnant</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input" v-model="animalForm.notes" placeholder="Optional..." />
          </div>
          <div class="form-group">
            <label class="form-label">Bought For (₱) <span class="optional">(optional)</span></label>
            <input class="form-input" type="number" v-model="animalForm.boughtFor" placeholder="e.g. 3500" />
          </div>

          <!-- QUANTITY -->
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <div class="qty-row">
              <button class="qty-btn" @click="animalForm.quantity = Math.max(1, animalForm.quantity - 1)">−</button>
              <input
                class="form-input qty-input"
                type="number"
                v-model.number="animalForm.quantity"
                min="1"
                max="500"
              />
              <button class="qty-btn" @click="animalForm.quantity = Math.min(500, animalForm.quantity + 1)">+</button>
            </div>
            <div class="qty-hint" v-if="animalForm.quantity > 1">
              Adding <strong>{{ animalForm.quantity }}</strong> {{ animalForm.type }}s
              <span v-if="animalForm.name"> — named "{{ animalForm.name }} 1", "{{ animalForm.name }} 2"…</span>
            </div>
          </div>

          <button class="btn-full" @click="submitAnimal" :disabled="saving">
            {{ saving ? 'Saving…' : (animalForm.quantity > 1 ? `Save ${animalForm.quantity} Animals` : 'Save Animal') }}
          </button>
        </template>

        <!-- ── ADD TRANSACTION ── -->
        <template v-if="ui.activeModal === 'addExpense'">
          <h2 class="modal-title">💸 Record Transaction</h2>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" v-model="expenseForm.type">
              <option value="Expense">📤 Expense (Money Out)</option>
              <option value="Income">📥 Income (Money In)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-select" v-model="expenseForm.category">
              <option v-for="c in expenseCategories" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₱)</label>
            <input class="form-input" type="number" v-model="expenseForm.amount" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input class="form-input" v-model="expenseForm.description" placeholder="e.g. 50kg duck feeds" />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="expenseForm.date" />
          </div>
          <button class="btn-full" @click="submitExpense">Save Transaction</button>
        </template>

        <!-- ── MARK PREGNANT ── -->
        <template v-if="ui.activeModal === 'markPregnant'">
          <h2 class="modal-title">🤰 Mark Goat Pregnant</h2>
          <div class="form-group">
            <label class="form-label">Select Female Goat</label>
            <select class="form-select" v-model="pregnancyForm.goatName">
              <option v-for="g in animalStore.femaleGoats" :key="g.id" :value="g.name">{{ g.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date Mated</label>
            <input class="form-input" type="date" v-model="pregnancyForm.mateDate" />
          </div>
          <div class="form-group">
            <label class="form-label">Expected Kids</label>
            <input class="form-input" type="number" v-model="pregnancyForm.expectedKids" placeholder="1–3" min="1" max="5" />
          </div>
          <div class="hint-box">
            📅 Expected birth: <strong>{{ breedingStore.expectedBirthFromDate(pregnancyForm.mateDate) }}</strong><br>
            <span>Based on 150-day goat gestation period</span>
          </div>
          <button class="btn-full" @click="submitPregnancy">Confirm Pregnancy</button>
        </template>

        <!-- ── RECORD DEATH ── -->
        <template v-if="ui.activeModal === 'recordDeath'">
          <h2 class="modal-title">💀 Record Animal Death</h2>
          <div class="form-group">
            <label class="form-label">Select Animal</label>
            <select class="form-select" v-model="deathForm.animalId">
              <option value="" disabled>— Choose an animal —</option>
              <option v-for="a in animalStore.animals" :key="a.id" :value="a.id">
                {{ a.name }} ({{ a.type }})
              </option>
            </select>
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
          <button class="btn-full danger" @click="submitDeath">Record Death</button>
        </template>

        <!-- ── HEALTH RECORD ── -->
        <template v-if="ui.activeModal === 'addHealth'">
          <h2 class="modal-title">💊 Add Health Record</h2>
          <div class="form-group">
            <label class="form-label">Animal Name / ID</label>
            <input class="form-input" v-model="healthForm.animal" placeholder="e.g. Bella or Batch A" />
          </div>
          <div class="form-group">
            <label class="form-label">Animal Type</label>
            <select class="form-select" v-model="healthForm.animalType">
              <option>Goat</option><option>Duck</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Treatment Type</label>
            <select class="form-select" v-model="healthForm.treatment">
              <option>Vaccination</option>
              <option>Deworming</option>
              <option>Antibiotic</option>
              <option>Vitamins</option>
              <option>Wound Treatment</option>
              <option>Check-up</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Medicine / Product Used</label>
            <input class="form-input" v-model="healthForm.medicine" placeholder="e.g. Ivermectin 1%" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" type="date" v-model="healthForm.date" />
            </div>
            <div class="form-group">
              <label class="form-label">Next Due</label>
              <input class="form-input" type="date" v-model="healthForm.nextDate" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input" v-model="healthForm.notes" placeholder="Dosage, observations..." />
          </div>
          <button class="btn-full" @click="submitHealth">Save Record</button>
        </template>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useUIStore }       from '@/stores/ui'
import { useAnimalStore }   from '@/stores/animals'
import { useFinanceStore }  from '@/stores/finance'
import { useBreedingStore } from '@/stores/breeding'
import { useHealthStore }   from '@/stores/health'

const ui            = useUIStore()
const animalStore   = useAnimalStore()
const finance       = useFinanceStore()
const breedingStore = useBreedingStore()
const healthStore   = useHealthStore()

const today = new Date().toISOString().slice(0, 10)

const expenseCategories = [
  'Feeds','Medicine','Veterinary','Labor','Equipment','Capital','Animal Sale','Egg Sale','Milk Sale','Manure Sale','Other',
]

// ── FORMS ──
const saving        = ref(false)
const animalForm    = reactive({ type: 'Goat', name: '', sex: 'Female', age: '', weight: '', health: 'Healthy', notes: '', boughtFor: '', quantity: 1 })
const expenseForm   = reactive({ type: 'Expense', category: 'Feeds', amount: '', description: '', date: today })
const pregnancyForm = reactive({ goatName: '', mateDate: today, expectedKids: 1 })
const deathForm     = reactive({ animalId: '', cause: 'Disease', date: today })
const healthForm    = reactive({ animal: '', animalType: 'Goat', treatment: 'Vaccination', medicine: '', notes: '', date: today, nextDate: '' })

async function submitAnimal() {
  if (saving.value) return
  saving.value = true
  try {
    const qty = Math.max(1, Math.floor(animalForm.quantity) || 1)
    const baseName = animalForm.name.trim()
    const promises = []
    for (let i = 1; i <= qty; i++) {
      const name = qty === 1 ? baseName : baseName ? `${baseName} ${i}` : ''
      promises.push(animalStore.addAnimal({ ...animalForm, name }))
    }
    await Promise.all(promises)
    Object.assign(animalForm, { type: 'Goat', name: '', sex: 'Female', age: '', weight: '', health: 'Healthy', notes: '', boughtFor: '', quantity: 1 })
    ui.closeModal()
    ui.showToast(qty > 1 ? `✅ ${qty} animals added!` : '✅ Animal added!')
  } finally {
    saving.value = false
  }
}

function submitExpense() {
  if (!expenseForm.amount) { ui.showToast('⚠️ Please enter an amount'); return }
  finance.addTransaction({ ...expenseForm })
  Object.assign(expenseForm, { type: 'Expense', category: 'Feeds', amount: '', description: '', date: today })
  ui.closeModal()
  ui.showToast('✅ Transaction saved!')
}

function submitPregnancy() {
  if (!pregnancyForm.goatName) { ui.showToast('⚠️ Please select a goat'); return }
  breedingStore.addPregnancy({ ...pregnancyForm })
  Object.assign(pregnancyForm, { goatName: '', mateDate: today, expectedKids: 1 })
  ui.closeModal()
  ui.showToast('✅ Pregnancy tracked!')
}

function submitDeath() {
  if (!deathForm.animalId) { ui.showToast('⚠️ Please select an animal'); return }
  animalStore.removeAnimal(deathForm.animalId)
  Object.assign(deathForm, { animalId: '', cause: 'Disease', date: today })
  ui.closeModal()
  ui.showToast('🙏 Death recorded')
}

function submitHealth() {
  if (!healthForm.animal.trim()) { ui.showToast('⚠️ Enter animal name'); return }
  healthStore.addRecord({ ...healthForm })
  Object.assign(healthForm, { animal: '', animalType: 'Goat', treatment: 'Vaccination', medicine: '', notes: '', date: today, nextDate: '' })
  ui.closeModal()
  ui.showToast('✅ Health record saved!')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 300;
  display: flex; align-items: flex-end;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  width: 100%; max-width: 430px; margin: 0 auto;
  padding: 16px 20px 40px;
  max-height: 92vh; overflow-y: auto;
}
.modal-handle {
  width: 40px; height: 4px; border-radius: 2px;
  background: var(--border); margin: 0 auto 20px;
}
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
.optional { font-size: 11px; color: var(--muted); font-weight: 400; }

.hint-box {
  background: var(--green-pale); border-radius: 10px;
  padding: 12px; margin-bottom: 16px;
  font-size: 13px; color: var(--green); line-height: 1.6;
}
.hint-box span { color: var(--muted); font-size: 12px; }

/* QUANTITY */
.qty-row {
  display: flex; align-items: center; gap: 10px;
}
.qty-btn {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-size: 20px; font-weight: 700; color: var(--text);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.qty-btn:active { background: var(--border); transform: scale(0.92); }
.qty-input {
  text-align: center;
  font-size: 18px !important;
  font-weight: 700 !important;
}
.qty-hint {
  margin-top: 8px; font-size: 12px; color: var(--muted);
  background: var(--bg2); border-radius: 8px; padding: 8px 10px;
  line-height: 1.5;
}

.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(100%); }
</style>