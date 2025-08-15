import { PrismaClient, BoardType } from '@prisma/client'
import { addDays, startOfDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  const today = startOfDay(new Date())
  const dates = [-1, 0, 1, 2, 3].map(d => addDays(today, d))

  for (const date of dates) {
    for (const boardType of [BoardType.HVAC, BoardType.PLUMBING]) {
      await prisma.dayRecord.upsert({
        where: {
          boardType_date: {
            boardType,
            date
          }
        },
        update: {},
        create: {
          boardType,
          date,
          techCount: 0,
          actualJobs: 0,
          agedOpps: 0,
          minGoal: 0,
          variance: 0,
          agedPercent: 0
        }
      })
      console.log(`Created/Updated ${boardType} record for ${date.toISOString().split('T')[0]}`)
    }
  }

  const weatherDates = [0, 1, 2].map(d => addDays(today, d))
  for (const date of weatherDates) {
    await prisma.weather.upsert({
      where: { date },
      update: {},
      create: {
        date,
        tempLow: 2 + Math.random() * 3,
        tempHigh: 8 + Math.random() * 4,
        raw: {}
      }
    })
    console.log(`Created weather record for ${date.toISOString().split('T')[0]}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })