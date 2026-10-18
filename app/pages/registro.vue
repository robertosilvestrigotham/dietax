<template>
  <div class="max-w-3xl mx-auto">
    <div
      v-if="days.length === 0"
      class="ui-card py-12 text-center ui-muted"
    >
      Nessun giorno registrato. Conferma un pasto per iniziare.
    </div>

    <ul v-else class="space-y-2.5">
      <li v-for="day in days" :key="day.dateKey">
        <button
          type="button"
          @click="openDay(day.dateKey)"
          class="ui-card w-full text-left p-4 hover:bg-[#fafbf9] dark:hover:bg-[#2b2c30] transition flex items-center gap-4"
        >
          <AppleActivityRings :values="day.rings" :size="44" class="flex-shrink-0" />

          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-[#1f2421] dark:text-white truncate">
              {{ day.label }}
            </div>
            <div class="text-xs mt-0.5 text-[#8a918c] dark:text-[#8e8f94] tabular-nums">
              {{ day.completed }}/{{ day.total }} pasti · {{ day.consumedKcal }} kcal
              <span v-if="day.extraCho > 0"> · +{{ day.extraCho }}g extra</span>
            </div>
          </div>

          <div class="text-right flex-shrink-0 tabular-nums">
            <div class="text-base font-bold text-[#1f2421] dark:text-white">{{ day.consumedCho }}g</div>
            <div class="text-[11px] text-[#8a918c] dark:text-[#8e8f94]">di {{ day.totalCho }}g CHO</div>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMealStore } from '~/stores/mealStore'
import { useCurrentDate } from '~/composables/useCurrentDate'
import { formatItalianDate } from '~/utils/date'
import { calculateDayCho, calculateDayKcal, calculatePlanAdherence } from '~/utils/nutrition'
import AppleActivityRings from '~/components/AppleActivityRings.vue'

const mealStore = useMealStore()
const router = useRouter()
const { setDate } = useCurrentDate()

// Same palette as the day summary rings
const COLORS = {
  cho: '#d4f65a',
  kcal: '#ececee',
  meals: '#7d7e84',
}

const days = computed(() =>
  Object.keys(mealStore.progress)
    .map((dateKey) => {
      const stats = mealStore.getDayCompletionStats(dateKey)
      if (stats.completed === 0) return null

      const dayPlan = mealStore.getDayPlanForDate(dateKey)
      const dayProgress = mealStore.getDayProgressForDate(dateKey)
      const cho = calculateDayCho({ dayPlan, dayProgress })
      const adherence = calculatePlanAdherence({ dayPlan, dayProgress })
      const kcal = calculateDayKcal({ dayPlan, dayProgress })
      const kcalGoal = mealStore.preferences.kcalGoal ?? kcal.totalKcal
      const kcalPct = kcalGoal ? Math.min(100, Math.round((kcal.consumedKcal / kcalGoal) * 100)) : 0
      const choPct = cho.totalCho ? Math.min(100, Math.round((cho.consumedCho / cho.totalCho) * 100)) : 0

      return {
        dateKey,
        label: formatItalianDate(dateKey),
        completed: stats.completed,
        total: stats.total,
        consumedCho: Math.round(cho.consumedCho),
        consumedKcal: kcal.consumedKcal,
        totalCho: Math.round(cho.totalCho),
        extraCho: adherence.totalExtraCho,
        rings: [
          { key: 'cho', pct: choPct, color: COLORS.cho },
          { key: 'kcal', pct: kcalPct, color: COLORS.kcal },
          { key: 'meals', pct: stats.percentage, color: COLORS.meals },
        ],
      }
    })
    .filter((day): day is NonNullable<typeof day> => day !== null)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
)

const openDay = (dateKey: string) => {
  setDate(dateKey)
  router.push('/')
}
</script>
