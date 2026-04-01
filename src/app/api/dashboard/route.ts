import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// Argentine currency formatter
function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export async function GET() {
  try {
    const now = new Date()

    // 1. Última factura importada y su total oficial
    const lastFacturaLog = await prisma.fuelLog.findFirst({
      where: { factura: { not: null }, status: 'IMPORTED' },
      orderBy: { date: 'desc' },
      select: { factura: true }
    })

    let lastFacturaNumber: string | null = lastFacturaLog?.factura ?? null
    let lastFacturaTotal = 0

    if (lastFacturaNumber) {
      const facturaTotal = await prisma.facturaTotal.findUnique({
        where: { factura: lastFacturaNumber },
        select: { totalOficial: true }
      })
      if (facturaTotal) {
        lastFacturaTotal = facturaTotal.totalOficial
      } else {
        const fallback = await prisma.fuelLog.aggregate({
          where: { factura: lastFacturaNumber, status: 'IMPORTED' },
          _sum: { totalCost: true }
        })
        lastFacturaTotal = fallback._sum.totalCost ?? 0
      }
    }

    // 1b. Date range for last factura
    let lastFacturaDateRange: { min: string; max: string } | null = null
    if (lastFacturaNumber) {
      const dateRange = await prisma.fuelLog.aggregate({
        where: { factura: lastFacturaNumber, status: 'IMPORTED' },
        _min: { date: true },
        _max: { date: true }
      })
      if (dateRange._min.date && dateRange._max.date) {
        const fmt = (d: Date) =>
          `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
        lastFacturaDateRange = { min: fmt(dateRange._min.date), max: fmt(dateRange._max.date) }
      }
    }

    // 2. Área Más Activa: MainArea with most FuelLog records in the last factura
    const areaActivity = await prisma.fuelLog.groupBy({
      by: ['mainAreaId'],
      where: {
        status: 'IMPORTED',
        ...(lastFacturaNumber ? { factura: lastFacturaNumber } : {}),
        mainAreaId: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 1
    })

    // Get the area name if we have a most active area
    let mostActiveAreaName = 'Sin datos'
    let mostActiveAreaCount = 0
    if (areaActivity.length > 0 && areaActivity[0].mainAreaId) {
      const area = await prisma.mainArea.findUnique({
        where: { id: areaActivity[0].mainAreaId },
        select: { name: true }
      })
      mostActiveAreaName = area?.name || 'Área desconocida'
      mostActiveAreaCount = areaActivity[0]._count.id
    }

    // 3. Tarjetas por Asignar: Count of distinct cardNumber where status = 'PENDING'
    const pendingCards = await prisma.fuelLog.groupBy({
      by: ['cardNumber'],
      where: {
        status: 'PENDING',
        cardNumber: {
          not: null
        }
      }
    })

    // 3.1. Get most recent import date for display
    const mostRecentImport = await prisma.fuelLog.findFirst({
      where: {
        status: 'IMPORTED'
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        date: true
      }
    })

    const lastImportDate = mostRecentImport?.date 
      ? `${mostRecentImport.date.getDate().toString().padStart(2, '0')}/${(mostRecentImport.date.getMonth() + 1).toString().padStart(2, '0')}/${mostRecentImport.date.getFullYear()}`
      : null

    // 4. Recent Activity
    const recentActivity: Array<{
      type: 'import' | 'assignment'
      title: string
      description: string
      date: Date
    }> = []

    // Recent Excel imports (last 3 distinct dates)
    const recentImportDates = await prisma.fuelLog.findMany({
      where: { status: 'IMPORTED' },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: 3
    })

    for (const importDate of recentImportDates) {
      const countResult = await prisma.fuelLog.count({
        where: { status: 'IMPORTED', date: importDate.date }
      })
      const date = new Date(importDate.date)
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
      recentActivity.push({
        type: 'import',
        title: `${countResult} registros importados`,
        description: `el ${formattedDate}`,
        date: importDate.date
      })
    }

    // Recent card assignments (last 2)
    const recentAssignments = await prisma.cardAreaHistory.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        card: {
          select: { cardNumber: true }
        },
        mainArea: {
          select: { name: true }
        },
        subArea: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 2
    })

    recentAssignments.forEach(assignment => {
      const date = new Date(assignment.createdAt)
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
      recentActivity.push({
        type: 'assignment',
        title: `Tarjeta ${assignment.card.cardNumber} asignada`,
        description: `a ${assignment.mainArea.name} - ${assignment.subArea?.name || 'Sin subárea'} el ${formattedDate}`,
        date: assignment.createdAt
      })
    })

    // Sort all activity by date and take last 5
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const limitedActivity = recentActivity.slice(0, 5)

    // 5. Últimos Precios de Combustible: Most recent FuelLog for each fuel type (unified query)
    const fuelTypes = ["INFINIA DIESEL", "NAFTA SUPER", "INFINIA", "D.DIESEL 500"]
    const recentFuelLogs = await prisma.fuelLog.findMany({
      where: { description: { in: fuelTypes }, status: 'IMPORTED' },
      orderBy: { date: 'desc' },
      select: { description: true, totalCost: true, gallons: true, date: true }
    })

    const validFuelPrices = fuelTypes
      .map(product => {
        const recentLog = recentFuelLogs.find(l => l.description === product)
        if (!recentLog || !recentLog.gallons || recentLog.gallons === 0) return null
        const pricePerLiter = recentLog.totalCost / recentLog.gallons
        return { product, pricePerLiter, date: recentLog.date }
      })
      .filter(price => price !== null)

    // 6. Consumo por secretaría de la última factura
    let consumoPorSecretaria: Array<{ areaName: string; litros: number; importe: string; porcentaje: number }> = []
    if (lastFacturaNumber) {
      const grouped = await prisma.fuelLog.groupBy({
        by: ['mainAreaId'],
        where: { factura: lastFacturaNumber, status: 'IMPORTED', mainAreaId: { not: null } },
        _sum: { totalCost: true, gallons: true },
        orderBy: { _sum: { totalCost: 'desc' } }
      })
      const totalImporte = grouped.reduce((sum, g) => sum + (g._sum.totalCost ?? 0), 0)
      const areaIds = grouped.map(g => g.mainAreaId!).filter(Boolean)
      const areas = await prisma.mainArea.findMany({ where: { id: { in: areaIds } }, select: { id: true, name: true } })
      const areaMap = new Map(areas.map(a => [a.id, a.name]))
      consumoPorSecretaria = grouped.map(g => ({
        areaName: areaMap.get(g.mainAreaId!) ?? 'Sin área',
        litros: g._sum.gallons ?? 0,
        importe: formatARS(g._sum.totalCost ?? 0),
        porcentaje: totalImporte > 0 ? Math.round(((g._sum.totalCost ?? 0) / totalImporte) * 100) : 0
      }))
    }

    // 7. Últimas facturas (últimas 5)
    const facturaGroups = await prisma.fuelLog.groupBy({
      by: ['factura'],
      where: { factura: { not: null }, status: 'IMPORTED' },
      _min: { date: true },
      _max: { date: true },
      _sum: { totalCost: true },
      orderBy: { _max: { date: 'desc' } },
      take: 5
    })
    const factNumeros = facturaGroups.map(f => f.factura!).filter(Boolean)
    const oficialTotals = await prisma.facturaTotal.findMany({
      where: { factura: { in: factNumeros } },
      select: { factura: true, totalOficial: true }
    })
    const oficialMap = new Map(oficialTotals.map(o => [o.factura, o.totalOficial]))
    const fmtDate = (d: Date) =>
      `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
    const ultimasFacturas = facturaGroups.map(f => {
      const hasOficial = oficialMap.has(f.factura!)
      const total = hasOficial ? oficialMap.get(f.factura!)! : (f._sum.totalCost ?? 0)
      return {
        factura: f.factura!,
        minDate: f._min.date ? fmtDate(f._min.date) : '—',
        maxDate: f._max.date ? fmtDate(f._max.date) : '—',
        total: formatARS(total),
        hasOficial
      }
    })

    return NextResponse.json({
      lastFactura: lastFacturaNumber,
      lastFacturaTotal: formatARS(lastFacturaTotal),
      lastFacturaDateRange,
      mostActiveArea: mostActiveAreaName,
      mostActiveAreaCount,
      pendingCards: pendingCards.length,
      lastImportDate,
      recentActivity: limitedActivity,
      fuelPrices: validFuelPrices,
      consumoPorSecretaria,
      ultimasFacturas
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
