import { describe, it, expect } from 'vitest'
import { FOODS, findFoodById, findFoodByName, searchFoods, foodNutrition } from '../../app/data/foods'
import { createSeedWeeklyPlan } from '../../app/data/seedMenu'
import {
  calculateIngredientCho,
  calculateIngredientKcal,
  calculateExtraKcal,
  calculateMealKcal,
  calculateDayKcal,
} from '../../app/utils/nutrition'

describe('food table', () => {
  it('has unique ids and sane values', () => {
    const ids = new Set(FOODS.map((f) => f.id))
    expect(ids.size).toBe(FOODS.length)
    for (const food of FOODS) {
      expect(food.choPer100g).toBeGreaterThanOrEqual(0)
      expect(food.choPer100g).toBeLessThanOrEqual(100)
      expect(food.kcalPer100g).toBeGreaterThan(0)
      // 4 kcal per gram of CHO is a hard lower bound for energy
      expect(food.kcalPer100g).toBeGreaterThanOrEqual(food.choPer100g * 3.7)
      if (food.unit === 'pz') expect(food.gramsPerPiece).toBeGreaterThan(0)
    }
  })

  it('covers every ingredient of the seed menu', () => {
    const plan = createSeedWeeklyPlan()
    const missing = new Set<string>()
    for (const day of Object.values(plan)) {
      for (const meal of Object.values(day)) {
        const ingredients = [...meal.ingredients, ...(meal.alternatives ?? []).flatMap((a) => a.ingredients)]
        for (const ing of ingredients) {
          if (!findFoodById(ing.canonicalId)) missing.add(ing.canonicalId)
        }
      }
    }
    expect([...missing]).toEqual([])
  })

  it('matches seed CHO per piece (pieces use gramsPerPiece)', () => {
    expect(foodNutrition(findFoodById('mela')!, 1).cho).toBe(18)
    expect(foodNutrition(findFoodById('banana')!, 1).cho).toBe(23)
    expect(foodNutrition(findFoodById('barretta-proteica')!, 1).cho).toBe(15)
  })

  it('finds foods by name, alias and partial query', () => {
    expect(findFoodByName('Knödel')?.id).toBe('canederlo')
    expect(findFoodByName('PIZZA')?.id).toBe('pizza-margherita')
    expect(searchFoods('cane')[0]?.id).toBe('canederlo')
    expect(searchFoods('a')).toEqual([])
  })
})

describe('calories', () => {
  it('estimates ingredient kcal from the table and honours explicit values', () => {
    const pasta = {
      id: 'i1',
      canonicalId: 'pasta-secca',
      name: 'Pasta',
      quantity: 90,
      unit: 'g' as const,
      category: 'carb' as const,
      preparationState: 'raw' as const,
      choPer100g: 73,
    }
    expect(calculateIngredientKcal(pasta)).toBe(318) // 90 * 353 / 100
    expect(calculateIngredientKcal({ ...pasta, kcal: 300 })).toBe(300)
    expect(calculateIngredientCho(pasta)).toBe(65.7)
    // Unknown custom ingredient → 0 kcal instead of a guess
    expect(calculateIngredientKcal({ ...pasta, canonicalId: 'custom-x', name: 'Boh' })).toBe(0)
  })

  it('uses extras, replacements and out-of-home estimates', () => {
    expect(calculateExtraKcal({ id: 'e', name: 'Mela', quantity: 1, unit: 'pz', choGrams: 18 })).toBe(90)
    expect(calculateExtraKcal({ id: 'e', name: 'Sconosciuto', choGrams: 10 })).toBe(40)
    expect(calculateExtraKcal({ id: 'e', name: 'Mela', choGrams: 18, kcal: 70 })).toBe(70)

    const meal = {
      id: 'm',
      slot: 'lunch' as const,
      name: 'Pranzo',
      description: '',
      isOut: true,
      ingredients: [],
      estimatedCho: 75,
    }
    expect(calculateMealKcal({ meal }).totalKcal).toBe(600) // 75 g CHO * 8
    expect(calculateMealKcal({ meal: { ...meal, estimatedKcal: 750 } }).totalKcal).toBe(750)
    expect(
      calculateMealKcal({
        meal,
        replacement: { description: 'Canederlo', choGrams: 48, kcal: 336, replacedAt: '' },
      }).totalKcal
    ).toBe(336)
  })

  it('gives every seed day a plausible calorie total', () => {
    const plan = createSeedWeeklyPlan()
    for (const day of Object.values(plan)) {
      const { totalKcal, consumedKcal } = calculateDayKcal({ dayPlan: day })
      expect(totalKcal).toBeGreaterThan(1000)
      expect(totalKcal).toBeLessThan(3500)
      expect(consumedKcal).toBe(0)
    }
  })
})
