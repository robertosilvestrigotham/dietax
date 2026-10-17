import { ref, computed, onMounted, watch } from 'vue'
import { useMealStore } from '~/stores/mealStore'
import type { ThemePreference } from '~/types/meal'

export function useTheme() {
  const mealStore = useMealStore()
  const isDark = ref(false)

  const theme = computed<ThemePreference>(() => mealStore.preferences.theme)

  const applyTheme = () => {
    if (typeof window === 'undefined') return

    const selectedTheme = mealStore.preferences.theme
    let shouldBeDark = false

    if (selectedTheme === 'dark') {
      shouldBeDark = true
    } else if (selectedTheme === 'light') {
      shouldBeDark = false
    } else {
      // system
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    isDark.value = shouldBeDark
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setTheme = (newTheme: ThemePreference) => {
    mealStore.setThemePreference(newTheme)
    applyTheme()
  }

  onMounted(() => {
    applyTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mealStore.preferences.theme === 'system') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
  })

  watch(
    () => mealStore.preferences.theme,
    () => {
      applyTheme()
    }
  )

  return {
    theme,
    isDark,
    setTheme,
  }
}
