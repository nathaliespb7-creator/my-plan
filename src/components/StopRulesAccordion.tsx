import { useState } from 'react'
import { plan } from '../lib/planUtils'

export function StopRulesAccordion() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between px-4 text-left text-base font-medium text-red-700 dark:text-red-400"
        onClick={() => setOpen((o) => !o)}
      >
        Остановите упражнение, если…
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <ul className="space-y-2 border-t border-red-100 px-4 py-3 text-base text-red-800 dark:border-red-900/30 dark:text-red-300">
          {plan.stopRules.map((rule) => (
            <li key={rule}>• {rule}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
