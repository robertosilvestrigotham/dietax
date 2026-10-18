<template>
  <div class="ui-modal-backdrop" @click.self="closeMenuGenerator">
    <div class="ui-modal sm:max-w-lg">
      <!-- Hero -->
      <div class="relative isolate overflow-hidden px-5 pt-5 pb-5 bg-gradient-to-br from-[#e3f2d3] to-[#eef5c8] dark:from-[#232427] dark:to-[#2c331a]">
        <ShaderBackground class="-z-10" />
        <div class="flex items-start justify-between gap-3">
          <span class="w-14 h-14 rounded-[20px] bg-white/75 dark:bg-white/10 backdrop-blur flex items-center justify-center shadow-[0_6px_20px_rgba(60,100,40,0.12)]">
            <ChefHat class="w-8 h-8 text-[#5f8a3a] dark:text-[#d4f65a]" />
          </span>
          <button type="button" @click="closeMenuGenerator" class="w-9 h-9 rounded-full flex items-center justify-center bg-white/60 dark:bg-white/10 text-[#1f2421] dark:text-white" aria-label="Chiudi">
            <X class="w-4 h-4" weight="bold" />
          </button>
        </div>
        <h3 class="mt-4 text-2xl font-bold tracking-tight text-[#1f2421] dark:text-white">Nuovo menù</h3>
        <p class="text-sm text-[#4a5a44] dark:text-[#b5b6ba]">
          Piatti nuovi ogni giorno, porzioni su <strong class="tabular-nums">{{ targetKcal }} kcal</strong>.
        </p>
      </div>

      <div class="ui-modal-body px-5 py-5 space-y-3">
        <!-- Options -->
        <div class="ui-card space-y-4">
          <div>
            <span class="ui-label">Carboidrati sulle calorie</span>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="opt in choOptions"
                :key="opt.label"
                type="button"
                @click="choRatio = opt.value"
                class="py-2 rounded-xl text-xs font-semibold transition"
                :class="choRatio === opt.value ? 'bg-[#d4f65a] text-[#16171a]' : 'bg-[#f1f4ef] dark:bg-[#2b2c30] text-[#4a524c] dark:text-[#c8c9cd]'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <label v-if="hasWorkouts" class="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span class="block text-sm font-medium text-[#1f2421] dark:text-white">Più calorie nei giorni di allenamento</span>
              <span class="ui-muted">Stesso totale settimanale</span>
            </span>
            <span class="relative inline-flex items-center flex-shrink-0">
              <input v-model="trainingBonus" type="checkbox" class="sr-only peer" />
              <span
                class="w-11 h-6 rounded-full bg-[#d6dfd1] dark:bg-[#34353a] peer-checked:bg-[#d4f65a] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
              ></span>
            </span>
          </label>

          <div class="space-y-2">
            <span class="ui-label">Alimenti da evitare</span>
            <div v-if="excluded.length" class="flex flex-wrap gap-1.5">
              <button
                v-for="id in excluded"
                :key="id"
                type="button"
                @click="removeExcluded(id)"
                class="ui-chip-on"
                :aria-label="`Togli ${foodName(id)} dagli esclusi`"
              >
                {{ foodName(id) }}
                <X class="w-3 h-3" weight="bold" />
              </button>
            </div>
            <FoodSearchInput
              v-model="excludeQuery"
              placeholder="Cerca un alimento da escludere"
              input-class="ui-input text-xs"
              @select="addExcluded"
            />
          </div>
        </div>

        <!-- Preview -->
        <div v-for="day in preview" :key="day.dayOfWeek" class="ui-card p-4">
          <div class="flex items-baseline justify-between mb-2">
            <span class="text-sm font-bold text-[#1f2421] dark:text-white capitalize">{{ DAY_OF_WEEK_LABELS[day.dayOfWeek] }}</span>
            <span class="text-xs tabular-nums text-[#8a918c] dark:text-[#8e8f94]">
              <span class="font-semibold text-[#1f2421] dark:text-white">{{ day.kcal }}</span> kcal · {{ Math.round(day.cho) }}g CHO
            </span>
          </div>
          <ul class="space-y-1">
            <li v-for="row in day.rows" :key="row.slot" class="flex items-center gap-2.5">
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                :class="row.locked ? 'bg-[#9fb83f]' : 'bg-[#c8d3c2] dark:bg-[#3a3b40]'"
              >
                <component :is="MEAL_SLOT_ICONS[row.slot]" class="w-3.5 h-3.5" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-xs font-medium text-[#1f2421] dark:text-white truncate">{{ row.name }}</span>
              </span>
              <span class="text-[11px] tabular-nums text-[#8a918c] flex-shrink-0">{{ row.kcal }}</span>
              <span v-if="row.isOut" class="w-8 text-center text-[10px] text-amber-700 dark:text-amber-300">fuori</span>
              <button
                v-else
                type="button"
                @click="toggleLock(day.dayOfWeek, row.slot)"
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
                :class="row.locked ? 'text-[#5f8a3a] dark:text-[#d4f65a] bg-[#eaf3dc] dark:bg-[#2f3520]' : 'text-[#b6bdb8] hover:text-[#4a524c]'"
                :aria-label="row.locked ? 'Sblocca piatto' : 'Tieni questo piatto'"
                :title="row.locked ? 'Bloccato: resta quando rigeneri' : 'Tieni questo piatto'"
              >
                <component :is="row.locked ? LockSimple : LockSimpleOpen" class="w-4 h-4" :weight="row.locked ? 'fill' : 'regular'" />
              </button>
            </li>
          </ul>
        </div>

        <p class="px-1 text-[11px] leading-relaxed text-[#8a918c] dark:text-[#6b6c71]">
          Blocca con il lucchetto i piatti che ti piacciono e rigenera gli altri. I pasti fuori casa restano. Puoi annullare da Opzioni.
        </p>
      </div>

      <div class="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5">
        <button type="button" @click="regenerate" class="ui-btn-ghost">
          <ArrowsClockwise class="w-4 h-4" />
          Rigenera
        </button>
        <button type="button" @click="apply" class="ui-btn-primary">
          <Check class="w-4 h-4" weight="bold" />
          Usa questo menù
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import {
  PhChefHat as ChefHat,
  PhX as X,
  PhArrowsClockwise as ArrowsClockwise,
  PhCheck as Check,
  PhLockSimple as LockSimple,
  PhLockSimpleOpen as LockSimpleOpen,
} from '@phosphor-icons/vue'
import type { DayOfWeek, Meal, MealSlot, WeeklyPlan } from '~/types/meal'
import { DAYS_OF_WEEK_ORDER, DAY_OF_WEEK_LABELS, MEAL_SLOT_ORDER } from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import { useProfileUi } from '~/composables/useProfileUi'
import { latestMeasurement, summarizeProfile, workoutKcal } from '~/utils/body'
import { calculateDayKcal, calculateMealKcal } from '~/utils/nutrition'
import { generateWeekPlan, lockKey, planChoRatio, type GeneratedWeek } from '~/utils/menuGenerator'
import { MEAL_SLOT_ICONS } from '~/utils/mealIcons'
import { findFoodById, type FoodItem } from '~/data/foods'
import ShaderBackground from '~/components/ShaderBackground.vue'
import FoodSearchInput from '~/components/FoodSearchInput.vue'

const mealStore = useMealStore()
const { closeMenuGenerator } = useProfileUi()

const targetKcal = computed(() => {
  if (mealStore.preferences.kcalGoal) return mealStore.preferences.kcalGoal
  const fromProfile = mealStore.profile ? summarizeProfile(mealStore.profile)?.targetKcal : undefined
  if (fromProfile) return fromProfile
  const total = DAYS_OF_WEEK_ORDER.reduce((s, d) => s + calculateDayKcal({ dayPlan: mealStore.plan[d] }).totalKcal, 0)
  return Math.round(total / 7 / 50) * 50
})

// CHO share: as in the current plan, or a fixed 45% / 40%
const currentRatio = Math.round(planChoRatio(mealStore.plan) * 100) / 100
const choOptions = [
  { label: `Come ora (${Math.round(currentRatio * 100)}%)`, value: currentRatio },
  { label: '45%', value: 0.45 },
  { label: '40%', value: 0.4 },
]
const choRatio = ref(currentRatio)

// Training days: workouts of the profile, in kcal per weekday
const hasWorkouts = computed(() => (mealStore.profile?.workouts?.length ?? 0) > 0)
const trainingBonus = ref(hasWorkouts.value)
const workoutKcalByDay = computed(() => {
  const profile = mealStore.profile
  const weight = latestMeasurement(profile)?.weightKg
  if (!trainingBonus.value || !profile?.workouts || !weight) return undefined
  const byDay: Partial<Record<DayOfWeek, number>> = {}
  for (const w of profile.workouts) byDay[w.day] = (byDay[w.day] ?? 0) + workoutKcal(w.type, w.minutes, weight)
  return byDay
})

// Excluded foods (persisted in preferences)
const excluded = computed(() => mealStore.preferences.excludedFoods ?? [])
const excludeQuery = ref('')
const foodName = (id: string) => findFoodById(id)?.name ?? id
const addExcluded = (food: FoodItem) => {
  mealStore.setExcludedFoods([...excluded.value, food.id])
  excludeQuery.value = ''
}
const removeExcluded = (id: string) => mealStore.setExcludedFoods(excluded.value.filter((x) => x !== id))

// Locked meals: kept as they are in the preview when regenerating
const lockedMeals = ref(new Map<string, Meal>())
const seed = ref(Math.floor(Math.random() * 1e9))
const result = shallowRef<GeneratedWeek | null>(null)

const generate = () => {
  const base = JSON.parse(JSON.stringify(mealStore.plan)) as WeeklyPlan
  for (const [key, meal] of lockedMeals.value) {
    const [day, slot] = key.split(':') as [DayOfWeek, MealSlot]
    base[day][slot] = meal
  }
  result.value = generateWeekPlan({
    plan: base,
    targetKcal: targetKcal.value,
    choRatio: choRatio.value,
    excludedFoods: excluded.value,
    locks: new Set(lockedMeals.value.keys()),
    workoutKcalByDay: workoutKcalByDay.value,
    seed: seed.value,
  })
}

// Options change → new menu; locking a dish does not reshuffle the others
watch([choRatio, trainingBonus, excluded, seed], generate, { immediate: true, deep: true })

const regenerate = () => {
  seed.value = Math.floor(Math.random() * 1e9)
}

const toggleLock = (day: DayOfWeek, slot: MealSlot) => {
  const key = lockKey(day, slot)
  const next = new Map(lockedMeals.value)
  if (next.has(key)) next.delete(key)
  else if (result.value) next.set(key, result.value.plan[day][slot])
  lockedMeals.value = next
}

const preview = computed(() => {
  if (!result.value) return []
  return result.value.days.map((day) => ({
    ...day,
    rows: MEAL_SLOT_ORDER.map((slot) => {
      const meal = result.value!.plan[day.dayOfWeek][slot]
      return {
        slot,
        name: meal.description,
        kcal: calculateMealKcal({ meal }).totalKcal,
        isOut: meal.isOut,
        locked: lockedMeals.value.has(lockKey(day.dayOfWeek, slot)),
      }
    }),
  }))
})

const apply = () => {
  if (!result.value) return
  mealStore.applyPlan(result.value.plan)
  closeMenuGenerator()
}
</script>
