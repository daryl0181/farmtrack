<template>
  <Transition name="modal">
    <div class="modal-overlay" @click.self="ui.closeModal()">
      <div class="modal">
        <div class="modal-handle" />

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- ADD BATCH                                                  -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'addAnimal'">
          <h2 class="modal-title">➕ Add Animals</h2>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <div class="seg-ctrl">
                <button :class="['seg-btn', batchForm.type === 'Goat' ? 'active' : '']" @click="batchForm.type = 'Goat'; batchForm.breed = 'Native'">🐐 Goat</button>
                <button :class="['seg-btn', batchForm.type === 'Duck' ? 'active' : '']" @click="batchForm.type = 'Duck'; batchForm.breed = 'Native'">🦆 Duck</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Sex</label>
              <div class="seg-ctrl">
                <button :class="['seg-btn', batchForm.sex === 'Female' ? 'active' : '']" @click="batchForm.sex = 'Female'">♀ Female</button>
                <button :class="['seg-btn', batchForm.sex === 'Male' ? 'active' : '']" @click="batchForm.sex = 'Male'">♂ Male</button>
              </div>
            </div>
          </div>

          <!-- BREED -->
          <div class="form-group">
            <label class="form-label">Breed</label>
            <div class="breed-chips">
              <button v-for="b in currentBreeds" :key="b"
                :class="['breed-chip', batchForm.breed === b ? 'active' : '']"
                @click="batchForm.breed = b">
                {{ breedIcon(b) }} {{ b }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Batch Label <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="batchForm.label"
              :placeholder="batchForm.type === 'Duck' ? 'e.g. Flock A, Batch March' : 'e.g. Main Herd, Batch B'" />
          </div>

          <div class="form-group">
            <label class="form-label">How many?</label>
            <div class="qty-row">
              <button class="qty-btn" @click="batchForm.count = Math.max(1, batchForm.count - 1)">−</button>
              <input class="form-input qty-input" type="number" v-model.number="batchForm.count" min="1" max="9999" />
              <button class="qty-btn" @click="batchForm.count = Math.min(9999, batchForm.count + 1)">+</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Price per head (₱) <span class="optional">(optional)</span></label>
            <input class="form-input" type="number" v-model.number="batchForm.pricePerHead" placeholder="e.g. 350" />
            <div class="qty-hint" v-if="batchForm.pricePerHead && batchForm.count > 1">
              Total: <strong>₱{{ formatNum(batchForm.pricePerHead * batchForm.count) }}</strong>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Health</label>
              <select class="form-select" v-model="batchForm.health">
                <option>Healthy</option><option>Sick</option><option>Under Treatment</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date Acquired</label>
              <input class="form-input" type="date" v-model="batchForm.addedDate" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="batchForm.notes" placeholder="e.g. from supplier Juan, vaccinated" />
          </div>

          <button class="btn-full" @click="submitBatch" :disabled="saving">
            {{ saving ? 'Saving…' : `Add ${batchForm.count} ${batchForm.type}${batchForm.count > 1 ? 's' : ''}` }}
          </button>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- ADD TRANSACTION                                            -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'addExpense'">
          <h2 class="modal-title">💸 Record Transaction</h2>
          <div class="form-group">
            <label class="form-label">Type</label>
            <div class="seg-ctrl">
              <button :class="['seg-btn', expenseForm.type === 'Expense' ? 'active danger' : '']" @click="expenseForm.type = 'Expense'">📤 Expense</button>
              <button :class="['seg-btn', expenseForm.type === 'Income' ? 'active success' : '']" @click="expenseForm.type = 'Income'">📥 Income</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-select" v-model="expenseForm.category">
              <option v-for="c in expenseCategories" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₱)</label>
            <input class="form-input amount-input" type="number" v-model="expenseForm.amount" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">Description <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="expenseForm.description" placeholder="e.g. 50kg duck feeds" />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="expenseForm.date" />
          </div>
          <button class="btn-full" :class="expenseForm.type === 'Expense' ? 'danger' : ''" @click="submitExpense">
            Save {{ expenseForm.type }}
          </button>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- MARK PREGNANT                                              -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'markPregnant'">
          <h2 class="modal-title">🐣 Track Goat Pregnancy</h2>
          <div class="form-group">
            <label class="form-label">Doe (Mother) Name / Tag</label>
            <input class="form-input" v-model="pregnancyForm.goatName" placeholder="Enter name or tag ID" />
            <div class="quick-pick" v-if="femaleFlagged.length">
              <div class="qp-label">Quick pick:</div>
              <div class="qp-chips">
                <button v-for="f in femaleFlagged" :key="f.id"
                  :class="['qp-chip', pregnancyForm.goatName === f.name ? 'active' : '']"
                  @click="pregnancyForm.goatName = f.name; pregnancyForm.motherBreed = f.breed || ''">
                  {{ f.name }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mother's Breed</label>
              <select class="form-select" v-model="pregnancyForm.motherBreed">
                <option value="">— Unknown —</option>
                <option v-for="b in allGoatBreeds" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Father's Breed</label>
              <select class="form-select" v-model="pregnancyForm.fatherBreed">
                <option value="">— Unknown —</option>
                <option v-for="b in allGoatBreeds" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
          </div>

          <div class="hint-box breed-preview" v-if="offspringPreview">
            🧬 Offspring will be: <strong>{{ offspringPreview }}</strong>
          </div>

          <div class="form-group">
            <label class="form-label">Date Mated</label>
            <input class="form-input" type="date" v-model="pregnancyForm.mateDate" />
          </div>
          <div class="form-group">
            <label class="form-label">Expected Kids</label>
            <div class="qty-row">
              <button class="qty-btn" @click="pregnancyForm.expectedKids = Math.max(1, pregnancyForm.expectedKids - 1)">−</button>
              <input class="form-input qty-input" type="number" v-model.number="pregnancyForm.expectedKids" min="1" max="5" />
              <button class="qty-btn" @click="pregnancyForm.expectedKids = Math.min(5, pregnancyForm.expectedKids + 1)">+</button>
            </div>
          </div>
          <div class="hint-box">
            📅 Expected birth: <strong>{{ breedingStore.expectedBirthFromDate(pregnancyForm.mateDate) }}</strong><br>
            <span>Based on 150-day gestation</span>
          </div>
          <button class="btn-full" @click="submitPregnancy">Confirm Pregnancy</button>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- RECORD DEATH                                               -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'recordDeath'">
          <h2 class="modal-title">💀 Record Deaths</h2>
          <div class="form-group">
            <label class="form-label">Select Batch</label>
            <select class="form-select" v-model="quickDeathForm.batchId">
              <option value="" disabled>— Choose a batch —</option>
              <option v-for="b in animalStore.batches" :key="b.id" :value="b.id">
                {{ b.label || b.type + ' Batch' }} ({{ b.currentCount }} alive)
              </option>
            </select>
          </div>
          <div class="form-group" v-if="quickDeathForm.batchId">
            <label class="form-label">How many died?</label>
            <div class="qty-row">
              <button class="qty-btn" @click="quickDeathForm.quantity = Math.max(1, quickDeathForm.quantity - 1)">−</button>
              <input class="form-input qty-input" type="number" v-model.number="quickDeathForm.quantity" min="1" />
              <button class="qty-btn" @click="quickDeathForm.quantity++">+</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Cause of Death</label>
            <div class="cause-grid">
              <button v-for="c in deathCauses" :key="c.label"
                :class="['cause-btn', quickDeathForm.cause === c.label ? 'active' : '']"
                @click="quickDeathForm.cause = c.label">
                {{ c.icon }} {{ c.label }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="quickDeathForm.date" />
          </div>
          <button class="btn-full danger" @click="submitQuickDeath" :disabled="!quickDeathForm.batchId">Record Death</button>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- LOG EGGS                                                   -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'logEggs'">
          <h2 class="modal-title">🥚 Log Egg Collection</h2>
          <div class="form-group">
            <label class="form-label">Duck Flock</label>
            <select class="form-select" v-model="eggForm.batchId">
              <option value="" disabled>— Choose a flock —</option>
              <option v-for="b in animalStore.duckBatches" :key="b.id" :value="b.id">
                {{ b.label || 'Duck Batch' }} · {{ b.breed || 'Native' }} · {{ b.currentCount }} ducks
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Eggs Collected Today</label>
            <div class="qty-row">
              <button class="qty-btn" @click="eggForm.eggsCollected = Math.max(0, eggForm.eggsCollected - 1)">−</button>
              <input class="form-input qty-input" type="number" v-model.number="eggForm.eggsCollected" min="0" />
              <button class="qty-btn" @click="eggForm.eggsCollected++">+</button>
            </div>
            <div class="qty-hint" v-if="selectedDuckBatch && eggForm.eggsCollected > 0">
              Lay rate: <strong :style="{ color: layRate >= 70 ? 'var(--green)' : layRate >= 40 ? 'var(--amber)' : 'var(--red)' }">{{ layRate }}%</strong>
              ({{ eggForm.eggsCollected }} / {{ selectedDuckBatch.currentCount }} ducks)
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="eggForm.date" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="eggForm.notes" placeholder="e.g. some soft-shelled, rainy day" />
          </div>
          <button class="btn-full" @click="submitEggs" :disabled="!eggForm.batchId">Save Collection</button>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- LOG HATCH                                                  -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'logHatch'">
          <h2 class="modal-title">🐥 Record Hatch</h2>
          <div class="form-group">
            <label class="form-label">Duck Flock</label>
            <select class="form-select" v-model="hatchForm.batchId">
              <option value="" disabled>— Choose a flock —</option>
              <option v-for="b in animalStore.duckBatches" :key="b.id" :value="b.id">
                {{ b.label || 'Duck Batch' }} · {{ b.breed || 'Native' }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mother's Breed</label>
              <select class="form-select" v-model="hatchForm.motherBreed">
                <option value="">— Same as flock —</option>
                <option v-for="b in DUCK_BREEDS" :key="b">{{ b }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Father's Breed</label>
              <select class="form-select" v-model="hatchForm.fatherBreed">
                <option value="">— Same as flock —</option>
                <option v-for="b in DUCK_BREEDS" :key="b">{{ b }}</option>
              </select>
            </div>
          </div>

          <div class="hint-box breed-preview" v-if="duckOffspringPreview">
            🧬 Offspring will be: <strong>{{ duckOffspringPreview }}</strong>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Eggs Set</label>
              <input class="form-input" type="number" v-model.number="hatchForm.eggsSet" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Hatched</label>
              <input class="form-input" type="number" v-model.number="hatchForm.hatched" min="0" />
            </div>
          </div>

          <div class="hatch-rate-row" v-if="hatchForm.eggsSet > 0">
            Hatch rate:
            <strong :style="{ color: hatchRate >= 70 ? 'var(--green)' : hatchRate >= 40 ? 'var(--amber)' : 'var(--red)' }">
              {{ hatchRate }}%
            </strong>
            ({{ hatchForm.hatched }}/{{ hatchForm.eggsSet }})
          </div>

          <div class="form-group" style="margin-top:12px;">
            <label class="form-label">Hatch Date</label>
            <input class="form-input" type="date" v-model="hatchForm.hatchDate" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="hatchForm.notes" placeholder="e.g. incubated naturally, 28 days" />
          </div>
          <button class="btn-full" @click="submitHatch" :disabled="!hatchForm.batchId">Save Hatch Record</button>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- ADD HEALTH REMINDER                                        -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'addHealth'">
          <h2 class="modal-title">💊 Schedule Health Reminder</h2>

          <div class="form-group">
            <label class="form-label">For which animals?</label>
            <div class="seg-ctrl">
              <button v-for="t in ['Goat','Duck','All']" :key="t"
                :class="['seg-btn', healthForm.animalType === t ? 'active' : '']"
                @click="healthForm.animalType = t">
                {{ t === 'Goat' ? '🐐' : t === 'Duck' ? '🦆' : '🐾' }} {{ t }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Animal / Batch Name</label>
            <input class="form-input" v-model="healthForm.animal" placeholder="e.g. Flock A, Bella, all goats" />
            <div class="quick-pick" v-if="relevantBatches.length">
              <div class="qp-label">Quick pick:</div>
              <div class="qp-chips">
                <button v-for="b in relevantBatches" :key="b.id"
                  :class="['qp-chip', healthForm.animal === (b.label || b.type) ? 'active' : '']"
                  @click="healthForm.animal = b.label || b.type">
                  {{ b.label || b.type }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Treatment Type</label>
            <div class="treatment-grid">
              <button v-for="t in treatmentTypes" :key="t.label"
                :class="['treatment-btn', healthForm.treatmentType === t.label ? 'active' : '']"
                @click="healthForm.treatmentType = t.label">
                {{ t.icon }} {{ t.label }}
              </button>
            </div>
          </div>

          <div class="form-group" v-if="healthForm.treatmentType === 'Custom'">
            <label class="form-label">Custom Treatment Name</label>
            <input class="form-input" v-model="healthForm.customTreatment" placeholder="e.g. Hoof Trimming, Eye Drop" />
          </div>

          <div class="form-group">
            <label class="form-label">Medicine / Product <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="healthForm.medicine" placeholder="e.g. Ivermectin 1%, Vitamin B" />
          </div>

          <div class="form-group">
            <label class="form-label">Next Due Date</label>
            <input class="form-input" type="date" v-model="healthForm.nextDueDate" />
            <div class="qty-hint" v-if="healthForm.nextDueDate">
              🔔 You'll be reminded <strong>7 days before</strong> and on the due date itself.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Repeat Every</label>
            <div class="repeat-chips">
              <button v-for="p in healthStore.repeatPresets.filter(p => p.days !== -1)" :key="p.days"
                :class="['repeat-chip', !healthForm.customRepeat && healthForm.repeatEveryDays === p.days ? 'active' : '']"
                @click="healthForm.repeatEveryDays = p.days; healthForm.customRepeat = false">
                {{ p.label }}
              </button>
              <button :class="['repeat-chip', healthForm.customRepeat ? 'active' : '']"
                @click="healthForm.customRepeat = true">
                Custom…
              </button>
            </div>
            <div v-if="healthForm.customRepeat" class="custom-repeat-row">
              <span class="form-label" style="white-space:nowrap;">Every</span>
              <input class="form-input" type="number" v-model.number="healthForm.repeatEveryDays" min="1" style="width:80px;" />
              <span class="form-label">days</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes <span class="optional">(optional)</span></label>
            <input class="form-input" v-model="healthForm.notes" placeholder="Dosage, special instructions..." />
          </div>

          <button class="btn-full" @click="submitHealth">Set Reminder</button>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- SELL ANIMALS                                               -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="ui.activeModal === 'sellAnimal'">
          <h2 class="modal-title">💰 Sell Animals</h2>

          <!-- PICK BATCH -->
          <div class="form-group">
            <label class="form-label">Which batch?</label>
            <div class="sell-batch-list">
              <button
                v-for="b in animalStore.batches.filter(b => b.currentCount > 0)"
                :key="b.id"
                :class="['sell-batch-btn', sellForm.batchId === b.id ? 'active' : '']"
                @click="pickBatch(b)"
              >
                <span class="sbb-emoji">{{ animalStore.animalEmoji(b.type) }}</span>
                <span class="sbb-info">
                  <span class="sbb-label">{{ b.label || b.type }}</span>
                  <span class="sbb-meta">{{ b.breed || '' }} · {{ b.currentCount }} left · bought ₱{{ b.pricePerHead }}/head</span>
                </span>
              </button>
            </div>
          </div>

          <template v-if="selectedBatch">
            <!-- QUANTITY -->
            <div class="form-group">
              <label class="form-label">How many to sell?</label>
              <div class="qty-row">
                <button class="qty-btn" @click="sellForm.quantity = Math.max(1, sellForm.quantity - 1)">−</button>
                <input class="form-input qty-input" type="number" v-model.number="sellForm.quantity"
                  :max="selectedBatch.currentCount" min="1" />
                <button class="qty-btn" @click="sellForm.quantity = Math.min(selectedBatch.currentCount, sellForm.quantity + 1)">+</button>
              </div>
              <div class="qty-hint">{{ selectedBatch.currentCount }} available</div>
            </div>

            <!-- SELL PRICE -->
            <div class="form-group">
              <label class="form-label">Selling price per head (₱)</label>
              <input class="form-input amount-input" type="number"
                v-model.number="sellForm.pricePerHead" placeholder="0" />
            </div>

            <!-- PROFIT PREVIEW — the key thing -->
            <div :class="['profit-preview', profitPerHead >= 0 ? 'gain' : 'loss']" v-if="sellForm.pricePerHead">
              <div class="pp-row">
                <span>Sell price</span>
                <span>₱{{ formatNum(sellForm.pricePerHead) }} / head</span>
              </div>
              <div class="pp-row">
                <span>Buy price</span>
                <span>₱{{ formatNum(selectedBatch.pricePerHead || 0) }} / head</span>
              </div>
              <div class="pp-divider" />
              <div class="pp-row result">
                <span>{{ profitPerHead >= 0 ? '📈 Profit' : '📉 Loss' }} per head</span>
                <span :class="profitPerHead >= 0 ? 'green' : 'red'">
                  {{ profitPerHead >= 0 ? '+' : '' }}₱{{ formatNum(profitPerHead) }}
                </span>
              </div>
              <div class="pp-row result">
                <span>Total ({{ sellForm.quantity }} head)</span>
                <span :class="totalProfit >= 0 ? 'green' : 'red'">
                  {{ totalProfit >= 0 ? '+' : '' }}₱{{ formatNum(totalProfit) }}
                </span>
              </div>
            </div>

            <div class="form-row" style="margin-top:14px;">
              <div class="form-group">
                <label class="form-label">Sold to <span class="optional">(optional)</span></label>
                <input class="form-input" v-model="sellForm.soldTo" placeholder="Buyer name" />
              </div>
              <div class="form-group">
                <label class="form-label">Date</label>
                <input class="form-input" type="date" v-model="sellForm.soldDate" />
              </div>
            </div>

            <button class="btn-full" @click="submitSell"
              :disabled="!sellForm.pricePerHead || !sellForm.quantity">
              Confirm Sale · ₱{{ formatNum(sellForm.pricePerHead * sellForm.quantity) }} total
            </button>
          </template>

        </template>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useUIStore }       from '@/stores/ui'
import { useAnimalStore, GOAT_BREEDS, DUCK_BREEDS, computeOffspringBreed } from '@/stores/animals'
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
  'Feeds','Medicine','Veterinary','Labor','Equipment',
  'Animal Sale','Egg Sale','Milk Sale','Manure Sale','Other',
]

const deathCauses = [
  { icon: '🦠', label: 'Disease' },
  { icon: '🤕', label: 'Injury' },
  { icon: '🌿', label: 'Natural' },
  { icon: '❓', label: 'Unknown' },
  { icon: '🐺', label: 'Predator Attack' },
]

const treatmentTypes = [
  { icon: '💉', label: 'Vaccination' },
  { icon: '🪱', label: 'Deworming' },
  { icon: '💊', label: 'Antibiotic' },
  { icon: '🌿', label: 'Vitamins' },
  { icon: '🩹', label: 'Wound Treatment' },
  { icon: '🩺', label: 'Check-up' },
  { icon: '✏️', label: 'Custom' },
]

const allGoatBreeds = computed(() => {
  const base = [...GOAT_BREEDS]
  animalStore.goatBatches.forEach(b => {
    if (b.breed && !base.includes(b.breed)) base.push(b.breed)
  })
  return base
})

const currentBreeds = computed(() =>
  batchForm.type === 'Goat' ? GOAT_BREEDS : DUCK_BREEDS
)

function breedIcon(b) {
  return { 'Anglo-Nubian': '🐐', Native: '🌿', Indo: '🦆' }[b] ?? '🔀'
}

function formatNum(n) {
  return Number(n || 0).toLocaleString('en-PH')
}

// ── BATCH ──────────────────────────────────────────────────────────────────────
const saving = ref(false)
const batchForm = reactive({
  type: 'Duck', breed: 'Native', sex: 'Female',
  label: '', count: 1, pricePerHead: '',
  health: 'Healthy', addedDate: today, notes: '',
})

async function submitBatch() {
  if (saving.value) return
  saving.value = true
  const count = batchForm.count; const type = batchForm.type
  try {
    await animalStore.addBatch({ ...batchForm })
    Object.assign(batchForm, { type: 'Duck', breed: 'Native', sex: 'Female', label: '', count: 1, pricePerHead: '', health: 'Healthy', addedDate: today, notes: '' })
    ui.closeModal()
    ui.showToast(`✅ ${count > 1 ? count + ' ' + type + 's' : type} added!`)
  } finally { saving.value = false }
}

// ── EXPENSE ────────────────────────────────────────────────────────────────────
const expenseForm = reactive({ type: 'Expense', category: 'Feeds', amount: '', description: '', date: today })

function submitExpense() {
  if (!expenseForm.amount) { ui.showToast('⚠️ Enter an amount'); return }
  finance.addTransaction({ ...expenseForm })
  Object.assign(expenseForm, { type: 'Expense', category: 'Feeds', amount: '', description: '', date: today })
  ui.closeModal()
  ui.showToast('✅ Transaction saved!')
}

// ── PREGNANCY ──────────────────────────────────────────────────────────────────
const pregnancyForm = reactive({ goatName: '', mateDate: today, expectedKids: 1, motherBreed: '', fatherBreed: '' })
const femaleFlagged = computed(() => animalStore.flagged.filter(f => f.sex === 'Female'))
const offspringPreview = computed(() =>
  pregnancyForm.motherBreed && pregnancyForm.fatherBreed
    ? computeOffspringBreed(pregnancyForm.motherBreed, pregnancyForm.fatherBreed) : ''
)

function submitPregnancy() {
  if (!pregnancyForm.goatName) { ui.showToast('⚠️ Enter a goat name'); return }
  breedingStore.addPregnancy({ ...pregnancyForm, offspringBreed: offspringPreview.value })
  Object.assign(pregnancyForm, { goatName: '', mateDate: today, expectedKids: 1, motherBreed: '', fatherBreed: '' })
  ui.closeModal()
  ui.showToast('✅ Pregnancy tracked!')
}

// ── DEATH ──────────────────────────────────────────────────────────────────────
const quickDeathForm = reactive({ batchId: '', quantity: 1, cause: 'Disease', date: today })

async function submitQuickDeath() {
  if (!quickDeathForm.batchId) return
  await animalStore.recordDeaths({ ...quickDeathForm })
  Object.assign(quickDeathForm, { batchId: '', quantity: 1, cause: 'Disease', date: today })
  ui.closeModal()
  ui.showToast('🙏 Death recorded')
}

// ── EGGS ───────────────────────────────────────────────────────────────────────
const eggForm = reactive({ batchId: '', eggsCollected: 0, date: today, notes: '' })
const selectedDuckBatch = computed(() => animalStore.duckBatches.find(b => b.id === eggForm.batchId))
const layRate = computed(() => {
  if (!selectedDuckBatch.value?.currentCount) return 0
  return Math.min(100, Math.round((eggForm.eggsCollected / selectedDuckBatch.value.currentCount) * 100))
})

async function submitEggs() {
  if (!eggForm.batchId) return
  await animalStore.addEggRecord({ ...eggForm })
  Object.assign(eggForm, { batchId: '', eggsCollected: 0, date: today, notes: '' })
  ui.closeModal()
  ui.showToast('🥚 Egg collection logged!')
}

// ── HATCH ──────────────────────────────────────────────────────────────────────
const hatchForm = reactive({ batchId: '', motherBreed: '', fatherBreed: '', eggsSet: 0, hatched: 0, hatchDate: today, notes: '' })
const duckOffspringPreview = computed(() =>
  hatchForm.motherBreed && hatchForm.fatherBreed
    ? computeOffspringBreed(hatchForm.motherBreed, hatchForm.fatherBreed) : ''
)
const hatchRate = computed(() =>
  hatchForm.eggsSet > 0 ? Math.round((hatchForm.hatched / hatchForm.eggsSet) * 100) : 0
)

async function submitHatch() {
  if (!hatchForm.batchId) return
  await animalStore.addHatchRecord({ ...hatchForm })
  Object.assign(hatchForm, { batchId: '', motherBreed: '', fatherBreed: '', eggsSet: 0, hatched: 0, hatchDate: today, notes: '' })
  ui.closeModal()
  ui.showToast('🐥 Hatch record saved!')
}

// ── HEALTH REMINDER ────────────────────────────────────────────────────────────
const healthForm = reactive({
  animal: '', animalType: 'Goat',
  treatmentType: 'Vaccination', customTreatment: '',
  medicine: '', notes: '',
  nextDueDate: today,
  repeatEveryDays: 90,
  customRepeat: false,
})
const relevantBatches = computed(() => {
  if (healthForm.animalType === 'All') return animalStore.batches
  return animalStore.batches.filter(b => b.type === healthForm.animalType)
})

function submitHealth() {
  if (!healthForm.animal.trim()) { ui.showToast('⚠️ Enter animal or batch name'); return }
  if (!healthForm.nextDueDate)   { ui.showToast('⚠️ Set a due date');             return }
  healthStore.addReminder({ ...healthForm })
  Object.assign(healthForm, { animal: '', animalType: 'Goat', treatmentType: 'Vaccination', customTreatment: '', medicine: '', notes: '', nextDueDate: today, repeatEveryDays: 90, customRepeat: false })
  ui.closeModal()
  ui.showToast('📅 Reminder set!')
}

// ── SELL FORM ──────────────────────────────────────────────────────────────
const sellForm = reactive({
  batchId: '', quantity: 1, pricePerHead: '', soldTo: '', soldDate: today,
})
const selectedBatch = computed(() =>
  animalStore.batches.find(b => b.id === sellForm.batchId) || null
)
// Profit = sell price per head − buy price per head
const profitPerHead = computed(() =>
  selectedBatch.value
    ? (Number(sellForm.pricePerHead) || 0) - (Number(selectedBatch.value.pricePerHead) || 0)
    : 0
)
const totalProfit = computed(() => profitPerHead.value * sellForm.quantity)

function pickBatch(b) {
  sellForm.batchId = b.id
  sellForm.quantity = 1
  sellForm.pricePerHead = ''
}

async function submitSell() {
  if (!sellForm.batchId || !sellForm.pricePerHead || !sellForm.quantity) return
  await animalStore.sellFromBatch({ ...sellForm })
  const msg = totalProfit.value >= 0
    ? '✅ Sale recorded! +₱' + formatNum(totalProfit.value) + ' profit'
    : '✅ Sale recorded (₱' + formatNum(Math.abs(totalProfit.value)) + ' loss)'
  Object.assign(sellForm, { batchId: '', quantity: 1, pricePerHead: '', soldTo: '', soldDate: today })
  ui.closeModal()
  ui.showToast(msg)
}

</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 300; display: flex; align-items: flex-end; backdrop-filter: blur(4px);
}
.modal {
  background: var(--surface); border-radius: 24px 24px 0 0;
  width: 100%; max-width: 430px; margin: 0 auto;
  padding: 16px 20px 40px; max-height: 92vh; overflow-y: auto;
}
.modal-handle { width: 40px; height: 4px; border-radius: 2px; background: var(--border); margin: 0 auto 20px; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
.optional { font-size: 11px; color: var(--muted); font-weight: 400; }

.seg-ctrl { display: flex; background: var(--bg2); border-radius: 10px; padding: 3px; gap: 2px; }
.seg-btn {
  flex: 1; padding: 9px; border-radius: 8px; border: none;
  font-size: 12px; font-weight: 600; color: var(--muted);
  font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.15s; background: none;
}
.seg-btn.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
.seg-btn.active.danger  { color: var(--red); }
.seg-btn.active.success { color: var(--green); }

.breed-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.breed-chip {
  padding: 8px 14px; border-radius: 20px; border: 1.5px solid var(--border);
  background: var(--bg2); color: var(--muted);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.breed-chip.active { background: var(--green); border-color: var(--green); color: #fff; }

.hint-box {
  background: var(--green-pale); border-radius: 10px;
  padding: 12px; margin-bottom: 16px;
  font-size: 13px; color: var(--green); line-height: 1.6;
}
.hint-box span { color: var(--muted); font-size: 12px; }
.hint-box.breed-preview { background: var(--purple-pale); color: var(--purple); }

.cause-grid, .treatment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.cause-btn, .treatment-btn {
  padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--border);
  background: var(--bg2); color: var(--muted); text-align: left;
  font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.cause-btn.active     { border-color: var(--red);   background: var(--red-pale);   color: var(--red); }
.treatment-btn.active { border-color: var(--green); background: var(--green-pale); color: var(--green); }

.repeat-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.repeat-chip {
  padding: 6px 12px; border-radius: 20px; border: 1.5px solid var(--border);
  background: var(--bg2); color: var(--muted);
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.repeat-chip.active { background: var(--green); border-color: var(--green); color: #fff; }
.custom-repeat-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }

.hatch-rate-row {
  font-size: 13px; color: var(--muted);
  background: var(--bg2); border-radius: 8px; padding: 10px 12px; margin-bottom: 4px;
}

.quick-pick { margin-top: 8px; }
.qp-label { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
.qp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.qp-chip {
  padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
  border: 1.5px solid var(--border); background: var(--bg2); color: var(--muted);
  cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.15s;
}
.qp-chip.active { background: var(--green); border-color: var(--green); color: #fff; }

.qty-row { display: flex; align-items: center; gap: 10px; }
.qty-btn {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-size: 22px; font-weight: 700; color: var(--text);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.qty-btn:active { background: var(--border); transform: scale(0.92); }
.qty-input { text-align: center; font-size: 18px !important; font-weight: 700 !important; }
.qty-hint { margin-top: 8px; font-size: 12px; color: var(--muted); background: var(--bg2); border-radius: 8px; padding: 8px 10px; }
.qty-hint strong { color: var(--text); }
.amount-input { font-size: 22px !important; font-weight: 700 !important; font-family: 'JetBrains Mono', monospace !important; }

.btn-full {
  width: 100%; padding: 14px; border-radius: 12px; border: none; margin-top: 8px;
  background: var(--green); color: #fff; font-family: 'Outfit', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer;
}
.btn-full:disabled { opacity: 0.45; cursor: default; }
.btn-full.danger { background: var(--red); }

.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(100%); }

/* SELL MODAL */
.sell-batch-list { display: flex; flex-direction: column; gap: 8px; }
.sell-batch-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px;
  border: 1.5px solid var(--border); background: var(--bg2);
  text-align: left; cursor: pointer; transition: all 0.15s; width: 100%;
  font-family: 'Outfit', sans-serif;
}
.sell-batch-btn.active { border-color: var(--green); background: var(--green-pale); }
.sbb-emoji { font-size: 22px; flex-shrink: 0; }
.sbb-info  { display: flex; flex-direction: column; gap: 2px; }
.sbb-label { font-size: 14px; font-weight: 600; color: var(--text); }
.sbb-meta  { font-size: 11px; color: var(--muted); }

.profit-preview {
  border-radius: 12px; padding: 14px 16px; margin: 4px 0 8px;
  border: 1.5px solid;
}
.profit-preview.gain { background: var(--green-pale); border-color: var(--green); }
.profit-preview.loss { background: var(--red-pale);   border-color: var(--red); }
.pp-row {
  display: flex; justify-content: space-between;
  font-size: 13px; color: var(--muted); padding: 4px 0;
}
.pp-row.result { font-weight: 700; font-size: 14px; color: var(--text); }
.pp-divider { height: 1px; background: rgba(255,255,255,0.3); margin: 6px 0; }
.pp-row .green { color: var(--green); font-family: 'JetBrains Mono', monospace; }
.pp-row .red   { color: var(--red);   font-family: 'JetBrains Mono', monospace; }

</style>