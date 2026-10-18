<template>
  <!-- Injects <link rel="manifest"> (needed to install the PWA) -->
  <NuxtPwaManifest />
  <div class="min-h-screen flex flex-col md:flex-row bg-[#e5ede2] dark:bg-[#0c1610] text-[#1f2421] dark:text-[#eef1ef] transition-colors">
    <!-- Desktop Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Global Top Header (Shown on secondary pages, hidden on / to match Dribbble mockup) -->
      <HeaderBar v-if="route.path !== '/'" :title="pageTitle" :subtitle="pageSubtitle" class="no-print" />

      <!-- Page Content -->
      <!-- Bottom padding = floating nav (bottom-4 + h-16) + breathing room + iOS safe area -->
      <main class="flex-1 p-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-8 max-w-5xl w-full mx-auto">
        <NuxtPage />
      </main>
    </div>

    <!-- Mobile Bottom Navigation for iPhone -->
    <MobileBottomNav class="no-print" />

    <!-- Profile: first-run onboarding and the 2-week measurements update -->
    <OnboardingSheet v-if="isOnboardingOpen" />
    <MeasurementSheet v-if="isMeasurementOpen" />
    <PlanScalingSheet v-if="isPlanScalingOpen" />
    <MenuGeneratorSheet v-if="isMenuGeneratorOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useMealStore } from '~/stores/mealStore'
import { useTheme } from '~/composables/useTheme'
import { useProfileUi } from '~/composables/useProfileUi'
import { getDaysAround, formatWeekRange } from '~/utils/date'

// Phosphor icons: duotone everywhere unless a component overrides `weight`
provide('weight', 'duotone')

const route = useRoute()
const mealStore = useMealStore()
const { isOnboardingOpen, isMeasurementOpen, isPlanScalingOpen, isMenuGeneratorOpen, openOnboarding } = useProfileUi()

// Initialize theme and store on client mount
useTheme()

onMounted(() => {
  mealStore.initFromStorage()
  // First run: ask for the profile (can be skipped and done later from Opzioni)
  if (!mealStore.profile && !mealStore.onboardingDismissed) openOnboarding()
})

const pageTitle = computed(() => {
  switch (route.path) {
    case '/':
      return 'Oggi'
    case '/pianificazione':
      return 'Pianificazione'
    case '/spesa':
      return 'Spesa'
    case '/impostazioni':
      return 'Impostazioni'
    case '/registro':
      return 'Registro'
    default:
      return 'DietaX'
  }
})

// Pianificazione shows its date window; other views need no subtitle
const pageSubtitle = computed(() => {
  if (route.path === '/pianificazione') {
    const days = getDaysAround(new Date(), 2, 4)
    return formatWeekRange(days[0]!.date, days[days.length - 1]!.date)
  }
  return undefined
})
</script>
