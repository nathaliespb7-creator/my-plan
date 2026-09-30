import type { UserData } from '../types/plan'
import { STORAGE_KEY } from '../types/plan'
import { toDateKey } from './planUtils'

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

export function exportUserData(data: UserData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `myplan-backup-${data.startDate}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importUserDataFromFile(file: File): Promise<UserData> {
  const text = await file.text()
  const parsed = JSON.parse(text) as UserData
  if (!parsed.startDate || !parsed.days) {
    throw new Error('Неверный файл')
  }
  return parsed
}
