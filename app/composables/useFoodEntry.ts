import { nextTick, ref, watch } from 'vue'
import type { FoodUnit } from '~/types/meal'
import { defaultFoodQuantity, findFoodByName, foodNutrition, type FoodItem } from '~/data/foods'

/**
 * Form state for "a food + quantity" (extras, replacements).
 * Picking a food from the table, or changing quantity/unit afterwards, fills CHO and kcal;
 * both stay editable and are not overwritten until quantity/unit/food change again.
 */
export function useFoodEntry() {
  const name = ref('')
  const food = ref<FoodItem | null>(null)
  const quantity = ref<number | null>(null)
  const unit = ref<Exclude<FoodUnit, 'qb'>>('g')
  const cho = ref<number | null>(null)
  const kcal = ref<number | null>(null)

  const recompute = () => {
    if (!food.value || quantity.value === null || quantity.value <= 0) return
    const result = foodNutrition(food.value, quantity.value, unit.value)
    cho.value = result.cho
    kcal.value = result.kcal
  }

  const selectFood = (picked: FoodItem) => {
    food.value = picked
    name.value = picked.name
    unit.value = picked.unit
    quantity.value = defaultFoodQuantity(picked)
    recompute()
  }

  watch([quantity, unit], recompute)

  // Typing a different name detaches the table food (manual values from now on)
  watch(name, (value) => {
    if (food.value && value !== food.value.name) food.value = null
  })

  const reset = (values: {
    name?: string
    quantity?: number | null
    unit?: FoodUnit
    cho?: number | null
    kcal?: number | null
  } = {}) => {
    name.value = values.name ?? ''
    food.value = findFoodByName(name.value) ?? null
    unit.value = values.unit && values.unit !== 'qb' ? values.unit : (food.value?.unit ?? 'g')
    quantity.value = values.quantity ?? null
    // Restore saved values after the quantity/unit watcher has run
    nextTick(() => {
      cho.value = values.cho ?? null
      kcal.value = values.kcal ?? null
    })
  }

  return { name, food, quantity, unit, cho, kcal, selectFood, reset }
}
