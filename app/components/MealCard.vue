<template>
  <div class="flex gap-3 sm:gap-4">
    <!-- Timeline rail: slot icon + connector to next meal -->
    <div class="flex flex-col items-center flex-shrink-0">
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        :class="[
          'text-white dark:text-[#e8f0e4]',
          isCompleted
            ? 'bg-[#a3bb97] dark:bg-[#3a5a3c]'
            : isActive
              ? 'bg-[#8cc63f] ring-2 ring-offset-2 ring-[#8cc63f] ring-offset-[#e5ede2] dark:ring-offset-[#0c1610]'
              : 'bg-[#c8d3c2] dark:bg-[#24332a]',
        ]"
      >
        <component :is="slotIcon" class="w-5 h-5" />
      </div>
      <div
        v-if="!isLast"
        class="w-0.5 rounded-full flex-1 mt-2"
        :class="isCompleted ? 'bg-[#a3bb97] dark:bg-[#3a5a3c]' : 'bg-[#d6dfd1] dark:bg-[#1d2a20]'"
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
            <span class="font-semibold text-[#1f2421] dark:text-[#e6ebe7]">{{ mealCho.totalCho }}g CHO</span>
            <span v-if="completedTimeFormatted" class="text-[#9aa19c] dark:text-[#7d867f]"> · alle {{ completedTimeFormatted }}</span>
          </div>
        </div>

        <!-- Actions: add extra + confirm (not in plan mode) -->
        <div v-if="!planMode" class="flex items-center gap-1.5 flex-shrink-0">
          <button
            v-if="!isLocked"
            type="button"
            @click="toggleAddExtra"
            class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 bg-white dark:bg-[#1b211d] text-[#4a524c] dark:text-[#c9d1cb] hover:bg-[#e6f3d6] hover:text-[#4c8a17] disabled:opacity-35 disabled:pointer-events-none"
            :title="isAddingExtra ? 'Chiudi' : 'Aggiungi alimento extra'"
            aria-label="Aggiungi extra"
          >
            <X v-if="isAddingExtra" class="w-4 h-4" weight="bold" />
            <Plus v-else class="w-4 h-4" weight="bold" />
          </button>
          <span
            v-if="isCompleted"
            class="w-9 h-9 rounded-full flex items-center justify-center bg-[#a3bb97] dark:bg-[#3a5a3c] text-white"
            title="Pasto confermato"
          >
            <Check class="w-4 h-4" weight="bold" />
          </span>
          <button
            v-else-if="!isLocked"
            type="button"
            @click="toggleCompleted"
            class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 bg-white dark:bg-[#1b211d] text-[#c3c8c4] dark:text-[#4d564f] hover:text-[#8cc63f]"
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
              editingExtraId === extra.id ? 'ring-2 ring-[#8cc63f]' : '',
            ]"
          >
            <div class="min-w-0 text-xs">
              <span class="font-medium" :class="tone.text">{{ extra.name }}</span>
              <span v-if="extra.quantity" :class="tone.muted"> • {{ extra.quantity }}{{ extra.unit || 'g' }}</span>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="text-xs font-semibold tabular-nums" :class="tone.accent">+{{ extra.choGrams }}g</span>
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
        <div v-if="isAddingExtra" class="mt-3 p-3.5 rounded-xl bg-white dark:bg-[#232a25] space-y-3">
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
              class="text-xs px-2.5 py-1 rounded-full bg-[#f3f4f3] dark:bg-[#1b211d] hover:bg-[#e6f3d6] text-[#4a524c] dark:text-[#c9d1cb] transition"
            >
              {{ p.label }} <span class="font-semibold text-[#4c8a17] dark:text-[#a0da6c]">+{{ p.cho }}g</span>
            </button>
          </div>

          <form @submit.prevent="saveExtra" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              ref="extraNameInput"
              type="text"
              v-model="newExtraName"
              placeholder="Alimento"
              class="w-full text-xs px-3 py-2 rounded-xl bg-[#f3f4f3] dark:bg-[#1b211d] text-[#1f2421] dark:text-white placeholder:text-[#9aa19c] focus:outline-none focus:ring-2 focus:ring-[#8cc63f]"
            />
            <input
              type="text"
              v-model="newExtraQty"
              placeholder="Quantità (es. 50g)"
              class="w-full text-xs px-3 py-2 rounded-xl bg-[#f3f4f3] dark:bg-[#1b211d] text-[#1f2421] dark:text-white placeholder:text-[#9aa19c] focus:outline-none focus:ring-2 focus:ring-[#8cc63f]"
            />
            <div class="flex items-center gap-1.5">
              <input
                type="number"
                v-model.number="newExtraCho"
                min="0"
                max="500"
                placeholder="g CHO"
                class="w-full text-xs px-3 py-2 rounded-xl bg-[#f3f4f3] dark:bg-[#1b211d] text-[#1f2421] dark:text-white placeholder:text-[#9aa19c] focus:outline-none focus:ring-2 focus:ring-[#8cc63f]"
              />
              <button
                type="submit"
                class="px-3.5 py-2 rounded-xl font-semibold text-xs flex-shrink-0 bg-[#8cc63f] hover:bg-[#7db536] text-white transition"
              >
                {{ editingExtraId ? 'Salva' : 'Aggiungi' }}
              </button>
            </div>
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
          class="mt-3 p-3.5 rounded-xl bg-white dark:bg-[#232a25] space-y-3"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#1f2421] dark:text-white">Cosa mangi al suo posto?</span>
            <button type="button" @click="closeReplacement" class="text-xs text-[#8a918c] hover:text-[#1f2421] dark:hover:text-white">
              Chiudi
            </button>
          </div>
          <input
            ref="replacementInput"
            type="text"
            v-model="replacementDescription"
            placeholder="Es. Canederlo in brodo"
            class="ui-input text-xs"
          />
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="replacementCho"
              min="0"
              max="500"
              placeholder="g CHO"
              class="ui-input text-xs"
            />
            <button
              type="submit"
              :disabled="!replacementDescription.trim() || replacementCho === null"
              class="px-4 py-2.5 rounded-xl font-semibold text-xs flex-shrink-0 bg-[#8cc63f] hover:bg-[#7db536] text-white transition disabled:opacity-40"
            >
              Sostituisci
            </button>
          </div>
          <button
            v-if="replacement"
            type="button"
            @click="restorePlannedMeal"
            class="text-xs font-medium text-[#5f8a3a] dark:text-[#a7c49a] flex items-center gap-1"
          >
            <ArrowCounterClockwise class="w-3.5 h-3.5" />
            Torna al pasto previsto
          </button>
        </form>

        <!-- Bottom-right: replace for this date + edit meal template -->
        <div v-if="canReplace || canEdit" class="flex justify-end gap-1 mt-2 -mb-1 -mr-1">
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
} from '@phosphor-icons/vue'
import type { DayOfWeek, ExtraFoodItem, Ingredient, Meal, MealSlot } from '~/types/meal'
import { MEAL_SLOT_LABELS } from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import { formatQuantityString } from '~/utils/grocery'
import { formatDateKey } from '~/utils/date'
import { MEAL_SLOT_ICONS } from '~/utils/mealIcons'
import { calculateMealCho } from '~/utils/nutrition'

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
const extraNameInput = ref<HTMLInputElement | null>(null)
const newExtraName = ref('')
const newExtraQty = ref('')
const newExtraCho = ref<number | null>(null)

