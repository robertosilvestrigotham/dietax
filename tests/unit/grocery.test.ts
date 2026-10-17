import { describe, it, expect } from 'vitest'
import {
  createIngredientAggregateKey,
  formatQuantityString,
  buildAggregatedGroceryList,
  groupGroceryByCategory,
  formatGroceryListAsText,
} from '../../app/utils/grocery'
import { createSeedWeeklyPlan } from '../../app/data/seedMenu'

describe('grocery utils', () => {
  it('creates aggregate key distinguishing units and preparation states', () => {
    const rawRiceKey = createIngredientAggregateKey('riso', 'g', 'raw')
    const cookedRiceKey = createIngredientAggregateKey('riso', 'g', 'cooked')
    expect(rawRiceKey).not.toBe(cookedRiceKey)
  })

  it('formats quantities and converts kg/L for large amounts', () => {
    expect(formatQuantityString(500, 'g')).toBe('500 g')
    expect(formatQuantityString(1200, 'g')).toBe('1200 g (1.2 kg)')
    expect(formatQuantityString(1000, 'ml')).toBe('1000 ml (1 L)')
    expect(formatQuantityString(null, 'qb', true)).toBe('q.b. (da definire)')
  })

  it('aggregates ingredients for the seed week properly', () => {
    const plan = createSeedWeeklyPlan()
    const weekDates = [
      '2026-10-12', // lun
      '2026-10-13', // mar
      '2026-10-14', // mer
      '2026-10-15', // gio (pranzo e cena fuori casa)
      '2026-10-16', // ven
      '2026-10-17', // sab
      '2026-10-18', // dom
    ]

    const items = buildAggregatedGroceryList({
      plan,
      dateKeys: weekDates,
    })

    expect(items.length).toBeGreaterThan(0)

    // Milk: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday = 7 days * 200 ml = 1400 ml
    const milk = items.find((i) => i.canonicalId === 'latte-vaccino')
    expect(milk).toBeDefined()
    expect(milk?.totalQuantity).toBe(1400)
    expect(milk?.unit).toBe('ml')
    expect(milk?.occurrences).toBe(7)

    // Out-of-home meals check: Thursday lunch and dinner are isOut: true, so no ingredients added from them
    // Check Thursday out meals
    const thuLunch = plan.thursday.lunch
    expect(thuLunch.isOut).toBe(true)

    // Check almond aggregation: Mon (15g), Wed (15g), Fri (15g), Sun (15g) = 60g
    const almonds = items.find((i) => i.canonicalId === 'mandorle')
    expect(almonds).toBeDefined()
    expect(almonds?.totalQuantity).toBe(60)

    // Check potatoes: Mon (250g), Fri (250g), Sun (250g) = 750g
    const potatoes = items.find((i) => i.canonicalId === 'patate')
    expect(potatoes).toBeDefined()
    expect(potatoes?.totalQuantity).toBe(750)
  })

  it('does not aggregate cooked legumes with uncooked grains into the same item', () => {
    const plan = createSeedWeeklyPlan()
    const weekDates = ['2026-10-12'] // Monday: pasta integrale secca (90g), ceci cotti (150g)

    const items = buildAggregatedGroceryList({
      plan,
      dateKeys: weekDates,
    })

    const pasta = items.find((i) => i.canonicalId === 'pasta-integrale-secca')
    const ceci = items.find((i) => i.canonicalId === 'ceci-cotti')

    expect(pasta?.preparationState).toBe('raw')
    expect(ceci?.preparationState).toBe('cooked')
    expect(pasta?.key).not.toBe(ceci?.key)
  })

  it('handles pantry status correctly', () => {
    const plan = createSeedWeeklyPlan()
    const items = buildAggregatedGroceryList({
      plan,
      dateKeys: ['2026-10-12'],
      globalPantry: ['mandorle'],
    })

    const almonds = items.find((i) => i.canonicalId === 'mandorle')
    expect(almonds?.status).toBe('in_pantry')

    const milk = items.find((i) => i.canonicalId === 'latte-vaccino')
    expect(milk?.status).toBe('to_buy')
  })

  it('groups items by category in canonical order', () => {
    const plan = createSeedWeeklyPlan()
    const items = buildAggregatedGroceryList({
      plan,
      dateKeys: ['2026-10-12'],
    })

    const grouped = groupGroceryByCategory(items)
    expect(grouped.length).toBeGreaterThan(0)
    // First categories should be carb or protein or dairy
    expect(['carb', 'protein', 'dairy']).toContain(grouped[0].category)
  })

  it('formats text export properly', () => {
    const plan = createSeedWeeklyPlan()
    const items = buildAggregatedGroceryList({
      plan,
      dateKeys: ['2026-10-12'],
    })

    const text = formatGroceryListAsText({
      aggregatedItems: items,
      rangeLabel: '12 Ottobre 2026',
    })

    expect(text).toContain('LISTA DELLA SPESA')
    expect(text).toContain('Latte')
  })

  it('skips planned ingredients of a meal replaced for that date', () => {
    const plan = createSeedWeeklyPlan()
    const dateKey = '2026-10-12' // Monday
    const mondayBreakfastIds = plan.monday.breakfast.ingredients.map((i) => i.canonicalId)
    expect(mondayBreakfastIds).toContain('latte-vaccino')

    const without = buildAggregatedGroceryList({ plan, dateKeys: [dateKey] })
    const replaced = buildAggregatedGroceryList({
      plan,
      dateKeys: [dateKey],
      dayProgressMap: {
        [dateKey]: {
          date: dateKey,
          completedMeals: { breakfast: false, morningSnack: false, lunch: false, afternoonSnack: false, dinner: false },
          completedAt: { breakfast: null, morningSnack: null, lunch: null, afternoonSnack: null, dinner: null },
          notes: '',
          replacements: { breakfast: { description: 'Cornetto', choGrams: 40, replacedAt: '2026-10-12T07:00:00Z' } },
        },
      },
    })

    expect(without.find((i) => i.canonicalId === 'latte-vaccino')).toBeDefined()
    expect(replaced.find((i) => i.canonicalId === 'latte-vaccino')).toBeUndefined()
  })
})
