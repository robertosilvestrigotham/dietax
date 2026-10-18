import type { ActivityLevel, BodyMeasurement, Lifestyle, Sex, UserProfile, WeightGoal, Workout, WorkoutType } from '~/types/meal'
import { formatDateKey, parseDateKey } from '~/utils/date'

// Estimates only: Mifflin-St Jeor + standard activity factors. Not a medical prescription.

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; hint: string; factor: number }> = {
  sedentary: { label: 'Sedentario', hint: 'Lavoro da seduto, poco movimento', factor: 1.2 },
  light: { label: 'Leggero', hint: 'Camminate o sport 1–3 volte a settimana', factor: 1.375 },
  moderate: { label: 'Moderato', hint: 'Sport 3–5 volte a settimana', factor: 1.55 },
  active: { label: 'Attivo', hint: 'Sport intenso 6–7 volte a settimana', factor: 1.725 },
  very_active: { label: 'Molto attivo', hint: 'Lavoro fisico o allenamenti quotidiani intensi', factor: 1.9 },
}

/** Daily movement without workouts (NEAT), as a multiplier of BMR */
export const LIFESTYLES: Record<Lifestyle, { label: string; hint: string; factor: number }> = {
  sedentary: { label: 'Seduto', hint: 'Ufficio, studio, auto', factor: 1.2 },
  standing: { label: 'In piedi', hint: 'Negozio, insegnamento, molti spostamenti a piedi', factor: 1.35 },
  physical: { label: 'Fisico', hint: 'Cantiere, magazzino, lavoro manuale', factor: 1.5 },
}

/**
 * Average MET for a moderate-vigorous session (Compendium of Physical Activities):
 * weight training ≈ 5, mixed cardio (running, cycling, swimming) ≈ 7.
 */
export const WORKOUT_TYPES: Record<WorkoutType, { label: string; met: number }> = {
  strength: { label: 'Forza', met: 5 },
  cardio: { label: 'Cardio', met: 7 },
}

/** Extra kcal of a session above rest (net MET, since rest is already in BMR) */
export function workoutKcal(type: WorkoutType, minutes: number, weightKg: number): number {
  return Math.round((WORKOUT_TYPES[type].met - 1) * weightKg * (minutes / 60))
}

export function weeklyWorkoutKcal(workouts: Workout[] | undefined, weightKg: number): number {
  return (workouts ?? []).reduce((sum, w) => sum + workoutKcal(w.type, w.minutes, weightKg), 0)
}

export const WEIGHT_GOALS: Record<WeightGoal, { label: string; hint: string }> = {
  lose: { label: 'Perdere peso', hint: 'Deficit moderato, circa 0,5 kg a settimana' },
  maintain: { label: 'Mantenere', hint: 'Calorie pari al fabbisogno' },
  gain: { label: 'Aumentare', hint: 'Leggero surplus' },
}

/** Days between two measurements before the app asks for an update */
export const MEASUREMENT_INTERVAL_DAYS = 14

const MIN_KCAL: Record<Sex, number> = { female: 1200, male: 1500 }

export function ageFromBirthYear(birthYear: number, today = new Date()): number {
  return today.getFullYear() - birthYear
}

export function latestMeasurement(profile: UserProfile | null | undefined): BodyMeasurement | undefined {
  return profile?.measurements[profile.measurements.length - 1]
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Sottopeso'
  if (bmi < 25) return 'Normopeso'
  if (bmi < 30) return 'Sovrappeso'
  return 'Obesità'
}

/** Waist-to-height ratio: above 0.5 indicates increased cardiometabolic risk */
export function waistToHeight(waistCm: number, heightCm: number): number {
  return Math.round((waistCm / heightCm) * 100) / 100
}

/** Basal metabolic rate (Mifflin-St Jeor) */
export function calculateBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

/** Total daily energy expenditure */
export function calculateTdee(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_LEVELS[activity].factor)
}

