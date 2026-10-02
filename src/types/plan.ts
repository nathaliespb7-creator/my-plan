export interface PlanData {
  meta: { version: number; language: string; note: string }
  profile: Record<string, string | number>
  targets: {
    kcal: number
    kcalRange: [number, number]
    proteinG: [number, number]
    fatG: [number, number]
    carbsG: number
    waterL: [number, number]
  }
  weekSchedule: Record<WeekdayKey, DayTypeKey>
  walking: Record<string, unknown>
  restDay: { title: string; miniRoutine: { name: string; reps: string }[] }
  progression: {
    weeks: number[]
    name: string
    sets: string
    repsInReserve?: string
    focus?: string
    note?: string
  }[]
  progressionRule: string
  stopRules: string[]
  workouts: Record<'A' | 'B' | 'C', WorkoutDef>
  foods: Record<string, FoodDef>
  menus: MenuDef[]
  menuRotation: string
}

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type DayTypeKey = 'A' | 'B' | 'C' | 'walk' | 'walk_intervals' | 'long_walk' | 'rest'
export type TabId = 'today' | 'week' | 'progress' | 'plan'

export interface ExerciseDef {
  id: string
  name: string
  block: 'main' | 'core'
  sets: number
  setsWeeks1to3: number
  reps: string
  startWeightKg: number
  weightMode: string
  startWeightText: string
  cue: string
  imageQuery: string
  image?: string
}

export interface WorkoutDef {
  title: string
  day: string
  durationMin: string
  exercises: ExerciseDef[]
  warmup: string
  cooldown: string
  restBetweenSetsSec: [number, number]
}

export interface FoodDef {
  name: string
  per100g: { kcal: number; protein: number; fat: number; carbs: number }
}

export interface MenuMealItem {
  food: string
  label: string
  grams: number
}

export interface MenuMeal {
  name: string
  time: string
  items: MenuMealItem[]
  totals: { kcal: number; protein: number; fat: number; carbs: number }
}

export interface MenuDef {
  id: string
  name: string
  meals: MenuMeal[]
  totals: { kcal: number; protein: number; fat: number; carbs: number }
}

export interface SetRecord {
  done: boolean
  reps?: number
}

export interface ExerciseDayState {
  weightKg: number
  sets: SetRecord[]
}

export interface WorkoutDayState {
  warmupDone: boolean
  cooldownDone: boolean
  completed?: boolean
  exercises: Record<string, ExerciseDayState>
}

export interface MealsDayState {
  menuId: string
  eaten: Record<string, boolean>
  swaps: Record<string, string>
}

export interface DayState {
  workout?: WorkoutDayState
  walkMinutes?: number
  walkDone?: boolean
  meals?: MealsDayState
  waterMl?: number
  steps?: number
  restRoutineDone?: Record<string, boolean>
}

export interface BodyWeightEntry {
  date: string
  kg: number
}

export interface UserData {
  startDate: string
  days: Record<string, DayState>
  bodyWeights: BodyWeightEntry[]
  lastBackupAt?: string
}

export const STORAGE_KEY = 'myplan-v1'
