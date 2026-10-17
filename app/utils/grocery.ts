import type {
  AggregatedShoppingItem,
  DayOfWeek,
  DayProgress,
  FoodPreparationState,
  FoodUnit,
  IngredientCategory,
  ItemShoppingStatus,
  ManualShoppingItem,
  MealSlot,
  WeeklyPlan,
  WeekShoppingState,
} from '~/types/meal'
import {
  INGREDIENT_CATEGORY_LABELS,
  INGREDIENT_CATEGORY_ORDER,
  MEAL_SLOT_LABELS,
  DAY_OF_WEEK_LABELS,
} from '~/types/meal'
import { getDayOfWeekFromDate } from './date'

/**
 * Creates a unique aggregation key ensuring incompatible units or preparations are never merged
 */
export function createIngredientAggregateKey(
  canonicalId: string,
  unit: FoodUnit,
  prepState: FoodPreparationState
): string {
  return `${canonicalId}__${unit}__${prepState}`
}

/**
 * Formats structured quantity with unit and notes
 */
export function formatQuantityString(
  quantity: number | null,
  unit: FoodUnit,
  isToDefine?: boolean
): string {
  if (isToDefine || quantity === null || unit === 'qb') {
    return 'q.b. (da definire)'
  }

  if (unit === 'g') {
    if (quantity >= 1000) {
      const kg = parseFloat((quantity / 1000).toFixed(2))
      return `${quantity} g (${kg} kg)`
    }
    return `${quantity} g`
  }

  if (unit === 'ml') {
    if (quantity >= 1000) {
      const liters = parseFloat((quantity / 1000).toFixed(2))
      return `${quantity} ml (${liters} L)`
    }
    return `${quantity} ml`
  }

  if (unit === 'pz') {
    return `${quantity} ${quantity === 1 ? 'pz' : 'pz'}`
  }

  return `${quantity}`
}

export function formatPreparationLabel(state: FoodPreparationState): string {
  switch (state) {
    case 'raw':
      return 'a secco'
    case 'cooked':
      return 'cotto e scolato'
    case 'canned':
      return 'al naturale/sgocciolato'
    default:
      return ''
  }
}

/**
 * Builds aggregated grocery items list for a specific set of date keys
 */
