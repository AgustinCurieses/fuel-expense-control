import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logAction } from '@/lib/audit'
import { requireRole } from '@/lib/serverAuth'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(request, 'admin')
  if (error) return error

  try {
    const { name, role, isActive, password } = await request.json()
    const { id } = params

    const current = await prisma.user.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    })

    const action = isActive === false && current.isActive ? 'DEACTIVATE_USER' : 'UPDATE_USER'
    await logAction({
      action,
      entity: 'User',
      entityId: id,
      detail: { email: current.email, changes: { name, role, isActive, passwordChanged: !!password } }
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(_request, 'admin')
  if (error) return error

  try {
    const { id } = params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })

    await logAction({
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id,
      detail: { email: user.email, deleted: true }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
