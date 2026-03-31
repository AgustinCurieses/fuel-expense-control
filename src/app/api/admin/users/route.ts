import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { logAction } from '@/lib/audit'

export async function GET() {
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
  try {
    const { email, name, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: { email, name: name || null, role, isActive: true },
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
