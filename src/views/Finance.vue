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

      <!-- MAIN TABS -->
      <div class="main-tabs">
        <button v-for="t in mainTabs" :key="t.key"
          :class="['main-tab', activeMain === t.key ? 'active' : '']"
          @click="activeMain = t.key">
          {{ t.label }}
        </button>
      </div>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- OVERVIEW TAB                                             -->
      <!-- ════════════════════════════════════════════════════════ -->
      <template v-if="activeMain === 'overview'">

        <!-- ORPHAN CLEANUP BANNER -->
        <Transition name="banner-fade">
          <div class="cleanup-banner" v-if="finance.orphanedSaleTransactions.length && !cleanedUp">
            <div class="cb-left">
              <div class="cb-title">⚠️ Duplicate sale income detected</div>
              <div class="cb-msg">
                {{ finance.orphanedSaleTransactions.length }} old sale record{{ finance.orphanedSaleTransactions.length > 1 ? 's are' : ' is' }}
                adding <strong>₱{{ finance.formatNum(orphanTotal) }}</strong> to your total income. Tap to fix.
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
          <div class="pnl-sub" v-if="finance.totalSaleProfit > 0">
            <span class="pnl-sub-label">↳ Animal Sales</span>
            <span class="pnl-sub-val">₱{{ finance.formatNum(finance.totalSaleProfit) }}</span>
          </div>
          <div class="pnl-sub" v-if="finance.otherIncome > 0">
            <span class="pnl-sub-label">↳ Other Income</span>
            <span class="pnl-sub-val">₱{{ finance.formatNum(finance.otherIncome) }}</span>
          </div>
          <div class="pnl-row mt-8">
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
          <span class="section-hint">tracked as asset, not expense</span>
        </div>
        <div class="invest-card card">
          <div class="invest-row">
            <span class="invest-label">Capital Invested in Animals</span>
            <span class="invest-val">₱{{ finance.formatNum(finance.totalAnimalInvestment) }}</span>
          </div>
          <div class="invest-row">
            <span class="invest-label">ROI vs Investment</span>
            <span :class="['invest-roi', finance.roi >= 0 ? 'positive' : 'negative']">
              {{ finance.roi >= 0 ? '+' : '' }}{{ finance.roi.toFixed(1) }}%
            </span>
          </div>
          <div class="invest-note">
            💡 Animal purchases are assets. They affect P&L only when animals die or are sold below cost.
          </div>
          <div class="invest-breakdown" v-if="finance.expenseBreakdown.length">
            <div class="ib-row" v-for="(cat, i) in finance.expenseBreakdown" :key="cat.name">
              <div class="ib-icon">{{ cat.icon }}</div>
              <div class="ib-track">
                <div class="ib-fill" :style="{ width: cat.pct + '%', background: barColors[i % barColors.length] }">
                  {{ cat.name }}
                </div>
              </div>
              <div class="ib-val">₱{{ finance.formatNum(cat.total) }}</div>
            </div>
          </div>
        </div>

        <!-- THIS MONTH -->
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
            <div class="sum-label">Death Loss</div>
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

        <!-- 6-MONTH TREND -->
        <template v-if="finance.monthlyTrend.length">
          <div class="section-title">📈 6-Month Trend</div>
          <div class="trend-card card">
            <div class="trend-grid">
              <div class="trend-item" v-for="m in finance.monthlyTrend" :key="m.key">
                <div class="trend-label">{{ m.label }}</div>
                <div class="trend-bars">
                  <div class="trend-bar-wrap">
                    <div class="trend-bar income"
                      :style="{ height: trendBarHeight(m.income, 'income') + 'px' }"
                      :title="'Income: ₱' + finance.formatNum(m.income)" />
                  </div>
                  <div class="trend-bar-wrap">
                    <div class="trend-bar expense"
                      :style="{ height: trendBarHeight(m.expense, 'expense') + 'px' }"
                      :title="'Expense: ₱' + finance.formatNum(m.expense)" />
                  </div>
                </div>
                <div :class="['trend-net', m.net >= 0 ? 'pos' : 'neg']">
                  {{ m.net >= 0 ? '+' : '' }}{{ m.net >= 0 ? '₱'+finance.formatNum(m.net) : '-₱'+finance.formatNum(Math.abs(m.net)) }}
                </div>
              </div>
            </div>
            <div class="trend-legend">
              <span class="tl-item"><span class="tl-dot income" />Income</span>
              <span class="tl-item"><span class="tl-dot expense" />Expenses</span>
            </div>
          </div>
        </template>

        <!-- EXPENSE BREAKDOWN -->
        <template v-if="finance.transactionBreakdown.length">
          <div class="section-title">Operating Expense Breakdown</div>
          <div class="card breakdown-card">
            <div class="bar-row" v-for="(cat, i) in finance.transactionBreakdown" :key="cat.name">
              <div class="bar-icon">{{ cat.icon }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: cat.pct + '%', background: barColors[i % barColors.length] }">
                  {{ cat.name }}
                </div>
              </div>
              <div class="bar-val">₱{{ finance.formatNum(cat.total) }}</div>
            </div>
          </div>
        </template>

      </template>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- HISTORY TAB                                              -->
      <!-- ════════════════════════════════════════════════════════ -->
      <template v-if="activeMain === 'history'">

        <!-- FILTERS -->
        <div class="hist-filters">
          <div class="hist-search-wrap">
            <span class="hist-search-icon">🔍</span>
            <input
              class="hist-search"
              v-model="histSearch"
              placeholder="Search transactions…"
            />
            <button v-if="histSearch" class="hist-clear" @click="histSearch = ''">×</button>
          </div>

          <div class="hist-filter-row">
            <select class="hist-select" v-model="histType">
              <option value="">All Types</option>
              <option value="Income">💚 Income</option>
              <option value="Expense">🔴 Expense</option>
            </select>
            <select class="hist-select" v-model="histCategory">
              <option value="">All Categories</option>
              <option v-for="c in allCategories" :key="c" :value="c">{{ c }}</option>
            </select>
            <select class="hist-select" v-model="histMonth">
              <option value="">All Months</option>
              <option v-for="m in availableMonths" :key="m.key" :value="m.key">{{ m.label }}</option>
            </select>
          </div>
        </div>

        <!-- TOTALS BAR -->
        <div class="hist-totals" v-if="filteredTxns.length">
          <div class="ht-item">
            <span class="ht-label">Showing</span>
            <span class="ht-val">{{ filteredTxns.length }} records</span>
          </div>
          <div class="ht-item" v-if="filteredIncome > 0">
            <span class="ht-label">Income</span>
            <span class="ht-val positive">₱{{ finance.formatNum(filteredIncome) }}</span>
          </div>
          <div class="ht-item" v-if="filteredExpense > 0">
            <span class="ht-label">Expense</span>
            <span class="ht-val negative">₱{{ finance.formatNum(filteredExpense) }}</span>
          </div>
        </div>

        <!-- TRANSACTION LIST -->
        <div class="txn-list" v-if="filteredTxns.length">
          <div class="txn-group" v-for="group in groupedTxns" :key="group.date">
            <div class="txn-date-label">{{ formatDateLabel(group.date) }}</div>
            <div class="txn-card card"
              v-for="t in group.transactions"
              :key="t.id"
            >
              <div class="txn-left">
                <div :class="['txn-icon-wrap', t.type === 'Income' ? 'income' : 'expense']">
                  {{ finance.categoryIcon(t.category) }}
                </div>
                <div class="txn-info">
                  <div class="txn-cat">{{ t.category }}</div>
                  <div class="txn-desc" v-if="t.description">{{ t.description }}</div>
                  <div class="txn-date-sm">{{ t.date }}</div>
                </div>
              </div>
              <div class="txn-right">
                <div :class="['txn-amount', t.type === 'Income' ? 'positive' : 'negative']">
                  {{ t.type === 'Income' ? '+' : '−' }}₱{{ finance.formatNum(t.amount) }}
                </div>
                <button class="txn-del-btn" @click="confirmDeleteTxn(t)" title="Delete">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">
            {{ histSearch || histType || histCategory || histMonth ? 'No transactions match your filters.' : 'No transactions yet.\nTap + to record one.' }}
          </div>
          <button v-if="histSearch || histType || histCategory || histMonth"
            class="clear-filters-btn" @click="clearFilters">Clear Filters</button>
        </div>

      </template>

    </div>

    <!-- ── DELETE TRANSACTION CONFIRM ── -->
    <Transition name="confirm">
      <div class="overlay confirm-overlay" v-if="deleteTxnTarget" @click.self="deleteTxnTarget = null">
        <div class="confirm-box">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-title">Delete Transaction?</div>
          <div class="confirm-msg">
            <div :class="['del-txn-preview', deleteTxnTarget?.type === 'Income' ? 'income' : 'expense']">
              <span class="del-icon">{{ finance.categoryIcon(deleteTxnTarget?.category) }}</span>
              <div>
                <div class="del-cat">{{ deleteTxnTarget?.category }}</div>
                <div class="del-amt">
                  {{ deleteTxnTarget?.type === 'Income' ? '+' : '−' }}₱{{ finance.formatNum(deleteTxnTarget?.amount) }}
                </div>
                <div class="del-date">{{ deleteTxnTarget?.date }}</div>
              </div>
            </div>
            <p style="margin-top:10px;font-size:12px;color:var(--muted);">This cannot be undone.</p>
          </div>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="deleteTxnTarget = null">Cancel</button>
            <button class="btn-delete" @click="doDeleteTxn" :disabled="delTxnSaving">
              {{ delTxnSaving ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <button class="fab" @click="ui.openModal('addExpense')">+</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader          from '@/components/PageHeader.vue'
import { useFinanceStore } from '@/stores/finance'
import { useUIStore }      from '@/stores/ui'

const finance = useFinanceStore()
const ui      = useUIStore()

const barColors = ['#2d6a4f', '#c77c2a', '#1d6fa5', '#6b3fa0', '#c1121f', '#0e7490']

// ── TABS ───────────────────────────────────────────────────────────────────
const mainTabs = [
  { key: 'overview', label: '📊 Overview' },
  { key: 'history',  label: '📋 History' },
]
const activeMain = ref('overview')

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
    ui.showToast(`✅ Removed ${count} duplicate sale entr${count === 1 ? 'y' : 'ies'}`)
    cleanedUp.value = true
  } catch {
    ui.showToast('⚠️ Cleanup failed, try again')
  } finally {
    cleaning.value = false
  }
}

