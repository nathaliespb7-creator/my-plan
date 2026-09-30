import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { useApp } from '../context/AppContext'
import {
  dayCompletionStatus,
  weekCompletionPercent,
} from '../lib/dayStatus'
import {
  dayTypeLabel,
  getDayType,
  getWeekDatesAround,
  getWeekNumber,
  parseDateKey,
} from '../lib/planUtils'
import type { DayTypeKey } from '../types/plan'

const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function dayIcon(type: DayTypeKey): string {
  if (type === 'A' || type === 'B' || type === 'C') return '🏋'
  if (type === 'walk' || type === 'walk_intervals' || type === 'long_walk')
    return '🚶'
  return '🛌'
}

function statusDot(status: ReturnType<typeof dayCompletionStatus>): string {
  if (status === 'done') return 'bg-emerald-500'
  if (status === 'partial') return 'bg-amber-400'
  return 'bg-zinc-300 dark:bg-zinc-600'
}

export function WeekScreen() {
  const { user, todayKey } = useApp()
  const weekDates = getWeekDatesAround(todayKey)
  const weekNum = getWeekNumber(user.startDate, todayKey)
  const pct = weekCompletionPercent(weekDates, user)

  let strengthDone = 0
  let strengthTotal = 0
  let walkDone = 0
  let walkTotal = 0

  for (const dk of weekDates) {
    const t = getDayType(dk)
    const st = dayCompletionStatus(dk, user)
    if (t === 'A' || t === 'B' || t === 'C') {
      strengthTotal++
      if (st === 'done') strengthDone++
    }
    if (t === 'walk' || t === 'walk_intervals' || t === 'long_walk') {
      walkTotal++
      if (st === 'done') walkDone++
    }
  }

  const chartData = [
    { name: 'Силовые', done: strengthDone, plan: strengthTotal },
    { name: 'Ходьба', done: walkDone, plan: walkTotal },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Неделя {weekNum}</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Выполнено: {pct}%
        </p>
      </header>

      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((dk, i) => {
          const type = getDayType(dk)
          const status = dayCompletionStatus(dk, user)
          const d = parseDateKey(dk)
          return (
            <div
              key={dk}
              className="flex flex-col items-center rounded-lg border border-zinc-200 p-2 text-center dark:border-zinc-800"
            >
              <span className="text-sm text-zinc-500">{dayLabels[i]}</span>
              <span className="text-lg">{d.getDate()}</span>
              <span className="text-xl" title={dayTypeLabel(type)}>
                {dayIcon(type)}
              </span>
              <span
                className={`mt-1 h-2 w-2 rounded-full ${statusDot(status)}`}
              />
            </div>
          )
        })}
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Графики недели</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 14 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
              <Tooltip />
              <Bar dataKey="done" name="Сделано" fill="#059669" />
              <Bar dataKey="plan" name="План" fill="#a1a1aa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-base text-zinc-600">
          Силовые: {strengthDone} из {strengthTotal} · Ходьба: {walkDone} из{' '}
          {walkTotal}
        </p>
      </section>
    </div>
  )
}
