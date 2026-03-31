import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    
    // Get all pending fuel logs with dominio field
    const pendingLogs = await prisma.fuelLog.findMany({
      where: {
        status: 'PENDING',
        cardNumber: {
          not: null
        }
      },
      select: {
        cardNumber: true,
        id: true,
        dominio: true,
        date: true
      },
      orderBy: {
        date: 'desc'
      }
    })


    // Group by card number and get most recent dominio
    const pendingCardsMap = new Map<string, { cardNumber: string; count: number; identification: string | null }>()
    
    for (const log of pendingLogs) {
      const cardNumber = log.cardNumber!
      
      if (!pendingCardsMap.has(cardNumber)) {
        pendingCardsMap.set(cardNumber, {
          cardNumber,
          count: 0,
          identification: log.dominio
        })
      }
      pendingCardsMap.get(cardNumber)!.count++
    }

    const result = Array.from(pendingCardsMap.values())

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching pending cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending cards' },
      { status: 500 }
    )
  }
}