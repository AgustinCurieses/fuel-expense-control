import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './database'

export type UserRole = 'admin' | 'editor' | 'viewer'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
}

export async function getSession(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  if (!token) return null

  return prisma.user.findFirst({
    where: { sessionToken: token, isActive: true },
    select: { id: true, email: true, name: true, role: true }
  })
}

export async function requireAuth(request: NextRequest) {
  const user = await getSession(request)
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  return { user, error: null }
}

export async function requireRole(request: NextRequest, minRole: UserRole) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return { user: null, error: error ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const userLevel = ROLE_HIERARCHY[user.role as UserRole] ?? 0
  if (userLevel < ROLE_HIERARCHY[minRole]) {
    return { user: null, error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) }
  }

  return { user, error: null }
}
