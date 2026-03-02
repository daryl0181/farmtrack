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
              <option>🐐 Goat</option>
              <option>🐔 Chicken</option>
              <option>🦆 Duck</option>
              <option>🐷 Pig</option>
              <option>🐄 Cow</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Name / Tag ID</label>
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
          <button class="btn-full" @click="submitAnimal">Save Animal</button>
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
            <input class="form-input" v-model="expenseForm.description" placeholder="e.g. 50kg chicken feeds" />
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
            <label class="form-label">Animal Name / Tag ID</label>
            <input class="form-input" v-model="deathForm.nameOrId" placeholder="Exact name or tag" />
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
              <option>Goat</option><option>Chicken</option><option>Duck</option><option>Pig</option>
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
import { reactive } from 'vue'
import { useUIStore }      from '@/stores/ui'
import { useAnimalStore }  from '@/stores/animals'
import { useFinanceStore } from '@/stores/finance'
import { useBreedingStore } from '@/stores/breeding'
import { useHealthStore }  from '@/stores/health'

const ui       = useUIStore()
const animalStore  = useAnimalStore()
const finance  = useFinanceStore()
const breedingStore = useBreedingStore()
const healthStore  = useHealthStore()

const today = new Date().toISOString().slice(0, 10)

const expenseCategories = [
  'Feeds','Medicine','Veterinary','Labor','Equipment','Capital','Animal Sale','Egg Sale','Milk Sale','Manure Sale','Other',
]

// ── FORMS ──
const animalForm = reactive({ type: 'Goat', name: '', sex: 'Female', age: '', weight: '', health: 'Healthy', notes: '' })
const expenseForm = reactive({ type: 'Expense', category: 'Feeds', amount: '', description: '', date: today })
const pregnancyForm = reactive({ goatName: '', mateDate: today, expectedKids: 1 })
const deathForm = reactive({ nameOrId: '', cause: 'Disease', date: today })
const healthForm = reactive({ animal: '', animalType: 'Goat', treatment: 'Vaccination', medicine: '', notes: '', date: today, nextDate: '' })

function submitAnimal() {
  if (!animalForm.name.trim()) { ui.showToast('⚠️ Please enter a name'); return }
  animalStore.addAnimal({ ...animalForm })
  Object.assign(animalForm, { type: 'Goat', name: '', sex: 'Female', age: '', weight: '', health: 'Healthy', notes: '' })
  ui.closeModal(); ui.showToast('✅ Animal added!')
}

function submitExpense() {
  if (!expenseForm.amount) { ui.showToast('⚠️ Please enter an amount'); return }
  finance.addTransaction({ ...expenseForm })
  Object.assign(expenseForm, { type: 'Expense', category: 'Feeds', amount: '', description: '', date: today })
  ui.closeModal(); ui.showToast('✅ Transaction saved!')
}

function submitPregnancy() {
  if (!pregnancyForm.goatName) { ui.showToast('⚠️ Please select a goat'); return }
  breedingStore.addPregnancy({ ...pregnancyForm })
  Object.assign(pregnancyForm, { goatName: '', mateDate: today, expectedKids: 1 })
  ui.closeModal(); ui.showToast('✅ Pregnancy tracked!')
}

function submitDeath() {
  if (!deathForm.nameOrId.trim()) { ui.showToast('⚠️ Enter animal name'); return }
  animalStore.removeAnimal(deathForm.nameOrId)
  Object.assign(deathForm, { nameOrId: '', cause: 'Disease', date: today })
  ui.closeModal(); ui.showToast('🙏 Death recorded')
}

function submitHealth() {
  if (!healthForm.animal.trim()) { ui.showToast('⚠️ Enter animal name'); return }
  healthStore.addRecord({ ...healthForm })
  Object.assign(healthForm, { animal: '', animalType: 'Goat', treatment: 'Vaccination', medicine: '', notes: '', date: today, nextDate: '' })
  ui.closeModal(); ui.showToast('✅ Health record saved!')
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
.hint-box {
  background: var(--green-pale); border-radius: 10px;
  padding: 12px; margin-bottom: 16px;
  font-size: 13px; color: var(--green); line-height: 1.6;
}
.hint-box span { color: var(--muted); font-size: 12px; }

.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(100%); }
</style>
