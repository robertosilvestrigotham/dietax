<template>
  <div
    class="ui-panel flex items-center gap-3 px-3 py-2.5 text-sm transition"
    :class="item.status === 'in_pantry' ? 'opacity-60' : ''"
  >
    <!-- Bought toggle -->
    <button
      type="button"
      @click="$emit('toggle-bought')"
      class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition active:scale-95"
      :class="
        item.status === 'bought'
          ? 'bg-[#d4f65a] text-[#16171a]'
          : 'bg-white dark:bg-[#34353a] text-[#c3c8c4] dark:text-[#55565b] hover:text-[#d4f65a]'
      "
      :aria-label="`Segna ${item.name} come ${item.status === 'bought' ? 'non acquistato' : 'acquistato'}`"
    >
      <Check class="w-3.5 h-3.5" weight="bold" />
    </button>

    <!-- Name + details -->
    <div class="min-w-0 flex-1">
      <div
        class="font-medium truncate"
        :class="
          item.status === 'bought' || item.status === 'in_pantry'
            ? 'line-through text-[#9aa19c] dark:text-[#6b6c71]'
            : 'text-[#1f2421] dark:text-[#f4f4f5]'
        "
      >
        {{ item.name }}
      </div>
      <div class="text-[11px] text-[#8a918c] dark:text-[#8e8f94] truncate">
        <span class="font-semibold text-[#4a524c] dark:text-[#c8c9cd] tabular-nums">{{ formattedQuantity }}</span>
        <template v-if="'preparationState' in item && item.preparationState && item.preparationState !== 'none'">
          · {{ formatPreparationLabel(item.preparationState) }}
        </template>
        <template v-if="'sourceMeals' in item && item.sourceMeals && item.sourceMeals.length > 0">
          · {{ formatSourceMeals(item.sourceMeals) }}
        </template>
      </div>
    </div>

    <!-- Pantry toggle -->
    <button
      type="button"
      @click="$emit('toggle-pantry')"
      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
      :class="
        item.status === 'in_pantry'
          ? 'bg-[#9fb83f] text-white dark:bg-[#5c6b2a]'
          : 'text-[#9aa19c] dark:text-[#6b6c71] hover:bg-white dark:hover:bg-[#34353a] hover:text-[#4a524c]'
      "
      :title="item.status === 'in_pantry' ? 'Rimuovi dalla dispensa' : 'Ce l\'ho in dispensa'"
      :aria-label="item.status === 'in_pantry' ? 'Rimuovi dalla dispensa' : 'Segna in dispensa'"
    >
      <Archive class="w-4 h-4" />
    </button>

    <!-- Delete (manual items) -->
    <button
      v-if="isManual"
      type="button"
      @click="$emit('delete')"
      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[#9aa19c] hover:text-rose-600 hover:bg-white dark:hover:bg-[#34353a] transition"
      title="Elimina"
      aria-label="Elimina prodotto"
    >
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhCheck as Check, PhArchive as Archive, PhTrash as Trash2 } from '@phosphor-icons/vue'
import type {
  AggregatedShoppingItem,
  DayOfWeek,
  ManualShoppingItem,
  MealSlot,
} from '~/types/meal'
import { DAY_OF_WEEK_SHORT, MEAL_SLOT_LABELS } from '~/types/meal'
import { formatQuantityString, formatPreparationLabel } from '~/utils/grocery'

const props = defineProps<{
  item: AggregatedShoppingItem | ManualShoppingItem
  isManual?: boolean
}>()

defineEmits<{
  (e: 'toggle-bought'): void
  (e: 'toggle-pantry'): void
  (e: 'delete'): void
}>()

const formattedQuantity = computed(() => {
  if ('totalQuantity' in props.item) {
    return formatQuantityString(
      props.item.totalQuantity,
      props.item.unit,
      props.item.isToDefine
    )
  }
  return formatQuantityString(props.item.quantity, props.item.unit)
})

const formatSourceMeals = (
  sources: { dayOfWeek: DayOfWeek; slot: MealSlot; mealName: string }[]
) => {
  return sources
    .map((s) => `${DAY_OF_WEEK_SHORT[s.dayOfWeek]} (${MEAL_SLOT_LABELS[s.slot]})`)
    .join(', ')
}
</script>
