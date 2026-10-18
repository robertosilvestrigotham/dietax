import type { DayOfWeek, FoodPreparationState, Ingredient, Meal, MealSlot, WeeklyPlan } from '~/types/meal'
import { DAYS_OF_WEEK_ORDER, MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '~/types/meal'
import { DISHES, type Dish, type DishComponent, type DishCourse, type DishTag } from '~/data/dishes'
import { findFoodById, foodNutrition, type FoodItem } from '~/data/foods'
import { calculateDayCho, calculateDayKcal, calculateMealCho, calculateMealKcal } from '~/utils/nutrition'
import { roundPortion } from '~/utils/planScaling'

/**
 * Builds weekly menus from the dish library — deterministic for a given seed, offline, no AI.
 * Every portion is resized from the built-in food table, so CHO and kcal are always computed, never guessed.
 */

/** Share of the day's calories (and CHO) per meal */
export const SLOT_SHARES: Record<MealSlot, number> = {
  breakfast: 0.2,
  morningSnack: 0.1,
  lunch: 0.3,
  afternoonSnack: 0.1,
  dinner: 0.3,
}

const SLOT_COURSE: Record<MealSlot, DishCourse> = {
  breakfast: 'breakfast',
  morningSnack: 'snack',
  lunch: 'main',
  afternoonSnack: 'snack',
  dinner: 'main',
}

const PROTEIN_TAGS: DishTag[] = ['fish', 'legumes', 'white-meat', 'red-meat', 'eggs', 'cheese']

/** Small seeded PRNG (mulberry32): same seed → same menu */
export function createRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const preparationOf = (foodId: string): FoodPreparationState => {
  if (/-(secca|secco)$/.test(foodId)) return 'raw'
  if (/-(cotti|cotte|cotta)$/.test(foodId)) return 'cooked'
  if (foodId === 'tonno-naturale') return 'canned'
  return 'none'
}

const isResizable = (component: DishComponent, food: FoodItem) =>
  ['carb', 'protein', 'fat', 'dairy'].includes(component.role) &&
  (food.unit !== 'pz' || component.role === 'carb' || component.role === 'protein')

const roundAmount = (amount: number, food: FoodItem) =>
  food.unit === 'pz' ? Math.max(1, Math.round(amount)) : roundPortion(amount)

export const dishUsesExcludedFood = (dish: Dish, excluded: Set<string>) =>
  dish.components.some((comp) => excluded.has(comp.foodId))

export interface FittedDish {
  dish: Dish
  meal: Meal
  kcal: number
  cho: number
}

/**
 * Resizes a dish to the meal targets in two passes:
 * carb portions to the CHO target, then protein/fat/dairy portions to the remaining calories.
 */
export function fitDish(dish: Dish, slot: MealSlot, target: { kcal: number; cho: number }, mealId: string): FittedDish | null {
  const items = dish.components.map((comp) => ({ comp, food: findFoodById(comp.foodId), amount: comp.amount }))
  if (items.some((item) => !item.food)) return null
  const resolved = items as { comp: DishComponent; food: FoodItem; amount: number }[]

  const nutrition = (item: (typeof resolved)[number]) => foodNutrition(item.food, item.amount, item.food.unit)
  const sum = (list: typeof resolved, key: 'cho' | 'kcal') => list.reduce((acc, item) => acc + nutrition(item)[key], 0)

  const carbs = resolved.filter((i) => i.comp.role === 'carb' && isResizable(i.comp, i.food))
  const fillers = resolved.filter((i) => i.comp.role !== 'carb' && isResizable(i.comp, i.food))
  // Never shrink below 40% or grow beyond 2× a reference portion (both passes)
  const clampAmount = (item: (typeof resolved)[number]) =>
    roundAmount(Math.min(item.comp.amount * 2, Math.max(item.comp.amount * 0.4, item.amount)), item.food)

  // Two rounds: dairy and legumes also carry CHO, so the second round corrects the first
  for (let round = 0; round < 2; round++) {
    const choCarbs = sum(carbs, 'cho')
    if (choCarbs > 0) {
      const choOthers = sum(resolved, 'cho') - choCarbs
      // At most double the reference portion: beyond that a different dish fits better
      const factor = Math.min(2, Math.max(0.4, (target.cho - choOthers) / choCarbs))
      for (const item of carbs) item.amount = roundAmount(item.amount * factor, item.food)
    }
    const kcalFillers = sum(fillers, 'kcal')
    if (kcalFillers > 0) {
      const kcalOthers = sum(resolved, 'kcal') - kcalFillers
      const factor = Math.min(2, Math.max(0.5, (target.kcal - kcalOthers) / kcalFillers))
      for (const item of fillers) item.amount = roundAmount(item.amount * factor, item.food)
    }
  }
  for (const item of [...carbs, ...fillers]) item.amount = clampAmount(item)

  const ingredients: Ingredient[] = resolved.map((item, i) => ({
    id: `${mealId}-${i}`,
    canonicalId: item.food.id,
    name: item.food.name,
    quantity: item.amount,
    unit: item.food.unit,
    category: item.food.category,
    preparationState: preparationOf(item.food.id),
    // For pieces, choPer100g holds the CHO of one piece (see calculateIngredientCho)
    choPer100g:
      item.food.unit === 'pz'
        ? Math.round(((item.food.choPer100g * (item.food.gramsPerPiece ?? 100)) / 100) * 10) / 10
        : item.food.choPer100g,
  }))

  const meal: Meal = {
    id: mealId,
    slot,
    name: MEAL_SLOT_LABELS[slot],
    description: dish.name,
    isOut: false,
    ingredients,
    dishId: dish.id,
  }

  return {
    dish,
    meal,
    kcal: calculateMealKcal({ meal }).totalKcal,
    cho: calculateMealCho({ meal }).totalCho,
  }
}

const fitError = (fitted: FittedDish, target: { kcal: number; cho: number }) =>
  Math.abs(fitted.kcal - target.kcal) / Math.max(target.kcal, 50) +
  Math.abs(fitted.cho - target.cho) / Math.max(target.cho, 10)

/** CHO share of energy in the current plan (CHO g × 4 / kcal), week average */
export function planChoRatio(plan: WeeklyPlan): number {
  let cho = 0
  let kcal = 0
  for (const day of DAYS_OF_WEEK_ORDER) {
    cho += calculateDayCho({ dayPlan: plan[day] }).totalCho
    kcal += calculateDayKcal({ dayPlan: plan[day] }).totalKcal
  }
  return kcal > 0 ? Math.min(0.65, Math.max(0.25, (cho * 4) / kcal)) : 0.45
}

export const lockKey = (day: DayOfWeek, slot: MealSlot) => `${day}:${slot}`

export interface GeneratorOptions {
  plan: WeeklyPlan // current plan: locked and out-of-home meals are kept from here
  targetKcal: number
  choRatio: number // share of calories from carbohydrates (0.4 = 40%)
  excludedFoods?: string[]
  locks?: Set<string> // lockKey(day, slot)
  /** kcal burned by workouts per weekday: training days get more, rest days less (same weekly total) */
  workoutKcalByDay?: Partial<Record<DayOfWeek, number>>
  seed: number
}

export interface GeneratedDay {
  dayOfWeek: DayOfWeek
  targetKcal: number
  targetCho: number
  kcal: number
  cho: number
}

export interface GeneratedWeek {
  plan: WeeklyPlan
  days: GeneratedDay[]
}

export function generateWeekPlan(options: GeneratorOptions): GeneratedWeek {
  const { plan, targetKcal, choRatio, seed } = options
  const excluded = new Set(options.excludedFoods ?? [])
  const locks = options.locks ?? new Set<string>()
  const random = createRandom(seed)

  const workouts = options.workoutKcalByDay ?? {}
  const avgWorkout = DAYS_OF_WEEK_ORDER.reduce((sum, d) => sum + (workouts[d] ?? 0), 0) / 7

  const newPlan = JSON.parse(JSON.stringify(plan)) as WeeklyPlan
  const usage = new Map<string, number>()
  const weekTags = new Map<DishTag, number>()
  const days: GeneratedDay[] = []
  let previousDay: Partial<Record<MealSlot, string>> = {}

  const countDish = (dish: Dish) => {
    usage.set(dish.id, (usage.get(dish.id) ?? 0) + 1)
    if (dish.course === 'main') for (const tag of dish.tags) weekTags.set(tag, (weekTags.get(tag) ?? 0) + 1)
  }
  const tagCount = (tag: DishTag) => weekTags.get(tag) ?? 0

  for (const day of DAYS_OF_WEEK_ORDER) {
    const dayTargetKcal = Math.round(targetKcal + (workouts[day] ?? 0) - avgWorkout)
    const dayTargetCho = Math.round((dayTargetKcal * choRatio) / 4)

    // Kept meals (locked or out of home) use part of the day's budget
    const kept = MEAL_SLOT_ORDER.filter((slot) => locks.has(lockKey(day, slot)) || plan[day][slot].isOut)
    const free = MEAL_SLOT_ORDER.filter((slot) => !kept.includes(slot))
    let keptKcal = 0
    let keptCho = 0
    const dayProteinTags = new Set<DishTag>()
    const dayProteinFoods = new Set<string>()
    const addProteinFoods = (dish: Dish) =>
      dish.components.filter((c) => c.role === 'protein').forEach((c) => dayProteinFoods.add(c.foodId))
    for (const slot of kept) {
      keptKcal += calculateMealKcal({ meal: plan[day][slot] }).totalKcal
      keptCho += calculateMealCho({ meal: plan[day][slot] }).totalCho
      const keptDish = DISHES.find((d) => d.id === plan[day][slot].dishId)
      if (keptDish) {
        countDish(keptDish)
        addProteinFoods(keptDish)
        keptDish.tags.filter((t) => PROTEIN_TAGS.includes(t)).forEach((t) => dayProteinTags.add(t))
      }
    }
    const freeShare = free.reduce((sum, slot) => sum + SLOT_SHARES[slot], 0)
    const budgetKcal = Math.max(0, dayTargetKcal - keptKcal)
    const budgetCho = Math.max(0, dayTargetCho - keptCho)

    const today: Partial<Record<MealSlot, string>> = {}
    for (const slot of free) {
      const target = {
        kcal: (budgetKcal * SLOT_SHARES[slot]) / freeShare,
        cho: (budgetCho * SLOT_SHARES[slot]) / freeShare,
      }
      const course = SLOT_COURSE[slot]
      let best: { fitted: FittedDish; score: number } | null = null

      for (const dish of DISHES) {
        if (dish.course !== course || dishUsesExcludedFood(dish, excluded)) continue
        const fitted = fitDish(dish, slot, target, `gen-${day}-${slot}`)
        if (!fitted) continue

        const used = usage.get(dish.id) ?? 0
        let score = random() * 0.6 - fitError(fitted, target) * 3 - used * 1.2
        if (used >= 2) score -= 5
        if (previousDay[slot] === dish.id) score -= 3
        if (Object.values(today).includes(dish.id)) score -= 5
        if (dish.components.some((c) => c.role === 'protein' && dayProteinFoods.has(c.foodId))) score -= 2

        if (course === 'main') {
          if (dish.prefer && dish.prefer !== slot) score -= 0.4
          if (dish.tags.some((t) => PROTEIN_TAGS.includes(t) && dayProteinTags.has(t))) score -= 1.5
          if (dish.tags.includes('fish') && tagCount('fish') < 2) score += 1
          if (dish.tags.includes('legumes') && tagCount('legumes') < 2) score += 1
          if (dish.tags.includes('red-meat') && tagCount('red-meat') >= 2) score -= 2
          if (dish.tags.includes('treat') && tagCount('treat') >= 1) score -= 5
        } else if (dish.tags.includes('treat') && (usage.get(dish.id) ?? 0) >= 1) {
          score -= 5
        }

        if (!best || score > best.score) best = { fitted, score }
      }

      if (best) {
        newPlan[day][slot] = best.fitted.meal
        today[slot] = best.fitted.dish.id
        countDish(best.fitted.dish)
        addProteinFoods(best.fitted.dish)
        if (course === 'main') {
          best.fitted.dish.tags.filter((t) => PROTEIN_TAGS.includes(t)).forEach((t) => dayProteinTags.add(t))
        }
      }
    }
    previousDay = today

    days.push({
      dayOfWeek: day,
      targetKcal: dayTargetKcal,
      targetCho: dayTargetCho,
      kcal: calculateDayKcal({ dayPlan: newPlan[day] }).totalKcal,
      cho: calculateDayCho({ dayPlan: newPlan[day] }).totalCho,
    })
  }

  return { plan: newPlan, days }
}

/**
 * Alternatives for one meal with the same calories and CHO ("Cambia piatto").
 * Results are spread over different main proteins when possible.
 */
export function suggestDishes(options: {
  slot: MealSlot
  target: { kcal: number; cho: number }
  excludedFoods?: string[]
  excludeDishId?: string
  count?: number
  mealId: string
}): FittedDish[] {
  const { slot, target, excludeDishId, count = 4, mealId } = options
  const excluded = new Set(options.excludedFoods ?? [])
  const course = SLOT_COURSE[slot]

  const ranked = DISHES.filter(
    (d) => d.course === course && d.id !== excludeDishId && !dishUsesExcludedFood(d, excluded) && !d.tags.includes('treat')
  )
    .map((dish) => fitDish(dish, slot, target, mealId))
    .filter((f): f is FittedDish => f !== null)
    .sort((a, b) => fitError(a, target) - fitError(b, target))

  const picked: FittedDish[] = []
  const seenProteins = new Set<string>()
  for (const fitted of ranked) {
    const protein = fitted.dish.tags.find((t) => PROTEIN_TAGS.includes(t)) ?? fitted.dish.id
    if (seenProteins.has(protein)) continue
    seenProteins.add(protein)
    picked.push(fitted)
    if (picked.length === count) return picked
  }
  // Not enough distinct proteins: fill with the next best ones
  for (const fitted of ranked) {
    if (picked.length === count) break
    if (!picked.includes(fitted)) picked.push(fitted)
  }
  return picked
}
