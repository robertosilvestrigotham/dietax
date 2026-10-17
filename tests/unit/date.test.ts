import { describe, it, expect } from 'vitest'
import {
  formatDateKey,
  parseDateKey,
  getDayOfWeekFromDate,
  getMondayOfWeek,
  getWeekDays,
  formatItalianDate,
  shiftDateKey,
} from '../../app/utils/date'

describe('date utils', () => {
  it('formats and parses date keys consistently without UTC drift', () => {
    const d = new Date(2026, 9, 13) // 13 October 2026
    const key = formatDateKey(d)
    expect(key).toBe('2026-10-13')

    const parsed = parseDateKey('2026-10-13')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(9)
    expect(parsed.getDate()).toBe(13)
  })

  it('correctly maps day of week', () => {
    // 2026-10-12 is Monday
    expect(getDayOfWeekFromDate('2026-10-12')).toBe('monday')
    // 2026-10-13 is Tuesday
    expect(getDayOfWeekFromDate('2026-10-13')).toBe('tuesday')
    // 2026-10-18 is Sunday
    expect(getDayOfWeekFromDate('2026-10-18')).toBe('sunday')
  })

  it('calculates Monday of the week properly for any day including Sunday', () => {
    // For Wednesday 2026-10-14, Monday should be 2026-10-12
    const monday = getMondayOfWeek(new Date(2026, 9, 14))
    expect(formatDateKey(monday)).toBe('2026-10-12')

    // For Sunday 2026-10-18, Monday should still be 2026-10-12
    const mondayFromSun = getMondayOfWeek(new Date(2026, 9, 18))
    expect(formatDateKey(mondayFromSun)).toBe('2026-10-12')
  })

  it('returns all 7 days of the week', () => {
    const days = getWeekDays('2026-10-14')
    expect(days).toHaveLength(7)
    expect(days[0].dayOfWeek).toBe('monday')
    expect(days[0].dateKey).toBe('2026-10-12')
    expect(days[6].dayOfWeek).toBe('sunday')
    expect(days[6].dateKey).toBe('2026-10-18')
  })

  it('formats Italian readable date with capital first letters', () => {
    const formatted = formatItalianDate('2026-10-13')
    expect(formatted.toLowerCase()).toContain('martedì')
    expect(formatted.toLowerCase()).toContain('ottobre')
    expect(formatted).toContain('2026')
  })

  it('shifts date key by positive or negative days', () => {
    expect(shiftDateKey('2026-10-13', 1)).toBe('2026-10-14')
    expect(shiftDateKey('2026-10-13', -1)).toBe('2026-10-12')
    expect(shiftDateKey('2026-10-01', -1)).toBe('2026-09-30')
  })
})
