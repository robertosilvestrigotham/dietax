<template>
  <header
    class="sticky top-0 z-20 bg-[#e5ede2]/85 dark:bg-[#0c1610]/85 backdrop-blur-xl px-4 md:px-8 pt-5 pb-3 flex items-end justify-between gap-4 transition-colors"
  >
    <div class="min-w-0">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-[#1f2421] dark:text-white truncate">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-xs text-[#8a918c] dark:text-[#8e9790] mt-0.5 truncate">
        {{ subtitle }}
      </p>
    </div>

    <div class="flex items-center gap-2 flex-shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>
