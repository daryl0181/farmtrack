<template>
  <div class="tx-item">
    <div :class="['tx-icon-wrap', transaction.type === 'Income' ? 'income' : 'expense']">
      <span class="tx-icon">{{ finance.categoryIcon(transaction.category) }}</span>
    </div>
    <div class="tx-info">
      <div class="tx-name">{{ transaction.description || transaction.category }}</div>
      <div class="tx-meta">
        <span class="tx-date">{{ transaction.date }}</span>
        <span class="tx-sep">·</span>
        <span class="tx-cat">{{ transaction.category }}</span>
      </div>
    </div>
    <div class="tx-right">
      <div :class="['tx-amount', transaction.type === 'Income' ? 'in' : 'out']">
        {{ transaction.type === 'Income' ? '+' : '-' }}₱{{ finance.formatNum(transaction.amount) }}
      </div>
      <div :class="['tx-type-badge', transaction.type === 'Income' ? 'in' : 'out']">
        {{ transaction.type }}
      </div>
    </div>
    <button class="tx-delete" @click.stop="finance.removeTransaction(transaction.id)" title="Delete">×</button>
  </div>
</template>

<script setup>
import { useFinanceStore } from '@/stores/finance'
const finance = useFinanceStore()

defineProps({
  transaction: { type: Object, required: true },
})
</script>

<style scoped>
.tx-item {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface); padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.tx-item:last-child { border-bottom: none; }
.tx-item:active { background: var(--bg2); }

.tx-icon-wrap {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tx-icon-wrap.income  { background: var(--green-pale); }
.tx-icon-wrap.expense { background: var(--red-pale); }

.tx-icon { font-size: 18px; }

.tx-info  { flex: 1; min-width: 0; }
.tx-name  { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-meta  { display: flex; align-items: center; gap: 4px; margin-top: 3px; }
.tx-date  { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
.tx-sep   { font-size: 10px; color: var(--border); }
.tx-cat   { font-size: 11px; color: var(--muted); }

.tx-right { text-align: right; flex-shrink: 0; }
.tx-amount { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; }
.tx-amount.in  { color: var(--green); }
.tx-amount.out { color: var(--red);   }
.tx-type-badge {
  font-size: 9px; font-weight: 600; margin-top: 3px;
  padding: 2px 6px; border-radius: 4px; display: inline-block;
}
.tx-type-badge.in  { background: var(--green-pale); color: var(--green); }
.tx-type-badge.out { background: var(--red-pale);   color: var(--red); }

.tx-delete {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent;
  font-size: 16px; font-weight: 300; color: var(--muted);
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: all 0.15s; line-height: 1;
}
.tx-delete:active { background: var(--red-pale); border-color: var(--red); color: var(--red); }
</style>