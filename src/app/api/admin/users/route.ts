import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logAction } from '@/lib/audit'
import { requireRole } from '@/lib/serverAuth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const { error } = await requireRole(request, 'admin')
  if (error) return error

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'admin')
  if (error) return error

  try {
    const { email, name, role, password } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
    }
    if (!password) {
      return NextResponse.json({ error: 'La contraseña es requerida' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, name: name || null, role, isActive: true, password: hashedPassword },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    })

    await logAction({
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      detail: { email, role }
    })

    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
