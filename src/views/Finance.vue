<template>
  <div>
    <PageHeader greeting="Farm" title="Finance Tracker">
      <template #right>
        <div :class="['profit-chip', finance.profit >= 0 ? 'positive' : 'negative']">
          {{ finance.profit >= 0 ? '+' : '' }}₱{{ finance.formatNum(finance.profit) }}
        </div>
      </template>
      <div class="header-stats cols-2">
        <div class="header-stat">
          <div class="header-stat-val" style="color:#7ee787;">
            ₱{{ finance.formatNum(finance.totalIncome) }}
          </div>
          <div class="header-stat-label">Total Income</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val" style="color:#f8a09d;">
            ₱{{ finance.formatNum(finance.operatingExpenses) }}
          </div>
          <div class="header-stat-label">Operating Costs</div>
        </div>
      </div>
    </PageHeader>

    <div class="page-content">

      <!-- ── ORPHAN CLEANUP BANNER ── -->
      <!-- Shows only when there are leftover Animal Sale transactions from before the fix -->
      <Transition name="banner-fade">
        <div class="cleanup-banner" v-if="finance.orphanedSaleTransactions.length && !cleanedUp">
          <div class="cb-left">
            <div class="cb-title">⚠️ Duplicate sale income detected</div>
            <div class="cb-msg">
              {{ finance.orphanedSaleTransactions.length }} old sale record{{ finance.orphanedSaleTransactions.length > 1 ? 's are' : ' is' }}
              adding <strong>₱{{ finance.formatNum(orphanTotal) }}</strong> to your total income.
              These are leftover entries from before a bug fix. Tap to remove them.
            </div>
          </div>
          <button class="cb-btn" :disabled="cleaning" @click="doCleanup">
            {{ cleaning ? 'Cleaning…' : 'Fix Now' }}
          </button>
        </div>
      </Transition>

      <!-- P&L CARD -->
      <div class="section-title">📊 Profit & Loss</div>
      <div class="pnl-card card">

        <div class="pnl-row">
          <span class="pnl-label">📥 Total Income</span>
          <span class="pnl-val positive">₱{{ finance.formatNum(finance.totalIncome) }}</span>
        </div>

        <div class="pnl-row">
          <span class="pnl-label">🌾 Operating Expenses</span>
          <span class="pnl-val negative">− ₱{{ finance.formatNum(finance.operatingExpenses) }}</span>
        </div>

        <template v-if="finance.deathLoss > 0">
          <div class="pnl-row">
            <span class="pnl-label">💀 Loss from Deaths</span>
            <span class="pnl-val negative">− ₱{{ finance.formatNum(finance.deathLoss) }}</span>
          </div>
        </template>

        <template v-if="finance.realizedSaleLoss > 0">
          <div class="pnl-row">
            <span class="pnl-label">📉 Below-Cost Sales</span>
            <span class="pnl-val negative">− ₱{{ finance.formatNum(finance.realizedSaleLoss) }}</span>
          </div>
        </template>

        <div class="pnl-divider" />

        <div class="pnl-row total">
          <span class="pnl-label-total">Net Profit / Loss</span>
          <span :class="['pnl-val', 'big', finance.profit >= 0 ? 'positive' : 'negative']">
            {{ finance.profit >= 0 ? '+' : '' }}₱{{ finance.formatNum(finance.profit) }}
          </span>
        </div>
      </div>

      <!-- INVESTMENT CARD -->
      <div class="section-title">
        🐾 Animal Investment
        <span class="section-hint">Not an expense — this is your asset</span>
      </div>
      <div class="invest-card card">
        <div class="invest-row">
          <span class="invest-label">Total Capital in Animals</span>
          <span class="invest-val">₱{{ finance.formatNum(finance.totalAnimalInvestment) }}</span>
        </div>
        <div class="invest-row">
          <span class="invest-label">ROI vs Investment</span>
          <span :class="['invest-roi', finance.roi >= 0 ? 'positive' : 'negative']">
            {{ finance.roi >= 0 ? '+' : '' }}{{ finance.roi.toFixed(1) }}%
          </span>
        </div>
        <div class="invest-note">
          💡 Animal purchases are tracked as investments. They only affect your P&L when animals die or are sold below cost.
        </div>
        <div class="invest-breakdown" v-if="finance.expenseBreakdown.length">
          <div class="ib-row" v-for="(cat, i) in finance.expenseBreakdown" :key="cat.name">
            <div class="ib-icon">{{ cat.icon }}</div>
            <div class="ib-track">
              <div
                class="ib-fill"
                :style="{ width: cat.pct + '%', background: barColors[i % barColors.length] }"
              >{{ cat.name }}</div>
            </div>
            <div class="ib-val">₱{{ finance.formatNum(cat.total) }}</div>
          </div>
        </div>
      </div>

      <!-- SUMMARY GRID -->
      <div class="section-title" style="margin-top:4px;">This Month</div>
      <div class="summary-grid">
        <div class="sum-card card">
          <div class="sum-label">Income</div>
          <div class="sum-val positive">₱{{ finance.formatNum(finance.monthIncome) }}</div>
        </div>
        <div class="sum-card card">
          <div class="sum-label">Expenses</div>
          <div class="sum-val negative">₱{{ finance.formatNum(finance.monthExpenses) }}</div>
        </div>
        <div class="sum-card card">
          <div class="sum-label">Deaths Loss</div>
          <div class="sum-val" :class="finance.deathLoss > 0 ? 'negative' : ''">
            {{ finance.deathLoss > 0 ? '−' : '' }}₱{{ finance.formatNum(finance.deathLoss) }}
          </div>
        </div>
        <div class="sum-card card">
          <div class="sum-label">Sale Loss</div>
          <div class="sum-val" :class="finance.realizedSaleLoss > 0 ? 'negative' : ''">
            {{ finance.realizedSaleLoss > 0 ? '−' : '' }}₱{{ finance.formatNum(finance.realizedSaleLoss) }}
          </div>
        </div>
      </div>

      <!-- OPERATING EXPENSES BREAKDOWN -->
      <template v-if="finance.transactionBreakdown.length">
        <div class="section-title">Operating Expense Breakdown</div>
        <div class="card breakdown-card">
          <div class="bar-row" v-for="(cat, i) in finance.transactionBreakdown" :key="cat.name">
            <div class="bar-icon">{{ cat.icon }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: cat.pct + '%', background: barColors[i % barColors.length] }"
              >{{ cat.name }}</div>
            </div>
            <div class="bar-val">₱{{ finance.formatNum(cat.total) }}</div>
          </div>
        </div>
      </template>

    

    </div>

    <button class="fab" @click="ui.openModal('addExpense')">+</button>
  </div>
