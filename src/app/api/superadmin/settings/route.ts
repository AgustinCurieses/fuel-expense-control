import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// Default values — returned when no DB row exists yet
const DEFAULTS: Record<string, string> = {
  org_name:                  'Municipalidad de Luján',
  org_province:              'Buenos Aires',
  card_inactivity_days:      '30',
  excel_sheet_index:         '0',
  billing_period:            'quincenal',
  factura_tolerance_green:   '1',
  factura_tolerance_yellow:  '100',
  show_org_logo:             'false',
}

export async function GET() {
  try {
    const rows = await prisma.systemSettings.findMany()
    const result: Record<string, string> = { ...DEFAULTS }
    for (const row of rows) {
      result[row.key] = row.value
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(DEFAULTS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Record<string, string> = await request.json()
    const allowedKeys = Object.keys(DEFAULTS)

    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.includes(key)) continue
      await prisma.systemSettings.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
  }
}
