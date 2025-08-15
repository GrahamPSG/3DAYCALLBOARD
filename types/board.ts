export type BoardType = 'HVAC' | 'PLUMBING'

export interface DayData {
  id: string | null
  techCount: number
  actualJobs: number
  agedOpps: number
  minGoal: number
  variance: number
  agedPercent: number
  locked: boolean
  greyed: boolean
  editable: boolean
}

export interface WeatherData {
  low: number
  high: number
  lastUpdated: string
}

export interface BoardData {
  days: string[]
  weather: Record<string, WeatherData>
  hvac: Record<string, DayData>
  plumbing: Record<string, DayData>
  targets: Record<string, number>
  unlockSession: {
    unlockedUntil: string
    remainingSeconds: number
  } | null
  serverTime: string
}

export interface UpdateDayRequest {
  boardType: BoardType
  date: string
  techCount: number
  actualJobs: number
  agedOpps: number
}