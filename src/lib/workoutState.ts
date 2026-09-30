import type { ExerciseDef, ExerciseDayState, UserData } from '../types/plan'
import { getSetCount } from './planUtils'

export function getExerciseState(
  user: UserData,
  dateKey: string,
  ex: ExerciseDef,
  weekNumber: number,
): ExerciseDayState {
  const count = getSetCount(ex, weekNumber)
  const day = user.days[dateKey]
  const existing = day?.workout?.exercises?.[ex.id]
  if (existing && existing.sets.length === count) {
    return existing
  }

  let weight = ex.startWeightKg
  for (const dk of Object.keys(user.days).sort().reverse()) {
    if (dk >= dateKey) continue
    const w = user.days[dk]?.workout?.exercises?.[ex.id]?.weightKg
    if (w != null) {
      weight = w
      break
    }
  }

  const sets = Array.from({ length: count }, (_, i) =>
    existing?.sets?.[i] ? existing.sets[i] : { done: false },
  )

  return {
    weightKg: existing?.weightKg ?? weight,
    sets,
  }
}
