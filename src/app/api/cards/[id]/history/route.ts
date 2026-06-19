import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params

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
    return NextResponse.json(
      { error: 'Failed to fetch card history' },
      { status: 500 }
    )
  }
}