</template>

<script setup>
import { ref, computed }   from 'vue'
import PageHeader          from '@/components/PageHeader.vue'
import { useFinanceStore } from '@/stores/finance'
import { useUIStore }      from '@/stores/ui'

const finance = useFinanceStore()
const ui      = useUIStore()

const barColors = ['#2d6a4f', '#c77c2a', '#1d6fa5', '#6b3fa0', '#c1121f', '#0e7490']

// ── ORPHAN CLEANUP ─────────────────────────────────────────────────────────
const cleaning  = ref(false)
const cleanedUp = ref(false)

const orphanTotal = computed(() =>
  finance.orphanedSaleTransactions.reduce((s, t) => s + Number(t.amount || 0), 0)
)

async function doCleanup() {
  cleaning.value = true
  try {
    const count = await finance.cleanupOrphanedSaleTransactions()
    ui.showToast(`✅ Removed ${count} duplicate sale entr${count === 1 ? 'y' : 'ies'} from income`)
    cleanedUp.value = true
  } catch (e) {
    ui.showToast('⚠️ Cleanup failed, try again')
    console.error(e)
  } finally {
    cleaning.value = false
  }
}
</script>

<style scoped>
.profit-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px; font-weight: 700; padding-top: 6px;
}
.profit-chip.positive { color: #7ee787; }
.profit-chip.negative { color: #f8a09d; }

/* CLEANUP BANNER */
.cleanup-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: #3d1f00; border: 1.5px solid var(--amber);
  border-radius: 12px; padding: 14px 16px; margin-bottom: 16px;
}
.cb-left  { flex: 1; }
.cb-title { font-size: 13px; font-weight: 700; color: var(--amber); margin-bottom: 4px; }
.cb-msg   { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.5; }
.cb-msg strong { color: #fff; }
.cb-btn {
  flex-shrink: 0; padding: 9px 16px; border-radius: 8px; border: none;
  background: var(--amber); color: #000; font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
}
.cb-btn:disabled { opacity: 0.5; }
.banner-fade-enter-active, .banner-fade-leave-active { transition: all 0.3s ease; }
.banner-fade-enter-from, .banner-fade-leave-to { opacity: 0; transform: translateY(-8px); }

/* P&L CARD */
.pnl-card { padding: 8px 16px 16px; margin-bottom: 20px; }
.pnl-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 0;
}
.pnl-row.total { padding-top: 14px; }
.pnl-label { font-size: 13px; color: var(--muted); }
.pnl-label-total { font-size: 15px; font-weight: 700; color: var(--text); }
.pnl-val { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; }
.pnl-val.big { font-size: 20px; font-weight: 800; }
.pnl-val.positive { color: var(--green); }
.pnl-val.negative { color: var(--red); }
.pnl-divider { height: 1px; background: var(--border); margin: 4px 0; }

/* INVESTMENT CARD */
.section-hint { font-size: 11px; color: var(--muted); font-weight: 400; margin-left: 4px; }
.invest-card { padding: 16px; margin-bottom: 20px; }
.invest-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--bg2);
}
.invest-row:last-of-type { border-bottom: none; }
.invest-label { font-size: 13px; color: var(--muted); }
.invest-val   { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: var(--text); }
.invest-roi   { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; }
.invest-roi.positive { color: var(--green); }
.invest-roi.negative { color: var(--red); }
.invest-note {
  background: var(--bg2); border-radius: 8px; padding: 10px 12px;
  font-size: 12px; color: var(--muted); margin: 12px 0; line-height: 1.5;
}
.invest-breakdown { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.ib-row { display: flex; align-items: center; gap: 10px; }
.ib-icon { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
.ib-track { flex: 1; background: var(--bg2); border-radius: 4px; height: 22px; overflow: hidden; }
.ib-fill {
  height: 100%; border-radius: 4px;
  display: flex; align-items: center; padding-left: 8px;
  font-size: 10px; font-weight: 600; color: #fff;
  min-width: 40px; transition: width 0.6s ease;
}
.ib-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); width: 54px; text-align: right; flex-shrink: 0; }

/* SUMMARY GRID */
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.sum-card { padding: 14px 16px; }
.sum-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.sum-val { font-size: 17px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.sum-val.positive { color: var(--green); }
.sum-val.negative { color: var(--red); }

/* BREAKDOWN BARS */
.breakdown-card { padding: 16px; margin-bottom: 20px; }
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.bar-row:last-child { margin-bottom: 0; }
.bar-icon { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
.bar-track { flex: 1; background: var(--bg2); border-radius: 4px; height: 22px; overflow: hidden; }
.bar-fill {
  height: 100%; border-radius: 4px;
  display: flex; align-items: center; padding-left: 8px;
  font-size: 10px; font-weight: 600; color: #fff;
  min-width: 40px; transition: width 0.6s ease;
}
.bar-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); width: 54px; text-align: right; flex-shrink: 0; }

.link { font-size: 12px; color: var(--green); font-weight: 500; cursor: pointer; }
</style>