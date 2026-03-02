<template>
  <div>
    <PageHeader :greeting="greeting" title="Severino Farm">
      <template #right>
        <div style="text-align:right;">
          <div class="header-date">{{ todayStr }}</div>
          <button class="logout-btn" @click="handleLogout">Sign Out</button>
        </div>
      </template>
      <div class="header-stats cols-4">
        <div class="header-stat">
          <div class="header-stat-val">{{ animalStore.totalAnimals }}</div>
          <div class="header-stat-label">Total Animals</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val">₱{{ finance.formatNum(finance.totalInvested) }}</div>
          <div class="header-stat-label">Invested</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val" style="color:var(--green-light);">
            ₱{{ finance.formatNum(finance.totalIncome) }}
          </div>
          <div class="header-stat-label">Total Sold</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val" :style="{ color: finance.profit >= 0 ? '#7ee787' : '#f8a09d' }">
            {{ finance.profit >= 0 ? '+' : '' }}₱{{ finance.formatNum(finance.profit) }}
          </div>
          <div class="header-stat-label">Profit</div>
        </div>
      </div>
    </PageHeader>

    <div class="page-content">

      <!-- ALERTS -->
      <div v-if="allAlerts.length" class="alert-stack">
        <div v-for="(a, i) in allAlerts" :key="i" :class="['alert', a.type]">
          <div class="alert-dot" />
          <div class="alert-text" v-html="a.msg" />
        </div>
      </div>

      <!-- ANIMAL OVERVIEW -->
      <div class="section-title">
        Animals Overview
        <RouterLink to="/animals" class="link">See all →</RouterLink>
      </div>
      <div class="animal-grid">
        <!-- GOATS -->
        <div class="animal-card" @click="$router.push('/animals')">
          <span class="ac-emoji">🐐</span>
          <div class="ac-name">Goats</div>
          <div class="ac-count">{{ animalStore.goats.length }}</div>
          <div class="ac-sub">{{ animalStore.maleGoats.length }} male · {{ animalStore.femaleGoats.length }} female</div>
          <span class="tag purple ac-badge" v-if="breedingStore.pregnancyCount">{{ breedingStore.pregnancyCount }} pregnant</span>
        </div>
        <!-- DUCKS -->
        <div class="animal-card" @click="$router.push('/animals')">
          <span class="ac-emoji">🦆</span>
          <div class="ac-name">Ducks</div>
          <div class="ac-count">{{ animalStore.ducks.length }}</div>
          <div class="ac-sub">{{ maleDucks }} male · {{ femaleDucks }} female</div>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="section-title">Quick Actions</div>
      <div class="actions-grid">
        <button class="action-btn" @click="ui.openModal('addAnimal')">
          <div class="ai ai-green">🐐</div> Add Animal
        </button>
        <button class="action-btn" @click="ui.openModal('addExpense')">
          <div class="ai ai-amber">💰</div> Record Finance
        </button>
        <button class="action-btn" @click="ui.openModal('markPregnant')">
          <div class="ai ai-purple">🤰</div> Mark Pregnant
        </button>
        <button class="action-btn" @click="ui.openModal('addHealth')">
          <div class="ai ai-blue">💊</div> Health Record
        </button>
        <button class="action-btn" @click="ui.openModal('recordDeath')">
          <div class="ai ai-red">💀</div> Record Death
        </button>
        <button class="action-btn" @click="$router.push('/reports')">
          <div class="ai ai-green">📊</div> Reports
        </button>
      </div>

      <!-- FINANCE SUMMARY -->
      <div class="section-title">
        Finance Summary
        <RouterLink to="/finance" class="link">Details →</RouterLink>
      </div>
      <div class="finance-card card">
        <div class="finance-row">
          <span class="f-label">💰 Total Invested</span>
          <span class="f-val">₱{{ finance.formatNum(finance.totalInvested) }}</span>
        </div>
        <div class="finance-row">
          <span class="f-label">📥 Total Sold / Income</span>
          <span class="f-val positive">₱{{ finance.formatNum(finance.totalIncome) }}</span>
        </div>
        <div class="finance-row">
          <span class="f-label">📤 Total Expenses</span>
          <span class="f-val negative">₱{{ finance.formatNum(finance.totalExpenses) }}</span>
        </div>
        <div class="finance-row total">
          <span style="font-weight:700;">Net Profit / Loss</span>
          <span :class="['f-val', 'big', finance.profit >= 0 ? 'positive' : 'negative']">
            {{ finance.profit >= 0 ? '+' : '' }}₱{{ finance.formatNum(finance.profit) }}
          </span>
        </div>
      </div>

      <!-- PREGNANCY TRACKER -->
      <template v-if="breedingStore.pregnanciesWithProgress.length">
        <div class="section-title">
          🤰 Pregnancy Tracker
          <RouterLink to="/breeding" class="link">All →</RouterLink>
        </div>
        <div class="preg-stack">
          <PregnancyCard
            v-for="p in breedingStore.pregnanciesWithProgress.slice(0,3)"
            :key="p.id"
            :pregnancy="p"
          />
        </div>
      </template>

      <!-- RECENT TRANSACTIONS -->
      <div class="section-title">
        Recent Transactions
        <RouterLink to="/finance" class="link">All →</RouterLink>
      </div>
      <div class="card" v-if="finance.transactions.length">
        <TransactionItem
          v-for="t in finance.transactions.slice(0,5)"
          :key="t.id"
          :transaction="t"
        />
      </div>
      <div class="empty-state" v-else>
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">No transactions yet.<br>Tap "Record Finance" to add one.</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader      from '@/components/PageHeader.vue'
import PregnancyCard   from '@/components/PregnancyCard.vue'
import TransactionItem from '@/components/TransactionItem.vue'
import { useAnimalStore }   from '@/stores/animals'
import { useFinanceStore }  from '@/stores/finance'
import { useBreedingStore } from '@/stores/breeding'
import { useUIStore }       from '@/stores/ui'
import { useAuthStore }     from '@/stores/auth'

