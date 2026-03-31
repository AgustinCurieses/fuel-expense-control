import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// Spanish month names
const spanishMonths = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function generateQuincenaLabel(dates: Date[]): string {
  // Sort dates ascending
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
  
  // Get the median date
  const medianDate = sortedDates[Math.floor(sortedDates.length / 2)]
  
  const day = medianDate.getDate()
  const month = spanishMonths[medianDate.getMonth()]
  const year = medianDate.getFullYear()
  
  if (day <= 15) {
    return `Primera quincena ${month} ${year}`
  } else {
    return `Segunda quincena ${month} ${year}`
  }
}

export async function GET() {
  try {
    // Get all fuel logs with factura values
    const fuelLogs = await prisma.fuelLog.findMany({
      where: {
        status: 'IMPORTED'
      },
      select: {
        factura: true,
        date: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Group by factura and find date ranges
    const facturaMap = new Map<string, { dates: Date[], count: number }>()
    
    fuelLogs.forEach(log => {
      if (log.factura) {
        const existing = facturaMap.get(log.factura)
        if (existing) {
          existing.dates.push(log.date)
          existing.count++
        } else {
          facturaMap.set(log.factura, {
            dates: [log.date],
            count: 1
          })
        }
      }
    })

    // Get all facturas that have an official total saved
    const facturaTotals = await prisma.facturaTotal.findMany({
      select: { factura: true }
    })
    const validatedSet = new Set(facturaTotals.map(ft => ft.factura))

    // Transform the data
    const result = Array.from(facturaMap.entries())
      .map(([factura, data]) => {
        return {
          factura,
          label: generateQuincenaLabel(data.dates),
          count: data.count,
          hasTotal: validatedSet.has(factura)
        }
      })
      .sort((a, b) => b.factura.localeCompare(a.factura)) // Sort by factura number descending

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching facturas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facturas' },
      { status: 500 }
    )
  }
}