// Common quick presets for fast logging
const QUICK_PRESETS = [
  { label: 'Pane (30g)', name: 'Pane integrale', qty: '30g', cho: 15 },
  { label: 'Mela / Pera (1 pz)', name: 'Mela fresca', qty: '1 pz', cho: 18 },
  { label: 'Banana (1 pz)', name: 'Banana piccola', qty: '1 pz', cho: 23 },
  { label: 'Biscotti (2 pz)', name: 'Biscotti frollini', qty: '20g', cho: 15 },
  { label: 'Cioccolato fondente', name: 'Cioccolato 85%', qty: '15g', cho: 7 },
  { label: 'Fette biscottate (2 pz)', name: 'Fette biscottate', qty: '2 pz', cho: 15 },
]

const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
  mealStore.addExtraFood(props.dateKey, props.meal.slot, {
    name: preset.name,
    quantity: 1,
    unit: 'pz',
    choGrams: preset.cho,
  })
}

const startEditExtra = (extra: ExtraFoodItem) => {
  isReplacing.value = false
  editingExtraId.value = extra.id
  newExtraName.value = extra.name
  newExtraQty.value = extra.quantity ? `${extra.quantity}${extra.unit || 'g'}` : ''
  newExtraCho.value = extra.choGrams
  isAddingExtra.value = true
  nextTick(() => {
    extraNameInput.value?.focus()
  })
}

