import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getSession } from '@/lib/serverAuth'
import { logAction } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request)
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { sessionToken: null }
      })
      await logAction({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGOUT'
      })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('session_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/'
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
