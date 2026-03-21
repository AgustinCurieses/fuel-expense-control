import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      include: { area: true, subArea: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(
      cards.map(card => ({
        ...card,
        identification: card.identification || undefined,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt)
      }))
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
  try {
    const body = await request.json()
    console.log('Card creation request body:', body)
    const { cardNumber, identification, areaId, subAreaId, cardType, allowedFuel } = body
    
    console.log('Extracted fields:', { cardNumber, identification, areaId, subAreaId, cardType, allowedFuel })

    // Ensure we have a valid user - create default user if needed
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Default User'
        }
      })
      console.log('Created default user:', user.id)
    }

    const card = await prisma.card.create({
      data: {
        cardNumber,
        identification: identification || null,
        areaId,
        subAreaId: subAreaId || null,
        cardType: cardType || 'vehiculo',
        allowedFuel: allowedFuel || 'nafta',
        userId: user.id
      }
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
  try {
    const body = await request.json()
    console.log('Card update request body:', body)
    const { id, cardNumber, identification, areaId, subAreaId, cardType, allowedFuel } = body
    
    console.log('Update extracted fields:', { id, cardNumber, identification, areaId, subAreaId, cardType, allowedFuel })

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
