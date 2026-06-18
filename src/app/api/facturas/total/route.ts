import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireRole } from '@/lib/serverAuth'

// Helper function to format currency in Argentine format
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// GET - Retrieve factura total and calculated total
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factura = searchParams.get('factura')

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura parameter is required' },
        { status: 400 }
      )
    }

    // Get saved official total
    const savedTotal = await prisma.facturaTotal.findUnique({
      where: { factura }
    })

    // Calculate total from database
    const calculatedTotalResult = await prisma.fuelLog.aggregate({
      where: {
        factura: factura,
        status: 'IMPORTED'
      },
      _sum: {
        amount: true
      }
    })

    const calculatedTotal = calculatedTotalResult._sum.amount || 0

    return NextResponse.json({
      factura,
      totalOficial: savedTotal?.totalOficial || null,
      totalCalculado: calculatedTotal,
      totalOficialFormateado: savedTotal ? formatCurrency(savedTotal.totalOficial) : null,
      totalCalculadoFormateado: formatCurrency(calculatedTotal),
      diferencia: savedTotal ? calculatedTotal - savedTotal.totalOficial : null,
      diferenciaFormateada: savedTotal ? formatCurrency(calculatedTotal - savedTotal.totalOficial) : null
    })
  } catch (error) {
    console.error('Error fetching factura total:', error)
    return NextResponse.json(
      { error: 'Failed to fetch factura total' },
      { status: 500 }
    )
  }
}

// POST - Save or update factura total
export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'editor')
  if (error) return error

  try {
    const body = await request.json()
    const { factura, totalOficial } = body

    if (!factura || totalOficial === undefined || totalOficial === null) {
      return NextResponse.json(
        { error: 'Factura and totalOficial are required' },
        { status: 400 }
      )
    }

    const totalOficialNum = parseFloat(totalOficial.toString())
    if (isNaN(totalOficialNum)) {
      return NextResponse.json(
        { error: 'totalOficial must be a valid number' },
        { status: 400 }
      )
    }

    // Upsert the factura total
    const result = await prisma.facturaTotal.upsert({
      where: { factura },
      update: { totalOficial: totalOficialNum },
      create: {
        factura,
        totalOficial: totalOficialNum
      }
    })

    // Calculate total from database for comparison
    const calculatedTotalResult = await prisma.fuelLog.aggregate({
      where: {
        factura: factura,
        status: 'IMPORTED'
      },
      _sum: {
        amount: true
      }
    })

    const calculatedTotal = calculatedTotalResult._sum.amount || 0
    const diferencia = calculatedTotal - totalOficialNum

    return NextResponse.json({
      success: true,
      message: 'Total oficial guardado correctamente',
      factura,
      totalOficial: totalOficialNum,
      totalCalculado: calculatedTotal,
      totalOficialFormateado: formatCurrency(totalOficialNum),
      totalCalculadoFormateado: formatCurrency(calculatedTotal),
      diferencia,
      diferenciaFormateada: formatCurrency(diferencia)
    })
  } catch (error) {
    console.error('Error saving factura total:', error)
    return NextResponse.json(
      { error: 'Failed to save factura total' },
      { status: 500 }
    )
  }
}
