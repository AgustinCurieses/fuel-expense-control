import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ASSIGNING PENDING CARD ===')
    
    const { cardNumber, identification, mainAreaId, subAreaId } = await request.json()
    
    console.log('Assignment data:', { cardNumber, identification, mainAreaId, subAreaId })

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

      console.log('Created new card:', newCard.id)

      // 2. Update all pending fuel logs for this card number
      const updatedLogs = await tx.fuelLog.updateMany({
        where: {
          cardNumber: cardNumber,
          status: 'PENDING'
        },
        data: {
          status: 'IMPORTED',
          cardId: newCard.id,
          mainAreaId: newCard.areaId,
          subAreaId: newCard.subAreaId
        }
      })

      console.log(`Updated ${updatedLogs.count} fuel logs`)

      return {
        card: newCard,
        updatedCount: updatedLogs.count
      }
    })

    console.log('Assignment completed successfully')

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
