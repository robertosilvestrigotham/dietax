<template>
  <div class="relative">
    <input
      ref="inputRef"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :class="inputClass"
      autocomplete="off"
      @input="onInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter="onEnter"
    />
    <ul
      v-if="isOpen"
      class="absolute z-30 left-0 right-0 mt-1 py-1 rounded-xl bg-white dark:bg-[#34353a] shadow-mac-lg max-h-64 overflow-y-auto"
    >
      <li v-for="(food, i) in suggestions" :key="food.id">
        <button
          type="button"
          @mousedown.prevent="pick(food)"
          class="w-full text-left px-3 py-2 flex items-center justify-between gap-3 transition"
          :class="i === highlighted ? 'bg-[#f1f4ef] dark:bg-[#3a3b40]' : 'hover:bg-[#f1f4ef] dark:hover:bg-[#3a3b40]'"
        >
          <span class="text-xs font-medium text-[#1f2421] dark:text-white truncate">{{ food.name }}</span>
          <span class="text-[11px] tabular-nums text-[#8a918c] dark:text-[#8e8f94] flex-shrink-0">
            {{ describe(food) }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { searchFoods, foodNutrition, type FoodItem } from '~/data/foods'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    inputClass?: string
  }>(),
  { placeholder: '', inputClass: 'ui-input' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', food: FoodItem): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const highlighted = ref(-1)
// Hide suggestions right after a pick until the user types again
const justPicked = ref(false)

const suggestions = computed(() => searchFoods(props.modelValue))
const isOpen = computed(() => isFocused.value && !justPicked.value && suggestions.value.length > 0)

watch(suggestions, () => {
  highlighted.value = -1
})

const onInput = (e: Event) => {
  justPicked.value = false
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

const pick = (food: FoodItem) => {
  justPicked.value = true
  emit('update:modelValue', food.name)
  emit('select', food)
}

const move = (delta: number) => {
  if (!isOpen.value) return
  const n = suggestions.value.length
  highlighted.value = (highlighted.value + delta + n) % n
}

const onEnter = (e: KeyboardEvent) => {
  const food = suggestions.value[highlighted.value]
  if (isOpen.value && food) {
    e.preventDefault()
    pick(food)
  }
}

const describe = (food: FoodItem) => {
  if (food.unit === 'pz') {
    const { cho, kcal } = foodNutrition(food, 1, 'pz')
    return `1 pz · ${cho}g · ${kcal} kcal`
  }
  return `100${food.unit === 'ml' ? 'ml' : 'g'} · ${food.choPer100g}g · ${food.kcalPer100g} kcal`
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>