const cancelEditExtra = () => {
  editingExtraId.value = null
  newExtraName.value = ''
  newExtraQty.value = ''
  newExtraCho.value = null
  isAddingExtra.value = false
}

const openAddExtra = () => {
  isReplacing.value = false
  editingExtraId.value = null
  newExtraName.value = ''
  newExtraQty.value = ''
  newExtraCho.value = null
  isAddingExtra.value = true
  nextTick(() => {
    extraNameInput.value?.focus()
  })
}

const toggleAddExtra = () => {
  if (isAddingExtra.value) {
    cancelEditExtra()
  } else {
    openAddExtra()
  }
}

const saveExtra = () => {
  if (!newExtraName.value.trim() || newExtraCho.value === null) return

  const parsedQty = newExtraQty.value
    ? Number(newExtraQty.value.replace(/[^0-9.]/g, '')) || null
    : null

  if (editingExtraId.value) {
    mealStore.updateExtraFood(props.dateKey, props.meal.slot, editingExtraId.value, {
      name: newExtraName.value.trim(),
      quantity: parsedQty,
      choGrams: Number(newExtraCho.value) || 0,
    })
  } else {
    mealStore.addExtraFood(props.dateKey, props.meal.slot, {
      name: newExtraName.value.trim(),
      quantity: parsedQty,
      unit: 'g',
      choGrams: Number(newExtraCho.value) || 0,
    })
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
        card: 'bg-[#8cc63f]',
        text: 'text-white',
        muted: 'text-white/80',
        accent: 'text-white',
        row: 'bg-white/20 hover:bg-white/30',
        rowStatic: 'bg-white/20',
        chipOn: 'bg-white text-[#4c8a17]',
        chipOff: 'bg-white/20 text-white hover:bg-white/30',
        ghost: 'bg-white/25 text-white hover:bg-white/35',
      }
    : {
        card: 'bg-[#f1f4ef] dark:bg-[#18221b]',
        text: 'text-[#1f2421] dark:text-[#eef1ef]',
        muted: 'text-[#8a918c] dark:text-[#8e9790]',
        accent: 'text-[#4c8a17] dark:text-[#a0da6c]',
        row: 'bg-white dark:bg-[#232a25] hover:bg-[#fafbfa] dark:hover:bg-[#283029]',
        rowStatic: 'bg-white dark:bg-[#232a25]',
        chipOn: 'bg-[#1f2421] text-white dark:bg-white dark:text-[#1f2421]',
        chipOff: 'bg-white dark:bg-[#262e28] text-[#4a524c] dark:text-[#c9d1cb] hover:bg-[#e9ebe9] dark:hover:bg-[#2d362f]',
        ghost: 'text-[#8a918c] dark:text-[#8e9790] hover:bg-white dark:hover:bg-[#262e28] hover:text-[#1f2421] dark:hover:text-white',
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

// Day-specific replacement of the whole meal (the weekly plan is untouched)
const replacement = computed(() => {
  if (props.planMode) return undefined
  return mealStore.getDayProgressForDate(props.dateKey).replacements?.[props.meal.slot]
})

const canReplace = computed(() => !props.planMode && !isLocked.value)
const isReplacing = ref(false)
const replacementInput = ref<HTMLInputElement | null>(null)
const replacementDescription = ref('')
const replacementCho = ref<number | null>(null)

const openReplacement = () => {
  cancelEditExtra()
  replacementDescription.value = replacement.value?.description ?? ''
  replacementCho.value = replacement.value?.choGrams ?? null
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
  if (!replacementDescription.value.trim() || replacementCho.value === null) return
  mealStore.setMealReplacement(props.dateKey, props.meal.slot, {
    description: replacementDescription.value.trim(),
    choGrams: Number(replacementCho.value) || 0,
  })
  closeReplacement()
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
