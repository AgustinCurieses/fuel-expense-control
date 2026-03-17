import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    console.log('=== FETCHING PENDING CARDS ===')
    
    // Get all pending fuel logs and group by card number
    const pendingLogs = await prisma.fuelLog.findMany({
      where: {
        status: 'PENDING',
        cardNumber: {
          not: null
        }
      },
      select: {
        cardNumber: true,
        id: true
      }
    })

    console.log(`Found ${pendingLogs.length} pending logs`)

    // Group by card number and count
    const pendingCards = pendingLogs.reduce((acc: Record<string, { cardNumber: string; count: number }>, log: any) => {
      const cardNumber = log.cardNumber!
      if (!acc[cardNumber]) {
        acc[cardNumber] = {
          cardNumber,
          count: 0
        }
      }
      acc[cardNumber].count++
      return acc
    }, {} as Record<string, { cardNumber: string; count: number }>)

    const result = Object.values(pendingCards)
    console.log(`Returning ${result.length} unique pending cards`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching pending cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending cards' },
      { status: 500 }
    )
  }
}
