<template>
  <div class="pregnancy-item card">
    <div class="preg-icon">🐐</div>
    <div class="preg-info">
      <div class="preg-name">{{ pregnancy.goatName }}</div>
      <div class="preg-due">Due: {{ pregnancy.expectedBirth }} · {{ pregnancy.expectedKids }} kid{{ pregnancy.expectedKids > 1 ? 's' : '' }} expected</div>
      <div class="progress-track" style="margin-top:8px; height:5px; background:var(--bg2); border-radius:4px; overflow:hidden;">
        <div
          class="progress-fill"
          :style="{
            width: pregnancy.progress + '%',
            height: '5px',
            background: pregnancy.daysLeft < 14 ? 'var(--amber)' : 'var(--green)',
            borderRadius: '4px',
            transition: 'width 0.6s ease'
          }"
        />
      </div>
      <div class="preg-progress-label">{{ Math.round(pregnancy.progress) }}% complete</div>
    </div>
    <div class="preg-days">
      <div class="preg-days-num" :style="{ color: pregnancy.daysLeft < 14 ? 'var(--amber)' : 'var(--green)' }">
        {{ pregnancy.daysLeft }}
      </div>
      <div class="preg-days-label">days left</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  pregnancy: { type: Object, required: true },
})
</script>

<style scoped>
.pregnancy-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  transition: transform 0.15s;
}
.pregnancy-item:active { transform: scale(0.98); }

.preg-icon { font-size: 28px; flex-shrink: 0; }
.preg-info { flex: 1; min-width: 0; }
.preg-name { font-weight: 700; font-size: 15px; }
.preg-due  { font-size: 11px; color: var(--muted); margin-top: 2px; }
.preg-progress-label { font-size: 10px; color: var(--muted); margin-top: 4px; }

.preg-days { text-align: right; flex-shrink: 0; }
.preg-days-num   { font-size: 24px; font-weight: 800; line-height: 1; font-family: 'JetBrains Mono', monospace; }
.preg-days-label { font-size: 10px; color: var(--muted); margin-top: 2px; }
</style>