<template>
  <div class="pregnancy-item card">
    <div class="preg-icon">🐐</div>
    <div class="preg-info">
      <div class="preg-name">{{ pregnancy.goatName }}</div>
      <div class="preg-due">Due: {{ pregnancy.expectedBirth }} · {{ pregnancy.expectedKids }} kid{{ pregnancy.expectedKids > 1 ? 's' : '' }} expected</div>
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{
            width: pregnancy.progress + '%',
            background: pregnancy.daysLeft < 14 ? 'var(--amber)' : 'var(--green)',
          }"
        />
      </div>
      <div class="preg-progress-label">{{ Math.round(pregnancy.progress) }}% complete</div>
    </div>

    <div class="preg-right">
      <div class="preg-days">
        <div class="preg-days-num" :style="{ color: pregnancy.daysLeft < 14 ? 'var(--amber)' : 'var(--green)' }">
          {{ pregnancy.daysLeft }}
        </div>
        <div class="preg-days-label">days left</div>
      </div>

      <button class="birth-btn" @click="emit('record-birth', pregnancy)">🐣 Birth</button>
      <button class="del-btn" @click="confirmingDelete = true" v-if="!confirmingDelete">🗑️</button>
    </div>

    <!-- INLINE DELETE CONFIRM -->
    <Transition name="confirm-slide">
      <div class="confirm-bar" v-if="confirmingDelete">
        <span class="confirm-text">Remove pregnancy?</span>
        <button class="confirm-cancel" @click="confirmingDelete = false">Cancel</button>
        <button class="confirm-del" @click="doDelete">Delete</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBreedingStore } from '@/stores/breeding'

const props = defineProps({
  pregnancy: { type: Object, required: true },
})

const emit = defineEmits(['record-birth'])

const breedingStore = useBreedingStore()
const confirmingDelete = ref(false)

async function doDelete() {
  await breedingStore.removePregnancy(props.pregnancy.id)
}
</script>

<style scoped>
.pregnancy-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; position: relative; overflow: hidden;
  flex-wrap: wrap;
  transition: transform 0.15s;
}
.pregnancy-item:active { transform: scale(0.98); }

.preg-icon { font-size: 28px; flex-shrink: 0; }

.preg-info { flex: 1; min-width: 0; }
.preg-name { font-weight: 700; font-size: 15px; }
.preg-due  { font-size: 11px; color: var(--muted); margin-top: 2px; }

.progress-track {
  margin-top: 8px; height: 5px;
  background: var(--bg2); border-radius: 4px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 4px; transition: width 0.6s ease;
}
.preg-progress-label { font-size: 10px; color: var(--muted); margin-top: 4px; }

/* RIGHT SIDE: days + delete */
.preg-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }

.preg-days { text-align: right; }
.preg-days-num   { font-size: 24px; font-weight: 800; line-height: 1; font-family: 'JetBrains Mono', monospace; }
.preg-days-label { font-size: 10px; color: var(--muted); margin-top: 2px; }

.birth-btn {
  background: var(--green-pale); border: 1px solid var(--green);
  border-radius: 7px; padding: 3px 9px; font-size: 12px; font-weight: 600;
  color: var(--green); cursor: pointer; line-height: 1.6;
  transition: all 0.15s;
}
.birth-btn:active { background: var(--green); color: #fff; }

.del-btn {
  background: none; border: 1px solid var(--border);
  border-radius: 7px; padding: 3px 7px; font-size: 13px;
  color: var(--muted); cursor: pointer; line-height: 1.4;
  transition: all 0.15s;
}
.del-btn:active { background: var(--red-pale); border-color: var(--red); color: var(--red); }

/* INLINE CONFIRM BAR */
.confirm-bar {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 10px 0 0; border-top: 1px solid var(--border);
  flex-basis: 100%;
}
.confirm-text { flex: 1; font-size: 12px; color: var(--muted); }
.confirm-cancel {
  padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
  border: 1.5px solid var(--border); background: var(--bg2); color: var(--muted);
  font-family: 'Outfit', sans-serif; cursor: pointer;
}
.confirm-del {
  padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
  border: none; background: var(--red); color: #fff;
  font-family: 'Outfit', sans-serif; cursor: pointer;
}

.confirm-slide-enter-active, .confirm-slide-leave-active { transition: all 0.2s ease; }
.confirm-slide-enter-from, .confirm-slide-leave-to { opacity: 0; transform: translateY(6px); }
</style>