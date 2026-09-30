import planData from '../data/plan-data.json'
import type {
  DayTypeKey,
  ExerciseDef,
  PlanData,
  WeekdayKey,
} from '../types/plan'

export const plan = planData as unknown as PlanData

const WEEKDAY_KEYS: WeekdayKey[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
]

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(start: string, end: string): number {
  const a = parseDateKey(start)
  const b = parseDateKey(end)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function getWeekNumber(startDate: string, dateKey: string): number {
  const diff = daysBetween(startDate, dateKey)
  const week = Math.floor(diff / 7) + 1
  return Math.min(Math.max(week, 1), 12)
}

export function getWeekdayKey(dateKey: string): WeekdayKey {
  const d = parseDateKey(dateKey)
  return WEEKDAY_KEYS[d.getDay()]
}

export function getDayType(dateKey: string): DayTypeKey {
  const key = getWeekdayKey(dateKey)
  return plan.weekSchedule[key]
}

export function isDeloadWeek(weekNumber: number): boolean {
  return weekNumber === 6 || weekNumber === 12
}

export function getSetCount(exercise: ExerciseDef, weekNumber: number): number {
  let count =
    weekNumber >= 1 && weekNumber <= 3
      ? exercise.setsWeeks1to3
      : exercise.sets
  if (isDeloadWeek(weekNumber)) {
    count = Math.ceil(count / 2)
  }
  return count
}

export function defaultMenuIdForDate(startDate: string, dateKey: string): string {
  const dayIndex = daysBetween(startDate, dateKey)
  const idx = ((dayIndex % 3) + 3) % 3
  return plan.menus[idx]?.id ?? 'menu1'
}

export function getMenuById(menuId: string) {
  return plan.menus.find((m) => m.id === menuId) ?? plan.menus[0]
}

export function dayTypeLabel(type: DayTypeKey): string {
  if (type === 'A' || type === 'B' || type === 'C') {
    return plan.workouts[type].title
  }
  const w = plan.walking as Record<
    string,
    { title?: string } | undefined
  >
  if (type === 'walk') return w.walk?.title ?? 'Ходьба'
  if (type === 'walk_intervals') return w.walk_intervals?.title ?? 'Ходьба с интервалами'
  if (type === 'long_walk') return w.long_walk?.title ?? 'Длинная прогулка'
  return plan.restDay.title
}

export function formatRuDate(dateKey: string): string {
  const d = parseDateKey(dateKey)
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function getWeekDatesAround(dateKey: string): string[] {
  const d = parseDateKey(dateKey)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  const keys: string[] = []
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday)
    cur.setDate(monday.getDate() + i)
    keys.push(toDateKey(cur))
  }
  return keys
}

export function googleImagesUrl(query: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
}

export function walkingConfig(type: DayTypeKey) {
  const w = plan.walking as Record<string, {
    title: string
    minutes: [number, number]
    intensity?: string
    intervals?: { rounds: number; fastMin: number; easyMin: number }
  }>
  if (type === 'walk') return w.walk
  if (type === 'walk_intervals') return w.walk_intervals
  if (type === 'long_walk') return w.long_walk
  return null
}

export function stepsGoal(): [number, number] {
  const g = (plan.walking as { dailyStepsGoal: [number, number] }).dailyStepsGoal
  return g
}
