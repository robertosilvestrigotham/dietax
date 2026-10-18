<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- View switcher + menu generator -->
    <div class="flex items-center justify-between gap-2">
    <div class="ui-segment">
      <button
        type="button"
        @click="viewMode = 'single'"
        :class="viewMode === 'single' ? 'ui-segment-item-on' : 'ui-segment-item'"
      >
        Giorno
      </button>
      <button
        type="button"
        @click="viewMode = 'all'"
        :class="viewMode === 'all' ? 'ui-segment-item-on' : 'ui-segment-item'"
      >
        Panoramica
      </button>
    </div>
    <button type="button" @click="openMenuGenerator" class="ui-btn bg-[#d4f65a] hover:bg-[#c2e646] text-[#16171a] dark:bg-[#d4f65a] dark:text-[#16171a]">
      <ChefHat class="w-4 h-4" />
      Nuovo menù
    </button>
    </div>

    <!-- Days Selector Bar with Day CHO (always fits the width, no overlap) -->
    <div v-if="viewMode === 'single'" class="grid grid-cols-7 gap-1.5 sm:gap-2">
      <button
        v-for="day in weekDays"
        :key="day.dateKey"
        type="button"
        @click="selectDay(day.dayOfWeek, day.dateKey)"
        :disabled="isPast(day.dateKey)"
        class="min-w-0 py-2.5 px-1 rounded-2xl text-center transition flex flex-col items-center disabled:opacity-45 disabled:pointer-events-none"
        :class="[
          activeDayOfWeek === day.dayOfWeek
            ? 'bg-[#d4f65a] text-[#16171a]'
            : 'bg-white dark:bg-[#222326] text-[#1f2421] dark:text-[#f4f4f5] hover:bg-[#f3f4f3] dark:hover:bg-[#2b2c30]',
        ]"
      >
        <span
          class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide"
          :class="activeDayOfWeek === day.dayOfWeek ? 'text-white/85' : 'text-[#8a918c] dark:text-[#8e8f94]'"
        >
          {{ DAY_OF_WEEK_SHORT[day.dayOfWeek] }}
        </span>
        <span class="text-base sm:text-lg font-bold leading-tight tabular-nums">
          {{ day.dayOfMonth }}
        </span>
        <span
          class="text-[10px] sm:text-[11px] font-medium tabular-nums truncate max-w-full"
          :class="activeDayOfWeek === day.dayOfWeek ? 'text-white/85' : 'text-[#8a918c] dark:text-[#8e8f94]'"
        >
          {{ Math.round(getDateTotalCho(day.dateKey)) }}g
        </span>
      </button>
    </div>

    <!-- Single Day Detailed View -->
    <div v-if="viewMode === 'single'" class="space-y-4">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="text-lg font-bold text-[#1f2421] dark:text-white capitalize">
          {{ DAY_OF_WEEK_LABELS[activeDayOfWeek] }}
        </h2>
        <span class="text-sm tabular-nums">
          <span class="font-semibold text-[#5f8a3a] dark:text-[#d4f65a]">{{ Math.round(getDayTotalCho(activeDayOfWeek)) }}g CHO</span>
          <span class="text-[#8a918c] dark:text-[#8e8f94]"> · {{ getDayTotalKcal(activeDayOfWeek) }} kcal</span>
        </span>
      </div>

      <div>
        <MealCard
          v-for="slot in MEAL_SLOT_ORDER"
          :key="`${activeDateKey}-${slot}`"
          :meal="mealStore.plan[activeDayOfWeek][slot]"
          :date-key="activeDateKey"
          :day-of-week="activeDayOfWeek"
          :is-last="slot === MEAL_SLOT_ORDER[MEAL_SLOT_ORDER.length - 1]"
          plan-mode
          @edit="openEditModal"
        />
      </div>
    </div>

    <!-- Overview of all days in the window: mini calendar tile + the day's meals -->
    <div v-else class="space-y-3">
      <div v-for="day in weekDays" :key="`all-${day.dayOfWeek}`" class="ui-card p-3 flex gap-3">
        <button
          type="button"
          @click="selectDay(day.dayOfWeek, day.dateKey); viewMode = 'single'"
          :disabled="isPast(day.dateKey)"
          class="w-16 self-start flex-shrink-0 py-2.5 rounded-2xl flex flex-col items-center transition disabled:opacity-60 disabled:pointer-events-none"
          :class="
            day.isToday
              ? 'bg-[#d4f65a] text-[#16171a]'
              : 'bg-[#f1f4ef] dark:bg-[#2b2c30] text-[#1f2421] dark:text-[#f4f4f5] hover:bg-[#e9eee6] dark:hover:bg-[#2b2c30]'
          "
          :title="`Apri ${day.dayLabel}`"
        >
          <span
            class="text-[11px] font-semibold uppercase tracking-wide"
            :class="day.isToday ? 'text-white/85' : 'text-[#8a918c] dark:text-[#8e8f94]'"
          >
            {{ DAY_OF_WEEK_SHORT[day.dayOfWeek] }}
          </span>
          <span class="text-xl font-bold leading-tight tabular-nums">{{ day.dayOfMonth }}</span>
          <span
            class="text-[11px] font-medium tabular-nums"
            :class="day.isToday ? 'text-white/85' : 'text-[#8a918c] dark:text-[#8e8f94]'"
          >
            {{ Math.round(getDateTotalCho(day.dateKey)) }}g
          </span>
        </button>

        <ul class="flex-1 min-w-0">
          <li v-for="slot in MEAL_SLOT_ORDER" :key="`${day.dayOfWeek}-${slot}`">
            <button
              type="button"
              @click="openEditModalForDay(day.dayOfWeek, datedPlan(day.dateKey)[slot])"
              :disabled="getSlotState(day.dateKey, day.isToday, slot) === 'done' || isPast(day.dateKey)"
              class="w-full flex items-center gap-2.5 py-1.5 px-1.5 rounded-xl text-left hover:bg-[#f1f4ef] dark:hover:bg-[#2b2c30] transition disabled:pointer-events-none"
            >
              <span
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                :class="slotStateClass(getSlotState(day.dateKey, day.isToday, slot))"
              >
                <component :is="MEAL_SLOT_ICONS[slot]" class="w-4 h-4" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-xs font-semibold text-[#1f2421] dark:text-white">
                  {{ MEAL_SLOT_LABELS[slot] }}
                  <span v-if="datedPlan(day.dateKey)[slot].isOut" class="font-medium text-amber-700 dark:text-amber-300"> · Fuori casa</span>
                </span>
                <span class="block text-xs text-[#8a918c] dark:text-[#8e8f94] truncate">
                  {{ datedPlan(day.dateKey)[slot].description }}
                </span>
              </span>
              <span class="text-xs tabular-nums text-[#8a918c] dark:text-[#8e8f94] flex-shrink-0">
                {{ Math.round(getMealChoValue(datedPlan(day.dateKey)[slot])) }}g
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Meal Edit Modal -->
    <MealEditModal
      :is-open="isEditModalOpen"
      :meal="editingMeal"
      :day-of-week="modalDayOfWeek"
      @close="isEditModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhChefHat as ChefHat } from '@phosphor-icons/vue'
import { useProfileUi } from '~/composables/useProfileUi'
import type { DayOfWeek, Meal, MealSlot } from '~/types/meal'
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT,
  MEAL_SLOT_ORDER,
  MEAL_SLOT_LABELS,
} from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import { getDaysAround, formatDateKey, getDayOfWeekFromDate } from '~/utils/date'
import { MEAL_SLOT_ICONS } from '~/utils/mealIcons'
import { calculateMealCho, calculateDayCho, calculateDayKcal } from '~/utils/nutrition'