/**
 * Daily calorie target for the goal, rounded to 50 kcal:
 * lose = -20% (max -500), gain = +10% (max +300), never below BMR or a safe minimum.
 */
export function calculateTargetKcal(sex: Sex, bmr: number, tdee: number, goal: WeightGoal): number {
  let target = tdee
  if (goal === 'lose') target = tdee - Math.min(500, tdee * 0.2)
  if (goal === 'gain') target = tdee + Math.min(300, tdee * 0.1)
  // The floor is rounded up so rounding never takes the target below BMR / the safe minimum
  const floor = Math.ceil(Math.max(bmr, MIN_KCAL[sex]) / 50) * 50
  return Math.max(Math.round(target / 50) * 50, floor)
}

export interface ProfileSummary {
  age: number
  weightKg: number
  bmi: number
  bmiLabel: string
  waistToHeight?: number
  bmr: number
  dailyLifeKcal: number // BMR × lifestyle (or the legacy activity factor)
  workoutKcalPerDay: number // weekly workouts spread over 7 days
  tdee: number
  targetKcal: number
}

export function summarizeProfile(profile: UserProfile, today = new Date()): ProfileSummary | null {
  const current = latestMeasurement(profile)
  if (!current) return null
  const age = ageFromBirthYear(profile.birthYear, today)
  const bmr = calculateBmr(profile.sex, current.weightKg, profile.heightCm, age)
  let dailyLifeKcal: number
  let workoutKcalPerDay = 0
  if (profile.lifestyle) {
    dailyLifeKcal = Math.round(bmr * LIFESTYLES[profile.lifestyle].factor)
    workoutKcalPerDay = Math.round(weeklyWorkoutKcal(profile.workouts, current.weightKg) / 7)
  } else {
    dailyLifeKcal = calculateTdee(bmr, profile.activity ?? 'sedentary')
  }
  const tdee = dailyLifeKcal + workoutKcalPerDay
  const bmi = calculateBmi(current.weightKg, profile.heightCm)
  return {
    age,
    weightKg: current.weightKg,
    bmi,
    bmiLabel: bmiLabel(bmi),
    waistToHeight: current.waistCm ? waistToHeight(current.waistCm, profile.heightCm) : undefined,
    bmr,
    dailyLifeKcal,
    workoutKcalPerDay,
    tdee,
    targetKcal: calculateTargetKcal(profile.sex, bmr, tdee, profile.goal),
  }
}

export function daysSinceLastMeasurement(profile: UserProfile | null | undefined, today = new Date()): number | null {
  const current = latestMeasurement(profile)
  if (!current) return null
  const ms = parseDateKey(formatDateKey(today)).getTime() - parseDateKey(current.date).getTime()
  return Math.round(ms / 86_400_000)
}

export function isMeasurementDue(profile: UserProfile | null | undefined, today = new Date()): boolean {
  const days = daysSinceLastMeasurement(profile, today)
  return days !== null && days >= MEASUREMENT_INTERVAL_DAYS
}

/**
 * Calendar file (.ics) with a reminder every 2 weeks, starting 2 weeks after `from`.
 * Works with Apple/Google Calendar, no server or push notifications needed.
 */
export function buildMeasurementReminderIcs(appUrl: string, from = new Date()): string {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate() + MEASUREMENT_INTERVAL_DAYS)
  const ymd = formatDateKey(start).replace(/-/g, '')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DietaX//IT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:dietax-misure-${ymd}@dietax`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${ymd}T080000`,
    `DTEND:${ymd}T081500`,
    `RRULE:FREQ=WEEKLY;INTERVAL=${MEASUREMENT_INTERVAL_DAYS / 7}`,
    'SUMMARY:DietaX · Aggiorna peso e misure',
    `DESCRIPTION:Apri DietaX e aggiorna peso e misure: ${appUrl}`,
    `URL:${appUrl}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Aggiorna peso e misure in DietaX',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
