<template>
  <div>
    <PageHeader greeting="Farm" title="Reports & Analytics" />

    <div class="page-content">

      <!-- TABS -->
      <div class="tabs">
        <button
          v-for="t in tabs" :key="t.key"
          :class="['tab', activeTab === t.key ? 'active' : '']"
          @click="activeTab = t.key"
        >{{ t.label }}</button>
      </div>

      <!-- ── MONTHLY TAB ── -->
      <template v-if="activeTab === 'monthly'">
        <div class="section-title">This Month — {{ currentMonthLabel }}</div>
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="sc-val">{{ animalsAddedThisMonth }}</div>
            <div class="sc-label">Animals Added</div>
          </div>
          <div class="stat-card card">
            <div class="sc-val" style="color:var(--purple);">{{ breedingStore.pregnancyCount }}</div>
            <div class="sc-label">Active Pregnancies</div>
          </div>
          <div class="stat-card card">
            <div class="sc-val positive">₱{{ finance.formatNum(finance.monthIncome) }}</div>
            <div class="sc-label">Income</div>
          </div>
          <div class="stat-card card">
            <div class="sc-val negative">₱{{ finance.formatNum(finance.monthExpenses) }}</div>
            <div class="sc-label">Expenses</div>
          </div>
        </div>
      </template>

      <!-- ── ANIMALS TAB ── -->
      <template v-if="activeTab === 'animals'">
        <div class="section-title">Herd Composition</div>
        <div class="card breakdown-card">
          <div class="bar-row" v-for="item in animalStore.byType" :key="item.type">
            <div class="bar-icon">{{ item.emoji }}</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: item.pct + '%', background: item.color }">
                {{ item.type }}
              </div>
            </div>
            <div class="bar-val">{{ item.count }}</div>
          </div>
        </div>

        <div class="section-title">Gender Split</div>
        <div class="gender-grid">
          <div class="gender-card card">
            <div class="gc-icon">♂</div>
            <div class="gc-val blue">{{ animalStore.animals.filter(a => a.sex === 'Male').length }}</div>
            <div class="gc-label">Male</div>
          </div>
          <div class="gender-card card">
            <div class="gc-icon">♀</div>
            <div class="gc-val purple">{{ animalStore.animals.filter(a => a.sex === 'Female').length }}</div>
            <div class="gc-label">Female</div>
          </div>
        </div>

        <div class="section-title">Health Status</div>
        <div class="card breakdown-card">
          <div class="bar-row" v-for="h in healthBreakdown" :key="h.label">
            <div class="bar-icon">{{ h.icon }}</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: h.pct + '%', background: h.color }">{{ h.label }}</div>
            </div>
            <div class="bar-val">{{ h.count }}</div>
          </div>
        </div>
      </template>

      <!-- ── FINANCE TAB ── -->
      <template v-if="activeTab === 'finance'">
        <div class="section-title">Overall Finance Summary</div>
        <div class="finance-summary card">
          <div class="fs-row">
            <span class="fs-label">Capital Invested</span>
            <span class="fs-val">₱{{ finance.formatNum(finance.totalInvested) }}</span>
          </div>
          <div class="fs-row">
            <span class="fs-label">Total Income</span>
            <span class="fs-val positive">₱{{ finance.formatNum(finance.totalIncome) }}</span>
          </div>
          <div class="fs-row">
            <span class="fs-label">Total Expenses</span>
            <span class="fs-val negative">₱{{ finance.formatNum(finance.totalExpenses) }}</span>
          </div>
          <div class="fs-row divider-row">
            <span style="font-weight:700;">Net Profit / Loss</span>
            <span :class="['fs-val','big', finance.profit >= 0 ? 'positive' : 'negative']">
              {{ finance.profit >= 0 ? '+' : '' }}₱{{ finance.formatNum(finance.profit) }}
            </span>
          </div>
          <div class="fs-row">
            <span class="fs-label">Return on Investment (ROI)</span>
            <span :class="['fs-val', finance.roi >= 0 ? 'positive' : 'negative']">{{ finance.roi.toFixed(1) }}%</span>
          </div>
        </div>
      </template>

      <!-- ── SOLD ANIMALS TAB ── -->
      <template v-if="activeTab === 'sold'">

        <!-- SUMMARY CARDS -->
        <div class="stats-grid" style="margin-bottom:16px;">
          <div class="stat-card card">
            <div class="sc-val">{{ animalStore.soldAnimals.length }}</div>
            <div class="sc-label">Total Sold</div>
          </div>
          <div class="stat-card card">
            <div class="sc-val positive">₱{{ finance.formatNum(totalSoldRevenue) }}</div>
            <div class="sc-label">Total Revenue</div>
          </div>
          <div class="stat-card card">
            <div class="sc-val negative">₱{{ finance.formatNum(totalSoldCost) }}</div>
            <div class="sc-label">Total Cost</div>
          </div>
          <div class="stat-card card">
            <div :class="['sc-val', animalStore.totalSaleProfit >= 0 ? 'positive' : 'negative']">
              {{ animalStore.totalSaleProfit >= 0 ? '+' : '' }}₱{{ finance.formatNum(animalStore.totalSaleProfit) }}
            </div>
            <div class="sc-label">Net Profit</div>
          </div>
        </div>

        <!-- SOLD LIST -->
        <div class="section-title">Sold Animal Records</div>
        <div v-if="animalStore.soldAnimals.length" class="sold-list">
          <div class="sold-item card" v-for="s in animalStore.soldAnimals" :key="s.id">
            <div class="sold-emoji">{{ animalStore.animalEmoji(s.type) }}</div>
            <div class="sold-info">
              <div class="sold-name">{{ s.name || '(unnamed)' }} <span class="sold-type">{{ s.type }}</span></div>
              <div class="sold-meta">
                Sold {{ s.soldDate }}{{ s.soldTo ? ' → ' + s.soldTo : '' }}
              </div>
              <div class="sold-prices">
                <span class="sp-item">Cost: ₱{{ finance.formatNum(s.boughtFor) }}</span>
                <span class="sp-arrow">→</span>
                <span class="sp-item">Sold: ₱{{ finance.formatNum(s.soldFor) }}</span>
              </div>
            </div>
            <div :class="['sold-profit', s.profit >= 0 ? 'pos' : 'neg']">
              {{ s.profit >= 0 ? '+' : '' }}₱{{ finance.formatNum(s.profit) }}
            </div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <div class="empty-state-icon">💰</div>
          <div class="empty-state-text">No animals sold yet.<br>Tap 💰 on any animal to record a sale.</div>
        </div>

      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAnimalStore }   from '@/stores/animals'