// ── HISTORY FILTERS ────────────────────────────────────────────────────────
const histSearch   = ref('')
const histType     = ref('')
const histCategory = ref('')
const histMonth    = ref('')

const allCategories = computed(() => {
  const cats = new Set(finance.transactions.map(t => t.category).filter(Boolean))
  return [...cats].sort()
})

const availableMonths = computed(() => {
  const months = new Set(finance.transactions.map(t => t.date?.slice(0, 7)).filter(Boolean))
  return [...months].sort((a, b) => b.localeCompare(a)).map(m => {
    const d = new Date(m + '-01')
    return {
      key: m,
      label: d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
    }
  })
})

function clearFilters() {
  histSearch.value   = ''
  histType.value     = ''
  histCategory.value = ''
  histMonth.value    = ''
}

const filteredTxns = computed(() => {
  return finance.transactions.filter(t => {
    if (histType.value     && t.type !== histType.value)         return false
    if (histCategory.value && t.category !== histCategory.value) return false
    if (histMonth.value    && !t.date?.startsWith(histMonth.value)) return false
    if (histSearch.value) {
      const q = histSearch.value.toLowerCase()
      return (
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)    ||
        String(t.amount).includes(q)
      )
    }
    return true
  })
})

// Group by date
const groupedTxns = computed(() => {
  const map = {}
  filteredTxns.value.forEach(t => {
    if (!map[t.date]) map[t.date] = []
    map[t.date].push(t)
  })
  return Object.entries(map)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, transactions]) => ({ date, transactions }))
})

