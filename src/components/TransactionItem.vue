<!-- src/components/TransactionItem.vue  ── FULL FILE -->
<template>
  <div class="tx-item">
    <div class="tx-left">
      <div :class="['tx-icon', transaction.type === 'Income' ? 'income' : 'expense']">
        {{ categoryIcon(transaction.category) }}
      </div>
      <div class="tx-info">
        <div class="tx-cat">{{ transaction.category }}</div>
        <div class="tx-desc" v-if="transaction.description">{{ transaction.description }}</div>
        <div class="tx-date">{{ transaction.date }}</div>
      </div>
    </div>
    <div class="tx-right">
      <div :class="['tx-amount', transaction.type === 'Income' ? 'positive' : 'negative']">
        {{ transaction.type === 'Income' ? '+' : '−' }}₱{{ formatNum(transaction.amount) }}
      </div>
      <button class="tx-del" @click="confirmDelete" title="Delete">×</button>
    </div>

    <!-- INLINE CONFIRM -->
    <Transition name="confirm-fade">
      <div class="tx-confirm" v-if="confirming">
        <span class="tc-msg">Delete this transaction?</span>
        <div class="tc-btns">
          <button class="tc-cancel" @click="confirming = false">Cancel</button>
          <button class="tc-delete" @click="doDelete">Delete</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useUIStore } from '@/stores/ui'

const props = defineProps({ transaction: Object })
const finance = useFinanceStore()
const ui = useUIStore()

const confirming = ref(false)

function confirmDelete() {
  confirming.value = true
}

async function doDelete() {
  await finance.removeTransaction(props.transaction.id)
  confirming.value = false
  ui.showToast('🗑️ Transaction deleted')
}

function categoryIcon(cat) {
  return finance.categoryIcon(cat)
}

function formatNum(n) {
  return Number(n || 0).toLocaleString('en-PH')
}
</script>

<style scoped>
.tx-item {
  position: relative;
  padding: 13px 0;
  border-bottom: 1px solid var(--bg2);
  overflow: hidden;
}
.tx-item:last-child { border-bottom: none; }

/* TOP ROW */
.tx-left  { display: flex; align-items: center; gap: 10px; }
.tx-right {
  position: absolute; top: 13px; right: 0;
  display: flex; align-items: center; gap: 6px;
}
.tx-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.tx-icon.income  { background: var(--green-pale); }
.tx-icon.expense { background: var(--red-pale); }

.tx-info { padding-right: 80px; }  /* leave room for amount + delete btn */
.tx-cat  { font-size: 13px; font-weight: 600; color: var(--text); }
.tx-desc { font-size: 11px; color: var(--muted); margin-top: 2px; }
.tx-date { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

.tx-amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px; font-weight: 700;
}
.tx-amount.positive { color: var(--green); }
.tx-amount.negative { color: var(--red); }

.tx-del {
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent;
  font-size: 16px; font-weight: 300; color: var(--muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  line-height: 1; flex-shrink: 0;
  transition: all 0.15s;
}
.tx-del:active { background: var(--red-pale); color: var(--red); border-color: var(--red); }

/* INLINE CONFIRM BAR */
.tx-confirm {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: 10px;
  background: var(--red-pale); border: 1px solid var(--red);
  border-radius: 10px; padding: 9px 12px;
}
.tc-msg { font-size: 12px; color: var(--red); font-weight: 500; }
.tc-btns { display: flex; gap: 6px; flex-shrink: 0; }
.tc-cancel, .tc-delete {
  padding: 5px 12px; border-radius: 7px;
  font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer;
}
.tc-cancel {
  border: 1px solid var(--border); background: var(--surface); color: var(--muted);
}
.tc-delete {
  border: none; background: var(--red); color: #fff;
}

.confirm-fade-enter-active, .confirm-fade-leave-active { transition: all 0.18s ease; }
.confirm-fade-enter-from, .confirm-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>