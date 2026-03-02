<template>
  <div class="pregnancy-item card">
    <div class="preg-icon">🐐</div>
    <div class="preg-info">
      <div class="preg-name">{{ pregnancy.goatName }}</div>
      <div class="preg-due">Due: {{ pregnancy.expectedBirth }}</div>
      <div class="progress-track" style="margin-top:8px; height:5px;">
        <div
          class="progress-fill"
          :style="{ width: pregnancy.progress + '%', height: '5px', background: pregnancy.daysLeft < 14 ? 'var(--amber)' : 'var(--green)' }"
        />
      </div>
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
}
.preg-icon { font-size: 28px; flex-shrink: 0; }
.preg-info { flex: 1; }
.preg-name { font-weight: 600; font-size: 14px; }
.preg-due  { font-size: 12px; color: var(--muted); margin-top: 2px; }
.preg-days { text-align: right; flex-shrink: 0; }
.preg-days-num   { font-size: 22px; font-weight: 700; line-height: 1; font-family: 'JetBrains Mono', monospace; }
.preg-days-label { font-size: 10px; color: var(--muted); }
</style>
