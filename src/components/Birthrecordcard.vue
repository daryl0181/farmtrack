<template>
  <div class="birth-card card">

    <!-- TOP ROW -->
    <div class="bc-top">
      <div class="bc-icon">🐣</div>
      <div class="bc-info">
        <div class="bc-name">{{ record.goatName }}</div>
        <div class="bc-date">{{ record.birthDate }}</div>
        <div class="bc-breed" v-if="record.offspringBreed">🧬 {{ record.offspringBreed }}</div>
        <div class="bc-parents" v-if="record.motherBreed && record.fatherBreed">
          ♀ {{ record.motherBreed }} × ♂ {{ record.fatherBreed }}
        </div>
      </div>
      <div class="bc-badge">
        <div class="bc-total">{{ record.kidsCount }}</div>
        <div class="bc-total-label">kids born</div>
      </div>
    </div>

    <!-- KID PILLS -->
    <div class="bc-kids">
      <div class="kid-pill male">♂ {{ record.maleKids }} male</div>
      <div class="kid-pill female">♀ {{ record.femaleKids }} female</div>
    </div>

    <!-- DELETE BUTTON or CONFIRM BAR -->
    <div class="bc-footer">
      <Transition name="swap" mode="out-in">
        <div class="confirm-bar" v-if="confirming" key="confirm">
          <span class="confirm-text">Delete this birth record?</span>
          <div class="confirm-btns">
            <button class="btn-cancel" @click="confirming = false">Cancel</button>
            <button class="btn-del" @click="doDelete" :disabled="deleting">
              {{ deleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
        <button class="del-btn" v-else key="del" @click="confirming = true">
          🗑️ Delete Record
        </button>
      </Transition>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBreedingStore } from '@/stores/breeding'

const props = defineProps({
  record: { type: Object, required: true },
})

const breedingStore = useBreedingStore()
const confirming    = ref(false)
const deleting      = ref(false)

async function doDelete() {
  deleting.value = true
  try {
    await breedingStore.removeBirthRecord(props.record.id)
  } finally {
    deleting.value = false
    confirming.value = false
  }
}
</script>

<style scoped>
.birth-card { padding: 16px; }

/* TOP */
.bc-top  { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.bc-icon { font-size: 28px; flex-shrink: 0; }
.bc-info { flex: 1; min-width: 0; }
.bc-name    { font-weight: 700; font-size: 15px; }
.bc-date    { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
.bc-breed   { font-size: 11px; color: var(--purple); margin-top: 4px; font-weight: 500; }
.bc-parents { font-size: 10px; color: var(--muted); margin-top: 2px; }

.bc-badge { text-align: center; flex-shrink: 0; }
.bc-total       { font-size: 28px; font-weight: 800; line-height: 1; font-family: 'JetBrains Mono', monospace; color: var(--green); }
.bc-total-label { font-size: 10px; color: var(--muted); margin-top: 2px; }

/* KIDS */
.bc-kids { display: flex; gap: 8px; margin-bottom: 12px; }
.kid-pill { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
.kid-pill.male   { background: var(--blue-pale);   color: var(--blue); }
.kid-pill.female { background: var(--purple-pale);  color: var(--purple); }

/* FOOTER */
.bc-footer {
  border-top: 1px solid var(--bg2);
  padding-top: 10px;
  min-height: 38px;
}

.del-btn {
  width: 100%; padding: 9px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--bg2);
  color: var(--muted); font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; text-align: center;
}
.del-btn:active { background: var(--red-pale); border-color: var(--red); color: var(--red); }

/* CONFIRM BAR */
.confirm-bar {
  background: var(--red-pale); border: 1.5px solid var(--red);
  border-radius: 10px; padding: 10px 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.confirm-text { font-size: 12px; font-weight: 600; color: var(--red); flex: 1; }
.confirm-btns { display: flex; gap: 6px; flex-shrink: 0; }

.btn-cancel {
  padding: 6px 12px; border-radius: 8px; border: 1.5px solid var(--border);
  background: var(--surface); color: var(--muted);
  font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer;
} 
.btn-del {
  padding: 6px 14px; border-radius: 8px; border: none;
  background: var(--red); color: #fff;
  font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer;
}
.btn-del:disabled { opacity: 0.5; }

/* TRANSITION */
.swap-enter-active, .swap-leave-active { transition: all 0.18s ease; }
.swap-enter-from { opacity: 0; transform: translateY(4px); }
.swap-leave-to   { opacity: 0; transform: translateY(-4px); }
</style>