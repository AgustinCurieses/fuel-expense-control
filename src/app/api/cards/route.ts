import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireRole } from '@/lib/serverAuth'

export async function GET() {
  try {
    const [cards, inactivitySetting] = await Promise.all([
      prisma.card.findMany({
        include: {
          area: true,
          subArea: true,
          fuelLogs: {
            where: { status: 'IMPORTED' },
            orderBy: { date: 'desc' },
            take: 1,
            select: { date: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemSettings.findUnique({ where: { key: 'card_inactivity_days' } })
    ])

    const inactivityDays = parseInt(inactivitySetting?.value ?? '15', 10)
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - inactivityDays)

    return NextResponse.json(
      cards.map(card => {
        const lastActivityDate = card.fuelLogs[0]?.date ?? null
        return {
          ...card,
          fuelLogs: undefined,
          identification: card.identification || undefined,
          lastActivityDate,
          isInactive: !lastActivityDate || new Date(lastActivityDate) < threshold,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt)
        }
      })
    )
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'editor')
  if (error) return error

  try {
    const body = await request.json()
    const { cardNumber, identification, areaId, subAreaId, cardType, allowedFuel, userId } = body
    

    const cardData: any = {
      cardNumber,
      identification: identification || null,
      areaId,
      subAreaId: subAreaId || null,
      cardType: cardType || 'vehiculo',
      allowedFuel: allowedFuel || 'nafta'
    }

    // Only include userId if provided
    if (userId) {
      cardData.userId = userId
    }

    const card = await prisma.card.create({
      data: cardData
    })

    return NextResponse.json({
      ...card,
      identification: card.identification || undefined,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt)
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireRole(request, 'editor')
  if (error) return error

  try {
    const body = await request.json()
    const { id, cardNumber, identification, areaId, subAreaId, cardType, allowedFuel } = body
    

    const card = await prisma.card.update({
      where: { id },
      data: {
        cardNumber,
        identification: identification || null,
        areaId,
        subAreaId: subAreaId || null,
        cardType: cardType || 'vehiculo',
        allowedFuel: allowedFuel || 'nafta',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      ...card,
      identification: card.identification || undefined,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt)
    })
  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireRole(request, 'editor')
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    await prisma.card.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}