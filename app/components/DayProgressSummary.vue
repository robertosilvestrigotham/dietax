<template>
  <div
    class="relative overflow-hidden isolate rounded-[32px] px-5 pt-6 pb-5 sm:px-7 bg-gradient-to-br from-[#e3f2d3] via-[#dcefd0] to-[#eef5c8] dark:from-[#232427] dark:via-[#26291c] dark:to-[#2c331a] shadow-[0_8px_30px_rgba(60,100,40,0.08)]"
  >
    <!-- Animated shader background (falls back to the CSS gradient) -->
    <ShaderBackground class="-z-10" />

    <h2 class="text-center text-lg font-bold tracking-tight text-[#1f2a1c] dark:text-[#ececee]">
      Obiettivi del giorno
    </h2>

    <div class="flex justify-center mt-5 mb-6">
      <AppleActivityRings :values="ringValues" :size="250">
        <span class="text-[11px] font-medium text-[#6b7d66] dark:text-[#d4f65a]">CHO confermati</span>
        <span class="text-6xl font-bold tracking-tight leading-none tabular-nums text-[#1f2a1c] dark:text-white my-1.5">
          {{ Math.round(dayCho.consumedCho) }}
        </span>
        <span class="text-xs font-medium text-[#6b7d66] dark:text-[#d4f65a]">grammi</span>
      </AppleActivityRings>
    </div>

    <div class="grid grid-cols-3 gap-3 text-center">
      <div v-for="goal in goals" :key="goal.key">
        <div class="text-[11px] text-[#6b7d66] dark:text-[#d4f65a] tabular-nums">{{ goal.pct }}%</div>
        <div class="text-lg font-bold leading-tight tabular-nums text-[#1f2a1c] dark:text-white">{{ goal.value }}</div>
        <div class="text-xs font-semibold text-[#3a4a35] dark:text-[#ececee]">{{ goal.label }}</div>
        <div class="mt-2 h-1.5 rounded-full overflow-hidden" :style="{ backgroundColor: `${goal.color}40` }">
          <div
            class="h-full rounded-full transition-[width] duration-700 ease-out"
            :style="{ width: `${goal.pct}%`, backgroundColor: goal.color }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMealStore } from '~/stores/mealStore'
import { calculateDayCho, calculateDayKcal } from '~/utils/nutrition'
import AppleActivityRings from '~/components/AppleActivityRings.vue'
import ShaderBackground from '~/components/ShaderBackground.vue'

const props = defineProps<{
  dateKey: string
}>()

const mealStore = useMealStore()

const dayPlan = computed(() => mealStore.getDayPlanForDate(props.dateKey))
const dayProgress = computed(() => mealStore.getDayProgressForDate(props.dateKey))

const stats = computed(() => mealStore.getDayCompletionStats(props.dateKey))

const dayCho = computed(() => {
  return calculateDayCho({
    dayPlan: dayPlan.value,
    dayProgress: dayProgress.value,
  })
})

const choPercentage = computed(() => {
  if (!dayCho.value.totalCho) return 0
  return Math.min(100, Math.round((dayCho.value.consumedCho / dayCho.value.totalCho) * 100))
})

const dayKcal = computed(() =>
  calculateDayKcal({
    dayPlan: dayPlan.value,
    dayProgress: dayProgress.value,
  })
)

// Calorie goal: the one set in Opzioni, otherwise the planned calories of the day
const kcalGoal = computed(() => mealStore.preferences.kcalGoal ?? dayKcal.value.totalKcal)

const kcalPercentage = computed(() => {
  if (!kcalGoal.value) return 0
  return Math.min(100, Math.round((dayKcal.value.consumedKcal / kcalGoal.value) * 100))
})

// Pastel palette from the reference mockup
const COLORS = {
  cho: '#d4f65a',
  kcal: '#ececee',
  meals: '#7d7e84',
}

const ringValues = computed(() => [
  { key: 'cho', pct: choPercentage.value, color: COLORS.cho },
  { key: 'kcal', pct: kcalPercentage.value, color: COLORS.kcal },
  { key: 'meals', pct: stats.value.percentage, color: COLORS.meals },
])

const goals = computed(() => [
  {
    key: 'cho',
    label: 'Carboidrati',
    color: COLORS.cho,
    pct: choPercentage.value,
    value: `${Math.round(dayCho.value.consumedCho)}/${Math.round(dayCho.value.totalCho)}g`,
  },
  {
    key: 'kcal',
    label: 'Calorie',
    color: COLORS.kcal,
    pct: kcalPercentage.value,
    value: `${dayKcal.value.consumedKcal}/${kcalGoal.value}`,
  },
  {
    key: 'meals',
    label: 'Pasti',
    color: COLORS.meals,
    pct: stats.value.percentage,
    value: `${stats.value.completed}/${stats.value.total}`,
  },
])
</script>
