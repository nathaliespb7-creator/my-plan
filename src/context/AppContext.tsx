import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DayState, TabId, UserData } from '../types/plan'
import {
  defaultMenuIdForDate,
  getDayType,
  getWeekNumber,
  toDateKey,
} from '../lib/planUtils'
import {
  emptyUserData,
  exportUserData,
  importUserDataFromFile,
  loadUserData,
  saveUserData,
} from '../lib/storage'

interface AppContextValue {
  tab: TabId
  setTab: (t: TabId) => void
  todayKey: string
  user: UserData
  weekNumber: number
  dayType: ReturnType<typeof getDayType>
  needsStartDate: boolean
  setStartDate: (date: string) => void
  getDay: (dateKey: string) => DayState
  updateDay: (dateKey: string, patch: Partial<DayState>) => void
  resetProgress: () => void
  exportData: () => void
  importData: (file: File) => Promise<void>
  setBodyWeightForDate: (dateKey: string, kg: number) => void
  setStartDateSetting: (date: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function mergeDay(user: UserData, dateKey: string, patch: Partial<DayState>): UserData {
  const prev = user.days[dateKey] ?? {}
  return {
    ...user,
    days: {
      ...user.days,
      [dateKey]: { ...prev, ...patch },
    },
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('today')
  const [user, setUser] = useState<UserData>(() => loadUserData() ?? emptyUserData())
  const [needsStartDate, setNeedsStartDate] = useState(() => !loadUserData())

  const todayKey = toDateKey(new Date())
  const weekNumber = getWeekNumber(user.startDate, todayKey)
  const dayType = getDayType(todayKey)

  useEffect(() => {
    saveUserData(user)
  }, [user])

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const setStartDate = useCallback((date: string) => {
    setUser((u) => ({ ...u, startDate: date }))
    setNeedsStartDate(false)
  }, [])

  const getDay = useCallback(
    (dateKey: string): DayState => user.days[dateKey] ?? {},
    [user],
  )

  const updateDay = useCallback((dateKey: string, patch: Partial<DayState>) => {
    setUser((u) => mergeDay(u, dateKey, patch))
  }, [])

  const resetProgress = useCallback(() => {
    setUser((u) => ({
      startDate: u.startDate,
      days: {},
      bodyWeights: [],
    }))
  }, [])

  const exportData = useCallback(() => {
    exportUserData(user)
  }, [user])

  const importData = useCallback(async (file: File) => {
    const data = await importUserDataFromFile(file)
    setUser(data)
    setNeedsStartDate(false)
  }, [])

  const setBodyWeightForDate = useCallback((dateKey: string, kg: number) => {
    setUser((u) => {
      const rest = u.bodyWeights.filter((e) => e.date !== dateKey)
      return {
        ...u,
        bodyWeights: [...rest, { date: dateKey, kg }].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      }
    })
  }, [])

  const setStartDateSetting = useCallback((date: string) => {
    setUser((u) => ({ ...u, startDate: date }))
    setNeedsStartDate(false)
  }, [])

  const value = useMemo(
    () => ({
      tab,
      setTab,
      todayKey,
      user,
      weekNumber,
      dayType,
      needsStartDate,
      setStartDate,
      getDay,
      updateDay,
      resetProgress,
      exportData,
      importData,
      setBodyWeightForDate,
      setStartDateSetting,
    }),
    [
      tab,
      todayKey,
      user,
      weekNumber,
      dayType,
      needsStartDate,
      setStartDate,
      getDay,
      updateDay,
      resetProgress,
      exportData,
      importData,
      setBodyWeightForDate,
      setStartDateSetting,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp outside provider')
  return ctx
}

export function useTodayMeals(dateKey: string) {
  const { user, getDay, updateDay } = useApp()
  const day = getDay(dateKey)
  const menuId =
    day.meals?.menuId ?? defaultMenuIdForDate(user.startDate, dateKey)

  const ensureMeals = () => {
    if (!day.meals) {
      updateDay(dateKey, {
        meals: { menuId, eaten: {}, swaps: {} },
        waterMl: day.waterMl ?? 0,
        steps: day.steps ?? 0,
      })
    }
  }

  return { menuId, day, ensureMeals, updateDay, user }
}
