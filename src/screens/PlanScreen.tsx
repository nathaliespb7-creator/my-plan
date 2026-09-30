import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { plan } from '../lib/planUtils'

export function PlanScreen() {
  const {
    user,
    resetProgress,
    exportData,
    importData,
    setStartDateSetting,
  } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-8 pb-4">
      <header>
        <h1 className="text-2xl font-bold">План</h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
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
            <p className="text-base text-zinc-600">
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
          <div key={menu.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="text-lg font-medium">{menu.name}</h3>
            <p className="text-base text-zinc-600">
              ~{menu.totals.kcal} ккал · Б {menu.totals.protein} · Ж{' '}
              {menu.totals.fat} · У {menu.totals.carbs}
            </p>
            {menu.meals.map((meal) => (
              <div key={meal.name} className="mt-2">
                <p className="font-medium">
                  {meal.name} ({meal.time})
                </p>
                <ul className="text-base text-zinc-700 dark:text-zinc-300">
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
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <span className="font-medium">
                Недели {p.weeks[0]}
                {p.weeks.length > 1 ? `–${p.weeks[p.weeks.length - 1]}` : ''}:{' '}
                {p.name}
              </span>
              <p className="text-zinc-600 dark:text-zinc-400">{p.sets}</p>
            </li>
          ))}
        </ul>
        <p className="text-base">{plan.progressionRule}</p>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">Настройки</h2>
        <label className="block text-base">
          Дата старта плана
          <input
            type="date"
            className="mt-1 min-h-11 w-full rounded-lg border px-3 dark:border-zinc-600 dark:bg-zinc-950"
            value={user.startDate}
            onChange={(e) => setStartDateSetting(e.target.value)}
          />
        </label>

        <button
          type="button"
          className="min-h-11 w-full rounded-lg border border-zinc-300 text-base dark:border-zinc-600"
          onClick={() => exportData()}
        >
          Экспорт данных (JSON)
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) await importData(f)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          className="min-h-11 w-full rounded-lg border border-zinc-300 text-base dark:border-zinc-600"
          onClick={() => fileRef.current?.click()}
        >
          Импорт данных из файла
        </button>

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
              className="min-h-11 w-full rounded-lg border text-base"
              onClick={() => setConfirmReset(false)}
            >
              Отмена
            </button>
          </div>
        )}
      </section>

      <footer className="border-t border-zinc-200 pt-4 text-base text-zinc-500 dark:border-zinc-800">
        {plan.meta.note}
      </footer>
    </div>
  )
}
