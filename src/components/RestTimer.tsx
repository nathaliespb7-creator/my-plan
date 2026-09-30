import { useEffect, useState } from 'react'

interface RestTimerProps {
  seconds: number
  onDone: () => void
  onSkip: () => void
}

export function RestTimer({ seconds, onDone, onSkip }: RestTimerProps) {
  const [left, setLeft] = useState(seconds)
  const [extra, setExtra] = useState(0)

  useEffect(() => {
    setLeft(seconds + extra)
  }, [seconds, extra])

  useEffect(() => {
    if (left <= 0) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      onDone()
      return
    }
    const t = window.setTimeout(() => setLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [left, onDone])

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
      <p className="text-lg font-semibold">Отдых: {left} сек</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="min-h-11 flex-1 rounded-lg bg-emerald-600 px-4 text-base text-white"
          onClick={() => setExtra((e) => e + 30)}
        >
          +30 сек
        </button>
        <button
          type="button"
          className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-4 text-base dark:border-zinc-600"
          onClick={onSkip}
        >
          Пропустить
        </button>
      </div>
    </div>
  )
}
