<template>
  <div class="grid grid-cols-4 gap-1.5">
    <label>
      <span class="ui-label text-[10px]">Quantità</span>
      <input
        type="number"
        min="0"
        step="any"
        v-model.number="entry.quantity.value"
        placeholder="—"
        class="ui-input text-xs px-2.5"
      />
    </label>
    <label>
      <span class="ui-label text-[10px]">Unità</span>
      <select v-model="entry.unit.value" class="ui-input text-xs px-2">
        <option value="g">g</option>
        <option value="ml">ml</option>
        <option value="pz">pz</option>
      </select>
    </label>
    <label>
      <span class="ui-label text-[10px] text-[#5f8a3a] dark:text-[#a7c49a]">CHO g</span>
      <input
        type="number"
        min="0"
        step="any"
        v-model.number="entry.cho.value"
        placeholder="0"
        class="ui-input text-xs px-2.5 font-semibold"
      />
    </label>
    <label>
      <span class="ui-label text-[10px]">Kcal</span>
      <input
        type="number"
        min="0"
        step="any"
        v-model.number="entry.kcal.value"
        placeholder="—"
        class="ui-input text-xs px-2.5"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import type { useFoodEntry } from '~/composables/useFoodEntry'

defineProps<{
  entry: ReturnType<typeof useFoodEntry>
}>()
</script>
