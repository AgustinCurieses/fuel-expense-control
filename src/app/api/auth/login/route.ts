import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { logAction } from '@/lib/audit'

// Rate limiting: max 5 intentos por IP en 15 minutos
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const now = Date.now()

  const record = loginAttempts.get(ip)
  if (record) {
    if (now < record.resetAt) {
      if (record.count >= MAX_ATTEMPTS) {
        const minutesLeft = Math.ceil((record.resetAt - now) / 60000)
        return NextResponse.json(
          { error: `Demasiados intentos. Intentá de nuevo en ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}.` },
          { status: 429 }
        )
      }
    } else {
      loginAttempts.delete(ip)
    }
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.isActive || !user.password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const current = loginAttempts.get(ip)
      if (current && now < current.resetAt) {
        current.count++
      } else {
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
      }
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Login exitoso — limpiar intentos fallidos
    loginAttempts.delete(ip)

    const token = randomBytes(32).toString('hex')

    await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken: token }
    })

    await logAction({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN'
    })

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    })

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
