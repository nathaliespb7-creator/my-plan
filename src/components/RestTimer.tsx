import { useEffect, useRef, useState } from 'react'
import { playRestDoneBeep } from '../lib/restAudio'

interface RestTimerProps {
  seconds: number
  onDone: () => void
  onSkip: () => void
}

export function RestTimer({ seconds, onDone, onSkip }: RestTimerProps) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + seconds * 1000)
  const [left, setLeft] = useState(seconds)
  const finishedRef = useRef(false)

  useEffect(() => {
    finishedRef.current = false
    const end = Date.now() + seconds * 1000
    setEndsAt(end)
    setLeft(seconds)
  }, [seconds])

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining <= 0 && !finishedRef.current) {
        finishedRef.current = true
        playRestDoneBeep()
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        onDone()
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => clearInterval(id)
  }, [endsAt, onDone])

  return (
    <div className="rounded-xl border border-action-soft-border bg-action-soft p-4">
      <p className="text-lg font-semibold text-ink">Отдых: {left} сек</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="min-h-11 flex-1 rounded-lg bg-action px-4 text-base text-action-fg"
          onClick={() => setEndsAt((e) => e + 30_000)}
        >
          +30 сек
        </button>
        <button
          type="button"
          className="min-h-11 flex-1 rounded-lg border border-border bg-surface px-4 text-base text-ink"
          onClick={onSkip}
        >
          Пропустить
        </button>
      </div>
    </div>
  )
}