export function buildAggregatedGroceryList(options: {
  plan: WeeklyPlan
  dateKeys: string[]
  shoppingState?: WeekShoppingState
  globalPantry?: string[]
  dayProgressMap?: Record<string, DayProgress>
}): AggregatedShoppingItem[] {
  const { plan, dateKeys, shoppingState, globalPantry = [], dayProgressMap = {} } = options

  const aggregatedMap = new Map<string, AggregatedShoppingItem>()

  for (const dateKey of dateKeys) {
    const dayOfWeek = getDayOfWeekFromDate(dateKey)
    const dayPlan = plan[dayOfWeek]
    if (!dayPlan) continue

    const slots: MealSlot[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner']

    for (const slot of slots) {
      const meal = dayPlan[slot]
      if (!meal) continue

      // Out of home meals do not generate grocery items
      if (meal.isOut) continue

      // Replaced for this date: the planned ingredients are not needed
      if (dayProgressMap[dateKey]?.replacements?.[slot]) continue

      // Collect base ingredients
      const ingredientsToProcess = [...(meal.ingredients || [])]

      // Handle meal alternatives
      if (meal.alternatives && meal.alternatives.length > 0) {
        // Day-specific selection takes precedence over template selection
        const dayProgress = dayProgressMap[dateKey]
        const selectedAltId =
          dayProgress?.selectedAlternatives?.[slot] ||
          meal.selectedAlternativeId ||
          meal.alternatives[0]?.id

        const chosenAlt = meal.alternatives.find((alt) => alt.id === selectedAltId)
        if (chosenAlt && chosenAlt.ingredients) {
          ingredientsToProcess.push(...chosenAlt.ingredients)
        }
      }

      // Aggregate each ingredient
      for (const ingredient of ingredientsToProcess) {
        const prep = ingredient.preparationState || 'none'
        const unit = ingredient.unit || 'g'
        const key = createIngredientAggregateKey(ingredient.canonicalId, unit, prep)

        const existing = aggregatedMap.get(key)
        const sourceInfo = {
          dayOfWeek,
          slot,
          mealName: meal.name,
          dateString: dateKey,
        }

        if (existing) {
          existing.occurrences += 1
          existing.sourceMeals.push(sourceInfo)

          if (ingredient.quantity !== null && existing.totalQuantity !== null) {
            existing.totalQuantity += ingredient.quantity
          } else if (ingredient.quantity === null) {
            existing.isToDefine = true
          }
        } else {
          // Determine status: check week shopping state first, then global pantry
          let status: ItemShoppingStatus = 'to_buy'
          if (shoppingState?.itemStatuses?.[key]) {
            status = shoppingState.itemStatuses[key]
          } else if (globalPantry.includes(ingredient.canonicalId)) {
            status = 'in_pantry'
          }

          aggregatedMap.set(key, {
            key,
            canonicalId: ingredient.canonicalId,
            name: ingredient.name,
            category: ingredient.category,
            unit,
            preparationState: prep,
            totalQuantity: ingredient.quantity,
            occurrences: 1,
            isToDefine: Boolean(ingredient.isToDefine || ingredient.quantity === null),
            sourceMeals: [sourceInfo],
            status,
          })
        }
      }
    }
  }

  return Array.from(aggregatedMap.values())
}

/**
 * Groups items by their category preserving the canonical category order
 */
export function groupGroceryByCategory<T extends { category: IngredientCategory }>(
  items: T[]
): { category: IngredientCategory; label: string; items: T[] }[] {
  const result: { category: IngredientCategory; label: string; items: T[] }[] = []

  for (const cat of INGREDIENT_CATEGORY_ORDER) {
    const matching = items.filter((item) => item.category === cat)
    if (matching.length > 0) {
      result.push({
        category: cat,
        label: INGREDIENT_CATEGORY_LABELS[cat] || cat,
        items: matching,
      })
    }
  }

  return result
}

/**
 * Generates an exportable/printable text format of the shopping list
 */
export function formatGroceryListAsText(options: {
  aggregatedItems: AggregatedShoppingItem[]
  manualItems?: ManualShoppingItem[]
  rangeLabel: string
  excludePantry?: boolean
}): string {
  const { aggregatedItems, manualItems = [], rangeLabel, excludePantry = false } = options

  const lines: string[] = []
  lines.push(`🛒 LISTA DELLA SPESA — ${rangeLabel}`)
  lines.push('='.repeat(40))

  let filteredAggregated = aggregatedItems
  let filteredManual = manualItems

  if (excludePantry) {
    filteredAggregated = aggregatedItems.filter((i) => i.status !== 'in_pantry')
    filteredManual = manualItems.filter((i) => i.status !== 'in_pantry')
  }

  const grouped = groupGroceryByCategory(filteredAggregated)

  for (const group of grouped) {
    lines.push('')
    lines.push(`[${group.label.toUpperCase()}]`)

    for (const item of group.items) {
      const checkbox = item.status === 'bought' ? '✅' : item.status === 'in_pantry' ? '🏠' : '⬜'
      const qtyStr = formatQuantityString(item.totalQuantity, item.unit, item.isToDefine)
      const prepStr = item.preparationState && item.preparationState !== 'none'
        ? ` (${formatPreparationLabel(item.preparationState)})`
        : ''
      const pantryTag = item.status === 'in_pantry' ? ' [In dispensa]' : ''
      lines.push(`${checkbox} ${item.name}${prepStr}: ${qtyStr}${pantryTag}`)
    }
  }

  if (filteredManual.length > 0) {
    lines.push('')
    lines.push('[PRODOTTI AGGIUNTI MANUALMENTE]')
    for (const item of filteredManual) {
      const checkbox = item.status === 'bought' ? '✅' : item.status === 'in_pantry' ? '🏠' : '⬜'
      const qtyStr = item.quantity !== null ? formatQuantityString(item.quantity, item.unit) : 'q.b.'
      lines.push(`${checkbox} ${item.name}: ${qtyStr}`)
    }
  }

  lines.push('')
  lines.push(`Generata da DietaX`)

  return lines.join('\n')
}
