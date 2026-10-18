<template>
  <div class="flex gap-3 sm:gap-4">
    <!-- Timeline rail: slot icon + connector to next meal -->
    <div class="flex flex-col items-center flex-shrink-0">
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        :class="[
          isActive ? 'text-[#16171a]' : 'text-white dark:text-[#ececee]',
          isCompleted
            ? 'bg-[#9fb83f] dark:bg-[#5c6b2a]'
            : isActive
              ? 'bg-[#d4f65a] ring-2 ring-offset-2 ring-[#d4f65a] ring-offset-[#e5ede2] dark:ring-offset-[#131416]'
              : 'bg-[#c8d3c2] dark:bg-[#3a3b40]',
        ]"
      >
        <component :is="slotIcon" class="w-5 h-5" />
      </div>
      <div
        v-if="!isLast"
        class="w-0.5 rounded-full flex-1 mt-2"
        :class="isCompleted ? 'bg-[#9fb83f] dark:bg-[#5c6b2a]' : 'bg-[#d6dfd1] dark:bg-[#34353a]'"
      ></div>
    </div>

    <div class="flex-1 min-w-0" :class="isLast ? '' : 'pb-6'">
      <!-- Title + actions outside the card -->
      <div class="min-h-10 flex items-center justify-between gap-3">
        <div class="min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-base text-[#1f2421] dark:text-white leading-tight truncate">
              {{ MEAL_SLOT_LABELS[meal.slot] }}
            </h3>
            <span
              v-if="meal.isOut"
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            >
              Fuori casa
            </span>
          </div>
          <div class="text-xs mt-0.5 tabular-nums">
            <span class="font-semibold text-[#1f2421] dark:text-[#ececee]">{{ mealCho.totalCho }}g CHO</span>
            <span class="text-[#8a918c] dark:text-[#8e8f94]"> · {{ mealKcal.totalKcal }} kcal</span>
            <span v-if="completedTimeFormatted" class="text-[#9aa19c] dark:text-[#8e8f94]"> · alle {{ completedTimeFormatted }}</span>
          </div>
        </div>

        <!-- Actions: add extra + confirm (not in plan mode) -->
        <div v-if="!planMode" class="flex items-center gap-1.5 flex-shrink-0">
          <button
            v-if="!isLocked"
            type="button"
            @click="toggleAddExtra"
            class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 bg-white dark:bg-[#222326] text-[#4a524c] dark:text-[#c8c9cd] hover:bg-[#e6f3d6] hover:text-[#4c8a17] disabled:opacity-35 disabled:pointer-events-none"
            :title="isAddingExtra ? 'Chiudi' : 'Aggiungi alimento extra'"
            aria-label="Aggiungi extra"
          >
            <X v-if="isAddingExtra" class="w-4 h-4" weight="bold" />
            <Plus v-else class="w-4 h-4" weight="bold" />
          </button>
          <span
            v-if="isCompleted"
            class="w-9 h-9 rounded-full flex items-center justify-center bg-[#9fb83f] dark:bg-[#5c6b2a] text-white"
            title="Pasto confermato"
          >
            <Check class="w-4 h-4" weight="bold" />
          </span>
          <button
            v-else-if="!isLocked"
            type="button"
            @click="toggleCompleted"
            class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 bg-white dark:bg-[#222326] text-[#c3c8c4] dark:text-[#55565b] hover:text-[#d4f65a]"
            title="Conferma pasto"
            aria-label="Conferma pasto"
          >
            <Check class="w-4 h-4" weight="bold" />
          </button>
        </div>
      </div>

      <!-- Card -->
      <div class="mt-3 rounded-2xl p-4 transition-colors" :class="tone.card">
        <!-- Replaced for this date: show what is actually eaten, planned meal struck through -->
        <template v-if="replacement">
          <div class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" :class="tone.muted">
            <Swap class="w-3.5 h-3.5" />
            Sostituito
          </div>
          <p class="mt-1 text-sm font-medium leading-snug" :class="tone.text">
            {{ replacement.description }}
          </p>
          <p class="mt-1 text-xs leading-relaxed line-through" :class="tone.muted">
            {{ meal.description }}
          </p>
        </template>
        <p v-else class="text-sm font-medium leading-snug" :class="tone.text">
          {{ meal.description }}
        </p>
        <p
          v-if="!replacement && displayIngredients.length > 0 && !meal.isOut"
          class="mt-1 text-xs leading-relaxed"
          :class="tone.muted"
        >
          <template v-for="(ing, i) in displayIngredients" :key="ing.id">
            <span v-if="i > 0" class="mx-1">•</span>{{ ing.name }} {{ formatIngredientQuantity(ing) }}
          </template>
        </p>

        <!-- Extra foods logged -->
        <div v-if="extraFoodsList.length > 0" class="mt-3 space-y-1.5">
          <div
            v-for="extra in extraFoodsList"
            :key="extra.id"
            @click="!isLocked && startEditExtra(extra)"
            class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition"
            :class="[
              isLocked ? tone.rowStatic : [tone.row, 'cursor-pointer'],
              editingExtraId === extra.id ? 'ring-2 ring-[#d4f65a]' : '',
            ]"
          >
            <div class="min-w-0 text-xs">
              <span class="font-medium" :class="tone.text">{{ extra.name }}</span>
              <span v-if="extra.quantity" :class="tone.muted"> • {{ extra.quantity }}{{ extra.unit || 'g' }}</span>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="text-xs font-semibold tabular-nums" :class="tone.accent">+{{ extra.choGrams }}g</span>
              <span class="text-[11px] tabular-nums" :class="tone.muted">{{ calculateExtraKcal(extra) }} kcal</span>
              <button
                v-if="!isLocked"
                type="button"
                @click.stop="removeExtra(extra.id)"
                class="p-0.5 rounded-full transition hover:text-rose-600"
                :class="tone.muted"
                title="Rimuovi"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Alternatives -->
        <div v-if="!replacement && meal.alternatives && meal.alternatives.length > 0" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-if="isLocked"
            class="text-xs px-3 py-1 rounded-full font-medium"
            :class="tone.chipOn"
          >
            {{ meal.alternatives.find((a) => a.id === activeAlternativeId)?.label }}
          </span>
          <template v-else>
            <button
              v-for="alt in meal.alternatives"
              :key="alt.id"
              type="button"
              @click="selectAlternative(alt.id)"
              class="text-xs px-3 py-1 rounded-full font-medium transition"
              :class="activeAlternativeId === alt.id ? tone.chipOn : tone.chipOff"
            >
              {{ alt.label }}
            </button>
          </template>
        </div>

        <!-- Inline extra food form -->
        <div v-if="isAddingExtra" class="mt-3 p-3.5 rounded-xl bg-white dark:bg-[#34353a] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#1f2421] dark:text-white">
              {{ editingExtraId ? 'Modifica alimento' : 'Aggiungi alimento' }}
            </span>
            <button type="button" @click="cancelEditExtra" class="text-xs text-[#8a918c] hover:text-[#1f2421] dark:hover:text-white">
              Chiudi
            </button>
          </div>

          <div v-if="!editingExtraId" class="flex flex-wrap gap-1.5">
            <button
              v-for="p in QUICK_PRESETS"
              :key="p.label"
              type="button"
              @click="applyPreset(p)"
              class="text-xs px-2.5 py-1 rounded-full bg-[#f1f4ef] dark:bg-[#222326] hover:bg-[#e6f3d6] text-[#4a524c] dark:text-[#c8c9cd] transition"
            >
              {{ p.label }} <span class="font-semibold text-[#4c8a17] dark:text-[#d4f65a]">+{{ p.cho }}g</span>
            </button>
          </div>

          <form @submit.prevent="saveExtra" class="space-y-2">
            <FoodSearchInput
              ref="extraNameInput"
              v-model="extraEntry.name.value"
              placeholder="Cerca alimento o scrivi"
              input-class="ui-input"
              @select="extraEntry.selectFood"
            />
            <FoodAmountFields :entry="extraEntry" />
            <button
              type="submit"
              :disabled="!extraEntry.name.value.trim() || extraEntry.cho.value === null"
              class="w-full py-2.5 rounded-xl font-semibold text-xs bg-[#d4f65a] hover:bg-[#c2e646] text-[#16171a] transition disabled:opacity-40"
            >
              {{ editingExtraId ? 'Salva' : 'Aggiungi' }}
            </button>
          </form>

          <button
            v-if="editingExtraId"
            type="button"
            @click="removeExtra(editingExtraId); cancelEditExtra()"
            class="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Elimina</span>
          </button>
        </div>

        <!-- Inline replacement form -->
        <form
          v-if="isReplacing"
          @submit.prevent="saveReplacement"
          class="mt-3 p-3.5 rounded-xl bg-white dark:bg-[#34353a] space-y-3"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#1f2421] dark:text-white">Cosa mangi al suo posto?</span>
            <button type="button" @click="closeReplacement" class="text-xs text-[#8a918c] hover:text-[#1f2421] dark:hover:text-white">
              Chiudi
            </button>
          </div>
          <!-- Ideas with the same calories and CHO as the planned meal -->
          <div v-if="replacementIdeas.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="idea in replacementIdeas"
              :key="idea.dish.id"
              type="button"
              @click="useIdeaAsReplacement(idea)"
              class="text-xs px-2.5 py-1 rounded-full bg-[#f1f4ef] dark:bg-[#222326] hover:bg-[#e6f3d6] text-[#4a524c] dark:text-[#c8c9cd] transition text-left"
            >
              {{ idea.dish.name }} <span class="tabular-nums text-[#8a918c]">· {{ idea.kcal }} kcal</span>
            </button>
          </div>
          <FoodSearchInput
            ref="replacementInput"
            v-model="replacementEntry.name.value"
            placeholder="Es. Canederlo"
            input-class="ui-input"
            @select="replacementEntry.selectFood"
          />
          <FoodAmountFields :entry="replacementEntry" />
          <button
            type="submit"
            :disabled="!replacementEntry.name.value.trim() || replacementEntry.cho.value === null"
            class="w-full py-2.5 rounded-xl font-semibold text-xs bg-[#d4f65a] hover:bg-[#c2e646] text-[#16171a] transition disabled:opacity-40"
          >
            Sostituisci
          </button>
          <button
            v-if="replacement"
            type="button"
            @click="restorePlannedMeal"
            class="text-xs font-medium text-[#5f8a3a] dark:text-[#d4f65a] flex items-center gap-1"
          >
            <ArrowCounterClockwise class="w-3.5 h-3.5" />
            Torna al pasto previsto
          </button>
        </form>

        <!-- Plan mode: swap the dish with one of similar calories/CHO -->
        <div v-if="isSwappingDish" class="mt-3 p-3 rounded-xl bg-white dark:bg-[#34353a] space-y-1.5">
          <div class="flex items-center justify-between pb-1">
            <span class="text-xs font-semibold text-[#1f2421] dark:text-white">Stesse calorie, piatto diverso</span>
            <button type="button" @click="isSwappingDish = false" class="text-xs text-[#8a918c] hover:text-[#1f2421] dark:hover:text-white">
              Chiudi
            </button>
          </div>
          <button
            v-for="option in dishOptions"
            :key="option.dish.id"
            type="button"
            @click="swapDish(option)"
            class="w-full px-3 py-2 rounded-xl bg-[#f1f4ef] dark:bg-[#222326] hover:bg-[#e6f3d6] dark:hover:bg-[#2f3520] transition text-left flex items-center justify-between gap-2"
          >
            <span class="min-w-0">
              <span class="block text-xs font-medium text-[#1f2421] dark:text-white truncate">{{ option.dish.name }}</span>
              <span class="block text-[11px] text-[#8a918c] truncate">
                {{ option.meal.ingredients.map((i) => `${i.name} ${formatIngredientQuantity(i)}`).join(' · ') }}
              </span>
            </span>
            <span class="text-[11px] tabular-nums text-[#8a918c] flex-shrink-0">{{ option.kcal }} kcal · {{ Math.round(option.cho) }}g</span>
          </button>
          <button type="button" @click="moreDishOptions" class="w-full py-1.5 text-xs font-medium text-[#5f8a3a] dark:text-[#d4f65a] flex items-center justify-center gap-1">
            <ArrowsClockwise class="w-3.5 h-3.5" />
            Altre idee
          </button>
        </div>

        <!-- Bottom-right: replace for this date / swap dish in the plan + edit meal template -->
        <div v-if="canReplace || canEdit" class="flex justify-end gap-1 mt-2 -mb-1 -mr-1">
          <button
            v-if="planMode && canEdit"
            type="button"
            @click="toggleDishSwap"
            class="w-8 h-8 rounded-full flex items-center justify-center transition"
            :class="tone.ghost"
            title="Cambia piatto"
            aria-label="Cambia piatto"
          >
            <ArrowsClockwise class="w-4 h-4" />
          </button>
          <button
            v-if="canReplace"
            type="button"
            @click="toggleReplacement"
            class="w-8 h-8 rounded-full flex items-center justify-center transition"
            :class="tone.ghost"
            title="Sostituisci solo per oggi"
            aria-label="Sostituisci pasto"
          >
            <Swap class="w-4 h-4" />
          </button>
          <button
            v-if="canEdit"
            type="button"
            @click="$emit('edit', meal)"
            class="w-8 h-8 rounded-full flex items-center justify-center transition"
            :class="tone.ghost"
            title="Modifica il piano"
            aria-label="Modifica pasto"
          >
            <Pencil class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  PhBowlFood,
  PhCheck as Check,
  PhPlus as Plus,
  PhX as X,
  PhPencilSimple as Pencil,
  PhTrash as Trash2,
  PhSwap as Swap,
  PhArrowCounterClockwise as ArrowCounterClockwise,
  PhArrowsClockwise as ArrowsClockwise,
} from '@phosphor-icons/vue'
import type { DayOfWeek, ExtraFoodItem, Ingredient, Meal, MealSlot } from '~/types/meal'
import { MEAL_SLOT_LABELS } from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import { formatQuantityString } from '~/utils/grocery'
import { formatDateKey } from '~/utils/date'
import { MEAL_SLOT_ICONS } from '~/utils/mealIcons'
import { calculateMealCho, calculateMealKcal, calculateExtraKcal } from '~/utils/nutrition'
import { findFoodById, foodNutrition } from '~/data/foods'
import { useFoodEntry } from '~/composables/useFoodEntry'
import { suggestDishes, type FittedDish } from '~/utils/menuGenerator'
import FoodSearchInput from '~/components/FoodSearchInput.vue'
import FoodAmountFields from '~/components/FoodAmountFields.vue'

