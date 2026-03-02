<template>
  <div class="tx-item">
    <div class="tx-icon">{{ finance.categoryIcon(transaction.category) }}</div>
    <div class="tx-info">
      <div class="tx-name">{{ transaction.description || transaction.category }}</div>
      <div class="tx-meta">{{ transaction.date }} · {{ transaction.category }}</div>
    </div>
    <div :class="['tx-amount', transaction.type === 'Income' ? 'in' : 'out']">
      {{ transaction.type === 'Income' ? '+' : '-' }}₱{{ finance.formatNum(transaction.amount) }}
    </div>
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
  background: var(--surface); padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.tx-item:last-child { border-bottom: none; }
.tx-icon   { font-size: 20px; flex-shrink: 0; }
.tx-info   { flex: 1; }
.tx-name   { font-size: 14px; font-weight: 500; }
.tx-meta   { font-size: 11px; color: var(--muted); margin-top: 2px; }
.tx-amount { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; white-space: nowrap; }
.tx-amount.in  { color: var(--green); }
.tx-amount.out { color: var(--red);   }
</style>
