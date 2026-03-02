<template>
  <header class="page-header">
    <div class="header-top">
      <div>
        <div class="header-greeting">{{ greeting }}</div>
        <div class="header-title">{{ title }}</div>
      </div>
      <div class="header-right">
        <slot name="right" />
      </div>
    </div>
    <slot />
  </header>
</template>

<script setup>
defineProps({
  greeting: { type: String, default: '' },
  title:    { type: String, required: true },
})
</script>