const props = withDefaults(
  defineProps<{
    meal: Meal
    dateKey: string
    dayOfWeek?: DayOfWeek
    editable?: boolean
    timelineState?: 'past' | 'active' | 'future'
    isLast?: boolean
    // Plan editing (Pianificazione): no confirm/extras, edit always available
    planMode?: boolean
  }>(),
  {
    planMode: false,
    editable: true,
    isLast: false,
    timelineState: undefined,
  }
)

defineEmits<{
  (e: 'edit', meal: Meal): void
}>()

const mealStore = useMealStore()

const isAddingExtra = ref(false)
const editingExtraId = ref<string | null>(null)
const extraNameInput = ref<{ focus: () => void } | null>(null)
const extraEntry = useFoodEntry()

// Quick presets from the food table
const QUICK_PRESETS = (
  [
    ['pane-integrale', 30],
    ['mela', 1],
    ['banana', 1],
    ['biscotti-frollini', 20],
    ['cioccolato-fondente', 15],
    ['fette-biscottate', 20],
  ] as const
).flatMap(([id, quantity]) => {
  const food = findFoodById(id)
  if (!food) return []
  const { cho, kcal } = foodNutrition(food, quantity)
  const amount = food.unit === 'pz' ? `${quantity} pz` : `${quantity}${food.unit}`
  return [{ label: `${food.name} ${amount}`, name: food.name, quantity, unit: food.unit, cho, kcal }]
})

