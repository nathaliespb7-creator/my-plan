import { useMemo, useState } from 'react'
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
  computeMonthStats,
  getMonthGrid,
  monthLabel,
  shiftMonth,
} from '../lib/calendar'
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

const CHART_DONE = 'oklch(0.52 0.09 158)'
const CHART_PLAN = 'oklch(0.72 0.03 264)'

function dayIcon(type: DayTypeKey): string {
  if (type === 'A' || type === 'B' || type === 'C') return '🏋'
  if (type === 'walk' || type === 'walk_intervals' || type === 'long_walk')
    return '🚶'
  return '🛌'
}

function statusDot(status: ReturnType<typeof dayCompletionStatus>): string {
  if (status === 'done') return 'bg-done'
  if (status === 'partial') return 'bg-amber-400'
  return 'bg-border'
}

function cellRing(dateKey: string, todayKey: string): string {
  return dateKey === todayKey ? 'ring-2 ring-action ring-offset-1 ring-offset-paper' : ''
}

export function WeekScreen() {
  const { user, todayKey } = useApp()
  const today = parseDateKey(todayKey)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const weekDates = getWeekDatesAround(todayKey)
  const weekNum = getWeekNumber(user.startDate, todayKey)
  const pct = weekCompletionPercent(weekDates, user)

  const monthGrid = useMemo(() => getMonthGrid(year, month), [year, month])
  const monthStats = useMemo(
    () => computeMonthStats(user, year, month, todayKey),
    [user, year, month, todayKey],
  )

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

  const goMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta)
    setYear(next.year)
    setMonth(next.month)
  }

  const monthDaysTotal =
    monthStats.daysDone + monthStats.daysPartial + monthStats.daysNone
  const monthDonePct =
    monthDaysTotal > 0
      ? Math.round((monthStats.daysDone / monthDaysTotal) * 100)
      : 0

  return (
    <div className="space-y-8 pb-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">Неделя {weekNum}</h1>
        <p className="text-lg text-ink-muted">Выполнено: {pct}%</p>
      </header>

      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((dk, i) => {
          const type = getDayType(dk)
          const status = dayCompletionStatus(dk, user)
          const d = parseDateKey(dk)
          return (
            <div
              key={dk}
              className={`flex flex-col items-center rounded-lg border border-border bg-surface p-2 text-center ${cellRing(dk, todayKey)}`}
            >
              <span className="text-base text-ink-faint">{dayLabels[i]}</span>
              <span className="text-lg text-ink">{d.getDate()}</span>
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
        <h2 className="mb-3 text-xl font-semibold text-ink">График этой недели</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 16 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 16 }} />
              <Tooltip />
              <Bar dataKey="done" name="Сделано" fill={CHART_DONE} />
              <Bar dataKey="plan" name="План" fill={CHART_PLAN} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-base text-ink-muted">
          Силовые: {strengthDone} из {strengthTotal} · Ходьба: {walkDone} из{' '}
          {walkTotal}
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-muted text-lg text-ink"
            onClick={() => goMonth(-1)}
            aria-label="Предыдущий месяц"
          >
            ‹
          </button>
          <h2 className="text-center text-xl font-semibold capitalize text-ink">
            {monthLabel(year, month)}
          </h2>
          <button
            type="button"
            className="flex h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-muted text-lg text-ink"
            onClick={() => goMonth(1)}
            aria-label="Следующий месяц"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-base text-ink-faint">
          {dayLabels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((cell, idx) => {
            if (!cell.dateKey) {
              return <div key={`e-${idx}`} className="min-h-[3.25rem]" />
            }
            const type = getDayType(cell.dateKey)
            const status = dayCompletionStatus(cell.dateKey, user)
            const isFuture = cell.dateKey > todayKey
            const beforePlan = cell.dateKey < user.startDate
            return (
              <div
                key={cell.dateKey}
                title={`${dayTypeLabel(type)}${isFuture ? ' (ещё впереди)' : ''}`}
                className={`flex min-h-[3.25rem] flex-col items-center justify-center rounded-lg border border-border p-1 text-center ${
                  beforePlan
                    ? 'opacity-30'
                    : isFuture
                      ? 'bg-muted/50'
                      : 'bg-muted'
                } ${cellRing(cell.dateKey, todayKey)}`}
              >
                <span className="text-base font-medium text-ink">{cell.day}</span>
                <span className="text-base leading-none">{dayIcon(type)}</span>
                {!beforePlan && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${statusDot(isFuture ? 'none' : status)}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          className="min-h-11 w-full rounded-lg border border-border text-base text-ink"
          onClick={() => {
            setYear(today.getFullYear())
            setMonth(today.getMonth())
          }}
        >
          Вернуться к текущему месяцу
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-xl font-semibold text-ink">
          Итоги за {monthLabel(year, month)}
        </h2>
        <p className="text-base text-ink-muted">
          Дней полностью выполнено: {monthStats.daysDone} · частично:{' '}
          {monthStats.daysPartial} · без отметок: {monthStats.daysNone}
          {monthStats.daysDone + monthStats.daysPartial + monthStats.daysNone > 0
            ? ` (${monthDonePct}% полностью)`
            : ''}
        </p>
        <ul className="space-y-2 text-base text-ink">
          <li>
            Силовые: {monthStats.strengthDone} из {monthStats.strengthPlanned}{' '}
            (завершено тренировок: {monthStats.workoutsCompleted})
          </li>
          <li>
            Ходьба: {monthStats.walkDone} из {monthStats.walkPlanned}
          </li>
          <li>
            Отдых (рутина): {monthStats.restDone} из {monthStats.restPlanned}
          </li>
          <li>Минут ходьбы (записано): {monthStats.walkMinutesTotal}</li>
          <li>Шагов (сумма за месяц): {monthStats.stepsTotal.toLocaleString('ru-RU')}</li>
          <li>
            Приёмов пищи отмечено «съела»: {monthStats.mealsEaten}
          </li>
          <li>
            Вода: {Math.round(monthStats.waterTotalMl / 100) / 10} л (сумма по
            дням)
          </li>
        </ul>
        <p className="text-base text-ink-faint">
          Считаются только дни с даты старта плана и не позже сегодня. Будущие
          дни в календаре показаны без отметок.
        </p>
      </section>
    </div>
  )
}
