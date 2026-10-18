import { ref } from 'vue'
import { buildMeasurementReminderIcs } from '~/utils/body'

// Shared open/close state, so any view can open the onboarding or the measurements sheet
const isOnboardingOpen = ref(false)
const isMeasurementOpen = ref(false)
const isPlanScalingOpen = ref(false)
const isMenuGeneratorOpen = ref(false)

export function useProfileUi() {
  const config = useRuntimeConfig()

  /** Downloads a calendar event repeating every 2 weeks (opens the Calendar import on iPhone) */
  const downloadMeasurementReminder = () => {
    const appUrl = `${window.location.origin}${config.app.baseURL}`
    const ics = buildMeasurementReminderIcs(appUrl)
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'dietax-promemoria-misure.ics'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return {
    isOnboardingOpen,
    isMeasurementOpen,
    openOnboarding: () => (isOnboardingOpen.value = true),
    closeOnboarding: () => (isOnboardingOpen.value = false),
    openMeasurement: () => (isMeasurementOpen.value = true),
    closeMeasurement: () => (isMeasurementOpen.value = false),
    isPlanScalingOpen,
    openPlanScaling: () => (isPlanScalingOpen.value = true),
    closePlanScaling: () => (isPlanScalingOpen.value = false),
    isMenuGeneratorOpen,
    openMenuGenerator: () => (isMenuGeneratorOpen.value = true),
    closeMenuGenerator: () => (isMenuGeneratorOpen.value = false),
    downloadMeasurementReminder,
  }
}