const applyPreset = (preset: (typeof QUICK_PRESETS)[number]) => {
  mealStore.addExtraFood(props.dateKey, props.meal.slot, {
    name: preset.name,
    quantity: preset.quantity,
    unit: preset.unit,
    choGrams: preset.cho,
    kcal: preset.kcal,
  })
}

const startEditExtra = (extra: ExtraFoodItem) => {
  isReplacing.value = false
  editingExtraId.value = extra.id
  extraEntry.reset({
    name: extra.name,
    quantity: extra.quantity ?? null,
    unit: extra.unit,
    cho: extra.choGrams,
    kcal: calculateExtraKcal(extra),
  })
  isAddingExtra.value = true
  nextTick(() => extraNameInput.value?.focus())
}

const cancelEditExtra = () => {
  editingExtraId.value = null
  extraEntry.reset()
  isAddingExtra.value = false
}

const openAddExtra = () => {
  isReplacing.value = false
  editingExtraId.value = null
  extraEntry.reset()
  isAddingExtra.value = true
  nextTick(() => extraNameInput.value?.focus())
}

const toggleAddExtra = () => {
  if (isAddingExtra.value) {
    cancelEditExtra()
  } else {
    openAddExtra()
  }
}

const saveExtra = () => {
  const { name, quantity, unit, cho, kcal } = extraEntry
  if (!name.value.trim() || cho.value === null) return

  const data = {
    name: name.value.trim(),
    quantity: quantity.value,
    unit: unit.value,
    choGrams: Number(cho.value) || 0,
    kcal: kcal.value === null ? undefined : Number(kcal.value) || 0,
  }
  if (editingExtraId.value) {
    mealStore.updateExtraFood(props.dateKey, props.meal.slot, editingExtraId.value, data)
  } else {
    mealStore.addExtraFood(props.dateKey, props.meal.slot, data)
  }

  cancelEditExtra()
}

