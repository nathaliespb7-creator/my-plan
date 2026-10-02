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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-md">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-11 flex-1 py-3 text-base font-medium transition-colors ${
              tab === t.id ? 'text-action' : 'text-ink-faint'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