const mealStore = useMealStore()
const { openMenuGenerator } = useProfileUi()

const viewMode = ref<'single' | 'all'>('single')
const activeDateKey = ref<string>(formatDateKey(new Date()))
const activeDayOfWeek = ref<DayOfWeek>(getDayOfWeekFromDate(activeDateKey.value))

// Rolling window: 2 past days, today, 4 future days
const PAST_DAYS = 2
const FUTURE_DAYS = 4
const weekDays = computed(() => getDaysAround(new Date(), PAST_DAYS, FUTURE_DAYS))

const getDayTotalCho = (day: DayOfWeek): number => {
  const dayPlan = mealStore.getDayPlan(day)
  return calculateDayCho({ dayPlan }).totalCho
}

// Real dates (overview, tiles): confirmed meals use their frozen copy
const datedPlan = (dateKey: string) => mealStore.getDayPlanForDate(dateKey)
const getDateTotalCho = (dateKey: string): number => calculateDayCho({ dayPlan: datedPlan(dateKey) }).totalCho

const getDayTotalKcal = (day: DayOfWeek): number => {
  return calculateDayKcal({ dayPlan: mealStore.getDayPlan(day) }).totalKcal
}

const getMealChoValue = (meal: Meal): number => {
  return calculateMealCho({ meal }).totalCho
}

// Past days are read-only and not selectable
const todayKey = formatDateKey(new Date())
const isPast = (dateKey: string) => dateKey < todayKey

// Same states as the "Oggi" timeline: active = first unconfirmed meal of today
type SlotState = 'done' | 'active' | 'future'

const getSlotState = (dateKey: string, isToday: boolean, slot: MealSlot): SlotState => {
  if (mealStore.isMealCompleted(dateKey, slot)) return 'done'
  if (isToday && MEAL_SLOT_ORDER.find((s) => !mealStore.isMealCompleted(dateKey, s)) === slot) {
    return 'active'
  }
  return 'future'
}

const slotStateClass = (state: SlotState) => {
  if (state === 'active') return 'bg-[#d4f65a] text-[#16171a]'
  if (state === 'done') return 'bg-[#5c6b2a] text-[#ececee]'
  return 'bg-[#3a3b40] text-[#ececee]'
}

const isEditModalOpen = ref(false)
const editingMeal = ref<Meal | null>(null)
const modalDayOfWeek = ref<DayOfWeek>('monday')

const selectDay = (day: DayOfWeek, dateKey: string) => {
  activeDayOfWeek.value = day
  activeDateKey.value = dateKey
}

const openEditModal = (meal: Meal) => {
  editingMeal.value = meal
  modalDayOfWeek.value = activeDayOfWeek.value
  isEditModalOpen.value = true
}

const openEditModalForDay = (day: DayOfWeek, meal: Meal) => {
  editingMeal.value = meal
  modalDayOfWeek.value = day
  isEditModalOpen.value = true
}
</script>
