import type { DayState, DayTypeKey, UserData } from '../types/plan'
import {
  getDayType,
  getSetCount,
  getWeekNumber,
  plan,
} from './planUtils'

export type DayStatus = 'none' | 'partial' | 'done'

function workoutProgress(
  dayType: DayTypeKey,
  day: DayState | undefined,
  weekNumber: number,
): { done: number; total: number } {
  if (dayType !== 'A' && dayType !== 'B' && dayType !== 'C') {
    return { done: 0, total: 0 }
  }
  const workout = plan.workouts[dayType]
  const state = day?.workout
  let total = 2
  let done = (state?.warmupDone ? 1 : 0) + (state?.cooldownDone ? 1 : 0)
  for (const ex of workout.exercises) {
    const count = getSetCount(ex, weekNumber)
    total += count
    const sets = state?.exercises?.[ex.id]?.sets ?? []
    done += sets.filter((s) => s.done).length
  }
  if (state?.completed) {
    return { done: total, total }
  }
  return { done, total }
}

export function dayCompletionStatus(
  dateKey: string,
  user: UserData,
): DayStatus {
  const dayType = getDayType(dateKey)
  const weekNumber = getWeekNumber(user.startDate, dateKey)
  const day = user.days[dateKey]

  if (dayType === 'A' || dayType === 'B' || dayType === 'C') {
    const { done, total } = workoutProgress(dayType, day, weekNumber)
    if (total === 0) return 'none'
    if (day?.workout?.completed || done >= total) return 'done'
    if (done > 0) return 'partial'
    return 'none'
  }

  if (
    dayType === 'walk' ||
    dayType === 'walk_intervals' ||
    dayType === 'long_walk'
  ) {
    if (day?.walkDone) return 'done'
    if ((day?.walkMinutes ?? 0) > 0) return 'partial'
    return 'none'
  }

  if (dayType === 'rest') {
    const routine = plan.restDay.miniRoutine
    const doneCount = routine.filter((r) => day?.restRoutineDone?.[r.name]).length
    if (doneCount >= routine.length) return 'done'
    if (doneCount > 0) return 'partial'
    return 'none'
  }

  return 'none'
}

export function weekCompletionPercent(
  weekDateKeys: string[],
  user: UserData,
): number {
  const statuses = weekDateKeys.map((k) => dayCompletionStatus(k, user))
  const scorable = statuses.filter((s) => s !== 'none').length
  if (scorable === 0) return 0
  const done = statuses.filter((s) => s === 'done').length
  return Math.round((done / weekDateKeys.length) * 100)
}