const removeExtra = (extraId: string) => {
  mealStore.removeExtraFood(props.dateKey, props.meal.slot, extraId)
}

const isCompleted = computed(() => {
  return !props.planMode && mealStore.isMealCompleted(props.dateKey, props.meal.slot)
})

const effectiveState = computed<'past' | 'active' | 'future'>(() => {
  if (props.planMode) return 'future'
  if (props.timelineState) {
    return props.timelineState
  }
  return isCompleted.value ? 'past' : 'future'
})

// Past meals (confirmed, or on a past day) can't be edited
// Past = a day before today, or a meal already confirmed: read-only, nothing clickable
const isPastDay = computed(() => props.dateKey < formatDateKey(new Date()))
const isLocked = computed(
  () => isPastDay.value || mealStore.isMealCompleted(props.dateKey, props.meal.slot)
)

const canEdit = computed(() => props.editable && !isLocked.value)

// The active (next to eat) meal gets a solid green card
const isActive = computed(
  () => effectiveState.value === 'active' && !isCompleted.value && !isPastDay.value
)

const tone = computed(() =>
  isActive.value
    ? {
        card: 'bg-[#d4f65a]',
        text: 'text-[#16171a]',
        muted: 'text-[#16171a]/65',
        accent: 'text-[#16171a]',
        row: 'bg-black/10 hover:bg-black/15',
        rowStatic: 'bg-black/10',
        chipOn: 'bg-[#16171a] text-[#d4f65a]',
        chipOff: 'bg-black/10 text-[#16171a] hover:bg-black/15',
        ghost: 'bg-black/10 text-[#16171a] hover:bg-black/15',
      }
    : {
        card: 'bg-[#f1f4ef] dark:bg-[#2b2c30]',
        text: 'text-[#1f2421] dark:text-[#f4f4f5]',
        muted: 'text-[#8a918c] dark:text-[#8e8f94]',
        accent: 'text-[#4c8a17] dark:text-[#d4f65a]',
        row: 'bg-white dark:bg-[#34353a] hover:bg-[#fafbfa] dark:hover:bg-[#3a3b40]',
        rowStatic: 'bg-white dark:bg-[#34353a]',
        chipOn: 'bg-[#d4f65a] text-[#16171a]',
        chipOff: 'bg-white dark:bg-[#34353a] text-[#4a524c] dark:text-[#c8c9cd] hover:bg-[#e9ebe9] dark:hover:bg-[#3a3b40]',
        ghost: 'text-[#8a918c] dark:text-[#8e8f94] hover:bg-white dark:hover:bg-[#34353a] hover:text-[#1f2421] dark:hover:text-white',
      }
)

