import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id

    const history = await prisma.cardAreaHistory.findMany({
      where: { cardId: cardId },
      include: {
        mainArea: true,
        subArea: true
      },
      orderBy: {
        validFrom: 'desc'
      }
    })

    return NextResponse.json(history)

  } catch (error) {
    console.error('Error fetching card history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card history' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
