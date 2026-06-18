import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireRole } from '@/lib/serverAuth'

export async function GET(request: NextRequest) {
  const { error } = await requireRole(request, 'admin')
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userEmail: true,
          action: true,
          entity: true,
          entityId: true,
          detail: true,
          createdAt: true
        }
      }),
      prisma.auditLog.count()
    ])

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
