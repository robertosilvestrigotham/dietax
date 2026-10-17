<template>
  <div class="space-y-5 max-w-5xl mx-auto">
    <!-- Range + actions -->
    <div class="flex flex-wrap items-center justify-between gap-3 no-print">
      <div class="ui-segment">
        <button
          type="button"
          @click="setRangeCurrentWeek"
          :class="isCurrentWeekSelected ? 'ui-segment-item-on' : 'ui-segment-item'"
        >
          Questa settimana
        </button>
        <button
          type="button"
          @click="setRangeNextWeek"
          :class="isNextWeekSelected ? 'ui-segment-item-on' : 'ui-segment-item'"
        >
          Prossima
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button type="button" @click="copyShoppingList" class="ui-icon-btn" :title="copiedFeedback ? 'Copiata' : 'Copia lista'" aria-label="Copia lista">
          <Check v-if="copiedFeedback" class="w-[18px] h-[18px] text-[#5f8a3a]" weight="bold" />
          <Copy v-else class="w-[18px] h-[18px]" />
        </button>
        <button type="button" @click="printList" class="ui-icon-btn" title="Stampa" aria-label="Stampa">
          <Printer class="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          @click="isManualModalOpen = true"
          class="w-9 h-9 rounded-full flex items-center justify-center bg-[#8cc63f] hover:bg-[#7db536] text-white transition active:scale-95"
          title="Aggiungi prodotto"
          aria-label="Aggiungi prodotto"
        >
          <Plus class="w-[18px] h-[18px]" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Custom range -->
    <div class="grid grid-cols-2 gap-2 no-print">
      <label>
        <span class="ui-label">Dal</span>
        <input type="date" v-model="startDateKey" class="ui-input bg-white dark:bg-[#1b211d] text-xs" />
      </label>
      <label>
        <span class="ui-label">Al</span>
        <input type="date" v-model="endDateKey" class="ui-input bg-white dark:bg-[#1b211d] text-xs" />
      </label>
    </div>

    <!-- Status filters -->
    <div class="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 no-print">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        type="button"
        @click="activeStatusFilter = f.value"
        :class="activeStatusFilter === f.value ? 'ui-chip-on' : 'ui-chip'"
        class="flex-shrink-0"
      >
        {{ f.label }}
        <span class="tabular-nums opacity-60">{{ f.count }}</span>
      </button>
      <button
        type="button"
        @click="excludePantry = !excludePantry"
        :class="excludePantry ? 'ui-chip-on' : 'ui-chip'"
        class="flex-shrink-0"
      >
        <EyeSlash class="w-3.5 h-3.5" />
        Nascondi dispensa
      </button>
    </div>

    <!-- Alternatives in the selected range -->
    <div v-if="mealsWithAlternatives.length > 0" class="ui-card space-y-3 no-print">
      <div>
        <h2 class="ui-title">Alternative</h2>
        <p class="ui-muted mt-0.5">La lista si aggiorna in base alla scelta.</p>
      </div>
      <div class="space-y-2.5">
        <div
          v-for="item in mealsWithAlternatives"
          :key="`${item.dayOfWeek}-${item.slot}`"
          class="ui-panel p-3"
        >
          <span class="text-xs font-semibold text-[#1f2421] dark:text-white block mb-2">
            {{ DAY_OF_WEEK_LABELS[item.dayOfWeek] }} · {{ MEAL_SLOT_LABELS[item.slot] }}
          </span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="alt in item.meal.alternatives"
              :key="alt.id"
              type="button"
              @click="setChosenAlternative(item.dayOfWeek, item.slot, alt.id)"
              :class="getChosenAlternative(item.dayOfWeek, item.slot) === alt.id ? 'ui-chip-on' : 'ui-chip'"
            >
              {{ alt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Shopping list by category -->
    <div
      v-for="group in filteredGroupedItems"
      :key="group.category"
      class="ui-card space-y-2 page-break"
    >
      <div class="flex items-center justify-between pb-1">
        <h2 class="ui-title">{{ group.label }}</h2>
        <span class="text-xs tabular-nums text-[#8a918c] dark:text-[#8e9790]">{{ group.items.length }}</span>
      </div>
      <GroceryItemRow
        v-for="item in group.items"
        :key="item.key"
        :item="item"
        @toggle-bought="toggleItemBought(item)"
        @toggle-pantry="toggleItemPantry(item)"
      />
    </div>

    <!-- Manual items -->
    <div v-if="filteredManualItems.length > 0" class="ui-card space-y-2 page-break">
      <div class="flex items-center justify-between pb-1">
        <h2 class="ui-title">Aggiunti a mano</h2>
        <span class="text-xs tabular-nums text-[#8a918c] dark:text-[#8e9790]">{{ filteredManualItems.length }}</span>
      </div>
      <GroceryItemRow
        v-for="item in filteredManualItems"
        :key="item.id"
        :item="item"
        :is-manual="true"
        @toggle-bought="toggleManualBought(item.id)"
        @toggle-pantry="toggleManualPantry(item.id)"
        @delete="removeManualItem(item.id)"
      />
    </div>

    <!-- Empty state -->
    <div
      v-if="filteredGroupedItems.length === 0 && filteredManualItems.length === 0"
      class="ui-card py-12 text-center"
    >
      <ShoppingBag class="w-12 h-12 text-[#a3bb97] mx-auto mb-3" />
      <h3 class="ui-title">Niente da mostrare</h3>
      <p class="ui-muted max-w-xs mx-auto mt-1">
        Nessun prodotto corrisponde ai filtri scelti per queste date.
      </p>
    </div>

    <ManualItemModal
      :is-open="isManualModalOpen"
      @close="isManualModalOpen = false"
      @add="handleAddManualItem"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhBasket as ShoppingBag, PhPlus as Plus, PhCopy as Copy, PhPrinter as Printer, PhCheck as Check, PhEyeSlash as EyeSlash } from '@phosphor-icons/vue'
import type {
  AggregatedShoppingItem,
  DayOfWeek,
  FoodUnit,
  IngredientCategory,
  Meal,
  MealSlot,
} from '~/types/meal'
import {
  DAY_OF_WEEK_LABELS,
  DAYS_OF_WEEK_ORDER,
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ORDER,
} from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import {
  formatDateKey,
  getMondayOfWeek,
  shiftDateKey,
  formatWeekRange,
  parseDateKey,
} from '~/utils/date'
import {
  buildAggregatedGroceryList,
  groupGroceryByCategory,
  formatGroceryListAsText,
} from '~/utils/grocery'

const mealStore = useMealStore()

// Default date range: current week (Monday to Sunday)
const mondayCurrentWeek = getMondayOfWeek(new Date())
const startDateKey = ref<string>(formatDateKey(mondayCurrentWeek))
const endDateKey = ref<string>(shiftDateKey(formatDateKey(mondayCurrentWeek), 6))

const activeStatusFilter = ref<'all' | 'to_buy' | 'bought' | 'in_pantry'>('all')
const excludePantry = ref(false)
const isManualModalOpen = ref(false)
const copiedFeedback = ref(false)

const rangeKey = computed(() => `${startDateKey.value}_${endDateKey.value}`)

const formattedRangeLabel = computed(() => {
  return formatWeekRange(startDateKey.value, endDateKey.value)
})

const isCurrentWeekSelected = computed(() => {
  const currentMon = formatDateKey(getMondayOfWeek(new Date()))
  const currentSun = shiftDateKey(currentMon, 6)
  return startDateKey.value === currentMon && endDateKey.value === currentSun
})

const isNextWeekSelected = computed(() => {
  const nextMon = shiftDateKey(formatDateKey(getMondayOfWeek(new Date())), 7)
  const nextSun = shiftDateKey(nextMon, 6)
  return startDateKey.value === nextMon && endDateKey.value === nextSun
})

const setRangeCurrentWeek = () => {
  const currentMon = formatDateKey(getMondayOfWeek(new Date()))
  startDateKey.value = currentMon
  endDateKey.value = shiftDateKey(currentMon, 6)
}

const setRangeNextWeek = () => {
  const nextMon = shiftDateKey(formatDateKey(getMondayOfWeek(new Date())), 7)
  startDateKey.value = nextMon
  endDateKey.value = shiftDateKey(nextMon, 6)
}

// Generate list of all date keys in range
const dateKeysInRange = computed(() => {
  const keys: string[] = []
  try {
    const start = parseDateKey(startDateKey.value)
    const end = parseDateKey(endDateKey.value)

    if (start.getTime() > end.getTime()) {
      return [startDateKey.value]
    }

    let current = new Date(start)
    while (current.getTime() <= end.getTime()) {
      keys.push(formatDateKey(current))
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
    }
  } catch {
    keys.push(startDateKey.value)
  }
  return keys
})

const currentShoppingState = computed(() => {
  return mealStore.getShoppingStateForRange(rangeKey.value)
})

// Build aggregated list from store template and day overrides
const aggregatedItems = computed(() => {
  return buildAggregatedGroceryList({
    plan: mealStore.plan,
    dateKeys: dateKeysInRange.value,
    shoppingState: currentShoppingState.value,
    globalPantry: mealStore.globalPantry,
    dayProgressMap: mealStore.progress,
  })
})

// Detect which meals in the selected range have alternatives
const mealsWithAlternatives = computed(() => {
  const list: { dayOfWeek: DayOfWeek; slot: MealSlot; meal: Meal }[] = []
  const checkedKeys = new Set<string>()

  for (const dayOfWeek of DAYS_OF_WEEK_ORDER) {
    const dayPlan = mealStore.plan[dayOfWeek]
    for (const slot of MEAL_SLOT_ORDER) {
      const meal = dayPlan[slot]
      if (meal.alternatives && meal.alternatives.length > 0 && !meal.isOut) {
        const key = `${dayOfWeek}-${slot}`
        if (!checkedKeys.has(key)) {
          checkedKeys.add(key)
          list.push({ dayOfWeek, slot, meal })
        }
      }
    }
  }
  return list
})

const getChosenAlternative = (dayOfWeek: DayOfWeek, slot: MealSlot) => {
  return (
    mealStore.plan[dayOfWeek][slot].selectedAlternativeId ||
    mealStore.plan[dayOfWeek][slot].alternatives?.[0]?.id
  )
}

const setChosenAlternative = (dayOfWeek: DayOfWeek, slot: MealSlot, altId: string) => {
  mealStore.updateMeal(dayOfWeek, slot, { selectedAlternativeId: altId })
}

// Filter items by status and pantry
const filteredAggregatedItems = computed(() => {
  return aggregatedItems.value.filter((item) => {
    if (excludePantry.value && item.status === 'in_pantry') return false
    if (activeStatusFilter.value !== 'all' && item.status !== activeStatusFilter.value) return false
    return true
  })
})

const filteredGroupedItems = computed(() => {
  return groupGroceryByCategory(filteredAggregatedItems.value)
})

const manualItems = computed(() => {
  return currentShoppingState.value.manualItems || []
})

const filteredManualItems = computed(() => {
  return manualItems.value.filter((item) => {
    if (excludePantry.value && item.status === 'in_pantry') return false
    if (activeStatusFilter.value !== 'all' && item.status !== activeStatusFilter.value) return false
    return true
  })
})

// Counters
const totalCount = computed(() => aggregatedItems.value.length + manualItems.value.length)
const toBuyCount = computed(() => {
  const agg = aggregatedItems.value.filter((i) => i.status === 'to_buy').length
  const man = manualItems.value.filter((i) => i.status === 'to_buy').length
  return agg + man
})
const boughtCount = computed(() => {
  const agg = aggregatedItems.value.filter((i) => i.status === 'bought').length
  const man = manualItems.value.filter((i) => i.status === 'bought').length
  return agg + man
})
const pantryCount = computed(() => {
  const agg = aggregatedItems.value.filter((i) => i.status === 'in_pantry').length
  const man = manualItems.value.filter((i) => i.status === 'in_pantry').length
  return agg + man
})

const statusFilters = computed(() => [
  { value: 'all' as const, label: 'Tutti', count: totalCount.value },
  { value: 'to_buy' as const, label: 'Da comprare', count: toBuyCount.value },
  { value: 'bought' as const, label: 'Presi', count: boughtCount.value },
  { value: 'in_pantry' as const, label: 'In dispensa', count: pantryCount.value },
])

const toggleItemBought = (item: AggregatedShoppingItem) => {
  mealStore.toggleItemBought(rangeKey.value, item.key, item.status)
}

const toggleItemPantry = (item: AggregatedShoppingItem) => {
  mealStore.toggleItemInPantry(rangeKey.value, item.key, item.status)
}

const toggleManualBought = (itemId: string) => {
  mealStore.toggleManualItemBought(rangeKey.value, itemId)
}

const toggleManualPantry = (itemId: string) => {
  const target = manualItems.value.find((i) => i.id === itemId)
  if (target) {
    const nextStatus = target.status === 'in_pantry' ? 'to_buy' : 'in_pantry'
    target.status = nextStatus
    mealStore.saveToStorage()
  }
}

const handleAddManualItem = (item: {
  name: string
  quantity: number | null
  unit: FoodUnit
  category: IngredientCategory
}) => {
  mealStore.addManualShoppingItem(rangeKey.value, {
    ...item,
    status: 'to_buy',
  })
}

const removeManualItem = (itemId: string) => {
  mealStore.removeManualShoppingItem(rangeKey.value, itemId)
}

const copyShoppingList = async () => {
  const text = formatGroceryListAsText({
    aggregatedItems: aggregatedItems.value,
    manualItems: manualItems.value,
    rangeLabel: formattedRangeLabel.value,
    excludePantry: excludePantry.value,
  })

  try {
    await navigator.clipboard.writeText(text)
    copiedFeedback.value = true
    setTimeout(() => {
      copiedFeedback.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
  }
}

const printList = () => {
  window.print()
}
</script>
