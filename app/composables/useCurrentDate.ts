import { ref, computed } from 'vue'
import {
  formatDateKey,
  formatItalianDate,
  getDayOfWeekFromDate,
  shiftDateKey,
  isDateToday,
} from '~/utils/date'
import { DAY_OF_WEEK_LABELS } from '~/types/meal'

const currentDateKey = ref<string>(formatDateKey(new Date()))

export function useCurrentDate() {
  const selectedDateKey = computed({
    get: () => currentDateKey.value,
    set: (val: string) => {
      currentDateKey.value = val
    },
  })

  const selectedDayOfWeek = computed(() => getDayOfWeekFromDate(currentDateKey.value))

  const selectedDayLabel = computed(() => DAY_OF_WEEK_LABELS[selectedDayOfWeek.value])

  const formattedDate = computed(() => formatItalianDate(currentDateKey.value))

  const isCurrentDateToday = computed(() => isDateToday(currentDateKey.value))

  const goToToday = () => {
    currentDateKey.value = formatDateKey(new Date())
  }

  const goToPreviousDay = () => {
    currentDateKey.value = shiftDateKey(currentDateKey.value, -1)
  }

  const goToNextDay = () => {
    currentDateKey.value = shiftDateKey(currentDateKey.value, 1)
  }

  const setDate = (key: string) => {
    currentDateKey.value = key
  }

  return {
    selectedDateKey,
    selectedDayOfWeek,
    selectedDayLabel,
    formattedDate,
    isCurrentDateToday,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    setDate,
  }
}
