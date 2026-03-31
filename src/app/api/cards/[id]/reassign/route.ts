import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id
    const { mainAreaId, subAreaId } = await request.json()

    // Validate required fields
    if (!mainAreaId) {
      return NextResponse.json(
        { error: 'mainAreaId is required' },
        { status: 400 }
      )
    }

    // Get the card to ensure it exists
    const card = await prisma.card.findUnique({
      where: { id: cardId }
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Perform the reassignment in a single transaction
    const updatedCard = await prisma.$transaction(async (tx) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set to start of day

      // 1. Set validTo = today on the current active history record
      const currentHistory = await tx.cardAreaHistory.findFirst({
        where: {
          cardId: cardId,
          validTo: null
        }
      })

      if (currentHistory) {
        await tx.cardAreaHistory.update({
          where: { id: currentHistory.id },
          data: { validTo: today }
        })
      }

      // 2. Create new CardAreaHistory record
      await tx.cardAreaHistory.create({
        data: {
          cardId: cardId,
          mainAreaId: mainAreaId,
          subAreaId: subAreaId || null,
          validFrom: today,
          validTo: null
        }
      })

      // 3. Update the card's mainAreaId and subAreaId
      const updated = await tx.card.update({
        where: { id: cardId },
        data: {
          areaId: mainAreaId,
          subAreaId: subAreaId || null
        },
        include: {
          area: true,
          subArea: true,
          user: true
        }
      })

      return updated
    })

    return NextResponse.json(updatedCard)

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reassign card area' },
      { status: 500 }
    )
  }
}
