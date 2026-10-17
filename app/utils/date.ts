import type { DayOfWeek } from '~/types/meal'
import { DAY_OF_WEEK_LABELS } from '~/types/meal'

/**
 * Formats a Date object to local YYYY-MM-DD without UTC timezone drift
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parses YYYY-MM-DD string into a local Date at midnight
 */
export function parseDateKey(key: string): Date {
  const parts = key.split('-')
  const year = parseInt(parts[0] || '1970', 10)
  const month = parseInt(parts[1] || '1', 10) - 1
  const day = parseInt(parts[2] || '1', 10)
  return new Date(year, month, day, 0, 0, 0, 0)
}

/**
 * Maps JS getDay() (0=Sun, 1=Mon, ..., 6=Sat) to DayOfWeek type
 */
export function getDayOfWeekFromDate(dateInput: Date | string): DayOfWeek {
  const date = typeof dateInput === 'string' ? parseDateKey(dateInput) : dateInput
  const dayIndex = date.getDay()
  const mapping: Record<number, DayOfWeek> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  }
  return mapping[dayIndex] ?? 'monday'
}

/**
 * Returns Monday of the week for a given date (Monday is considered day 1)
 */
export function getMondayOfWeek(dateInput: Date | string): Date {
  const date = typeof dateInput === 'string' ? parseDateKey(dateInput) : new Date(dateInput.getTime())
  const day = date.getDay() // 0 = Sun, 1 = Mon ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(date.getFullYear(), date.getMonth(), diff, 0, 0, 0, 0)
}

export interface WeekDayInfo {
  date: Date
  dateKey: string // YYYY-MM-DD
  dayOfWeek: DayOfWeek
  dayLabel: string
  dayOfMonth: number
  monthLabel: string
  isToday: boolean
}

function buildDayInfo(date: Date, todayKey: string): WeekDayInfo {
  const dateKey = formatDateKey(date)
  const dayOfWeek = getDayOfWeekFromDate(date)
  return {
    date,
    dateKey,
    dayOfWeek,
    dayLabel: DAY_OF_WEEK_LABELS[dayOfWeek],
    dayOfMonth: date.getDate(),
    monthLabel: date.toLocaleDateString('it-IT', { month: 'short' }),
    isToday: dateKey === todayKey,
  }
}

/**
 * Returns the 7 days of the week containing the reference date (from Monday to Sunday)
 */
export function getWeekDays(referenceDate: Date | string = new Date()): WeekDayInfo[] {
  const monday = getMondayOfWeek(referenceDate)
  const todayKey = formatDateKey(new Date())

  const days: WeekDayInfo[] = []
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 0, 0, 0, 0)
    days.push(buildDayInfo(current, todayKey))
  }
  return days
}

/**
 * Returns a rolling window of days around the reference date,
 * e.g. getDaysAround(today, 2, 4) = 2 past days, today, 4 future days
 */
export function getDaysAround(
  referenceDate: Date | string,
  daysBefore: number,
  daysAfter: number
): WeekDayInfo[] {
  const ref = typeof referenceDate === 'string' ? parseDateKey(referenceDate) : referenceDate
  const todayKey = formatDateKey(new Date())

  const days: WeekDayInfo[] = []
  for (let i = -daysBefore; i <= daysAfter; i++) {
    days.push(buildDayInfo(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + i, 0, 0, 0, 0), todayKey))
  }
  return days
}

/**
 * Formats a date into Italian readable format e.g. "Lunedì 13 Ottobre 2026"
 */
export function formatItalianDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? parseDateKey(dateInput) : dateInput
  const weekday = date.toLocaleDateString('it-IT', { weekday: 'long' })
  const day = date.getDate()
  const month = date.toLocaleDateString('it-IT', { month: 'long' })
  const year = date.getFullYear()

  // Capitalize first letter of weekday and month
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const capMonth = month.charAt(0).toUpperCase() + month.slice(1)

  return `${capWeekday} ${day} ${capMonth} ${year}`
}

/**
 * Formats week range label e.g. "12 - 18 Ottobre 2026" or "28 Settembre - 4 Ottobre 2026"
 */
export function formatWeekRange(startDateInput: Date | string, endDateInput: Date | string): string {
  const start = typeof startDateInput === 'string' ? parseDateKey(startDateInput) : startDateInput
  const end = typeof endDateInput === 'string' ? parseDateKey(endDateInput) : endDateInput

  const startDay = start.getDate()
  const endDay = end.getDate()
  const startMonth = start.toLocaleDateString('it-IT', { month: 'short' })
  const endMonth = end.toLocaleDateString('it-IT', { month: 'short' })
  const year = end.getFullYear()

  if (start.getMonth() === end.getMonth()) {
    const fullMonth = start.toLocaleDateString('it-IT', { month: 'long' })
    const capMonth = fullMonth.charAt(0).toUpperCase() + fullMonth.slice(1)
    return `${startDay} - ${endDay} ${capMonth} ${year}`
  }

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
}

/**
 * Shift a date by N days
 */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + deltaDays)
  return formatDateKey(date)
}

/**
 * Checks if a given date string or Date is today
 */
export function isDateToday(dateInput: Date | string): boolean {
  const targetKey = typeof dateInput === 'string' ? dateInput : formatDateKey(dateInput)
  return targetKey === formatDateKey(new Date())
}