const completedTimeFormatted = computed(() => {
  if (props.planMode) return null
  const prog = mealStore.getDayProgressForDate(props.dateKey)
  const isoTime = prog.completedAt?.[props.meal.slot]
  if (!isoTime) return null

  try {
    const d = new Date(isoTime)
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return null
  }
})

const activeAlternativeId = computed(() => {
  const prog = mealStore.getDayProgressForDate(props.dateKey)
  return (
    prog.selectedAlternatives?.[props.meal.slot] ||
    props.meal.selectedAlternativeId ||
    props.meal.alternatives?.[0]?.id
  )
})

const extraFoodsList = computed(() => {
  if (props.planMode) return []
  const prog = mealStore.getDayProgressForDate(props.dateKey)
  return prog.extraFoods?.[props.meal.slot] || []
})

const mealCho = computed(() => {
  return calculateMealCho({
    meal: props.meal,
    selectedAlternativeId: activeAlternativeId.value,
    extraFoods: extraFoodsList.value,
    replacement: replacement.value,
  })
})

const mealKcal = computed(() =>
  calculateMealKcal({
    meal: props.meal,
    selectedAlternativeId: activeAlternativeId.value,
    extraFoods: extraFoodsList.value,
    replacement: replacement.value,
  })
)

// Day-specific replacement of the whole meal (the weekly plan is untouched)
const replacement = computed(() => {
  if (props.planMode) return undefined
  return mealStore.getDayProgressForDate(props.dateKey).replacements?.[props.meal.slot]
})

