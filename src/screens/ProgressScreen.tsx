import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { getDayType, plan, toDateKey } from '../lib/planUtils'
import type { UserData } from '../types/plan'

const allExercises = ['A', 'B', 'C'].flatMap((k) =>
  plan.workouts[k as 'A' | 'B' | 'C'].exercises.map((e) => ({
    id: e.id,
    name: e.name,
  })),
)

function countCompletedWorkouts(user: UserData) {
  let n = 0
  for (const dk of Object.keys(user.days)) {
    const t = getDayType(dk)
    if (t === 'A' || t === 'B' || t === 'C') {
      if (user.days[dk]?.workout?.completed) n++
    }
  }
  return n
}

function streakWeeks(user: UserData): number {
  let streak = 0
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  for (let w = 0; w < 12; w++) {
    const weekStart = new Date(user.startDate)
    weekStart.setDate(weekStart.getDate() + w * 7)
    if (weekStart > today) break
    let hasStrength = false
    let allDone = true
    for (let d = 0; d < 7; d++) {
      const cur = new Date(weekStart)
      cur.setDate(weekStart.getDate() + d)
      if (cur > today) break
      const key = toDateKey(cur)
      const t = getDayType(key)
      if (t === 'A' || t === 'B' || t === 'C') {
        hasStrength = true
        if (!user.days[key]?.workout?.completed) allDone = false
      }
    }
    if (!hasStrength) continue
    if (allDone) streak++
    else break
  }
  return streak
}

export function ProgressScreen() {
  const { user, todayKey, setBodyWeightForDate } = useApp()
  const [exerciseId, setExerciseId] = useState(allExercises[0]?.id ?? 'a1')
  const [weightInput, setWeightInput] = useState('')

  const bodyChart = useMemo(
    () =>
      [...user.bodyWeights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => ({
          date: e.date.slice(5),
          kg: e.kg,
        })),
    [user.bodyWeights],
  )

  const exerciseChart = useMemo(() => {
    const points: { date: string; kg: number }[] = []
    for (const dk of Object.keys(user.days).sort()) {
      const w = user.days[dk]?.workout?.exercises?.[exerciseId]?.weightKg
      if (w != null) {
        points.push({ date: dk.slice(5), kg: w })
      }
    }
    return points
  }, [user.days, exerciseId])

  const sortedWeights = [...user.bodyWeights].sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  const firstWeight = sortedWeights[0]?.kg
  const lastWeight = sortedWeights[sortedWeights.length - 1]?.kg
  const delta =
    firstWeight != null && lastWeight != null
      ? (lastWeight - firstWeight).toFixed(1)
      : null

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Прогресс</h1>
        <p className="text-base text-ink-muted">
          Тренировок завершено: {countCompletedWorkouts(user)}
        </p>
        <p className="text-base text-ink-muted">
          Серия недель с силовыми: {streakWeeks(user)}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Вес тела</h2>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="кг"
            className="min-h-11 flex-1 rounded-lg border border-border bg-input-bg px-3 text-base text-ink"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <button
            type="button"
            className="min-h-11 rounded-lg bg-action px-4 text-base text-action-fg"
            onClick={() => {
              const kg = parseFloat(weightInput.replace(',', '.'))
              if (!kg) return
              setBodyWeightForDate(todayKey, kg)
              setWeightInput('')
            }}
          >
            Записать
          </button>
        </div>
        {delta != null && (
          <p className="text-base">Изменение от первой записи: {delta} кг</p>
        )}
        {bodyChart.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 16 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 16 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="oklch(0.42 0.14 264)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Вес упражнения</h2>
        <select
          className="min-h-11 w-full rounded-lg border border-border bg-input-bg px-3 text-base text-ink"
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
        >
          {allExercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {exerciseChart.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 16 }} />
                <YAxis tick={{ fontSize: 16 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="oklch(0.42 0.14 264)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-base text-ink-faint">
            Пока нет записей — отметьте тренировки на вкладке «Сегодня».
          </p>
        )}
      </section>
    </div>
  )
}
