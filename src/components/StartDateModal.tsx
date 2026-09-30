import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { toDateKey } from '../lib/planUtils'

export function StartDateModal() {
  const { needsStartDate, setStartDate } = useApp()
  const [value, setValue] = useState(toDateKey(new Date()))

  if (!needsStartDate) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Дата старта плана</h2>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Укажите, с какого дня считать недели 1–12. По умолчанию — сегодня.
        </p>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 min-h-11 w-full rounded-lg border border-zinc-300 px-3 text-base dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button
          type="button"
          className="mt-4 min-h-11 w-full rounded-lg bg-emerald-600 text-base font-medium text-white"
          onClick={() => setStartDate(value)}
        >
          Начать
        </button>
      </div>
    </div>
  )
}
