import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Recent Excel imports (last 3)
    const recentImports = await prisma.fuelLog.groupBy({
      by: ['date'],
      where: {
        status: 'IMPORTED',
        date: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 3
    })

    recentImports.forEach(import_ => {
      const date = new Date(import_.date)
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
      recentActivity.push({
        type: 'import',
        title: `${import_._count.id} registros importados`,
        description: `el ${formattedDate}`,
        date: import_.date
      })
    })

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

    // 5. Últimos Precios de Combustible: Most recent FuelLog for each fuel type
    const fuelTypes = ["INFINIA DIESEL", "NAFTA SUPER", "INFINIA", "D.DIESEL 500"]
    const fuelPrices = await Promise.all(
      fuelTypes.map(async (product) => {
        const recentLog = await prisma.fuelLog.findFirst({
          where: {
            description: product,
            status: 'IMPORTED'
          },
          orderBy: {
            date: 'desc'
          },
          select: {
            amount: true,
            gallons: true,
            date: true
          }
        })

        if (!recentLog || !recentLog.gallons || recentLog.gallons === 0) {
          return null
        }

        const pricePerLiter = recentLog.amount / recentLog.gallons
        return {
          product,
          pricePerLiter,
          date: recentLog.date
        }
      })
    )

    const validFuelPrices = fuelPrices.filter(price => price !== null)

    return NextResponse.json({
      lastFactura: lastFacturaNumber,
      lastFacturaTotal: formatARS(lastFacturaTotal),
      mostActiveArea: mostActiveAreaName,
      mostActiveAreaCount,
      pendingCards: pendingCards.length,
      lastImportDate,
      recentActivity: limitedActivity,
      fuelPrices: validFuelPrices
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
