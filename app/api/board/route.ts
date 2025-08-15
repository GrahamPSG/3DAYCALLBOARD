import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  calculateMinGoal, 
  calculateVariance, 
  calculateAgedPercent,
  getTargetForDay,
  isDayLocked,
  isDayGreyed,
  getDayOffset
} from '@/lib/calculations'
import { addDays, format, startOfDay } from 'date-fns'

function verifyApiKey(request: NextRequest): boolean {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  
  if (!key || key !== process.env.SECRET_URL_KEY) {
    return false
  }
  
  return true
}

export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    const today = startOfDay(new Date())
    const dates = [-1, 0, 1, 2, 3].map(d => addDays(today, d))

    const records = await prisma.dayRecord.findMany({
      where: {
        date: {
          in: dates
        }
      }
    })

    const weather = await prisma.weather.findMany({
      where: {
        date: {
          in: dates.slice(1, 4)
        }
      },
      orderBy: {
        fetchedAt: 'desc'
      }
    })

    const unlockSession = await prisma.unlockSession.findFirst({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        unlockedAt: 'desc'
      }
    })

    const response: any = {
      days: dates.map(d => format(d, 'yyyy-MM-dd')),
      weather: {},
      hvac: {},
      plumbing: {},
      targets: {},
      unlockSession: unlockSession ? {
        unlockedUntil: unlockSession.expiresAt,
        remainingSeconds: Math.max(0, Math.floor((unlockSession.expiresAt.getTime() - Date.now()) / 1000))
      } : null,
      serverTime: new Date().toISOString()
    }

    weather.forEach(w => {
      const dateStr = format(w.date, 'yyyy-MM-dd')
      response.weather[dateStr] = {
        low: w.tempLow,
        high: w.tempHigh,
        lastUpdated: w.fetchedAt.toISOString()
      }
    })

    dates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const offset = getDayOffset(date)
      response.targets[dateStr] = getTargetForDay(offset)
    })

    dates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      for (const boardTypeStr of ['HVAC', 'PLUMBING']) {
        const record = records.find(r => 
          r.boardType === boardTypeStr && 
          format(r.date, 'yyyy-MM-dd') === dateStr
        )
        
        const boardData = record ? {
          id: record.id,
          techCount: record.techCount,
          actualJobs: record.actualJobs,
          agedOpps: record.agedOpps,
          minGoal: calculateMinGoal(record.techCount),
          variance: calculateVariance(record.actualJobs, calculateMinGoal(record.techCount)),
          agedPercent: calculateAgedPercent(record.agedOpps, record.actualJobs),
          locked: isDayLocked(date, unlockSession || undefined),
          greyed: isDayGreyed(date),
          editable: !isDayLocked(date, unlockSession || undefined)
        } : {
          id: null,
          techCount: 0,
          actualJobs: 0,
          agedOpps: 0,
          minGoal: 0,
          variance: 0,
          agedPercent: 0,
          locked: isDayLocked(date, unlockSession || undefined),
          greyed: isDayGreyed(date),
          editable: !isDayLocked(date, unlockSession || undefined)
        }
        
        if (boardTypeStr === 'HVAC') {
          response.hvac[dateStr] = boardData
        } else {
          response.plumbing[dateStr] = boardData
        }
      }
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching board data:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}