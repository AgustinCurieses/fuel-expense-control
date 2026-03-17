import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    const [mainAreas, subAreas] = await Promise.all([
      prisma.mainArea.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.subArea.findMany({ orderBy: { createdAt: 'desc' } })
    ])

    return NextResponse.json({
      mainAreas: mainAreas.map(area => ({
        ...area,
        createdAt: new Date(area.createdAt),
        updatedAt: new Date(area.updatedAt)
      })),
      subAreas: subAreas.map(area => ({
        ...area,
        createdAt: new Date(area.createdAt),
        updatedAt: new Date(area.updatedAt)
      }))
    })
  } catch (error) {
    console.error('Error fetching areas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch areas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, parentAreaId } = body

    if (type === 'main') {
      const area = await prisma.mainArea.create({
        data: { name }
      })
      
      return NextResponse.json({
        ...area,
        createdAt: new Date(area.createdAt),
        updatedAt: new Date(area.updatedAt)
      })
    } else {
      const area = await prisma.subArea.create({
        data: { name, parentAreaId }
      })
      
      return NextResponse.json({
        ...area,
        createdAt: new Date(area.createdAt),
        updatedAt: new Date(area.updatedAt)
      })
    }
  } catch (error) {
    console.error('Error creating area:', error)
    return NextResponse.json(
      { error: 'Failed to create area' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, name, parentAreaId } = body

    if (type === 'main') {
      const area = await prisma.mainArea.update({
        where: { id },
        data: { name, updatedAt: new Date() }
      })
      
      return NextResponse.json({
        ...area,
        createdAt: new Date(area.createdAt),
        updatedAt: new Date(area.updatedAt)
      })
    } else {
      const area = await prisma.subArea.update({
        where: { id },
        data: { name, parentAreaId, updatedAt: new Date() }
      })
      
      return NextResponse.json({
        ...area,
        createdAt: new Date(area.createdAt),
        updatedAt: new Date(area.updatedAt)
      })
    }
  } catch (error) {
    console.error('Error updating area:', error)
    return NextResponse.json(
      { error: 'Failed to update area' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json(
        { error: 'Missing id or type parameter' },
        { status: 400 }
      )
    }

    if (type === 'main') {
      await prisma.mainArea.delete({ where: { id } })
    } else {
      await prisma.subArea.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting area:', error)
    return NextResponse.json(
      { error: 'Failed to delete area' },
      { status: 500 }
    )
  }
}
