import type { DayOfWeek, Ingredient, IngredientCategory, Meal, MealSlot, WeeklyPlan } from '~/types/meal'
import { DAYS_OF_WEEK_ORDER, MEAL_SLOT_ORDER } from '~/types/meal'
import { calculateDayCho, calculateDayKcal, calculateIngredientKcal } from '~/utils/nutrition'

/**
 * Adapts the weekly plan to a daily calorie target by resizing portions — deterministic, offline, no AI.
 *
 * Per day: kcal of the "fixed" part (vegetables, q.b., pieces, out-of-home meals) stays as is;
 * weighed portions (g/ml) of the other foods are multiplied by one factor so the day lands on the target.
 * The factor is clamped so portions never change by more than ±40%.
 */

export const MIN_FACTOR = 0.6
export const MAX_FACTOR = 1.4
const FIXED_CATEGORIES: IngredientCategory[] = ['veg']

export interface PortionChange {
  slot: MealSlot
  name: string
  from: number
  to: number
  unit: string
}

export interface DayScalingReport {
  dayOfWeek: DayOfWeek
  factor: number
  clamped: boolean
  beforeKcal: number
  afterKcal: number
  beforeCho: number
  afterCho: number
  changes: PortionChange[]
}

export interface PlanScalingResult {
  plan: WeeklyPlan
  days: DayScalingReport[]
}

const isScalable = (ing: Ingredient) =>
  typeof ing.quantity === 'number' &&
  ing.quantity > 0 &&
  (ing.unit === 'g' || ing.unit === 'ml') &&
  !ing.isToDefine &&
  !FIXED_CATEGORIES.includes(ing.category)

/** Ingredients that count for the day: base + the currently chosen alternative */
const countedIngredients = (meal: Meal): Ingredient[] => {
  if (meal.isOut) return []
  const altId = meal.selectedAlternativeId || meal.alternatives?.[0]?.id
  const alt = meal.alternatives?.find((a) => a.id === altId)
  return [...(meal.ingredients || []), ...(alt?.ingredients || [])]
}

export function roundPortion(value: number): number {
  const step = value <= 50 ? 5 : 10
  return Math.max(5, Math.round(value / step) * step)
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** "90 g pasta" → "75 g pasta" (first occurrence of that amount + unit) */
export function updateDescriptionAmount(description: string, from: number, to: number, unit: string): string {
  const pattern = new RegExp(`(^|[^\\d.,])${escapeRegExp(String(from))}(\\s?)${unit}\\b`)
  return description.replace(pattern, `$1${to}$2${unit}`)
}

const scaleIngredient = (ing: Ingredient, factor: number): { ing: Ingredient; change?: { from: number; to: number } } => {
  if (!isScalable(ing)) return { ing }
  const from = ing.quantity as number
  const to = roundPortion(from * factor)
  if (to === from) return { ing }
  const ratio = to / from
  return {
    ing: {
      ...ing,
      quantity: to,
      choGrams: typeof ing.choGrams === 'number' ? Math.round(ing.choGrams * ratio * 10) / 10 : ing.choGrams,
      kcal: typeof ing.kcal === 'number' ? Math.round(ing.kcal * ratio) : ing.kcal,
    },
    change: { from, to },
  }
}

const scaleMeal = (meal: Meal, factor: number, changes: PortionChange[]): Meal => {
  if (meal.isOut) return meal
  let description = meal.description
  const counted = new Set(countedIngredients(meal).map((i) => i.id))

  const apply = (ing: Ingredient) => {
    const result = scaleIngredient(ing, factor)
    if (result.change) {
      description = updateDescriptionAmount(description, result.change.from, result.change.to, ing.unit)
      // Report only what is actually eaten (base + chosen alternative)
      if (counted.has(ing.id)) changes.push({ slot: meal.slot, name: ing.name, ...result.change, unit: ing.unit })
    }
    return result.ing
  }

  return {
    ...meal,
    ingredients: meal.ingredients.map(apply),
    alternatives: meal.alternatives?.map((alt) => ({ ...alt, ingredients: alt.ingredients.map(apply) })),
    description,
  }
}

export function scalePlanToTarget(plan: WeeklyPlan, targetKcal: number): PlanScalingResult {
  const newPlan = JSON.parse(JSON.stringify(plan)) as WeeklyPlan
  const days: DayScalingReport[] = []

  for (const dayOfWeek of DAYS_OF_WEEK_ORDER) {
    const dayPlan = plan[dayOfWeek]
    const beforeKcal = calculateDayKcal({ dayPlan }).totalKcal
    const beforeCho = calculateDayCho({ dayPlan }).totalCho

    let scalableKcal = 0
    for (const slot of MEAL_SLOT_ORDER) {
      for (const ing of countedIngredients(dayPlan[slot])) {
        if (isScalable(ing)) scalableKcal += calculateIngredientKcal(ing)
      }
    }
    const fixedKcal = beforeKcal - scalableKcal

    const ideal = scalableKcal > 0 ? (targetKcal - fixedKcal) / scalableKcal : 1
    const factor = Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, ideal))
    const clamped = factor !== ideal

    const changes: PortionChange[] = []
    if (Math.abs(factor - 1) >= 0.03) {
      for (const slot of MEAL_SLOT_ORDER) {
        newPlan[dayOfWeek][slot] = scaleMeal(dayPlan[slot], factor, changes)
      }
    }

    days.push({
      dayOfWeek,
      factor: Math.round(factor * 100) / 100,
      clamped,
      beforeKcal,
      afterKcal: calculateDayKcal({ dayPlan: newPlan[dayOfWeek] }).totalKcal,
      beforeCho,
      afterCho: calculateDayCho({ dayPlan: newPlan[dayOfWeek] }).totalCho,
      changes,
    })
  }

  return { plan: newPlan, days }
}
