<template>
  <div class="flex gap-4">
    <!-- Where to measure: follows the focused field -->
    <div class="w-24 sm:w-28 flex-shrink-0 py-1">
      <BodySilhouette :active="active" :filled="filled" />
    </div>

    <div class="flex-1 min-w-0 space-y-2">
      <label v-for="field in FIELDS" :key="field.key" class="block">
        <span class="flex items-baseline justify-between">
          <span
            class="text-xs font-medium transition-colors"
            :class="active === field.key ? 'text-[#5f8a3a] dark:text-[#a7c49a]' : 'text-[#8a918c] dark:text-[#8e9790]'"
          >
            {{ field.label }}
          </span>
          <span v-if="active === field.key" class="text-[10px] text-[#8a918c] dark:text-[#8e9790] truncate ml-2">{{ field.hint }}</span>
        </span>
        <span class="relative block mt-0.5">
          <input
            type="number"
            inputmode="decimal"
            step="0.5"
            :value="modelValue[field.key] ?? ''"
            :placeholder="previous?.[field.key] ? String(previous[field.key]) : '—'"
            class="ui-input pr-10 py-2"
            @focus="active = field.key"
            @input="update(field.key, ($event.target as HTMLInputElement).value)"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9aa19c] pointer-events-none">cm</span>
        </span>
      </label>
    </div>
  </div>
</template>

<script lang="ts">
export interface MeasureValues {
  waistCm: number | null
  hipsCm: number | null
  chestCm: number | null
  armCm: number | null
  thighCm: number | null
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BodySilhouette, { type BodyBand } from '~/components/BodySilhouette.vue'

const props = defineProps<{
  modelValue: MeasureValues
  previous?: Partial<Record<keyof MeasureValues, number>>
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: MeasureValues): void }>()

const FIELDS: { key: BodyBand; label: string; hint: string }[] = [
  { key: 'waistCm', label: 'Vita', hint: "all'ombelico, pancia rilassata" },
  { key: 'hipsCm', label: 'Fianchi', hint: 'nel punto più largo' },
  { key: 'chestCm', label: 'Torace', hint: "all'altezza dei capezzoli" },
  { key: 'armCm', label: 'Braccio', hint: 'a metà tra spalla e gomito' },
  { key: 'thighCm', label: 'Coscia', hint: 'nel punto più largo' },
]

const active = ref<BodyBand>('waistCm')

const filled = computed(() =>
  Object.fromEntries(FIELDS.map((f) => [f.key, typeof props.modelValue[f.key] === 'number']))
)

const update = (key: keyof MeasureValues, raw: string) => {
  const value = raw === '' ? null : Number(raw.replace(',', '.'))
  emit('update:modelValue', { ...props.modelValue, [key]: Number.isFinite(value) ? value : null })
}
</script>