const filteredIncome = computed(() =>
  filteredTxns.value.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0)
)
const filteredExpense = computed(() =>
  filteredTxns.value.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0)
)

function formatDateLabel(dateStr) {
  if (!dateStr) return dateStr
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === today.toISOString().slice(0, 10)) return 'Today'
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// ── TREND CHART ────────────────────────────────────────────────────────────
function trendBarHeight(val, type) {
  const maxIncome  = Math.max(...finance.monthlyTrend.map(m => m.income), 1)
  const maxExpense = Math.max(...finance.monthlyTrend.map(m => m.expense), 1)
  const max = type === 'income' ? maxIncome : maxExpense
  return Math.max(2, Math.round((val / max) * 48))
}

// ── DELETE TRANSACTION ─────────────────────────────────────────────────────
const deleteTxnTarget = ref(null)
const delTxnSaving    = ref(false)

function confirmDeleteTxn(t) {
  deleteTxnTarget.value = t
}

async function doDeleteTxn() {
  if (delTxnSaving.value) return
  delTxnSaving.value = true
  try {
    await finance.removeTransaction(deleteTxnTarget.value.id)
    ui.showToast('🗑️ Transaction deleted')
    deleteTxnTarget.value = null
  } catch {
    ui.showToast('⚠️ Failed to delete')
  } finally {
    delTxnSaving.value = false
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

/* MAIN TABS */
.main-tabs {
  display: flex; background: var(--bg2); border-radius: 14px;
  padding: 4px; gap: 4px; margin-bottom: 20px;
}
.main-tab {
  flex: 1; padding: 11px; border-radius: 11px; border: none;
  font-size: 13px; font-weight: 700;
  font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.15s;
  background: none; color: var(--muted);
}
.main-tab.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }

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
  padding: 11px 0; border-bottom: 1px solid var(--bg2);
}
.pnl-row.total    { border-bottom: none; padding-top: 14px; }
.pnl-row.mt-8     { margin-top: 4px; }
.pnl-sub {
  display: flex; justify-content: space-between; padding: 4px 0 4px 16px;
  border-bottom: 1px solid var(--bg2);
}
.pnl-sub-label { font-size: 11px; color: var(--muted); }
.pnl-sub-val   { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
.pnl-label { font-size: 13px; color: var(--muted); }
.pnl-label-total { font-size: 15px; font-weight: 700; color: var(--text); }
.pnl-val { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; }
.pnl-val.big { font-size: 20px; font-weight: 800; }
.pnl-val.positive { color: var(--green); }
.pnl-val.negative { color: var(--red); }
.pnl-divider { height: 1px; background: var(--border); margin: 4px 0; }

/* INVESTMENT */
.section-hint { font-size: 11px; color: var(--muted); font-weight: 400; margin-left: 4px; }
.invest-card { padding: 16px; margin-bottom: 20px; }
.invest-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--bg2);
}
.invest-label { font-size: 13px; color: var(--muted); }
.invest-val   { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; }
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
  font-size: 10px; font-weight: 600; color: #fff; min-width: 40px;
  transition: width 0.6s ease;
}
.ib-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); width: 54px; text-align: right; flex-shrink: 0; }

