import { describe, it, expect } from 'vitest'
import {
  calculateIngredientCho,
  calculateMealCho,
  calculateDayCho,
  calculatePlanAdherence,
} from '../../app/utils/nutrition'
import type { Ingredient, Meal, DayProgress, DayPlan } from '../../app/types/meal'

describe('nutrition / CHO calculation utils', () => {
  it('calculates ingredient CHO from direct choGrams or choPer100g', () => {
    const directIng: Ingredient = {
      id: '1',
      canonicalId: 'pasta',
      name: 'Pasta',
      quantity: 90,
      unit: 'g',
      category: 'carb',
      preparationState: 'raw',
      choGrams: 65.7,
    }
    expect(calculateIngredientCho(directIng)).toBe(65.7)

    const per100gIng: Ingredient = {
      id: '2',
      canonicalId: 'latte',
      name: 'Latte',
      quantity: 200,
      unit: 'ml',
      category: 'dairy',
      preparationState: 'none',
      choPer100g: 4.8,
    }
    // 200 * 4.8 / 100 = 9.6
    expect(calculateIngredientCho(per100gIng)).toBe(9.6)
  })

  it('calculates meal CHO accurately including base, alternative and extras', () => {
    const meal: Meal = {
      id: 'm1',
      slot: 'lunch',
      name: 'Pranzo',
      description: 'Pasta e ceci',
      isOut: false,
      ingredients: [
        {
          id: 'i1',
          canonicalId: 'pasta',
          name: 'Pasta',
          quantity: 90,
          unit: 'g',
          category: 'carb',
          preparationState: 'raw',
          choGrams: 65,
        },
        {
          id: 'i2',
          canonicalId: 'ceci',
          name: 'Ceci',
          quantity: 150,
          unit: 'g',
          category: 'legume',
          preparationState: 'cooked',
          choGrams: 25,
        },
      ],
    }

    const calcBase = calculateMealCho({ meal })
    expect(calcBase.baseCho).toBe(90)
    expect(calcBase.extraCho).toBe(0)
    expect(calcBase.totalCho).toBe(90)

    // With extra food logged (e.g. 30g bread = 15g CHO)
    const calcWithExtras = calculateMealCho({
      meal,
      extraFoods: [
        {
          id: 'e1',
          name: 'Pane extra',
          quantity: 30,
          unit: 'g',
          choGrams: 15,
        },
      ],
    })
    expect(calcWithExtras.baseCho).toBe(90)
    expect(calcWithExtras.extraCho).toBe(15)
    expect(calcWithExtras.totalCho).toBe(105)
  })

  it('calculates day CHO totals, consumed CHO and remaining CHO correctly', () => {
    const makeMeal = (slot: any, cho: number): Meal => ({
      id: slot,
      slot,
      name: slot,
      description: 'test',
      isOut: false,
      ingredients: [
        {
          id: 'i-' + slot,
          canonicalId: 'item',
          name: 'Item',
          quantity: 100,
          unit: 'g',
          category: 'carb',
          preparationState: 'none',
          choGrams: cho,
        },
      ],
    })

    const dayPlan: DayPlan = {
      breakfast: makeMeal('breakfast', 30),
      morningSnack: makeMeal('morningSnack', 15),
      lunch: makeMeal('lunch', 80),
      afternoonSnack: makeMeal('afternoonSnack', 5),
      dinner: makeMeal('dinner', 50),
    }

    const dayProgress: DayProgress = {
      date: '2026-10-12',
      completedMeals: {
        breakfast: true,
        morningSnack: true,
        lunch: false,
        afternoonSnack: false,
        dinner: false,
      },
      completedAt: {
        breakfast: '2026-10-12T08:00:00Z',
        morningSnack: '2026-10-12T11:00:00Z',
        lunch: null,
        afternoonSnack: null,
        dinner: null,
      },
      notes: '',
      extraFoods: {
        lunch: [
          {
            id: 'ex-1',
            name: 'Mela',
            choGrams: 18,
          },
        ],
      },
    }

    const result = calculateDayCho({ dayPlan, dayProgress })
    // breakfast (30) + morningSnack (15) + lunch (80 + 18) + afternoonSnack (5) + dinner (50) = 198
    expect(result.totalCho).toBe(198)
    // Consumed: breakfast (30) + morningSnack (15) = 45
    expect(result.consumedCho).toBe(45)
    // Remaining: 198 - 45 = 153
    expect(result.remainingCho).toBe(153)
  })

  it('calculates plan adherence percentage correctly', () => {
    const makeMeal = (slot: any, cho: number): Meal => ({
      id: slot,
      slot,
      name: slot,
      description: 'test',
      isOut: false,
      ingredients: [
        {
          id: 'i-' + slot,
          canonicalId: 'item',
          name: 'Item',
          quantity: 100,
          unit: 'g',
          category: 'carb',
          preparationState: 'none',
          choGrams: cho,
        },
      ],
    })

    const dayPlan: DayPlan = {
      breakfast: makeMeal('breakfast', 30),
      morningSnack: makeMeal('morningSnack', 15),
      lunch: makeMeal('lunch', 80),
      afternoonSnack: makeMeal('afternoonSnack', 5),
      dinner: makeMeal('dinner', 70),
    }

    // 100% adherence when no extras
    const cleanProgress: DayProgress = {
      date: '2026-10-12',
      completedMeals: {
        breakfast: true,
        morningSnack: false,
        lunch: false,
        afternoonSnack: false,
        dinner: false,
      },
      completedAt: {
        breakfast: '2026-10-12T08:00:00Z',
        morningSnack: null,
        lunch: null,
        afternoonSnack: null,
        dinner: null,
      },
      notes: '',
      extraFoods: {},
    }

    const cleanResult = calculatePlanAdherence({ dayPlan, dayProgress: cleanProgress })
    expect(cleanResult.adherencePercentage).toBe(100)
    expect(cleanResult.totalExtraCho).toBe(0)
    expect(cleanResult.hasExtras).toBe(false)

    // With extras logged
    const progressWithExtras: DayProgress = {
      ...cleanProgress,
      extraFoods: {
        lunch: [
          {
            id: 'ex-1',
            name: 'Cioccolato',
            choGrams: 20,
          },
        ],
      },
    }

    const extraResult = calculatePlanAdherence({ dayPlan, dayProgress: progressWithExtras })
    // Planned CHO = 200, extra = 20 -> 20/200 = 10% penalty -> 90% adherence
    expect(extraResult.totalExtraCho).toBe(20)
    expect(extraResult.hasExtras).toBe(true)
    expect(extraResult.adherencePercentage).toBe(90)
    expect(extraResult.statusLabel).toContain('Ottima aderenza')
  })

  it('uses a day-specific replacement instead of the planned meal', () => {
    const makeMeal = (slot: any, cho: number): Meal => ({
      id: slot,
      slot,
      name: slot,
      description: 'test',
      isOut: false,
      ingredients: [
        {
          id: 'i-' + slot,
          canonicalId: 'item',
          name: 'Item',
          quantity: 100,
          unit: 'g',
          category: 'carb',
          preparationState: 'none',
          choGrams: cho,
        },
      ],
    })

    const lunch = makeMeal('lunch', 80)
    const replacement = { description: 'Canederlo', choGrams: 45, replacedAt: '2026-10-14T12:00:00Z' }

    // Replacement CHO replaces the planned base, extras still add up
    const mealResult = calculateMealCho({
      meal: lunch,
      extraFoods: [{ id: 'ex', name: 'Pane', choGrams: 15 }],
      replacement,
    })
    expect(mealResult.baseCho).toBe(45)
    expect(mealResult.totalCho).toBe(60)

    const dayPlan: DayPlan = {
      breakfast: makeMeal('breakfast', 30),
      morningSnack: makeMeal('morningSnack', 15),
      lunch,
      afternoonSnack: makeMeal('afternoonSnack', 5),
      dinner: makeMeal('dinner', 50),
    }
    const dayProgress: DayProgress = {
      date: '2026-10-14',
      completedMeals: { breakfast: false, morningSnack: false, lunch: true, afternoonSnack: false, dinner: false },
      completedAt: { breakfast: null, morningSnack: null, lunch: '2026-10-14T13:00:00Z', afternoonSnack: null, dinner: null },
      notes: '',
      replacements: { lunch: replacement },
    }

    const day = calculateDayCho({ dayPlan, dayProgress })
    // 30 + 15 + 45 (replacement) + 5 + 50 = 145, consumed = lunch only
    expect(day.totalCho).toBe(145)
    expect(day.consumedCho).toBe(45)

    // Planned 180g; deviation |45 - 80| = 35 → 100 - round(35 / 180 * 100) = 81
    const adherence = calculatePlanAdherence({ dayPlan, dayProgress })
    expect(adherence.totalPlannedCho).toBe(180)
    expect(adherence.hasExtras).toBe(false)
    expect(adherence.adherencePercentage).toBe(81)
  })
})
