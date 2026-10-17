import type { Ingredient, Meal, DayProgress, MealSlot, ExtraFoodItem, MealReplacement } from '~/types/meal'

/**
 * Calculates carbohydrates (CHO) in grams for an ingredient
 */
export function calculateIngredientCho(ingredient: Ingredient): number {
  if (typeof ingredient.choGrams === 'number') {
    return ingredient.choGrams
  }

  if (typeof ingredient.choPer100g === 'number' && typeof ingredient.quantity === 'number') {
    if (ingredient.unit === 'pz') {
      // For pieces, choPer100g acts as cho per piece
      return Math.round(ingredient.quantity * ingredient.choPer100g * 10) / 10
    }
    return Math.round(((ingredient.quantity * ingredient.choPer100g) / 100) * 10) / 10
  }

  return 0
}

/**
 * Calculates total carbohydrates (CHO) in grams for a meal on a specific date,
 * including base ingredients, selected alternative and any logged extra foods.
 * A day-specific replacement takes the place of the planned meal entirely.
 */
export function calculateMealCho(options: {
  meal: Meal
  selectedAlternativeId?: string
  extraFoods?: ExtraFoodItem[]
  replacement?: MealReplacement
}): {
  baseCho: number
  extraCho: number
  totalCho: number
} {
  const { meal, selectedAlternativeId, extraFoods = [], replacement } = options

  if (replacement) {
    const extraCho = Math.round(extraFoods.reduce((acc, f) => acc + (f.choGrams || 0), 0) * 10) / 10
    const baseCho = Math.round((replacement.choGrams || 0) * 10) / 10
    return { baseCho, extraCho, totalCho: Math.round((baseCho + extraCho) * 10) / 10 }
  }

  if (meal.isOut && typeof meal.estimatedCho === 'number') {
    const extraCho = extraFoods.reduce((acc, f) => acc + (f.choGrams || 0), 0)
    return {
      baseCho: meal.estimatedCho,
      extraCho,
      totalCho: Math.round((meal.estimatedCho + extraCho) * 10) / 10,
    }
  }

  let baseCho = 0

  // 1. Ingredients
  for (const ing of meal.ingredients || []) {
    baseCho += calculateIngredientCho(ing)
  }

  // 2. Alternative if chosen
  if (meal.alternatives && meal.alternatives.length > 0) {
    const chosenId = selectedAlternativeId || meal.selectedAlternativeId || meal.alternatives[0]?.id
    const alt = meal.alternatives.find((a) => a.id === chosenId)
    if (alt && alt.ingredients) {
      for (const ing of alt.ingredients) {
        baseCho += calculateIngredientCho(ing)
      }
    }
  }

  // 3. Extra foods eaten
  const extraCho = extraFoods.reduce((acc, item) => acc + (item.choGrams || 0), 0)

  baseCho = Math.round(baseCho * 10) / 10
  const totalCho = Math.round((baseCho + extraCho) * 10) / 10

  return {
    baseCho,
    extraCho: Math.round(extraCho * 10) / 10,
    totalCho,
  }
}

/**
 * Calculates total daily CHO across all 5 slots for a given day
 */
export function calculateDayCho(options: {
  dayPlan: Record<MealSlot, Meal>
  dayProgress?: DayProgress
}): {
  slotsCho: Record<MealSlot, number>
  totalCho: number
  consumedCho: number
  remainingCho: number
} {
  const { dayPlan, dayProgress } = options
  const slots: MealSlot[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner']

  const slotsCho = {} as Record<MealSlot, number>
  let totalCho = 0
  let consumedCho = 0

  for (const slot of slots) {
    const meal = dayPlan[slot]
    if (!meal) {
      slotsCho[slot] = 0
      continue
    }

    const selectedAltId =
      dayProgress?.selectedAlternatives?.[slot] || meal.selectedAlternativeId

    const extraFoods = dayProgress?.extraFoods?.[slot] || []

    const mealCalc = calculateMealCho({
      meal,
      selectedAlternativeId: selectedAltId,
      extraFoods,
      replacement: dayProgress?.replacements?.[slot],
    })

    slotsCho[slot] = mealCalc.totalCho
    totalCho += mealCalc.totalCho

    if (dayProgress?.completedMeals?.[slot]) {
      consumedCho += mealCalc.totalCho
    }
  }

  totalCho = Math.round(totalCho * 10) / 10
  consumedCho = Math.round(consumedCho * 10) / 10
  const remainingCho = Math.max(0, Math.round((totalCho - consumedCho) * 10) / 10)

  return {
    slotsCho,
    totalCho,
    consumedCho,
    remainingCho,
  }
}

/**
 * Calculates percentage of diet plan adherence for a given day.
 * - Outermost factor: meals consumed on plan vs deviations/extras.
 * - Extras factor: calculates how much extra CHO was logged beyond the plan.
 * - Replacements count as a deviation equal to their CHO difference from the planned meal.
 * If there are no extras and no replacements, adherence is 100%.
 * Otherwise adherence reduces proportionally based on the CHO impact.
 */
export function calculatePlanAdherence(options: {
  dayPlan: Record<MealSlot, Meal>
  dayProgress?: DayProgress
}): {
  adherencePercentage: number
  totalPlannedCho: number
  totalExtraCho: number
  hasExtras: boolean
  statusLabel: string
} {
  const { dayPlan, dayProgress } = options
  const slots: MealSlot[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner']

  let totalPlannedCho = 0
  let totalExtraCho = 0
  let replacementDeviation = 0
  let hasReplacements = false

  for (const slot of slots) {
    const meal = dayPlan[slot]
    if (!meal) continue

    const selectedAltId =
      dayProgress?.selectedAlternatives?.[slot] || meal.selectedAlternativeId

    const mealCalc = calculateMealCho({
      meal,
      selectedAlternativeId: selectedAltId,
      extraFoods: [],
    })
    totalPlannedCho += mealCalc.baseCho

    const replacement = dayProgress?.replacements?.[slot]
    if (replacement) {
      hasReplacements = true
      replacementDeviation += Math.abs((replacement.choGrams || 0) - mealCalc.baseCho)
    }

    const extras = dayProgress?.extraFoods?.[slot] || []
    for (const item of extras) {
      totalExtraCho += item.choGrams || 0
    }
  }

  totalPlannedCho = Math.round(totalPlannedCho * 10) / 10
  totalExtraCho = Math.round(totalExtraCho * 10) / 10

  if (totalExtraCho === 0 && !hasReplacements) {
    return {
      adherencePercentage: 100,
      totalPlannedCho,
      totalExtraCho: 0,
      hasExtras: false,
      statusLabel: 'Piano rispettato al 100%',
    }
  }

  // Deviation penalty: relative to baseline planned CHO (or floor of 100g)
  const baseline = Math.max(100, totalPlannedCho)
  const penalty = Math.round(((totalExtraCho + replacementDeviation) / baseline) * 100)
  const adherencePercentage = Math.max(0, Math.min(100, 100 - penalty))

  let statusLabel = 'Piano rispettato al 100%'
  if (totalExtraCho === 0) {
    statusLabel = 'Pasto sostituito'
  } else if (adherencePercentage >= 90) {
    statusLabel = `Ottima aderenza (+${totalExtraCho}g extra)`
  } else if (adherencePercentage >= 70) {
    statusLabel = `Buona aderenza (+${totalExtraCho}g extra)`
  } else {
    statusLabel = `Scostamento (+${totalExtraCho}g extra)`
  }

  return {
    adherencePercentage,
    totalPlannedCho,
    totalExtraCho,
    hasExtras: totalExtraCho > 0,
    statusLabel,
  }
}

