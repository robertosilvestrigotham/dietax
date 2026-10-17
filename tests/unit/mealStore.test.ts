import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMealStore } from '../../app/stores/mealStore'

describe('mealStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with seed weekly plan', () => {
    const store = useMealStore()
    expect(store.plan.monday).toBeDefined()
    expect(store.plan.monday.breakfast.name).toBe('Colazione')
    expect(store.plan.thursday.lunch.isOut).toBe(true)
  })

  it('marks meal as completed and stores timestamp with snapshot', () => {
    const store = useMealStore()
    const testDate = '2026-10-12' // Monday

    store.toggleMealCompleted(testDate, 'breakfast')
    expect(store.isMealCompleted(testDate, 'breakfast')).toBe(true)

    const prog = store.getDayProgressForDate(testDate)
    expect(prog.completedMeals.breakfast).toBe(true)
    expect(prog.completedAt.breakfast).not.toBeNull()
    expect(prog.mealSnapshots?.breakfast).toBeDefined()
    expect(prog.mealSnapshots?.breakfast?.name).toBe('Colazione')

    // Untoggling
    store.toggleMealCompleted(testDate, 'breakfast')
    expect(store.isMealCompleted(testDate, 'breakfast')).toBe(false)
  })

  it('preserves historical snapshot when template meal is later modified', () => {
    const store = useMealStore()
    const testDate = '2026-10-12' // Monday

    // Complete breakfast on Monday
    store.toggleMealCompleted(testDate, 'breakfast')
    const originalSnapshotDesc = store.progress[testDate].mealSnapshots?.breakfast?.description
    expect(originalSnapshotDesc).toBe('200 ml latte, 40 g pane integrale')

    // Now user changes Monday breakfast template
    store.updateMeal('monday', 'breakfast', {
      description: 'Caffè amaro e biscotti',
      name: 'Colazione Modificata',
    })

    // The current template is updated
    expect(store.plan.monday.breakfast.name).toBe('Colazione Modificata')

    // But the historical snapshot for 2026-10-12 remains unchanged!
    expect(store.progress[testDate].mealSnapshots?.breakfast?.description).toBe('200 ml latte, 40 g pane integrale')
  })

  it('calculates day completion statistics accurately', () => {
    const store = useMealStore()
    const testDate = '2026-10-13' // Tuesday

    expect(store.getDayCompletionStats(testDate).completed).toBe(0)
    expect(store.getDayCompletionStats(testDate).percentage).toBe(0)

    store.toggleMealCompleted(testDate, 'breakfast')
    store.toggleMealCompleted(testDate, 'lunch')

    expect(store.getDayCompletionStats(testDate).completed).toBe(2)
    expect(store.getDayCompletionStats(testDate).percentage).toBe(40) // 2/5 = 40%
  })

  it('exports and imports data correctly', () => {
    const store = useMealStore()
    store.setDayNotes('2026-10-14', 'Nota di test')
    store.toggleMealCompleted('2026-10-14', 'dinner')

    const exported = store.exportData()
    expect(exported.version).toBe(1)
    expect(exported.progress['2026-10-14'].notes).toBe('Nota di test')

    // Create a new store instance and import
    setActivePinia(createPinia())
    const newStore = useMealStore()
    expect(newStore.progress['2026-10-14']).toBeUndefined()

    const result = newStore.importData(exported)
    expect(result.success).toBe(true)
    expect(newStore.progress['2026-10-14'].notes).toBe('Nota di test')
    expect(newStore.isMealCompleted('2026-10-14', 'dinner')).toBe(true)
  })

  it('adds and removes extra foods for a meal slot', () => {
    const store = useMealStore()
    const testDate = '2026-10-15'

    const extra = store.addExtraFood(testDate, 'lunch', {
      name: 'Pane extra',
      quantity: 30,
      unit: 'g',
      choGrams: 15,
    })

    expect(extra.id).toBeDefined()
    expect(store.progress[testDate].extraFoods?.lunch?.length).toBe(1)
    expect(store.progress[testDate].extraFoods?.lunch?.[0].name).toBe('Pane extra')
    expect(store.progress[testDate].extraFoods?.lunch?.[0].choGrams).toBe(15)

    store.updateExtraFood(testDate, 'lunch', extra.id, {
      name: 'Pane integrale tostato',
      choGrams: 18,
    })
    expect(store.progress[testDate].extraFoods?.lunch?.[0].name).toBe('Pane integrale tostato')
    expect(store.progress[testDate].extraFoods?.lunch?.[0].choGrams).toBe(18)

    store.removeExtraFood(testDate, 'lunch', extra.id)
    expect(store.progress[testDate].extraFoods?.lunch?.length).toBe(0)
  })
})
