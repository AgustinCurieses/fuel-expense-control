import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()
    const validKey = process.env.SUPERADMIN_KEY ?? 'superadmin'
    if (key === validKey) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false, error: 'Clave incorrecta' }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error de validación' }, { status: 500 })
  }
}
