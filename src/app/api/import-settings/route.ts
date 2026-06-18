import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireRole } from '@/lib/serverAuth'

export async function GET() {
  try {
    const settings = await prisma.importSettings.findMany({
      include: { mappings: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(
      settings.map(setting => ({
        ...setting,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt),
        mappings: setting.mappings.map(mapping => ({
          ...mapping,
          createdAt: new Date(mapping.createdAt),
          updatedAt: new Date(mapping.updatedAt)
        }))
      }))
    )
  } catch (error) {
    console.error('Error fetching import settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'admin')
  if (error) return error

  try {
    const body = await request.json()
    const { name, mappings } = body

    const setting = await prisma.importSettings.create({
      data: {
        name,
        mappings: {
          create: mappings.map((mapping: any) => ({
            internalField: mapping.internalField,
            rawColumnName: mapping.rawColumnName
          }))
        }
      },
      include: { mappings: true }
    })

    return NextResponse.json({
      ...setting,
      createdAt: new Date(setting.createdAt),
      updatedAt: new Date(setting.updatedAt),
      mappings: setting.mappings.map(mapping => ({
        ...mapping,
        createdAt: new Date(mapping.createdAt),
        updatedAt: new Date(mapping.updatedAt)
      }))
    })
  } catch (error) {
    console.error('Error creating import settings:', error)
    return NextResponse.json(
      { error: 'Failed to create import settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, mappings, isActive } = body

    // Delete existing mappings
    await prisma.importMapping.deleteMany({
      where: { settingsId: id }
    })

    // Update settings and create new mappings
    const setting = await prisma.importSettings.update({
      where: { id },
      data: {
        name,
        isActive,
        mappings: {
          create: mappings.map((mapping: any) => ({
            internalField: mapping.internalField,
            rawColumnName: mapping.rawColumnName
          }))
        }
      },
      include: { mappings: true }
    })

    return NextResponse.json({
      ...setting,
      createdAt: new Date(setting.createdAt),
      updatedAt: new Date(setting.updatedAt),
      mappings: setting.mappings.map(mapping => ({
        ...mapping,
        createdAt: new Date(mapping.createdAt),
        updatedAt: new Date(mapping.updatedAt)
      }))
    })
  } catch (error) {
    console.error('Error updating import settings:', error)
    return NextResponse.json(
      { error: 'Failed to update import settings' },
      { status: 500 }
    )
  }
}
