import { describe, it, expect } from 'vitest'
import {
  calculateBmi,
  bmiLabel,
  calculateBmr,
  calculateTdee,
  calculateTargetKcal,
  summarizeProfile,
  isMeasurementDue,
  daysSinceLastMeasurement,
  buildMeasurementReminderIcs,
  workoutKcal,
  weeklyWorkoutKcal,
} from '../../app/utils/body'
import type { UserProfile } from '../../app/types/meal'

const profile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  sex: 'male',
  birthYear: 1986,
  heightCm: 180,
  activity: 'moderate',
  goal: 'lose',
  measurements: [{ date: '2026-10-01', weightKg: 80, waistCm: 90 }],
  autoKcalGoal: true,
  ...overrides,
})

describe('body / energy estimates', () => {
  it('computes BMI and its category', () => {
    expect(calculateBmi(80, 180)).toBe(24.7)
    expect(bmiLabel(24.7)).toBe('Normopeso')
    expect(bmiLabel(31)).toBe('Obesità')
  })

  it('computes BMR (Mifflin-St Jeor) and TDEE', () => {
    expect(calculateBmr('male', 80, 180, 40)).toBe(1730)
    expect(calculateBmr('female', 60, 165, 30)).toBe(1320)
    expect(calculateTdee(1730, 'moderate')).toBe(2682)
  })

  it('applies a capped deficit/surplus and never goes below BMR or the safe minimum', () => {
    // 2682 - 500 = 2182 → 2200
    expect(calculateTargetKcal('male', 1730, 2682, 'lose')).toBe(2200)
    expect(calculateTargetKcal('male', 1730, 2682, 'maintain')).toBe(2700)
    // 2682 + 268 = 2950
    expect(calculateTargetKcal('male', 1730, 2682, 'gain')).toBe(2950)
    // Female sedentary: 1584 - 317 = 1267 < BMR 1320 → floor rounded up to 1350
    expect(calculateTargetKcal('female', 1320, 1584, 'lose')).toBe(1350)
    // Very small BMR: never below 1200 kcal for women
    expect(calculateTargetKcal('female', 1000, 1200, 'lose')).toBe(1200)
  })

  it('summarizes the profile from the latest measurement', () => {
    const p = profile({
      measurements: [
        { date: '2026-09-01', weightKg: 85 },
        { date: '2026-10-01', weightKg: 80, waistCm: 90 },
      ],
    })
    const summary = summarizeProfile(p, new Date(2026, 9, 17))!
    expect(summary.age).toBe(40)
    expect(summary.weightKg).toBe(80)
    expect(summary.waistToHeight).toBe(0.5)
    expect(summary.targetKcal).toBe(2200)
  })

  it('flags measurements older than 2 weeks', () => {
    const p = profile()
    expect(daysSinceLastMeasurement(p, new Date(2026, 9, 14))).toBe(13)
    expect(isMeasurementDue(p, new Date(2026, 9, 14))).toBe(false)
    expect(isMeasurementDue(p, new Date(2026, 9, 15))).toBe(true)
    expect(isMeasurementDue(null)).toBe(false)
  })

  it('builds a calendar reminder repeating every 2 weeks', () => {
    const ics = buildMeasurementReminderIcs('https://example.com/dietax/', new Date(2026, 9, 17))
    expect(ics).toContain('DTSTART:20261031T080000')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })

  it('estimates workout calories with net METs (strength 5, cardio 7)', () => {
    expect(workoutKcal('strength', 60, 90)).toBe(360) // (5 - 1) * 90 kg * 1 h
    expect(workoutKcal('cardio', 45, 90)).toBe(405) // (7 - 1) * 90 * 0.75
    expect(
      weeklyWorkoutKcal(
        [
          { id: 'a', day: 'monday', type: 'strength', minutes: 60 },
          { id: 'b', day: 'wednesday', type: 'cardio', minutes: 45 },
        ],
        90
      )
    ).toBe(765)
  })

  it('builds the daily need from lifestyle plus weekly workouts', () => {
    const p = profile({
      birthYear: 1983,
      heightCm: 185,
      activity: undefined,
      lifestyle: 'sedentary',
      workouts: [
        { id: '1', day: 'monday', type: 'strength', minutes: 60 },
        { id: '2', day: 'wednesday', type: 'strength', minutes: 60 },
        { id: '3', day: 'friday', type: 'strength', minutes: 60 },
      ],
      measurements: [{ date: '2026-10-18', weightKg: 90 }],
    })
    const summary = summarizeProfile(p, new Date(2026, 9, 18))!
    expect(summary.bmr).toBe(1846)
    expect(summary.dailyLifeKcal).toBe(2215) // 1846 * 1.2
    expect(summary.workoutKcalPerDay).toBe(154) // 3 * 360 / 7
    expect(summary.tdee).toBe(2369)
    expect(summary.targetKcal).toBe(1900) // 2369 - 474, rounded to 50
  })
})
