import type { TabId } from '../types/plan'
import { useApp } from '../context/AppContext'

const tabs: { id: TabId; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'progress', label: 'Прогресс' },
  { id: 'plan', label: 'План' },
]

export function BottomNav() {
  const { tab, setTab } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-md">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-11 flex-1 py-3 text-base font-medium transition-colors ${
              tab === t.id
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
