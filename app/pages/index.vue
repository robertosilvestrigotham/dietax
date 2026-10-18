<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Header: date + live clock -->
    <div class="flex items-start justify-between gap-4 pb-[38px] md:pb-[42px]">
      <div>
        <div class="flex items-center space-x-2">
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-white dark:bg-[#222326] text-[#1f2421] dark:text-[#f4f4f5]">
            {{ selectedDayLabel }}
          </span>
          <span v-if="isCurrentDateToday" class="text-xs font-semibold text-[#5f8a3a] dark:text-[#d4f65a] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#d4f65a]"></span>
            Oggi
          </span>
          <!-- Back to today (only when viewing another day, e.g. from Registro) -->
          <button
            v-else
            type="button"
            @click="goToToday"
            class="px-3 py-1 rounded-full text-xs font-semibold bg-[#d4f65a] text-[#16171a] hover:bg-[#c2e646] transition"
          >
            Torna a oggi
          </button>
        </div>
      </div>

      <time
        v-if="clock"
        class="text-2xl md:text-3xl font-bold tracking-tight tabular-nums text-[#a9cf8a] dark:text-[#9fb83f] leading-none pt-1"
      >
        {{ clock.hours }}<span class="clock-colon">:</span>{{ clock.minutes }}
      </time>
    </div>

    <!-- Day Progress & CHO Summary Card -->
    <DayProgressSummary :date-key="selectedDateKey" />

    <!-- Every 2 weeks: ask to update weight and measurements -->
    <button
      v-if="isCurrentDateToday && measurementDue"
      type="button"
      @click="openMeasurement"
      class="w-full ui-card p-4 flex items-center gap-3 text-left hover:bg-[#fafbf9] dark:hover:bg-[#2b2c30] transition"
    >
      <span class="w-10 h-10 rounded-full bg-[#f2b36b] text-white flex items-center justify-center flex-shrink-0">
        <Scales class="w-5 h-5" />
      </span>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-semibold text-[#1f2421] dark:text-white">È ora di aggiornare peso e misure</span>
        <span class="block ui-muted">Ultima misurazione {{ daysSinceMeasurement }} giorni fa</span>
      </span>
      <CaretRight class="w-4 h-4 text-[#9aa19c] flex-shrink-0" />
    </button>

    <!-- Meal Slots -->
    <div class="space-y-4">
      <!-- Celebratory banner if all 5 completed -->
      <div
        v-if="allMealsCompleted"
        class="px-4 py-3 rounded-2xl bg-[#d4f65a] text-[#16171a] text-sm font-semibold flex items-center gap-2.5"
      >
        <Confetti class="w-5 h-5 flex-shrink-0" />
        <span>Tutti i pasti confermati. Ottimo lavoro!</span>
      </div>

      <!-- Clean Cards List -->
      <div>
        <div
          v-for="slot in MEAL_SLOT_ORDER"
          :key="`${selectedDateKey}-${slot}`"
          :id="`slot-${slot}`"
        >
                    <MealCard
            :meal="getMeal(slot)"
            :date-key="selectedDateKey"
            :day-of-week="selectedDayOfWeek"
            :timeline-state="getTimelineState(slot)"
            :is-last="slot === MEAL_SLOT_ORDER[MEAL_SLOT_ORDER.length - 1]"
            @edit="openEditModal"
          />
        </div>
      </div>
    </div>

    <!-- Day Notes card at the bottom -->
    <DayNotesCard :date-key="selectedDateKey" />

    <!-- Informational Note -->
    <p class="px-1 flex items-start gap-2 ui-muted leading-relaxed">
      <Lightbulb class="w-4 h-4 flex-shrink-0 text-[#9fb83f]" />
      <span>Le modifiche al piano valgono per i giorni futuri e non cambiano i pasti già confermati.</span>
    </p>

    <!-- Meal Edit Modal -->
    <MealEditModal
      :is-open="isEditModalOpen"
      :meal="editingMeal"
      :day-of-week="selectedDayOfWeek"
      @close="isEditModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { PhConfetti as Confetti, PhLightbulb as Lightbulb, PhScales as Scales, PhCaretRight as CaretRight } from '@phosphor-icons/vue'
import { useProfileUi } from '~/composables/useProfileUi'
import { isMeasurementDue, daysSinceLastMeasurement } from '~/utils/body'
import DayNotesCard from '~/components/DayNotesCard.vue'
import { MEAL_SLOT_ORDER } from '~/types/meal'
import type { Meal, MealSlot } from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import { useCurrentDate } from '~/composables/useCurrentDate'

const mealStore = useMealStore()
const { openMeasurement } = useProfileUi()

const measurementDue = computed(() => isMeasurementDue(mealStore.profile))
const daysSinceMeasurement = computed(() => daysSinceLastMeasurement(mealStore.profile))
const {
  selectedDateKey,
  selectedDayOfWeek,
  selectedDayLabel,
  isCurrentDateToday,
  goToToday,
} = useCurrentDate()

// Live clock (client only, refreshed every 10s; the colon blinks via CSS)
const clock = ref<{ hours: string; minutes: string } | null>(null)
let clockTimer: ReturnType<typeof setInterval> | undefined
const updateClock = () => {
  const now = new Date()
  clock.value = {
    hours: String(now.getHours()).padStart(2, '0'),
    minutes: String(now.getMinutes()).padStart(2, '0'),
  }
}
onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 10_000)
})
onBeforeUnmount(() => clearInterval(clockTimer))

const isEditModalOpen = ref(false)
const editingMeal = ref<Meal | null>(null)

const getMeal = (slot: MealSlot): Meal => {
  const dayPlan = mealStore.getDayPlanForDate(selectedDateKey.value)
  return dayPlan[slot]
}

const getTimelineState = (slot: MealSlot): 'past' | 'active' | 'future' => {
  const isDone = mealStore.isMealCompleted(selectedDateKey.value, slot)
  if (isDone) return 'past'

  // The active slot is the first uncompleted slot in order
  const firstUncompleted = MEAL_SLOT_ORDER.find(
    (s) => !mealStore.isMealCompleted(selectedDateKey.value, s)
  )

  if (slot === firstUncompleted) {
    return 'active'
  }

  return 'future'
}

const allMealsCompleted = computed(() => {
  return MEAL_SLOT_ORDER.every((slot) =>
    mealStore.isMealCompleted(selectedDateKey.value, slot)
  )
})

const openEditModal = (meal: Meal) => {
  editingMeal.value = meal
  isEditModalOpen.value = true
}
</script>

<style scoped>
.clock-colon {
  animation: clock-blink 1s steps(1, end) infinite;
}

@keyframes clock-blink {
  50% {
    opacity: 0;
  }
}
</style>