const animalStore   = useAnimalStore()
const finance       = useFinanceStore()
const breedingStore = useBreedingStore()
const ui            = useUIStore()
const auth          = useAuthStore()
const router        = useRouter()

const todayStr = new Date().toLocaleDateString('en-PH', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return 'Good morning 🌅'
  if (hour >= 12 && hour < 17) return 'Good afternoon ☀️'
  if (hour >= 17 && hour < 21) return 'Good evening 🌆'
  return 'Good night 🌙'
})

// Duck male/female counts
const maleDucks   = computed(() => animalStore.ducks.filter(a => a.sex === 'Male').length)
const femaleDucks = computed(() => animalStore.ducks.filter(a => a.sex === 'Female').length)

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

const allAlerts = computed(() => {
  const a = [...breedingStore.alerts]
  if (finance.profit < 0) a.push({ type: 'danger', msg: `Farm is currently at a <strong>loss of ₱${finance.formatNum(Math.abs(finance.profit))}</strong>. Review your expenses.` })
  a.push({ type: 'info', msg: 'Reminder: Deworm all goats if last treatment was 90+ days ago.' })
  return a
})
</script>

<style scoped>
.logout-btn {
  margin-top: 6px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  font-family: 'Outfit', sans-serif;
  font-size: 11px; font-weight: 500;
  padding: 5px 10px; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
  display: block; margin-left: auto;
}
.logout-btn:active { background: rgba(255,255,255,0.25); }

.alert-stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }

/* HEADER STATS - 4 columns */
.cols-4 { grid-template-columns: 1fr 1fr 1fr 1fr !important; }
.cols-4 .header-stat-val { font-size: 14px; }
.cols-4 .header-stat-label { font-size: 9px; }

/* ANIMAL GRID - 2 columns now (no chicken) */
.animal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.animal-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 12px;
  position: relative; overflow: hidden; cursor: pointer;
  transition: transform 0.15s;
}
.animal-card:active { transform: scale(0.97); }
.ac-emoji  { font-size: 26px; display: block; margin-bottom: 6px; }
.ac-name   { font-size: 11px; color: var(--muted); font-weight: 500; }
.ac-count  { font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1.2; }
.ac-sub    { font-size: 10px; color: var(--muted); margin-top: 4px; line-height: 1.4; }
.ac-badge  { position: absolute; top: 10px; right: 8px; font-size: 9px; }

/* QUICK ACTIONS */
.actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.action-btn {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 14px 12px;
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 600; color: var(--text);
  transition: all 0.15s;
}
.action-btn:active { transform: scale(0.96); background: var(--bg2); }
.ai {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0;
}
.ai-green  { background: var(--green-pale); }
.ai-amber  { background: var(--amber-pale); }
.ai-blue   { background: var(--blue-pale);  }
.ai-purple { background: var(--purple-pale); }
.ai-red    { background: var(--red-pale);   }

/* FINANCE */
.finance-card { padding: 6px 16px 16px; margin-bottom: 20px; }
.finance-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 0; border-bottom: 1px solid var(--bg2);
}
.finance-row:last-child { border-bottom: none; padding-bottom: 0; }
.finance-row.total { padding-top: 14px; }
.f-label  { font-size: 13px; color: var(--muted); }
.f-val    { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; }
.f-val.big { font-size: 18px; }
.f-val.positive { color: var(--green); }
.f-val.negative { color: var(--red);   }

/* PREGNANCY */
.preg-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
</style>