/* SUMMARY GRID */
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.sum-card { padding: 14px 16px; }
.sum-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.sum-val { font-size: 17px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.sum-val.positive { color: var(--green); }
.sum-val.negative { color: var(--red); }

/* TREND CHART */
.trend-card { padding: 16px; margin-bottom: 20px; }
.trend-grid { display: flex; justify-content: space-between; align-items: flex-end; gap: 4px; }
.trend-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.trend-label { font-size: 10px; color: var(--muted); font-weight: 600; }
.trend-bars { display: flex; gap: 3px; align-items: flex-end; height: 56px; }
.trend-bar-wrap { display: flex; align-items: flex-end; height: 56px; }
.trend-bar { width: 10px; border-radius: 3px 3px 0 0; transition: height 0.4s ease; min-height: 2px; }
.trend-bar.income  { background: var(--green); }
.trend-bar.expense { background: var(--red); opacity: 0.7; }
.trend-net { font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 700; white-space: nowrap; }
.trend-net.pos { color: var(--green); }
.trend-net.neg { color: var(--red); }
.trend-legend { display: flex; justify-content: center; gap: 16px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--bg2); }
.tl-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted); }
.tl-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
.tl-dot.income  { background: var(--green); }
.tl-dot.expense { background: var(--red); opacity: 0.7; }

