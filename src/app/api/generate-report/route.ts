import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Workbook, Worksheet } from 'exceljs'

const prisma = new PrismaClient()

// Argentine currency format function
function formatARS(value: number): string {
  const parts = value.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return '$ ' + parts[0] + ',' + parts[1]
}

// Medium border style
const mediumBorder = {
  top: { style: 'medium' as const },
  bottom: { style: 'medium' as const },
  left: { style: 'medium' as const },
  right: { style: 'medium' as const }
}

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Include full end date

    // Get all fuel logs with IMPORTED status in date range
    const fuelLogs = await prisma.fuelLog.findMany({
      where: {
        status: 'IMPORTED',
        date: {
          gte: start,
          lte: end
        },
        cardId: {
          not: null
        }
      },
      include: {
        card: {
          include: {
            area: true,
            subArea: true
          }
        },
        user: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Group by MainArea
    const groupedByArea = fuelLogs.reduce((groups, log) => {
      const mainAreaName = log.card?.area?.name || 'Sin Área'
      if (!groups[mainAreaName]) {
        groups[mainAreaName] = []
      }
      groups[mainAreaName].push(log)
      return groups
    }, {} as Record<string, any[]>)

    // Create workbook
    const workbook = new Workbook()

    // Create one sheet per MainArea
    for (const [mainAreaName, logs] of Object.entries(groupedByArea)) {
      const worksheet = workbook.addWorksheet(mainAreaName)

      // Setup page configuration
      worksheet.pageSetup.orientation = 'landscape'
      worksheet.pageSetup.paperSize = 9 // A4
      worksheet.pageSetup.margins = {
        left: 0.278,
        right: 0.014,
        top: 0.75,
        bottom: 0.75,
        header: 0.417,
        footer: 0.417
      }

      // Set column widths
      worksheet.columns = [
        { width: 24.29 },  // A - Dependencia
        { width: 18 },     // B - Tarjeta
        { width: 32.29 },  // C - Conductor Autorizado
        { width: 14.29 },  // D - Dominio
        { width: 13.86 },  // E - Producto
        { width: 7.43 },   // F - Litros
        { width: 13 },     // G - Importe
        { width: 18.14 },  // H - Fecha
        { width: 39.57 },  // I - Establecimiento
        { width: 9.86 },   // J - Localidad
        { width: 13.43 }   // K - Remito
      ]

      // Row 1 - Title (merged A1:H1)
      const titleRow = worksheet.getRow(1)
      worksheet.mergeCells('A1:H1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = `Secretaria: ${mainAreaName} - Periodo ${startDate} Al ${endDate}`
      titleCell.font = { name: 'Calibri', size: 11, bold: true }
      titleCell.alignment = { horizontal: 'center' }
      titleCell.border = mediumBorder

      // Clear cells I1, J1, K1
      worksheet.getCell('I1').value = null
      worksheet.getCell('J1').value = null
      worksheet.getCell('K1').value = null

      // Row 2 - Headers
      const headers = [
        'Dependencia', 'Tarjeta', 'Conductor Autorizado', 'Dominio', 
        'Producto', 'Litros', 'Importe', 'Fecha', 
        'Establecimiento', 'Localidad', 'Remito'
      ]
      
      const headerRow = worksheet.getRow(2)
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = { name: 'Calibri', size: 11, bold: true }
        cell.alignment = { horizontal: 'center' }
        cell.border = mediumBorder
      })

      // Data rows (3 to N)
      let currentRow = 3
      let totalImporte = 0

      for (const log of logs) {
        const row = worksheet.getRow(currentRow)

        // Column A - Dependencia (left aligned)
        const depCell = row.getCell(1)
        depCell.value = log.card?.area?.name || ''
        depCell.font = { name: 'Calibri', size: 11 }
        depCell.alignment = { horizontal: 'left' }
        depCell.border = mediumBorder

        // Column B - Tarjeta
        const tarjetaCell = row.getCell(2)
        tarjetaCell.value = log.card?.cardNumber || ''
        tarjetaCell.font = { name: 'Calibri', size: 11 }
        tarjetaCell.border = mediumBorder

        // Column C - Conductor Autorizado
        const conductorCell = row.getCell(3)
        conductorCell.value = log.card?.identification || ''
        conductorCell.font = { name: 'Calibri', size: 11 }
        conductorCell.border = mediumBorder

        // Column D - Dominio
        const dominioCell = row.getCell(4)
        dominioCell.value = log.description || ''
        dominioCell.font = { name: 'Calibri', size: 11 }
        dominioCell.border = mediumBorder

        // Column E - Producto
        const productoCell = row.getCell(5)
        productoCell.value = log.description || ''
        productoCell.font = { name: 'Calibri', size: 11 }
        productoCell.border = mediumBorder

        // Column F - Litros (right aligned)
        const litrosCell = row.getCell(6)
        litrosCell.value = log.gallons || 0
        litrosCell.font = { name: 'Calibri', size: 11 }
        litrosCell.alignment = { horizontal: 'right' }
        litrosCell.border = mediumBorder

        // Column G - Importe (right aligned, Argentine format)
        const importeCell = row.getCell(7)
        importeCell.value = log.amount
        importeCell.font = { name: 'Calibri', size: 11 }
        importeCell.alignment = { horizontal: 'right' }
        importeCell.numFmt = '$ #.##0,00'
        importeCell.border = mediumBorder

        totalImporte += log.amount

        // Column H - Fecha
        const fechaCell = row.getCell(8)
        fechaCell.value = log.date
        fechaCell.font = { name: 'Calibri', size: 11 }
        fechaCell.border = mediumBorder

        // Column I - Establecimiento
        const establecimientoCell = row.getCell(9)
        establecimientoCell.value = log.location || ''
        establecimientoCell.font = { name: 'Calibri', size: 11 }
        establecimientoCell.border = mediumBorder

        // Column J - Localidad
        const localidadCell = row.getCell(10)
        localidadCell.value = '' // No localidad field in current schema
        localidadCell.font = { name: 'Calibri', size: 11 }
        localidadCell.border = mediumBorder

        // Column K - Remito
        const remitoCell = row.getCell(11)
        remitoCell.value = log.remito || ''
        remitoCell.font = { name: 'Calibri', size: 11 }
        remitoCell.border = mediumBorder

        currentRow++
      }

      // Last row - Total
      const totalRow = worksheet.getRow(currentRow)
      
      // Merge cells A:F
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`)
      const totalLabelCell = totalRow.getCell(1)
      totalLabelCell.value = 'Total : '
      totalLabelCell.font = { name: 'Calibri', size: 11 }
      totalLabelCell.alignment = { horizontal: 'right' }
      totalLabelCell.border = mediumBorder

      // Column G - Total sum
      const totalValueCell = totalRow.getCell(7)
      totalValueCell.value = totalImporte
      totalValueCell.font = { name: 'Calibri', size: 11 }
      totalValueCell.alignment = { horizontal: 'right' }
      totalValueCell.numFmt = '$ #.##0,00'
      totalValueCell.border = mediumBorder

      // Clear columns H, I, J, K in total row
      totalRow.getCell(8).value = null
      totalRow.getCell(9).value = null
      totalRow.getCell(10).value = null
      totalRow.getCell(11).value = null
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return as downloadable file
    const response = new NextResponse(buffer)
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.headers.set('Content-Disposition', `attachment; filename="reporte_${startDate}_${endDate}.xlsx"`)
    
    return response

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