import { useFinanceStore }  from '@/stores/finance'
import { useBreedingStore } from '@/stores/breeding'

const animalStore   = useAnimalStore()
const finance       = useFinanceStore()
const breedingStore = useBreedingStore()

const tabs = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'animals', label: 'Animals' },
  { key: 'finance', label: 'Finance' },
  { key: 'sold',    label: 'Sold 💰' },
]
const activeTab = ref('monthly')

const currentMonth      = new Date().toISOString().slice(0, 7)
const currentMonthLabel = new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

const animalsAddedThisMonth = computed(() =>
  animalStore.animals.filter(a => a.addedDate?.startsWith(currentMonth)).length
)

const healthBreakdown = computed(() => {
  const total = animalStore.animals.length || 1
  const map = {}
  animalStore.animals.forEach(a => { map[a.health] = (map[a.health] || 0) + 1 })
  const colors = { Healthy:'#2d6a4f', Pregnant:'#6b3fa0', Sick:'#c1121f', 'Under Treatment':'#c77c2a' }
  const icons  = { Healthy:'✅', Pregnant:'🤰', Sick:'🤒', 'Under Treatment':'💊' }
  return Object.entries(map).map(([label, count]) => ({
    label, count, pct: Math.round(count / total * 100),
    color: colors[label] ?? '#999', icon: icons[label] ?? '❓',
  }))
})

const totalSoldRevenue = computed(() =>
  animalStore.soldAnimals.reduce((s, a) => s + (Number(a.soldFor) || 0), 0)
)
const totalSoldCost = computed(() =>
  animalStore.soldAnimals.reduce((s, a) => s + (Number(a.boughtFor) || 0), 0)
)
</script>

<style scoped>
.tabs {
  display: flex; gap: 4px;
  background: var(--bg2); border-radius: 12px; padding: 4px;
  margin-bottom: 20px; overflow-x: auto;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  flex: 1; text-align: center; padding: 9px; white-space: nowrap;
  border-radius: 9px; font-size: 12px; font-weight: 500;
  cursor: pointer; border: none; background: none;
  font-family: 'Outfit', sans-serif; color: var(--muted); transition: all 0.15s;
}
.tab.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.stat-card  { padding: 16px; }
.sc-val     { font-size: 20px; font-weight: 700; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.sc-label   { font-size: 11px; color: var(--muted); margin-top: 4px; }
.sc-val.positive { color: var(--green); }
.sc-val.negative { color: var(--red); }

.breakdown-card { padding: 16px; margin-bottom: 20px; }
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.bar-row:last-child { margin-bottom: 0; }
.bar-icon { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
.bar-track { flex: 1; background: var(--bg2); border-radius: 4px; height: 22px; overflow: hidden; }
.bar-fill {
  height: 100%; border-radius: 4px; min-width: 40px;
  display: flex; align-items: center; padding-left: 8px;
  font-size: 10px; font-weight: 600; color: #fff; transition: width 0.6s ease;
}
.bar-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; width: 30px; text-align: right; flex-shrink: 0; }

.gender-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.gender-card { padding: 20px; text-align: center; }
.gc-icon { font-size: 28px; margin-bottom: 6px; }
.gc-val  { font-size: 28px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
.gc-val.blue   { color: var(--blue); }
.gc-val.purple { color: var(--purple); }
.gc-label { font-size: 12px; color: var(--muted); margin-top: 4px; }

.finance-summary { padding: 8px 16px 16px; }
.fs-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0; border-bottom: 1px solid var(--bg2);
}
.fs-row:last-child { border-bottom: none; padding-bottom: 0; }
.fs-row.divider-row { padding-top: 16px; }
.fs-label { font-size: 13px; color: var(--muted); }
.fs-val   { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; }
.fs-val.big { font-size: 20px; }
.fs-val.positive { color: var(--green); }
.fs-val.negative { color: var(--red); }

/* SOLD LIST */
.sold-list { display: flex; flex-direction: column; gap: 10px; }
.sold-item {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
}
.sold-emoji { font-size: 28px; flex-shrink: 0; }
.sold-info  { flex: 1; min-width: 0; }
.sold-name  { font-weight: 600; font-size: 14px; }
.sold-type  { font-size: 11px; color: var(--muted); font-weight: 400; margin-left: 4px; }
.sold-meta  { font-size: 11px; color: var(--muted); margin-top: 2px; }
.sold-prices { display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.sp-item { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--muted); }
.sp-arrow { font-size: 11px; color: var(--muted); }
.sold-profit {
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700;
  flex-shrink: 0; white-space: nowrap;
}
.sold-profit.pos { color: var(--green); }
.sold-profit.neg { color: var(--red); }
</style>