/* BREAKDOWN BARS */
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
.bar-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); width: 54px; text-align: right; flex-shrink: 0; }

/* HISTORY FILTERS */
.hist-filters { margin-bottom: 14px; display: flex; flex-direction: column; gap: 8px; }
.hist-search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 10px; padding: 0 12px; height: 42px;
}
.hist-search-icon { font-size: 14px; flex-shrink: 0; }
.hist-search {
  flex: 1; border: none; background: transparent; font-family: 'Outfit', sans-serif;
  font-size: 13px; color: var(--text); outline: none;
}
.hist-search::placeholder { color: var(--muted); }
.hist-clear {
  width: 22px; height: 22px; border-radius: 50%; border: none;
  background: var(--bg2); color: var(--muted); font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.hist-filter-row { display: flex; gap: 8px; }
.hist-select {
  flex: 1; padding: 8px 10px; border-radius: 8px;
  border: 1.5px solid var(--border); background: var(--surface);
  font-family: 'Outfit', sans-serif; font-size: 11px; color: var(--text); outline: none;
}

/* TOTALS BAR */
.hist-totals {
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  background: var(--bg2); border-radius: 8px; padding: 10px 14px;
  margin-bottom: 12px;
}
.ht-item { display: flex; gap: 5px; align-items: center; }
.ht-label { font-size: 11px; color: var(--muted); }
.ht-val   { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.ht-val.positive { color: var(--green); }
.ht-val.negative { color: var(--red); }

/* TRANSACTION LIST */
.txn-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px; }
.txn-group { margin-bottom: 16px; }
.txn-date-label {
  font-size: 11px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 0 4px 8px;
}
.txn-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; margin-bottom: 6px;
}
.txn-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.txn-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.txn-icon-wrap {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.txn-icon-wrap.income  { background: var(--green-pale); }
.txn-icon-wrap.expense { background: var(--red-pale); }

.txn-info { flex: 1; min-width: 0; }
.txn-cat  { font-weight: 600; font-size: 13px; }
.txn-desc { font-size: 11px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.txn-date-sm { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

.txn-amount { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; }
.txn-amount.positive { color: var(--green); }
.txn-amount.negative { color: var(--red); }

.txn-del-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
  background: transparent; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: var(--muted);
  transition: all 0.15s; flex-shrink: 0;
}
.txn-del-btn:active { background: var(--red-pale); border-color: var(--red); }

.clear-filters-btn {
  margin-top: 12px; padding: 8px 20px; border-radius: 8px;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-family: 'Outfit', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer;
}

/* CONFIRM BOX */
.overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.confirm-overlay { align-items: center; justify-content: center; padding: 24px; }
.confirm-box {
  background: var(--surface); border-radius: 20px;
  padding: 24px 20px; width: 100%; max-width: 340px;
}
.confirm-icon  { font-size: 32px; text-align: center; margin-bottom: 8px; }
.confirm-title { font-size: 17px; font-weight: 700; text-align: center; margin-bottom: 12px; }
.confirm-msg   { text-align: center; }
.confirm-btns  { display: flex; gap: 10px; margin-top: 16px; }

.del-txn-preview {
  display: flex; align-items: center; gap: 12px;
  border-radius: 10px; padding: 12px 14px; text-align: left;
}
.del-txn-preview.income  { background: var(--green-pale); }
.del-txn-preview.expense { background: var(--red-pale); }
.del-icon { font-size: 24px; flex-shrink: 0; }
.del-cat  { font-weight: 700; font-size: 14px; }
.del-amt  { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; margin-top: 2px; }
.del-date { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }

.btn-cancel {
  flex: 1; padding: 11px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--bg2);
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  color: var(--muted); cursor: pointer;
}
.btn-delete {
  flex: 2; padding: 11px; border-radius: 10px; border: none;
  background: var(--red); font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 700; color: #fff; cursor: pointer;
}
.btn-delete:disabled { opacity: 0.5; }

.confirm-enter-active, .confirm-leave-active { transition: all 0.2s ease; }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-box, .confirm-leave-to .confirm-box { transform: scale(0.92); }
</style>