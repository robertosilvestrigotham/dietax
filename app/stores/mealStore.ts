import { defineStore } from 'pinia'
import type {
  AppExportData,
  AppPreferences,
  BodyMeasurement,
  DayOfWeek,
  DayProgress,
  ExtraFoodItem,
  ItemShoppingStatus,
  ManualShoppingItem,
  Meal,
  MealSlot,
  UserProfile,
  WeeklyPlan,
  WeekShoppingState,
} from '~/types/meal'
import { createSeedWeeklyPlan } from '~/data/seedMenu'
import { getDayOfWeekFromDate } from '~/utils/date'
import { summarizeProfile } from '~/utils/body'

const STORAGE_KEY = 'dietax_state_v1'
// Previous weekly plan, kept so an automatic plan adaptation can be undone
const PLAN_BACKUP_KEY = 'dietax_plan_backup_v1'
const SCHEMA_VERSION = 1

interface MealStoreState {
  version: number
  plan: WeeklyPlan
  progress: Record<string, DayProgress>
  shoppingStates: Record<string, WeekShoppingState>
  globalPantry: string[]
  preferences: AppPreferences
  profile: UserProfile | null
  onboardingDismissed: boolean
  planBackup: WeeklyPlan | null
  isHydrated: boolean
}

export const useMealStore = defineStore('meal', {
  state: (): MealStoreState => ({
    version: SCHEMA_VERSION,
    plan: createSeedWeeklyPlan(),
    progress: {},
    shoppingStates: {},
    globalPantry: [],
    preferences: {
      theme: 'system',
      autoScrollToCurrentMeal: true,
      kcalGoal: null,
      excludedFoods: [],
    },
    profile: null,
    onboardingDismissed: false,
    planBackup: null,
    isHydrated: false,
  }),

  getters: {
    getDayPlan: (state) => {
      return (dayOfWeek: DayOfWeek) => state.plan[dayOfWeek]
    },

    /**
     * The meals of a real date: the weekly template, except confirmed meals,
     * which use the copy saved at confirmation so later plan edits don't rewrite history.
     */
    getDayPlanForDate: (state) => {
      return (dateKey: string): Record<MealSlot, Meal> => {
        const template = state.plan[getDayOfWeekFromDate(dateKey)]
        const prog = state.progress[dateKey]
        if (!prog?.mealSnapshots) return template
        const result = { ...template }
        for (const slot of Object.keys(template) as MealSlot[]) {
          const frozen = prog.completedMeals[slot] ? prog.mealSnapshots[slot]?.meal : undefined
          if (frozen) result[slot] = frozen
        }
        return result
      }
    },

    getMealForDate: (state) => {
      return (dateKey: string, slot: MealSlot): Meal | undefined => {
        const dayOfWeek = getDayOfWeekFromDate(dateKey)
        return state.plan[dayOfWeek]?.[slot]
      }
    },

    getDayProgressForDate: (state) => {
      return (dateKey: string): DayProgress => {
        if (state.progress[dateKey]) {
          return state.progress[dateKey]
        }
        return {
          date: dateKey,
          completedMeals: {
            breakfast: false,
            morningSnack: false,
            lunch: false,
            afternoonSnack: false,
            dinner: false,
          },
          completedAt: {
            breakfast: null,
            morningSnack: null,
            lunch: null,
            afternoonSnack: null,
            dinner: null,
          },
          notes: '',
          mealSnapshots: {},
          selectedAlternatives: {},
          extraFoods: {},
        }
      }
    },

    getDayCompletionStats: (state) => {
      return (dateKey: string): { completed: number; total: number; percentage: number } => {
        const prog = state.progress[dateKey]
        const total = 5
        if (!prog) return { completed: 0, total, percentage: 0 }

        const slots: MealSlot[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner']
        const completed = slots.filter((slot) => Boolean(prog.completedMeals[slot])).length
        const percentage = Math.round((completed / total) * 100)
        return { completed, total, percentage }
      }
    },

    isMealCompleted: (state) => {
      return (dateKey: string, slot: MealSlot): boolean => {
        return Boolean(state.progress[dateKey]?.completedMeals[slot])
      }
    },

    getShoppingStateForRange: (state) => {
      return (rangeKey: string): WeekShoppingState => {
        if (state.shoppingStates[rangeKey]) {
          return state.shoppingStates[rangeKey]
        }
        return {
          rangeKey,
          itemStatuses: {},
          manualItems: [],
          pantryExcludedKeys: [],
        }
      }
    },
  },

  actions: {
    initFromStorage() {
      if (typeof window === 'undefined') return

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppExportData>
          if (parsed && typeof parsed === 'object') {
            if (parsed.template) {
              this.plan = parsed.template
            }
            if (parsed.progress) {
              this.progress = parsed.progress
            }
            if (parsed.shoppingStates) {
              this.shoppingStates = parsed.shoppingStates
            }
            if (parsed.pantryItems) {
              this.globalPantry = parsed.pantryItems
            }
            if (parsed.preferences) {
              this.preferences = { ...this.preferences, ...parsed.preferences }
            }
            this.profile = parsed.profile ?? null
            this.onboardingDismissed = Boolean(parsed.onboardingDismissed)
          }
        }
        const backup = window.localStorage.getItem(PLAN_BACKUP_KEY)
        this.planBackup = backup ? (JSON.parse(backup) as WeeklyPlan) : null
      } catch (err) {
        console.error('Failed to load DietaX state from localStorage:', err)
      } finally {
        this.isHydrated = true
      }
    },

    saveToStorage() {
      if (typeof window === 'undefined') return

      try {
        const payload: AppExportData = {
          version: this.version,
          exportedAt: new Date().toISOString(),
          template: this.plan,
          progress: this.progress,
          shoppingStates: this.shoppingStates,
          pantryItems: this.globalPantry,
          preferences: this.preferences,
          profile: this.profile,
          onboardingDismissed: this.onboardingDismissed,
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch (err) {
        console.error('Failed to save DietaX state to localStorage:', err)
      }
    },

    ensureDayProgress(dateKey: string): DayProgress {
      if (!this.progress[dateKey]) {
        this.progress[dateKey] = {
          date: dateKey,
          completedMeals: {
            breakfast: false,
            morningSnack: false,
            lunch: false,
            afternoonSnack: false,
            dinner: false,
          },
          completedAt: {
            breakfast: null,
            morningSnack: null,
            lunch: null,
            afternoonSnack: null,
            dinner: null,
          },
          notes: '',
          mealSnapshots: {},
          selectedAlternatives: {},
          extraFoods: {},
          replacements: {},
        }
      }
      if (!this.progress[dateKey].extraFoods) {
        this.progress[dateKey].extraFoods = {}
      }
      if (!this.progress[dateKey].replacements) {
        this.progress[dateKey].replacements = {}
      }
      return this.progress[dateKey]
    },

    addExtraFood(
      dateKey: string,
      slot: MealSlot,
      extra: Omit<ExtraFoodItem, 'id' | 'createdAt'>
    ): ExtraFoodItem {
      const prog = this.ensureDayProgress(dateKey)
      if (!prog.extraFoods) {
        prog.extraFoods = {}
      }
      if (!prog.extraFoods[slot]) {
        prog.extraFoods[slot] = []
      }
      const newItem: ExtraFoodItem = {
        ...extra,
        id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      }
      prog.extraFoods[slot]!.push(newItem)
      this.saveToStorage()
      return newItem
    },

    removeExtraFood(dateKey: string, slot: MealSlot, extraId: string) {
      const prog = this.ensureDayProgress(dateKey)
      if (prog.extraFoods && prog.extraFoods[slot]) {
        prog.extraFoods[slot] = prog.extraFoods[slot]!.filter((f) => f.id !== extraId)
        this.saveToStorage()
      }
    },

    updateExtraFood(
      dateKey: string,
      slot: MealSlot,
      extraId: string,
      updates: Partial<Omit<ExtraFoodItem, 'id' | 'createdAt'>>
    ) {
      const prog = this.ensureDayProgress(dateKey)
      if (prog.extraFoods && prog.extraFoods[slot]) {
        const item = prog.extraFoods[slot]!.find((f) => f.id === extraId)
        if (item) {
          if (updates.name !== undefined) item.name = updates.name
          if (updates.quantity !== undefined) item.quantity = updates.quantity
          if (updates.unit !== undefined) item.unit = updates.unit
          if (updates.choGrams !== undefined) item.choGrams = updates.choGrams
          if (updates.kcal !== undefined) item.kcal = updates.kcal
          if (updates.notes !== undefined) item.notes = updates.notes
          this.saveToStorage()
        }
      }
    },

    toggleMealCompleted(dateKey: string, slot: MealSlot) {
      const prog = this.ensureDayProgress(dateKey)
      const currentStatus = Boolean(prog.completedMeals[slot])
      const nextStatus = !currentStatus

      prog.completedMeals[slot] = nextStatus

      if (nextStatus) {
        prog.completedAt[slot] = new Date().toISOString()

        // Capture immutable snapshot so future template edits don't alter completed history
        const dayOfWeek = getDayOfWeekFromDate(dateKey)
        const templateMeal = this.plan[dayOfWeek]?.[slot]
        if (templateMeal) {
          const ingSummary = (templateMeal.ingredients || [])
            .map((i) => `${i.name} (${i.quantity ?? 'q.b.'} ${i.unit})`)
            .join(', ')

          if (!prog.mealSnapshots) {
            prog.mealSnapshots = {}
          }
          const replacement = prog.replacements?.[slot]
          prog.mealSnapshots[slot] = {
            mealId: templateMeal.id,
            name: templateMeal.name,
            description: replacement?.description ?? templateMeal.description,
            meal: JSON.parse(JSON.stringify(templateMeal)) as Meal,
            ingredientsSummary: ingSummary,
            isOut: templateMeal.isOut,
          }
        }
      } else {
        prog.completedAt[slot] = null
      }

      this.saveToStorage()
    },

    setMealReplacement(
      dateKey: string,
      slot: MealSlot,
      data: { description: string; choGrams: number; kcal?: number }
    ) {
      const prog = this.ensureDayProgress(dateKey)
      prog.replacements![slot] = {
        description: data.description,
        choGrams: data.choGrams,
        kcal: data.kcal,
        replacedAt: new Date().toISOString(),
      }
      this.saveToStorage()
    },

    clearMealReplacement(dateKey: string, slot: MealSlot) {
      const prog = this.ensureDayProgress(dateKey)
      delete prog.replacements![slot]
      this.saveToStorage()
    },

    setDayNotes(dateKey: string, notes: string) {
      const prog = this.ensureDayProgress(dateKey)
      prog.notes = notes
      this.saveToStorage()
    },

    setDayAlternative(dateKey: string, slot: MealSlot, altId: string) {
      const prog = this.ensureDayProgress(dateKey)
      if (!prog.selectedAlternatives) {
        prog.selectedAlternatives = {}
      }
      prog.selectedAlternatives[slot] = altId
      this.saveToStorage()
    },

    resetAllProgress() {
      this.progress = {}
      this.saveToStorage()
    },

    resetDayProgress(dateKey: string) {
      delete this.progress[dateKey]
      this.saveToStorage()
    },

    updateMeal(dayOfWeek: DayOfWeek, slot: MealSlot, updatedMeal: Partial<Meal>) {
      const current = this.plan[dayOfWeek]?.[slot]
      if (current) {
        this.plan[dayOfWeek][slot] = {
          ...current,
          ...updatedMeal,
        }
        this.saveToStorage()
      }
    },

    resetToSeedMenu() {
      this.plan = createSeedWeeklyPlan()
      this.saveToStorage()
    },

    ensureShoppingState(rangeKey: string): WeekShoppingState {
      if (!this.shoppingStates[rangeKey]) {
        this.shoppingStates[rangeKey] = {
          rangeKey,
          itemStatuses: {},
          manualItems: [],
          pantryExcludedKeys: [],
        }
      }
      return this.shoppingStates[rangeKey]
    },

    setItemShoppingStatus(rangeKey: string, itemKey: string, status: ItemShoppingStatus) {
      const state = this.ensureShoppingState(rangeKey)
      state.itemStatuses[itemKey] = status
      this.saveToStorage()
    },

    toggleItemBought(rangeKey: string, itemKey: string, currentStatus: ItemShoppingStatus) {
      const state = this.ensureShoppingState(rangeKey)
      // Cycle: to_buy -> bought -> to_buy
      const nextStatus: ItemShoppingStatus = currentStatus === 'bought' ? 'to_buy' : 'bought'
      state.itemStatuses[itemKey] = nextStatus
      this.saveToStorage()
    },

    toggleItemInPantry(rangeKey: string, itemKey: string, currentStatus: ItemShoppingStatus) {
      const state = this.ensureShoppingState(rangeKey)
      // Toggle between in_pantry and to_buy
      const nextStatus: ItemShoppingStatus = currentStatus === 'in_pantry' ? 'to_buy' : 'in_pantry'
      state.itemStatuses[itemKey] = nextStatus
      this.saveToStorage()
    },

    addManualShoppingItem(
      rangeKey: string,
      item: Omit<ManualShoppingItem, 'id' | 'createdAt'>
    ) {
      const state = this.ensureShoppingState(rangeKey)
      const newItem: ManualShoppingItem = {
        ...item,
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      }
      state.manualItems.push(newItem)
      this.saveToStorage()
      return newItem
    },

    removeManualShoppingItem(rangeKey: string, itemId: string) {
      const state = this.ensureShoppingState(rangeKey)
      state.manualItems = state.manualItems.filter((i) => i.id !== itemId)
      this.saveToStorage()
    },

    toggleManualItemBought(rangeKey: string, itemId: string) {
      const state = this.ensureShoppingState(rangeKey)
      const target = state.manualItems.find((i) => i.id !== itemId ? false : true)
      if (target) {
        target.status = target.status === 'bought' ? 'to_buy' : 'bought'
        this.saveToStorage()
      }
    },

    toggleGlobalPantry(canonicalId: string) {
      const index = this.globalPantry.indexOf(canonicalId)
      if (index >= 0) {
        this.globalPantry.splice(index, 1)
      } else {
        this.globalPantry.push(canonicalId)
      }
      this.saveToStorage()
    },

    setThemePreference(theme: AppPreferences['theme']) {
      this.preferences.theme = theme
      this.saveToStorage()
    },

    /** Saves the profile; with autoKcalGoal the calorie goal follows the computed target */
    saveProfile(profile: UserProfile) {
      this.profile = profile
      this.onboardingDismissed = true
      this.syncKcalGoalWithProfile()
      this.saveToStorage()
    },

    /** Adds (or replaces, same date) a body measurement */
    addMeasurement(measurement: BodyMeasurement) {
      if (!this.profile) return
      const others = this.profile.measurements.filter((m) => m.date !== measurement.date)
      this.profile.measurements = [...others, measurement].sort((a, b) => a.date.localeCompare(b.date))
      this.syncKcalGoalWithProfile()
      this.saveToStorage()
    },

    syncKcalGoalWithProfile() {
      if (!this.profile?.autoKcalGoal) return
      const summary = summarizeProfile(this.profile)
      if (summary) this.preferences.kcalGoal = summary.targetKcal
    },

    /** Replaces the weekly plan (e.g. adapted to the calorie goal), keeping the old one for undo */
    applyPlan(newPlan: WeeklyPlan) {
      this.planBackup = JSON.parse(JSON.stringify(this.plan)) as WeeklyPlan
      this.plan = newPlan
      this.persistPlanBackup()
      this.saveToStorage()
    },

    restorePlanBackup() {
      if (!this.planBackup) return
      this.plan = this.planBackup
      this.planBackup = null
      this.persistPlanBackup()
      this.saveToStorage()
    },

    persistPlanBackup() {
      if (typeof window === 'undefined') return
      try {
        if (this.planBackup) window.localStorage.setItem(PLAN_BACKUP_KEY, JSON.stringify(this.planBackup))
        else window.localStorage.removeItem(PLAN_BACKUP_KEY)
      } catch (err) {
        console.error('Failed to save plan backup:', err)
      }
    },

    dismissOnboarding() {
      this.onboardingDismissed = true
      this.saveToStorage()
    },

    setExcludedFoods(foodIds: string[]) {
      this.preferences.excludedFoods = [...new Set(foodIds)]
      this.saveToStorage()
    },

    setKcalGoal(kcal: number | null) {
      this.preferences.kcalGoal = kcal && kcal > 0 ? Math.round(kcal) : null
      if (this.profile) this.profile.autoKcalGoal = false
      this.saveToStorage()
    },

    exportData(): AppExportData {
      return {
        version: this.version,
        exportedAt: new Date().toISOString(),
        template: this.plan,
        progress: this.progress,
        shoppingStates: this.shoppingStates,
        pantryItems: this.globalPantry,
        preferences: this.preferences,
        profile: this.profile,
        onboardingDismissed: this.onboardingDismissed,
      }
    },

    importData(data: AppExportData): { success: boolean; error?: string } {
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Dati JSON non validi' }
      }

      if (!data.template || typeof data.template !== 'object') {
        return { success: false, error: 'Il file non contiene un piano alimentare valido' }
      }

      try {
        this.plan = data.template
        this.progress = data.progress || {}
        this.shoppingStates = data.shoppingStates || {}
        this.globalPantry = data.pantryItems || []
        if (data.preferences) {
          this.preferences = { ...this.preferences, ...data.preferences }
        }
        if (data.profile !== undefined) this.profile = data.profile
        if (data.onboardingDismissed !== undefined) this.onboardingDismissed = data.onboardingDismissed
        this.saveToStorage()
        return { success: true }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Errore sconosciuto durante l\'importazione'
        return { success: false, error: message }
      }
    },
  },
})
