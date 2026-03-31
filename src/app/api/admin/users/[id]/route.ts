import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logAction } from '@/lib/audit'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, role, isActive } = await request.json()
    const { id } = params

    const current = await prisma.user.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive })
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    })

    const action = isActive === false && current.isActive ? 'DEACTIVATE_USER' : 'UPDATE_USER'
    await logAction({
      action,
      entity: 'User',
      entityId: id,
      detail: { email: current.email, changes: { name, role, isActive } }
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })

    await logAction({
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      detail: { email: user.email, deleted: true }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
