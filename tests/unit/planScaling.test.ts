import { describe, it, expect } from 'vitest'
import { createSeedWeeklyPlan } from '../../app/data/seedMenu'
import { scalePlanToTarget, roundPortion, updateDescriptionAmount, MAX_FACTOR } from '../../app/utils/planScaling'
import { calculateDayKcal } from '../../app/utils/nutrition'

describe('plan scaling', () => {
  it('rounds portions to 5 g (small) or 10 g', () => {
    expect(roundPortion(42)).toBe(40)
    expect(roundPortion(73)).toBe(70)
    expect(roundPortion(2)).toBe(5)
  })

  it('updates amounts inside descriptions', () => {
    expect(updateDescriptionAmount('90 g pasta, 100 g tonno', 90, 75, 'g')).toBe('75 g pasta, 100 g tonno')
    expect(updateDescriptionAmount('200 ml latte', 200, 180, 'ml')).toBe('180 ml latte')
    // "190 g" must not match "90 g"
    expect(updateDescriptionAmount('190 g riso', 90, 75, 'g')).toBe('190 g riso')
  })

  it('brings every day close to the target without touching the original plan', () => {
    const plan = createSeedWeeklyPlan()
    const original = JSON.stringify(plan)
    const target = 1700
    const { plan: scaled, days } = scalePlanToTarget(plan, target)

    expect(JSON.stringify(plan)).toBe(original)
    for (const day of days) {
      if (!day.clamped) expect(Math.abs(day.afterKcal - target)).toBeLessThanOrEqual(120)
      expect(day.afterKcal).toBe(calculateDayKcal({ dayPlan: scaled[day.dayOfWeek] }).totalKcal)
    }
  })

  it('keeps vegetables, q.b. and pieces unchanged and respects the factor limit', () => {
    const plan = createSeedWeeklyPlan()
    const { plan: scaled, days } = scalePlanToTarget(plan, 5000)
    for (const day of days) expect(day.factor).toBeLessThanOrEqual(MAX_FACTOR)

    const before = plan.monday.morningSnack.ingredients.find((i) => i.canonicalId === 'mela')!
    const after = scaled.monday.morningSnack.ingredients.find((i) => i.canonicalId === 'mela')!
    expect(after.quantity).toBe(before.quantity)

    const pastaBefore = plan.monday.lunch.ingredients.find((i) => i.unit === 'g' && i.category === 'carb')
    const pastaAfter = scaled.monday.lunch.ingredients.find((i) => i.id === pastaBefore?.id)
    if (pastaBefore && pastaAfter) expect(pastaAfter.quantity!).toBeGreaterThan(pastaBefore.quantity!)
  })
})
