import { dayCompletionStatus, type DayStatus } from './dayStatus'
import { getDayType, parseDateKey, toDateKey } from './planUtils'
import type { DayTypeKey, UserData } from '../types/plan'

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export interface MonthCell {
  dateKey: string | null
  day: number | null
}

/** Сетка месяца: понедельник — первый столбец, null — пустые ячейки. */
export function getMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const startOffset = (first.getDay() + 6) % 7
  const cells: MonthCell[] = []

  for (let i = 0; i < startOffset; i++) {
    cells.push({ dateKey: null, day: null })
  }
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day)
    cells.push({ dateKey: toDateKey(d), day })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null })
  }
  return cells
}

export interface MonthStats {
  strengthDone: number
  strengthPlanned: number
  walkDone: number
  walkPlanned: number
  restDone: number
  restPlanned: number
  daysDone: number
  daysPartial: number
  daysNone: number
  walkMinutesTotal: number
  stepsTotal: number
  mealsEaten: number
  waterTotalMl: number
  workoutsCompleted: number
}

function isWalk(type: DayTypeKey): boolean {
  return type === 'walk' || type === 'walk_intervals' || type === 'long_walk'
}

function isStrength(type: DayTypeKey): boolean {
  return type === 'A' || type === 'B' || type === 'C'
}

/** Итоги за календарный месяц (только дни плана: от startDate до сегодня включительно). */
export function computeMonthStats(
  user: UserData,
  year: number,
  month: number,
  todayKey: string,
): MonthStats {
  const stats: MonthStats = {
    strengthDone: 0,
    strengthPlanned: 0,
    walkDone: 0,
    walkPlanned: 0,
    restDone: 0,
    restPlanned: 0,
    daysDone: 0,
    daysPartial: 0,
    daysNone: 0,
    walkMinutesTotal: 0,
    stepsTotal: 0,
    mealsEaten: 0,
    waterTotalMl: 0,
    workoutsCompleted: 0,
  }

  const lastDay = new Date(year, month + 1, 0).getDate()
  const today = parseDateKey(todayKey)

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day)
    if (d > today) continue
    const dateKey = toDateKey(d)
    if (dateKey < user.startDate) continue

    const type = getDayType(dateKey)
    const status: DayStatus = dayCompletionStatus(dateKey, user)
    const dayState = user.days[dateKey]

    if (status === 'done') stats.daysDone++
    else if (status === 'partial') stats.daysPartial++
    else stats.daysNone++

    if (isStrength(type)) {
      stats.strengthPlanned++
      if (status === 'done') stats.strengthDone++
      if (dayState?.workout?.completed) stats.workoutsCompleted++
    }
    if (isWalk(type)) {
      stats.walkPlanned++
      if (status === 'done') stats.walkDone++
    }
    if (type === 'rest') {
      stats.restPlanned++
      if (status === 'done') stats.restDone++
    }

    stats.walkMinutesTotal += dayState?.walkMinutes ?? 0
    stats.stepsTotal += dayState?.steps ?? 0
    stats.waterTotalMl += dayState?.waterMl ?? 0

    const eaten = dayState?.meals?.eaten ?? {}
    stats.mealsEaten += Object.values(eaten).filter(Boolean).length
  }

  return stats
}