const canReplace = computed(() => !props.planMode && !isLocked.value)
const isReplacing = ref(false)
const replacementInput = ref<{ focus: () => void } | null>(null)
const replacementEntry = useFoodEntry()

const openReplacement = () => {
  cancelEditExtra()
  replacementEntry.reset({
    name: replacement.value?.description,
    cho: replacement.value?.choGrams ?? null,
    kcal: replacement.value?.kcal ?? null,
  })
  isReplacing.value = true
  nextTick(() => replacementInput.value?.focus())
}

const closeReplacement = () => {
  isReplacing.value = false
}

const toggleReplacement = () => {
  if (isReplacing.value) closeReplacement()
  else openReplacement()
}

const saveReplacement = () => {
  const { name, food, quantity, unit, cho, kcal } = replacementEntry
  if (!name.value.trim() || cho.value === null) return
  // Keep the amount in the description when it came from the food table (e.g. "Canederlo · 2 pz")
  const amount =
    food.value && quantity.value ? ` · ${quantity.value}${unit.value === 'pz' ? ' pz' : unit.value}` : ''
  mealStore.setMealReplacement(props.dateKey, props.meal.slot, {
    description: `${name.value.trim()}${amount}`,
    choGrams: Number(cho.value) || 0,
    kcal: kcal.value === null ? undefined : Number(kcal.value) || 0,
  })
  closeReplacement()
}

