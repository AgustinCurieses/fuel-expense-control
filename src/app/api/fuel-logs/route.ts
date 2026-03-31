import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')
    const areaId    = searchParams.get('areaId')
    const factura   = searchParams.get('factura')

    // Require at least one filter — never return all logs
    if (!startDate && !endDate && !areaId && !factura) {
      return NextResponse.json([])
    }

    const where: Record<string, unknown> = { status: 'IMPORTED' }

    if (factura) {
      where.factura = factura
    } else if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split('-').map(Number)
      const [ey, em, ed] = endDate.split('-').map(Number)
      where.date = {
        gte: new Date(sy, sm - 1, sd, 0, 0, 0),
        lte: new Date(ey, em - 1, ed, 23, 59, 59, 999)
      }
    }

    if (areaId) {
      where.mainAreaId = areaId
    }

    const fuelLogs = await prisma.fuelLog.findMany({
      where,
      include: { card: { include: { area: true, subArea: true } } },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(fuelLogs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fuel logs' }, { status: 500 })
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
