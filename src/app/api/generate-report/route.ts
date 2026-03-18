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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const areaId = searchParams.get('areaId')
    const factura = searchParams.get('factura')

    // Validation: either factura OR both dates are required
    if (!factura && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Either factura number or both startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Parse dates only if provided
    let start, end
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include full end date
    }

    // Build where clause
    const whereClause: any = {
      status: 'IMPORTED',
      cardId: {
        not: null
      }
    }

    // Add date range filter only if dates are provided
    if (start && end) {
      whereClause.date = {
        gte: start,
        lte: end
      }
    }

    // Add area filter if provided
    if (areaId) {
      whereClause.card = { areaId }
    }

    // Add factura filter if provided
    if (factura) {
      whereClause.factura = factura
    }

    // Get all fuel logs with IMPORTED status
    const fuelLogs = await prisma.fuelLog.findMany({
      where: whereClause,
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

    // Get the area name for title
    const areaName = fuelLogs.length > 0 && fuelLogs[0].card?.area?.name ? fuelLogs[0].card.area.name : 'Área Desconocida'

    // Create workbook
    const workbook = new Workbook()

    // Create single worksheet for the selected area
    const worksheet = workbook.addWorksheet(areaName)

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
    worksheet.mergeCells('A1:H1')
    const titleCell = worksheet.getCell('A1')
    // Format dates as DD/MM/YYYY without timezone conversion
    const formatDateTitle = (dateStr: string): string => {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}` 
    }
    
    const formattedStartDate = startDate ? formatDateTitle(startDate) : ''
    const formattedEndDate = endDate ? formatDateTitle(endDate) : ''
    
    const title = factura 
      ? `${areaName} - Factura ${factura}`
      : `${areaName} - Periodo ${formattedStartDate} Al ${formattedEndDate}`
    titleCell.value = title
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

    for (const log of fuelLogs) {
      const row = worksheet.getRow(currentRow)

      // Column A - Dependencia (SubArea name)
      const depCell = row.getCell(1)
      depCell.value = log.card?.subArea?.name || ''
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
      conductorCell.value = log.conductor || ''
      conductorCell.font = { name: 'Calibri', size: 11 }
      conductorCell.border = mediumBorder

      // Column D - Dominio (vehicle plate from Excel)
      const dominioCell = row.getCell(4)
      dominioCell.value = log.dominio || ''
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

      // Column G - Importe (right aligned, Argentine format as text)
      const importeCell = row.getCell(7)
      importeCell.value = formatARS(log.amount)
      importeCell.font = { name: 'Calibri', size: 11 }
      importeCell.alignment = { horizontal: 'right' }
      importeCell.border = mediumBorder

      // Column H - Fecha (formatted as DD/MM/YYYY, centered)
      const fechaCell = row.getCell(8)
      const date = new Date(log.date)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      fechaCell.value = `${day}/${month}/${year}`
      fechaCell.font = { name: 'Calibri', size: 11 }
      fechaCell.alignment = { horizontal: 'center' }
      fechaCell.border = mediumBorder

      // Column I - Establecimiento
      const establecimientoCell = row.getCell(9)
      establecimientoCell.value = log.location || ''
      establecimientoCell.font = { name: 'Calibri', size: 11 }
      establecimientoCell.border = mediumBorder

      // Column J - Localidad
      const localidadCell = row.getCell(10)
      localidadCell.value = log.localidad || ''
      localidadCell.font = { name: 'Calibri', size: 11 }
      localidadCell.border = mediumBorder

      // Column K - Remito
      const remitoCell = row.getCell(11)
      remitoCell.value = log.remito || ''
      remitoCell.font = { name: 'Calibri', size: 11 }
      remitoCell.border = mediumBorder

      currentRow++
    }

    const totalRowNumber = worksheet.rowCount + 1
const totalImporte = fuelLogs.reduce((sum, log) => sum + (log.amount || 0), 0)

worksheet.mergeCells(`A${totalRowNumber}:F${totalRowNumber}`)

const totalLabelCell = worksheet.getCell(`A${totalRowNumber}`)
totalLabelCell.value = 'Total : '
totalLabelCell.alignment = { horizontal: 'right' }
totalLabelCell.font = { name: 'Calibri', size: 11 }
totalLabelCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }

const totalValueCell = worksheet.getCell(`G${totalRowNumber}`)
totalValueCell.value = formatARS(totalImporte)
totalValueCell.alignment = { horizontal: 'right' }
totalValueCell.font = { name: 'Calibri', size: 11 }
totalValueCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }

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