// ─── Dish ideas from the library (same calories and CHO as the planned meal) ──
const plannedTarget = () => ({
  kcal: calculateMealKcal({ meal: props.meal, selectedAlternativeId: activeAlternativeId.value }).baseKcal,
  cho: calculateMealCho({ meal: props.meal, selectedAlternativeId: activeAlternativeId.value }).baseCho,
})

const ideasFor = (count: number, skip: string[] = []) =>
  suggestDishes({
    slot: props.meal.slot,
    target: plannedTarget(),
    excludedFoods: mealStore.preferences.excludedFoods ?? [],
    excludeDishId: props.meal.dishId,
    count: count + skip.length,
    mealId: props.meal.id,
  }).filter((f) => !skip.includes(f.dish.id)).slice(0, count)

const replacementIdeas = computed(() => (isReplacing.value && !props.meal.isOut ? ideasFor(3) : []))

const useIdeaAsReplacement = (idea: FittedDish) => {
  replacementEntry.reset({ name: idea.dish.name, cho: idea.cho, kcal: idea.kcal })
}

const isSwappingDish = ref(false)
const dishOptions = ref<FittedDish[]>([])
const shownDishIds = ref<string[]>([])

const toggleDishSwap = () => {
  isSwappingDish.value = !isSwappingDish.value
  if (isSwappingDish.value) {
    dishOptions.value = ideasFor(4)
    shownDishIds.value = dishOptions.value.map((o) => o.dish.id)
  }
}

const moreDishOptions = () => {
  const next = ideasFor(4, shownDishIds.value)
  // Library exhausted: start over
  dishOptions.value = next.length ? next : ideasFor(4)
  shownDishIds.value = next.length ? [...shownDishIds.value, ...next.map((o) => o.dish.id)] : dishOptions.value.map((o) => o.dish.id)
}

const swapDish = (option: FittedDish) => {
  if (!props.dayOfWeek) return
  mealStore.updateMeal(props.dayOfWeek, props.meal.slot, {
    ...option.meal,
    id: props.meal.id,
    notes: undefined,
    alternatives: undefined,
    selectedAlternativeId: undefined,
    estimatedCho: undefined,
    estimatedKcal: undefined,
  })
  isSwappingDish.value = false
}

const restorePlannedMeal = () => {
  mealStore.clearMealReplacement(props.dateKey, props.meal.slot)
  closeReplacement()
}

const displayIngredients = computed<Ingredient[]>(() => {
  const items: Ingredient[] = [...(props.meal.ingredients || [])]
  if (props.meal.alternatives && props.meal.alternatives.length > 0) {
    const chosen = props.meal.alternatives.find(
      (a) => a.id === activeAlternativeId.value
    )
    if (chosen && chosen.ingredients) {
      items.push(...chosen.ingredients)
    }
  }
  return items
})

const slotIcon = computed(() => MEAL_SLOT_ICONS[props.meal.slot] ?? PhBowlFood)

const toggleCompleted = () => {
  if (isLocked.value) return
  if (!isCompleted.value) {
    cancelEditExtra()
    isReplacing.value = false
  }
  mealStore.toggleMealCompleted(props.dateKey, props.meal.slot)
}

const selectAlternative = (altId: string) => {
  if (isLocked.value) return
  mealStore.setDayAlternative(props.dateKey, props.meal.slot, altId)
}

const formatIngredientQuantity = (ing: Ingredient) => {
  return formatQuantityString(ing.quantity, ing.unit, ing.isToDefine)
}
</script>
