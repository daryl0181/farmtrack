<template>
  <div>
    <PageHeader greeting="Manage" title="All Animals">
      <template #right>
        <div style="color:rgba(255,255,255,0.7); font-size:13px; padding-top:6px;">
          {{ animalStore.totalAnimals }} total
        </div>
      </template>
    </PageHeader>

    <div class="page-content">

      <!-- FILTER CHIPS -->
      <div class="filter-bar">
        <button
          v-for="f in filters" :key="f"
          :class="['filter-chip', activeFilter === f ? 'active' : '']"
          @click="activeFilter = f"
        >{{ f }}</button>
      </div>

      <!-- ANIMAL LIST -->
      <div class="animal-list" v-if="filteredAnimals.length">
        <div class="animal-item card" v-for="a in filteredAnimals" :key="a.id">
          <div class="ai-emoji">{{ animalStore.animalEmoji(a.type) }}</div>
          <div class="ai-info">
            <div class="ai-name">{{ a.name }}</div>
            <div class="ai-meta">{{ a.sex }} · {{ a.age }} months · {{ a.weight }} kg</div>
            <div class="ai-tags">
              <span :class="['tag', animalStore.healthTagColor(a.health)]">{{ a.health }}</span>
              <span class="tag blue" v-if="a.sex === 'Male'">♂ Male</span>
              <span class="tag purple" v-else>♀ Female</span>
              <span class="tag green" v-if="a.addedDate">{{ a.addedDate }}</span>
            </div>
            <div class="ai-notes" v-if="a.notes">📝 {{ a.notes }}</div>
          </div>
          <div class="ai-actions">
            <button class="icon-btn" @click="ui.openModal('addHealth')" title="Add health record">💊</button>
            <button class="icon-btn" @click="ui.showToast('Edit available after Firebase setup!')" title="Edit">✏️</button>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-state-icon">🐾</div>
        <div class="empty-state-text">No {{ activeFilter === 'All' ? '' : activeFilter }} animals yet.<br>Tap + to add one.</div>
      </div>

    </div>

    <button class="fab" @click="ui.openModal('addAnimal')">+</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAnimalStore } from '@/stores/animals'
import { useUIStore }     from '@/stores/ui'

const animalStore = useAnimalStore()
const ui          = useUIStore()

const filters      = ['All', 'Goat', 'Chicken', 'Duck', 'Pig', 'Cow']
const activeFilter = ref('All')

const filteredAnimals = computed(() =>
  activeFilter.value === 'All'
    ? animalStore.animals
    : animalStore.animals.filter(a => a.type === activeFilter.value)
)
</script>

<style scoped>
.filter-bar {
  display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
  margin-bottom: 16px;
}
.filter-bar::-webkit-scrollbar { display: none; }
.filter-chip {
  flex-shrink: 0; padding: 7px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--surface); color: var(--muted);
  font-family: 'Outfit', sans-serif; transition: all 0.15s;
}
.filter-chip.active { background: var(--green); border-color: var(--green); color: #fff; }

.animal-list { display: flex; flex-direction: column; gap: 10px; }
.animal-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; }
.ai-emoji { font-size: 30px; flex-shrink: 0; padding-top: 2px; }
.ai-info  { flex: 1; }
.ai-name  { font-weight: 600; font-size: 15px; }
.ai-meta  { font-size: 12px; color: var(--muted); margin-top: 2px; }
.ai-tags  { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 6px; }
.ai-notes { font-size: 11px; color: var(--muted); margin-top: 6px; }
.ai-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.icon-btn {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; cursor: pointer;
  border: 1px solid var(--border); background: var(--bg2);
}
.icon-btn:active { transform: scale(0.92); }
</style>
