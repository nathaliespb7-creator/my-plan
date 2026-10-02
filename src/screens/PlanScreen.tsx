import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { plan } from '../lib/planUtils'
import { formatBackupDate } from '../lib/storage'

export function PlanScreen() {
  const {
    user,
    resetProgress,
    saveCopy,
    importData,
    setStartDateSetting,
  } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [savingCopy, setSavingCopy] = useState(false)

  return (
    <div className="space-y-8 pb-4">
      <header>
        <h1 className="text-2xl font-bold">План</h1>
        <p className="text-base text-ink-muted">
          Только просмотр. Все данные из вашего файла плана.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
          Остановите упражнение, если…
        </h2>
        <ul className="space-y-1 text-base text-red-800 dark:text-red-300">
          {plan.stopRules.map((rule) => (
            <li key={rule}>• {rule}</li>
          ))}
        </ul>
      </section>

      {(['A', 'B', 'C'] as const).map((key) => {
        const w = plan.workouts[key]
        const main = w.exercises.filter((e) => e.block === 'main')
        const core = w.exercises.filter((e) => e.block === 'core')
        return (
          <section key={key} className="space-y-2">
            <h2 className="text-xl font-semibold">{w.title}</h2>
            <p className="text-base text-ink-muted">
              {w.durationMin} мин · разминка и заминка в приложении «Сегодня»
            </p>
            <ul className="list-inside list-disc space-y-1 text-base">
              {main.map((e) => (
                <li key={e.id}>
                  {e.name} — {e.reps} повт., {e.startWeightText}
                </li>
              ))}
            </ul>
            <p className="text-base font-medium">Поясничный каркас</p>
            <ul className="list-inside list-disc space-y-1 text-base">
              {core.map((e) => (
                <li key={e.id}>
                  {e.name} — {e.reps}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Меню</h2>
        {plan.menus.map((menu) => (
          <div key={menu.id} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-lg font-medium">{menu.name}</h3>
            <p className="text-base text-ink-muted">
              ~{menu.totals.kcal} ккал · Б {menu.totals.protein} · Ж{' '}
              {menu.totals.fat} · У {menu.totals.carbs}
            </p>
            {menu.meals.map((meal) => (
              <div key={meal.name} className="mt-2">
                <p className="font-medium">
                  {meal.name} ({meal.time})
                </p>
                <ul className="text-base text-ink-muted">
                  {meal.items.map((it, i) => (
                    <li key={i}>
                      {it.label} — {it.grams} г
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Прогрессия по неделям</h2>
        <ul className="space-y-2 text-base">
          {plan.progression.map((p) => (
            <li
              key={p.name}
              className="rounded-lg border border-border bg-surface p-3"
            >
              <span className="font-medium">
                Недели {p.weeks[0]}
                {p.weeks.length > 1 ? `–${p.weeks[p.weeks.length - 1]}` : ''}:{' '}
                {p.name}
              </span>
              <p className="text-ink-muted">{p.sets}</p>
            </li>
          ))}
        </ul>
        <p className="text-base">{plan.progressionRule}</p>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-xl font-semibold">Настройки</h2>

        <button
          type="button"
          className="min-h-12 w-full rounded-xl bg-action px-4 text-lg font-semibold text-action-fg disabled:opacity-50"
          disabled={savingCopy}
          onClick={async () => {
            setSavingCopy(true)
            try {
              await saveCopy()
            } finally {
              setSavingCopy(false)
            }
          }}
        >
          Сохранить копию
        </button>
        <p className="text-base text-ink-muted">
          {user.lastBackupAt
            ? `Последняя копия: ${formatBackupDate(user.lastBackupAt)}`
            : 'Копий ещё не было'}
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            setImportError(null)
            try {
              await importData(f)
            } catch (err) {
              setImportError(
                err instanceof Error
                  ? err.message
                  : 'Не удалось загрузить файл. Проверьте, что это копия из «Мой план».',
              )
            }
          }}
        />
        <button
          type="button"
          className="min-h-11 w-full rounded-lg border border-border bg-surface text-base text-ink"
          onClick={() => fileRef.current?.click()}
        >
          Загрузить копию
        </button>
        {importError && (
          <p className="text-base text-red-700 dark:text-red-400" role="alert">
            {importError}
          </p>
        )}

        <label className="block text-base">
          Дата старта плана
          <input
            type="date"
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-input-bg px-3 text-ink"
            value={user.startDate}
            onChange={(e) => setStartDateSetting(e.target.value)}
          />
        </label>

        {!confirmReset ? (
          <button
            type="button"
            className="min-h-11 w-full rounded-lg border border-red-300 text-base text-red-700 dark:border-red-800 dark:text-red-400"
            onClick={() => setConfirmReset(true)}
          >
            Сбросить прогресс
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-base text-red-700 dark:text-red-400">
              Удалить все отметки и веса? Это нельзя отменить.
            </p>
            <button
              type="button"
              className="min-h-11 w-full rounded-lg bg-red-600 text-base text-white"
              onClick={() => {
                resetProgress()
                setConfirmReset(false)
              }}
            >
              Да, сбросить
            </button>
            <button
              type="button"
              className="min-h-11 w-full rounded-lg border border-border bg-surface text-base text-ink"
              onClick={() => setConfirmReset(false)}
            >
              Отмена
            </button>
          </div>
        )}
      </section>

      <footer className="border-t border-border pt-4 text-base text-ink-faint">
        {plan.meta.note}
      </footer>
    </div>
  )
}
