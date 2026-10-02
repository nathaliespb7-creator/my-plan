import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { toDateKey } from '../lib/planUtils'

export function StartDateModal() {
  const { needsStartDate, setStartDate } = useApp()
  const [value, setValue] = useState(toDateKey(new Date()))

  if (!needsStartDate) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-ink">Дата старта плана</h2>
        <p className="mt-2 text-base text-ink-muted">
          Укажите, с какого дня считать недели 1–12. По умолчанию — сегодня.
        </p>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 min-h-11 w-full rounded-lg border border-border bg-input-bg px-3 text-base text-ink"
        />
        <button
          type="button"
          className="mt-4 min-h-11 w-full rounded-lg bg-action text-base font-medium text-action-fg"
          onClick={() => setStartDate(value)}
        >
          Начать
        </button>
      </div>
    </div>
  )
}
