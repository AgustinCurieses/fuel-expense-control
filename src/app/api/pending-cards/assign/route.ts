import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logAction } from '@/lib/audit'
import { requireRole } from '@/lib/serverAuth'

// Resolve the area assigned to a card at a specific date using CardAreaHistory
async function getCardAreaAtDate(cardId: string, date: Date) {
  const historyRecord = await prisma.cardAreaHistory.findFirst({
    where: {
      cardId: cardId,
      validFrom: {
        lte: date
      },
      OR: [
        { validTo: { gte: date } },
        { validTo: null }
      ]
    },
    orderBy: {
      validFrom: 'desc'
    }
  })

  return historyRecord
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'editor')
  if (error) return error

  try {
    const { cardNumber, identification, mainAreaId, subAreaId } = await request.json()

    if (!cardNumber || !mainAreaId) {
      return NextResponse.json(
        { error: 'Card number and main area are required' },
        { status: 400 }
      )
    }

    // Get a default user
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Default User'
        }
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the new card
      const newCard = await tx.card.create({
        data: {
          cardNumber,
          identification: identification || null,
          areaId: mainAreaId,
          subAreaId: subAreaId || null,
          userId: user.id
        },
        include: {
          area: true,
          subArea: true
        }
      })

      // 2. Find all pending fuel logs for this card number
      const pendingLogs = await tx.fuelLog.findMany({
        where: {
          cardNumber: cardNumber,
          status: 'PENDING'
        },
        select: { id: true, date: true }
      })

      // 3. For each log, resolve the correct area at the log's date using CardAreaHistory
      let updatedCount = 0
      for (const log of pendingLogs) {
        const historyRecord = await getCardAreaAtDate(newCard.id, log.date)

        const resolvedMainAreaId = historyRecord?.mainAreaId ?? newCard.areaId
        const resolvedSubAreaId = historyRecord?.subAreaId ?? newCard.subAreaId

        await tx.fuelLog.update({
          where: { id: log.id },
          data: {
            status: 'IMPORTED',
            cardId: newCard.id,
            mainAreaId: resolvedMainAreaId,
            subAreaId: resolvedSubAreaId
          }
        })
        updatedCount++
      }

      return {
        card: newCard,
        updatedCount
      }
    })

    await logAction({
      action: 'ASSIGN_CARD',
      entity: 'Card',
      entityId: result.card.id,
      detail: { cardNumber, mainAreaId, subAreaId, updatedLogs: result.updatedCount }
    })

    return NextResponse.json({
      success: true,
      card: result.card,
      updatedCount: result.updatedCount
    })

  } catch (error) {
    console.error('Error assigning pending card:', error)
    return NextResponse.json(
      { error: 'Failed to assign pending card' },
      { status: 500 }
    )
  }
}
