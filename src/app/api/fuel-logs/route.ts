import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    const fuelLogs = await prisma.fuelLog.findMany({
      include: { card: { include: { area: true, subArea: true } } },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(
      fuelLogs.map(log => ({
        ...log,
        date: new Date(log.date),
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt)
      }))
    )
  } catch (error) {
    console.error('Error fetching fuel logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fuel logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, amount, pricePerGallon, totalCost, gallons, odometer, location, description, cardId } = body

    // Ensure we have a valid user
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Default User'
        }
      })
    }

    const fuelLog = await prisma.fuelLog.create({
      data: {
        date: new Date(date),
        amount,
        pricePerGallon,
        totalCost,
        gallons,
        odometer: odometer || null,
        location: location || null,
        description: description || null,
        userId: user.id,
        cardId
      }
    })

    return NextResponse.json({
      ...fuelLog,
      date: new Date(fuelLog.date),
      createdAt: new Date(fuelLog.createdAt),
      updatedAt: new Date(fuelLog.updatedAt)
    })
  } catch (error) {
    console.error('Error creating fuel log:', error)
    return NextResponse.json(
      { error: 'Failed to create fuel log' },
      { status: 500 }
    )
  }
}
