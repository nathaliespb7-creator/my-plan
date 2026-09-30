import { useEffect, useMemo, useState } from 'react'
import { RestTimer } from '../components/RestTimer'
import { StopRulesAccordion } from '../components/StopRulesAccordion'
import { useApp, useTodayMeals } from '../context/AppContext'
import { dayNutritionEaten, macrosForItem, resolveMealItem } from '../lib/nutrition'
import {
  dayTypeLabel,
  formatRuDate,
  getMenuById,
  googleImagesUrl,
  plan,
  walkingConfig,
  stepsGoal,
  getSetCount,
} from '../lib/planUtils'
import { getExerciseState } from '../lib/workoutState'
import type { ExerciseDef, ExerciseDayState, WorkoutDayState } from '../types/plan'

export function TodayScreen() {
  const {
    todayKey,
    weekNumber,
    dayType,
    user,
    getDay,
    updateDay,
  } = useApp()
  const day = getDay(todayKey)
  const { menuId, ensureMeals } = useTodayMeals(todayKey)
  const [restTimer, setRestTimer] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    ensureMeals()
  }, [ensureMeals])

  const menu = getMenuById(day.meals?.menuId ?? menuId)
  const eaten = day.meals?.eaten ?? {}
  const swaps = day.meals?.swaps ?? {}
  const nutrition = dayNutritionEaten(menu.meals, eaten, swaps)
  const targets = plan.targets
  const waterMl = day.waterMl ?? 0
  const steps = day.steps ?? 0
  const [goalStepsMin, goalStepsMax] = stepsGoal()

  const workout =
    dayType === 'A' || dayType === 'B' || dayType === 'C'
      ? plan.workouts[dayType]
      : null

  const mainExercises = workout?.exercises.filter((e) => e.block === 'main') ?? []
  const coreExercises = workout?.exercises.filter((e) => e.block === 'core') ?? []

  const baseWorkout = (): WorkoutDayState => ({
    warmupDone: day.workout?.warmupDone ?? false,
    cooldownDone: day.workout?.cooldownDone ?? false,
    completed: day.workout?.completed ?? false,
    exercises: { ...(day.workout?.exercises ?? {}) },
  })

  const saveExercise = (exId: string, state: ExerciseDayState) => {
    const w = baseWorkout()
    w.exercises[exId] = state
    updateDay(todayKey, { workout: w })
  }

  const workoutStats = useMemo(() => {
    if (!workout) return { done: 0, total: 0 }
    let done = 0
    for (const ex of workout.exercises) {
      const count = getSetCount(ex, weekNumber)
      const sets = getExerciseState(user, todayKey, ex, weekNumber).sets
      if (sets.filter((s) => s.done).length >= count) done++
    }
    return { done, total: workout.exercises.length }
  }, [workout, user, todayKey, weekNumber])

  const toggleSet = (ex: ExerciseDef, setIndex: number) => {
    const state = getExerciseState(user, todayKey, ex, weekNumber)
    const sets = [...state.sets]
    const wasDone = sets[setIndex]?.done
    sets[setIndex] = { ...sets[setIndex], done: !wasDone }
    saveExercise(ex.id, { ...state, sets })
    if (!wasDone) {
      setRestTimer(true)
      if (sets.every((s) => s.done)) {
        setCollapsed((c) => ({ ...c, [ex.id]: true }))
      }
    }
  }

  const updateWeight = (ex: ExerciseDef, delta: number) => {
    const state = getExerciseState(user, todayKey, ex, weekNumber)
    saveExercise(ex.id, {
      ...state,
      weightKg: Math.max(0, state.weightKg + delta),
    })
  }

  const updateSetReps = (ex: ExerciseDef, setIndex: number, reps: number) => {
    const state = getExerciseState(user, todayKey, ex, weekNumber)
    const sets = [...state.sets]
    sets[setIndex] = { ...sets[setIndex], reps }
    saveExercise(ex.id, { ...state, sets })
  }

  const renderExercise = (ex: ExerciseDef) => {
    const state = getExerciseState(user, todayKey, ex, weekNumber)
    const count = getSetCount(ex, weekNumber)
    const allDone = state.sets.every((s) => s.done)
    const isCollapsed = collapsed[ex.id] && allDone

    if (isCollapsed) {
      return (
        <div
          key={ex.id}
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30"
        >
          <button
            type="button"
            className="min-h-11 w-full text-left text-base font-medium text-emerald-800 dark:text-emerald-300"
            onClick={() => setCollapsed((c) => ({ ...c, [ex.id]: false }))}
          >
            ✓ {ex.name}
          </button>
        </div>
      )
    }

    return (
      <div
        key={ex.id}
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h4 className="text-lg font-semibold">{ex.name}</h4>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          {count}×{ex.reps} · {ex.startWeightText}
        </p>
        <p className="mt-1 text-base italic text-zinc-500">{ex.cue}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-base">Вес, кг:</span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border text-xl"
            onClick={() => updateWeight(ex, -1)}
          >
            −
          </button>
          <span className="min-w-10 text-center text-lg font-medium">
            {state.weightKg}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border text-xl"
            onClick={() => updateWeight(ex, 1)}
          >
            +
          </button>
          <a
            href={googleImagesUrl(ex.imageQuery)}
            target="_blank"
            rel="noreferrer"
            className="min-h-11 rounded-lg bg-zinc-100 px-3 py-2 text-base dark:bg-zinc-800"
          >
            Как делать
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {state.sets.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleSet(ex, i)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-base font-medium ${
                s.done
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-zinc-300 dark:border-zinc-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {state.sets.map((s, i) => (
            <label key={i} className="flex items-center gap-2 text-base">
              <span className="w-24">Повторы {i + 1}:</span>
              <input
                type="number"
                min={0}
                className="min-h-11 w-24 rounded-lg border px-2 dark:border-zinc-600 dark:bg-zinc-950"
                value={s.reps ?? ''}
                placeholder="—"
                onChange={(e) =>
                  updateSetReps(ex, i, Number(e.target.value) || 0)
                }
              />
            </label>
          ))}
        </div>
      </div>
    )
  }

  const walkCfg = walkingConfig(dayType)

  return (
    <div className="space-y-6 pb-4">
      <header>
        <p className="text-base capitalize text-zinc-600 dark:text-zinc-400">
          {formatRuDate(todayKey)}
        </p>
        <h1 className="text-2xl font-bold">Неделя {weekNumber} из 12</h1>
        <p className="text-lg text-emerald-700 dark:text-emerald-400">
          {dayTypeLabel(dayType)}
        </p>
      </header>

      {workout && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Тренировка</h2>
          <StopRulesAccordion />
          <label className="flex min-h-11 items-start gap-3 text-base">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={day.workout?.warmupDone ?? false}
              onChange={(e) =>
                updateDay(todayKey, {
                  workout: { ...baseWorkout(), warmupDone: e.target.checked },
                })
              }
            />
            Разминка: {workout.warmup}
          </label>

          {restTimer && (
            <RestTimer
              seconds={60}
              onDone={() => setRestTimer(false)}
              onSkip={() => setRestTimer(false)}
            />
          )}

          <div className="space-y-3">{mainExercises.map(renderExercise)}</div>
          <h3 className="text-lg font-semibold">Поясничный каркас</h3>
          <div className="space-y-3">{coreExercises.map(renderExercise)}</div>

          <label className="flex min-h-11 items-start gap-3 text-base">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={day.workout?.cooldownDone ?? false}
              onChange={(e) =>
                updateDay(todayKey, {
                  workout: { ...baseWorkout(), cooldownDone: e.target.checked },
                })
              }
            />
            Заминка: {workout.cooldown}
          </label>

          <p className="text-base text-zinc-600">
            Упражнений выполнено: {workoutStats.done} из {workoutStats.total}
          </p>
          <button
            type="button"
            className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-base font-medium text-white disabled:opacity-40"
            disabled={
              workoutStats.done < workoutStats.total &&
              !day.workout?.completed
            }
            onClick={() =>
              updateDay(todayKey, {
                workout: { ...baseWorkout(), completed: true },
              })
            }
          >
            {day.workout?.completed
              ? 'Тренировка завершена ✓'
              : 'Тренировка завершена'}
          </button>
          <button
            type="button"
            className="min-h-11 w-full rounded-xl border border-zinc-300 text-base dark:border-zinc-600"
            onClick={() =>
              updateDay(todayKey, {
                workout: { ...baseWorkout(), completed: true },
              })
            }
          >
            Завершить так
          </button>
        </section>
      )}

      {walkCfg && (
        <section className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">{walkCfg.title}</h2>
          <p className="text-base">
            Цель: {walkCfg.minutes[0]}–{walkCfg.minutes[1]} мин
            {walkCfg.intensity ? ` · ${walkCfg.intensity}` : ''}
          </p>
          {walkCfg.intervals && (
            <WalkIntervalTimer intervals={walkCfg.intervals} />
          )}
          <label className="block text-base">
            Сколько минут прошла:
            <input
              type="number"
              min={0}
              className="mt-1 min-h-11 w-full rounded-lg border px-3 dark:border-zinc-600 dark:bg-zinc-950"
              value={day.walkMinutes ?? ''}
              onChange={(e) =>
                updateDay(todayKey, {
                  walkMinutes: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="checkbox"
              checked={day.walkDone ?? false}
              onChange={(e) =>
                updateDay(todayKey, { walkDone: e.target.checked })
              }
              className="h-5 w-5"
            />
            Ходьба выполнена
          </label>
        </section>
      )}

      {dayType === 'rest' && (
        <section className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">{plan.restDay.title}</h2>
          {plan.restDay.miniRoutine.map((item) => (
            <label
              key={item.name}
              className="flex min-h-11 items-center gap-3 text-base"
            >
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={day.restRoutineDone?.[item.name] ?? false}
                onChange={(e) =>
                  updateDay(todayKey, {
                    restRoutineDone: {
                      ...(day.restRoutineDone ?? {}),
                      [item.name]: e.target.checked,
                    },
                  })
                }
              />
              {item.name} — {item.reps}
            </label>
          ))}
        </section>
      )}

      <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Питание</h2>
          <select
            className="min-h-11 rounded-lg border px-2 text-base dark:border-zinc-600 dark:bg-zinc-950"
            value={day.meals?.menuId ?? menuId}
            onChange={(e) =>
              updateDay(todayKey, {
                meals: {
                  menuId: e.target.value,
                  eaten: day.meals?.eaten ?? {},
                  swaps: day.meals?.swaps ?? {},
                },
              })
            }
          >
            {plan.menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <NutritionSummary nutrition={nutrition} />

        {menu.meals.map((meal) => (
          <div
            key={meal.name}
            className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"
          >
            <label className="flex min-h-11 items-center gap-3 text-base font-medium">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={eaten[meal.name] ?? false}
                onChange={(e) =>
                  updateDay(todayKey, {
                    meals: {
                      menuId: day.meals?.menuId ?? menuId,
                      eaten: { ...eaten, [meal.name]: e.target.checked },
                      swaps,
                    },
                  })
                }
              />
              {meal.name} · {meal.time}
            </label>
            <ul className="space-y-2 pl-8 text-base">
              {meal.items.map((item, itemIdx) => {
                const resolved = resolveMealItem(
                  item,
                  meal.name,
                  itemIdx,
                  swaps,
                )
                const m = macrosForItem(resolved.foodId, resolved.grams)
                return (
                  <li key={itemIdx} className="space-y-1">
                    <span>
                      {resolved.label} — {resolved.grams} г (
                      {Math.round(m.kcal)} ккал)
                    </span>
                    <select
                      className="min-h-11 w-full rounded-lg border px-2 text-base dark:border-zinc-600 dark:bg-zinc-950"
                      value={swaps[`${meal.name}:${itemIdx}`] ?? item.food}
                      onChange={(e) =>
                        updateDay(todayKey, {
                          meals: {
                            menuId: day.meals?.menuId ?? menuId,
                            eaten,
                            swaps: {
                              ...swaps,
                              [`${meal.name}:${itemIdx}`]: e.target.value,
                            },
                          },
                        })
                      }
                    >
                      {Object.entries(plan.foods).map(([id, f]) => (
                        <option key={id} value={id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-base">
            Вода: {waterMl} мл · цель {targets.waterL[0]}–{targets.waterL[1]} л
          </p>
          <button
            type="button"
            className="mt-2 min-h-11 rounded-lg bg-sky-600 px-4 text-base text-white"
            onClick={() => updateDay(todayKey, { waterMl: waterMl + 250 })}
          >
            +250 мл
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">Шаги</h2>
        <p className="text-base text-zinc-600">
          Цель: {goalStepsMin}–{goalStepsMax}
        </p>
        <input
          type="number"
          min={0}
          className="mt-2 min-h-11 w-full rounded-lg border px-3 text-base dark:border-zinc-600 dark:bg-zinc-950"
          value={steps || ''}
          onChange={(e) =>
            updateDay(todayKey, { steps: Number(e.target.value) || 0 })
          }
        />
      </section>
    </div>
  )
}

function NutritionSummary({
  nutrition,
}: {
  nutrition: { kcal: number; protein: number; fat: number; carbs: number }
}) {
  const t = plan.targets
  const kcalPct = Math.min(100, (nutrition.kcal / t.kcal) * 100)
  const proteinPct = Math.min(
    100,
    (nutrition.protein / t.proteinG[1]) * 100,
  )

  return (
    <div className="space-y-2 text-base">
      <Bar label={`Ккал ${Math.round(nutrition.kcal)} / ${t.kcal}`} pct={kcalPct} />
      <Bar
        label={`Белок ${Math.round(nutrition.protein)} / ${t.proteinG[0]}–${t.proteinG[1]} г`}
        pct={proteinPct}
      />
      <p>
        Жиры: {Math.round(nutrition.fat)} г · Углеводы:{' '}
        {Math.round(nutrition.carbs)} г
      </p>
    </div>
  )
}

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <p>{label}</p>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function WalkIntervalTimer({
  intervals,
}: {
  intervals: { rounds: number; fastMin: number; easyMin: number }
}) {
  const [running, setRunning] = useState(false)
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<'fast' | 'easy'>('fast')
  const [secLeft, setSecLeft] = useState(intervals.fastMin * 60)

  useEffect(() => {
    if (!running) return
    if (secLeft <= 0) {
      if (phase === 'fast') {
        setPhase('easy')
        setSecLeft(intervals.easyMin * 60)
      } else if (round < intervals.rounds) {
        setRound((r) => r + 1)
        setPhase('fast')
        setSecLeft(intervals.fastMin * 60)
      } else {
        setRunning(false)
        if (navigator.vibrate) navigator.vibrate(200)
      }
      return
    }
    const t = window.setTimeout(() => setSecLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, secLeft, phase, round, intervals])

  const mm = Math.floor(secLeft / 60)
  const ss = secLeft % 60

  return (
    <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
      <p className="text-base font-medium">
        Раунд {round}/{intervals.rounds} ·{' '}
        {phase === 'fast' ? 'Быстро' : 'Спокойно'}
      </p>
      <p className="text-2xl font-bold tabular-nums">
        {mm}:{String(ss).padStart(2, '0')}
      </p>
      <button
        type="button"
        className="mt-2 min-h-11 rounded-lg bg-emerald-600 px-4 text-base text-white"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? 'Пауза' : 'Старт интервалов'}
      </button>
    </div>
  )
}
