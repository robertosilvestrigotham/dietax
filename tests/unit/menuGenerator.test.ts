import { describe, it, expect } from 'vitest'
import { createSeedWeeklyPlan } from '../../app/data/seedMenu'
import { DISHES } from '../../app/data/dishes'
import { findFoodById } from '../../app/data/foods'
import { DAYS_OF_WEEK_ORDER, MEAL_SLOT_ORDER } from '../../app/types/meal'
import { generateWeekPlan, suggestDishes, lockKey, fitDish } from '../../app/utils/menuGenerator'
import { calculateMealCho, calculateMealKcal } from '../../app/utils/nutrition'
import { DISHES_BY_ID } from '../../app/data/dishes'

const base = () => ({ plan: createSeedWeeklyPlan(), targetKcal: 1900, choRatio: 0.45, seed: 7 })

describe('dish library', () => {
  it('uses only foods of the built-in table, with unique ids', () => {
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(DISHES.length)
    for (const dish of DISHES) {
      for (const comp of dish.components) expect(findFoodById(comp.foodId), `${dish.id} → ${comp.foodId}`).toBeDefined()
    }
  })

  it('fits a dish to the requested calories and CHO', () => {
    const fitted = fitDish(DISHES_BY_ID.get('pr-pasta-tonno')!, 'lunch', { kcal: 600, cho: 70 }, 'm')!
    expect(Math.abs(fitted.kcal - 600)).toBeLessThan(60)
    expect(Math.abs(fitted.cho - 70)).toBeLessThan(8)
    expect(fitted.meal.description).toBe('Pasta al pomodoro e tonno')
  })
})

describe('menu generator', () => {
  it('hits the daily targets and keeps out-of-home meals', () => {
    const options = base()
    const { plan, days } = generateWeekPlan(options)
    for (const day of days) {
      expect(Math.abs(day.kcal - day.targetKcal) / day.targetKcal).toBeLessThan(0.06)
      expect(Math.abs(day.cho - day.targetCho) / day.targetCho).toBeLessThan(0.12)
    }
    // Thursday lunch and dinner are out of home in the seed menu
    expect(plan.thursday.lunch).toEqual(options.plan.thursday.lunch)
    expect(plan.thursday.dinner).toEqual(options.plan.thursday.dinner)
  })

  it('is varied: no dish more than twice, fish and legumes at least twice, at most one treat', () => {
    const { plan } = generateWeekPlan(base())
    const usage = new Map<string, number>()
    const tags = new Map<string, number>()
    for (const day of DAYS_OF_WEEK_ORDER) {
      for (const slot of MEAL_SLOT_ORDER) {
        const dish = plan[day][slot].dishId ? DISHES_BY_ID.get(plan[day][slot].dishId!) : undefined
        if (!dish) continue
        usage.set(dish.id, (usage.get(dish.id) ?? 0) + 1)
        if (dish.course === 'main') for (const t of dish.tags) tags.set(t, (tags.get(t) ?? 0) + 1)
      }
    }
    expect(Math.max(...usage.values())).toBeLessThanOrEqual(2)
    expect(tags.get('fish') ?? 0).toBeGreaterThanOrEqual(2)
    expect(tags.get('legumes') ?? 0).toBeGreaterThanOrEqual(2)
    expect(tags.get('treat') ?? 0).toBeLessThanOrEqual(1)
  })

  it('is deterministic per seed and changes with a new seed', () => {
    const a = generateWeekPlan(base())
    const b = generateWeekPlan(base())
    const c = generateWeekPlan({ ...base(), seed: 99 })
    expect(JSON.stringify(a.plan)).toBe(JSON.stringify(b.plan))
    expect(JSON.stringify(a.plan)).not.toBe(JSON.stringify(c.plan))
  })

  it('honours excluded foods and locked meals', () => {
    const options = { ...base(), excludedFoods: ['pasta-secca', 'tonno-naturale'], locks: new Set([lockKey('monday', 'lunch')]) }
    const { plan } = generateWeekPlan(options)
    for (const day of DAYS_OF_WEEK_ORDER) {
      for (const slot of MEAL_SLOT_ORDER) {
        if (day === 'monday' && slot === 'lunch') continue
        if (!plan[day][slot].dishId) continue
        const ids = plan[day][slot].ingredients.map((i) => i.canonicalId)
        expect(ids).not.toContain('pasta-secca')
        expect(ids).not.toContain('tonno-naturale')
      }
    }
    expect(plan.monday.lunch).toEqual(options.plan.monday.lunch)
  })

  it('gives training days more calories with the same weekly total', () => {
    const { days } = generateWeekPlan({ ...base(), workoutKcalByDay: { monday: 700 } })
    const monday = days.find((d) => d.dayOfWeek === 'monday')!
    const tuesday = days.find((d) => d.dayOfWeek === 'tuesday')!
    expect(monday.targetKcal - tuesday.targetKcal).toBe(700)
    expect(days.reduce((s, d) => s + d.targetKcal, 0)).toBeCloseTo(1900 * 7, -1)
  })

  it('suggests alternatives with similar calories and different proteins', () => {
    const plan = createSeedWeeklyPlan()
    const meal = plan.monday.lunch
    const target = { kcal: calculateMealKcal({ meal }).totalKcal, cho: calculateMealCho({ meal }).totalCho }
    const suggestions = suggestDishes({ slot: 'lunch', target, mealId: 'x' })
    expect(suggestions).toHaveLength(4)
    for (const s of suggestions) expect(Math.abs(s.kcal - target.kcal) / target.kcal).toBeLessThan(0.2)
    const proteins = suggestions.map((s) => s.dish.tags.find((t) => ['fish', 'legumes', 'white-meat', 'red-meat', 'eggs', 'cheese'].includes(t)))
    expect(new Set(proteins).size).toBeGreaterThanOrEqual(3)
  })
})
