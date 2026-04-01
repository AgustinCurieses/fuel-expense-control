import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function getFuelGroup(product: string): 'nafta' | 'gasoil' | 'unknown' {
  if (!product) return 'unknown'
  const p = product.toUpperCase()
  if (p.includes('NAFTA') || (p.includes('INFINIA') && !p.includes('DIESEL'))) return 'nafta'
  if (p.includes('INFINIA DIESEL') || p.includes('D.DIESEL')) return 'gasoil'
  return 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factura   = searchParams.get('factura')
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')
    const areaId    = searchParams.get('areaId')

    // Build the FuelLog filter
    const logWhere: any = { status: 'IMPORTED' }
    if (factura) {
      logWhere.factura = factura
    } else if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split('-').map(Number)
      const [ey, em, ed] = endDate.split('-').map(Number)
      logWhere.date = {
        gte: new Date(sy, sm - 1, sd, 0, 0, 0),
        lte: new Date(ey, em - 1, ed, 23, 59, 59, 999)
      }
    }

    // Card-level area filter
    const cardWhere: any = {
      fuelLogs: { some: logWhere }
    }
    if (areaId) cardWhere.areaId = areaId

    const cardsWithLogs = await prisma.card.findMany({
      where: cardWhere,
      include: {
        fuelLogs: { where: logWhere, orderBy: { date: 'desc' } },
        area: true,
        subArea: true
      }
    })

    const alerts: any[] = []

    for (const card of cardsWithLogs) {
      if (card.cardType === 'maquinaria' || card.allowedFuel === 'ambos') continue

      let suspiciousLoads: any[] = []
      let primaryGroup: 'nafta' | 'gasoil'

      if (!card.cardType || !card.allowedFuel) {
        // Fallback: determine by historical majority
        const naftaLogs  = card.fuelLogs.filter(l => getFuelGroup(l.description || '') === 'nafta')
        const gasoilLogs = card.fuelLogs.filter(l => getFuelGroup(l.description || '') === 'gasoil')
        const naftaL  = naftaLogs.reduce((s, l) => s + (l.gallons || 0), 0)
        const gasoilL = gasoilLogs.reduce((s, l) => s + (l.gallons || 0), 0)
        if (naftaL === 0 && gasoilL === 0) continue
        primaryGroup   = gasoilL > naftaL ? 'gasoil' : 'nafta'
        suspiciousLoads = primaryGroup === 'nafta' ? gasoilLogs : naftaLogs
      } else {
        primaryGroup = card.allowedFuel === 'nafta' ? 'nafta' : 'gasoil'
        if (card.allowedFuel === 'nafta') {
          suspiciousLoads = card.fuelLogs.filter(l => {
            const p = (l.description || '').toUpperCase()
            return p.includes('DIESEL') || p.includes('D.DIESEL')
          })
        } else {
          suspiciousLoads = card.fuelLogs.filter(l => {
            const p = (l.description || '').toUpperCase()
            return (p.includes('NAFTA') || p.includes('INFINIA')) && !p.includes('DIESEL')
          })
        }
      }

      if (suspiciousLoads.length > 0) {
        alerts.push({
          cardNumber: card.cardNumber,
          dominio:    card.identification || 'Sin Dominio',
          subArea:    card.subArea?.name  || 'Sin Dependencia',
          mainArea:   card.area?.name     || 'Sin Secretaría',
          mainAreaId: card.areaId         || null,
          primaryGroup,
          suspiciousLoads: suspiciousLoads.map(l => ({
            date:    formatDate(l.date),
            product: l.description || 'Sin Producto',
            liters:  l.gallons     || 0,
            amount:  l.amount      || 0,
            remito:  l.remito      || 'Sin Remito',
            factura: l.factura     || null
          }))
        })
      }
    }

    return NextResponse.json(alerts)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching fuel type alerts' }, { status: 500 })
  }
}
