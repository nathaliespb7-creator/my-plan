import type { UserData } from '../types/plan'
import { STORAGE_KEY } from '../types/plan'
import { daysBetween, toDateKey } from './planUtils'

export function emptyUserData(startDate?: string): UserData {
  return {
    startDate: startDate ?? toDateKey(new Date()),
    days: {},
    bodyWeights: [],
  }
}

export function loadUserData(): UserData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserData
  } catch {
    return null
  }
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function downloadJson(json: string, fileName: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/** Сохранить копию. true — пользователь поделился или скачал; false — отменил «Поделиться». */
export async function exportUserData(data: UserData): Promise<boolean> {
  const json = JSON.stringify(data, null, 2)
  const fileName = `moy-plan-kopiya-${toDateKey(new Date())}.json`
  const file = new File([json], fileName, { type: 'application/json' })

  try {
    if (
      typeof navigator.share === 'function' &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    ) {
      await navigator.share({
        files: [file],
        title: 'Мой план: копия',
      })
      return true
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return false
    }
  }

  downloadJson(json, fileName)
  return true
}

export async function importUserDataFromFile(file: File): Promise<UserData> {
  const text = await file.text()
  const parsed = JSON.parse(text) as UserData
  if (!parsed.startDate || !parsed.days) {
    throw new Error('Неверный файл. Выберите копию, сохранённую из «Мой план».')
  }
  return parsed
}

export function formatBackupDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function needsBackupReminder(
  lastBackupAt: string | undefined,
  todayKey: string,
): boolean {
  if (!lastBackupAt) return true
  return daysBetween(lastBackupAt, todayKey) > 7
}
