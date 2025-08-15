import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import { calculateMinGoal, calculateVariance, calculateAgedPercent } from '@/lib/calculations'
import { BoardType } from '@/types/board'

interface UpdateRequest {
  date: string
  boardType: string
  techCount?: number
  actualJobs?: number
  agedOpps?: number
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    const body: UpdateRequest = await request.json()
    const { date, boardType, techCount, actualJobs, agedOpps } = body

    // Validate required fields
    if (!date || !boardType) {
      return NextResponse.json(
        { error: 'Missing required fields: date, boardType', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Validate boardType
    if (!['HVAC', 'PLUMBING'].includes(boardType)) {
      return NextResponse.json(
        { error: 'Invalid boardType. Must be HVAC or PLUMBING', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Get current record
    const currentRecord = await prisma.dayRecord.findUnique({
      where: {
        boardType_date: {
          boardType: boardType as any,
          date: dateObj
        }
      }
    })

    // Check if day is locked
    if (currentRecord?.locked) {
      return NextResponse.json(
        { error: 'Cannot update locked day', code: 'DAY_LOCKED' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (techCount !== undefined) {
      updateData.techCount = Math.max(0, techCount)
      updateData.minGoal = calculateMinGoal(updateData.techCount)
    }
    
    if (actualJobs !== undefined) {
      updateData.actualJobs = Math.max(0, actualJobs)
    }
    
    if (agedOpps !== undefined) {
      updateData.agedOpps = Math.max(0, agedOpps)
    }

    // Calculate derived values
    const finalTechCount = updateData.techCount ?? currentRecord?.techCount ?? 0
    const finalActualJobs = updateData.actualJobs ?? currentRecord?.actualJobs ?? 0
    const finalAgedOpps = updateData.agedOpps ?? currentRecord?.agedOpps ?? 0

    updateData.minGoal = calculateMinGoal(finalTechCount)
    updateData.variance = calculateVariance(finalActualJobs, updateData.minGoal)
    updateData.agedPercent = calculateAgedPercent(finalAgedOpps, finalActualJobs)

    // Update the record
    const updatedRecord = await prisma.dayRecord.upsert({
      where: {
        boardType_date: {
          boardType: boardType as any,
          date: dateObj
        }
      },
      update: {
        ...updateData,
        updatedAt: new Date()
      },
      create: {
        boardType: boardType as any,
        date: dateObj,
        techCount: finalTechCount,
        actualJobs: finalActualJobs,
        agedOpps: finalAgedOpps,
        minGoal: updateData.minGoal,
        variance: updateData.variance,
        agedPercent: updateData.agedPercent
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Day record updated successfully'
    })

  } catch (error) {
    console.error('Day update error:', error)
    return NextResponse.json(
      { error: 'Failed to update day record', code: 'UPDATE_ERROR', details: String(error) },
      { status: 500 }
    )
  }
}