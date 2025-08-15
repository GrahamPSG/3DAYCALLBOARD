export function calculateMinGoal(techCount: number): number {
  return techCount * 3
}

export function calculateVariance(actualJobs: number, minGoal: number): number {
  return actualJobs - minGoal
}

export function calculateAgedPercent(agedOpps: number, actualJobs: number): number {
  if (actualJobs === 0) return 0
  return (agedOpps / actualJobs) * 100
}

export function getTargetForDay(dayOffset: number): number {
  switch (dayOffset) {
    case -1: return 100 // Yesterday
    case 0: return 100  // Today
    case 1: return 66   // Tomorrow
    case 2: return 33   // +2
    case 3: return 15   // +3
    default: return 0
  }
}

export function isDayLocked(date: Date, unlockSession?: { expiresAt: Date }): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (targetDate.getTime() === yesterday.getTime()) {
    if (unlockSession && unlockSession.expiresAt > new Date()) {
      return false
    }
    return true
  }
  
  return false
}

export function isDayGreyed(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const plusThree = new Date(today)
  plusThree.setDate(plusThree.getDate() + 3)
  
  return targetDate.getTime() === plusThree.getTime()
}

export function getDayOffset(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}