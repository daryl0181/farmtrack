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
          <div class="header-stat-val" style="color:#7ee787;">₱{{ finance.formatNum(finance.totalIncome) }}</div>
          <div class="header-stat-label">Total Income</div>
        </div>
        <div class="header-stat">
          <div class="header-stat-val" style="color:#f8a09d;">₱{{ finance.formatNum(finance.totalExpenses) }}</div>
          <div class="header-stat-label">Total Expenses</div>
        </div>
      </div>
    </PageHeader>

    <div class="page-content">

      <!-- EXPENSE BREAKDOWN -->
      <div class="section-title">Expense Breakdown</div>
      <div class="card breakdown-card" v-if="finance.expenseBreakdown.length">
        <div class="bar-row" v-for="(cat, i) in finance.expenseBreakdown" :key="cat.name">
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

      <!-- SUMMARY ROW -->
      <div class="section-title" style="margin-top:4px;">Summary</div>
      <div class="summary-grid">
        <div class="sum-card card">
          <div class="sum-label">Invested</div>
          <div class="sum-val">₱{{ finance.formatNum(finance.totalInvested) }}</div>
        </div>
        <div class="sum-card card">
          <div class="sum-label">ROI</div>
          <div class="sum-val" :class="finance.roi >= 0 ? 'positive' : 'negative'">{{ finance.roi.toFixed(1) }}%</div>
        </div>
        <div class="sum-card card">
          <div class="sum-label">This Month In</div>
          <div class="sum-val positive">₱{{ finance.formatNum(finance.monthIncome) }}</div>
        </div>
        <div class="sum-card card">
          <div class="sum-label">This Month Out</div>
          <div class="sum-val negative">₱{{ finance.formatNum(finance.monthExpenses) }}</div>
        </div>
      </div>

      <!-- ALL TRANSACTIONS -->
      <div class="section-title">
        All Transactions
        <span class="link" @click="ui.openModal('addExpense')">+ Add</span>
      </div>
      <div class="card" v-if="finance.transactions.length">
        <TransactionItem
          v-for="t in finance.transactions"
          :key="t.id"
          :transaction="t"
        />
      </div>
      <div class="empty-state" v-else>
        <div class="empty-state-icon">💸</div>
        <div class="empty-state-text">No transactions yet.</div>
      </div>

    </div>

    <button class="fab" @click="ui.openModal('addExpense')">+</button>
  </div>
</template>

<script setup>
import PageHeader      from '@/components/PageHeader.vue'
import TransactionItem from '@/components/TransactionItem.vue'
import { useFinanceStore } from '@/stores/finance'
import { useUIStore }      from '@/stores/ui'

const finance = useFinanceStore()
const ui      = useUIStore()

const barColors = ['#2d6a4f','#c77c2a','#1d6fa5','#6b3fa0','#c1121f','#0e7490']
</script>

<style scoped>
.profit-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px; font-weight: 700; padding-top: 6px;
}
.profit-chip.positive { color: #7ee787; }
.profit-chip.negative { color: #f8a09d; }

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

.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.sum-card { padding: 14px 16px; }
.sum-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.sum-val { font-size: 17px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.sum-val.positive { color: var(--green); }
.sum-val.negative { color: var(--red); }

.link { font-size: 12px; color: var(--green); font-weight: 500; cursor: pointer; }
</style>
