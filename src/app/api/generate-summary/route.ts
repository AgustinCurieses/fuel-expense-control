import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as ExcelJS from 'exceljs'

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

// Custom currency formatter for KPI values (ensures $ prefix with space)
function formatARSKPI(amount: number): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
  return `$ ${formatted}`
}

// Safe merge helper function
function safeMerge(ws: ExcelJS.Worksheet, range: string) {
  try {
    ws.unMergeCells(range);
  } catch (e) {
    // range wasn't merged, ignore
  }
  ws.mergeCells(range);
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== SUMMARY REPORT GENERATION START ===')
    
    const { searchParams } = new URL(request.url)
    const factura = searchParams.get('factura')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const areaId = searchParams.get('areaId')

    console.log('Request params:', { factura, startDate, endDate, areaId })

    // Build where clause
    const whereClause: any = {
      status: 'IMPORTED',
      cardId: { not: null }
    }

    // Add date range filter if provided
    if (startDate && endDate && !factura) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      whereClause.date = {
        gte: start,
        lte: end
      }
    }

    // Add factura filter if provided
    if (factura) {
      whereClause.factura = factura
    }

    // Add area filter if provided
    if (areaId) {
      whereClause.mainAreaId = areaId
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2))

    // Get all fuel logs matching criteria
    const fuelLogs = await prisma.fuelLog.findMany({
      where: whereClause,
      include: {
        card: {
          include: {
            area: true,
            subArea: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    console.log('Found fuel logs:', fuelLogs.length)

    if (fuelLogs.length === 0) {
      console.log('No data found for criteria')
      return NextResponse.json(
        { error: 'No data found for specified criteria' },
        { status: 404 }
      )
    }

    // Get previous factura for comparative analysis
    let previousFactura = null
    let previousByArea = []
    
    if (factura) {
      // Step 1: get all distinct factura values that have fuel logs, ordered by date
      const allFacturas = await prisma.fuelLog.findMany({
        where: { 
          factura: { not: null }, 
          status: 'IMPORTED' 
        },
        select: { factura: true, date: true },
        orderBy: { date: 'asc' }
      })

      // Step 2: find the one immediately before current factura
      const uniqueFacturas = Array.from(new Set(allFacturas.map(f => f.factura)))
      const facturaList = uniqueFacturas.filter(f => f !== null).sort((a, b) => a.localeCompare(b))
      
      const currentIndex = facturaList.indexOf(factura)
      previousFactura = currentIndex > 0 ? facturaList[currentIndex - 1] : null

      // Step 3: get spend per mainArea for previous factura
      if (previousFactura) {
        const previousPeriodData = await prisma.fuelLog.groupBy({
          by: ['mainAreaId'],
          where: { 
            factura: previousFactura, 
            status: 'IMPORTED' 
          },
          _sum: { totalCost: true }
        })

        // Step 4: get mainArea names
        const areas = await prisma.mainArea.findMany({
          where: {
            id: { in: previousPeriodData.map(item => item.mainAreaId) }
          }
        })

        const areaMap = new Map(areas.map(a => [a.id, a.name]))
        
        previousByArea = previousPeriodData.map(item => ({
          mainAreaId: item.mainAreaId,
          areaName: areaMap.get(item.mainAreaId) || 'Sin Área',
          totalCost: item._sum.totalCost || 0
        }))
      }
    }

    console.log('Previous factura:', previousFactura)
    console.log('Previous period areas:', previousByArea.length)

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Resumen Ejecutivo')

    // Set page setup - Portrait A4
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0, footer: 0 }
    }

    // Set ALL column widths explicitly using getColumn() method for better control
    worksheet.getColumn('A').width = 22;   // Secretaría
    worksheet.getColumn('B').width = 7;    // Cargas
    worksheet.getColumn('C').width = 11;   // Inf. Diesel (L)
    worksheet.getColumn('D').width = 11;   // Nafta Super (L)
    worksheet.getColumn('E').width = 10;   // Infinia (L)
    worksheet.getColumn('F').width = 11;   // D.Diesel 500 (L)
    worksheet.getColumn('G').width = 16;   // Importe
    worksheet.getColumn('H').width = 9;    // % del Total
    worksheet.getColumn('I').width = 11;   // Total Litros
    worksheet.getColumn('J').width = 9;    // % Litros

    // Disable gridlines
    // worksheet.showGridLines = false // Commented out as property doesn't exist

    // Set all row heights at the beginning
    for (let i = 1; i <= 50; i++) {
      const row = worksheet.getRow(i)
      if (i === 1 || i === 2) {
        row.height = 20
      }
      else if (i === 3 || i === 6 || i === 19 || i === 27) {
        row.height = 8
      }
      else if (i === 4 || i === 5) {
        row.height = 22
      }
      else if ([7, 20, 28].includes(i)) {
        row.height = 18
      }
      else if ([8, 21, 29, 33].includes(i)) {
        row.height = 16
      }
      else {
        row.height = 14
      }
      row.hidden = false
    }

    // SECTION 1 - Institutional Header (rows 1-3)
    // Row 1: Main title
    worksheet.mergeCells('A1:J1')
    worksheet.getCell('A1').value = 'MUNICIPALIDAD DE LUJÁN — Subdirección de Patrimonio'
    worksheet.getCell('A1').font = { name: 'Calibri', size: 13, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A1').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // Row 2: Subtitle
    const periodLabel = factura 
      ? `Factura N°: ${factura}`
      : startDate && endDate 
        ? `Período: ${startDate} Al ${endDate}`
        : 'Todos los períodos'

    worksheet.mergeCells('A2:J2')
    worksheet.getCell('A2').value = `Resumen de Consumo de Combustible — ${periodLabel}`
    worksheet.getCell('A2').font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A2').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // SECTION 2 - KPI Boxes (rows 4-5) - Individual cells with borders
    
    // Calculate KPIs
    const totalFacturado = fuelLogs.reduce((sum, log) => sum + log.amount, 0)
    const vehiculosActivos = new Set(fuelLogs.map(log => log.card?.cardNumber)).size
    const totalCargas = fuelLogs.length
    const totalLitros = fuelLogs.reduce((sum, log) => sum + log.gallons, 0)
    const precioPromedio = totalLitros > 0 ? totalFacturado / totalLitros : 0

    console.log('KPIs calculated:', { totalFacturado, vehiculosActivos, totalCargas, totalLitros, precioPromedio })

    // KPI labels - row 4 (merge 3 columns each)
    worksheet.mergeCells('A4:C4')
    worksheet.getCell('A4').value = 'Total Facturado'
    worksheet.getCell('A4').font = { bold: true, name: 'Calibri', size: 9 }
    worksheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell('A4').border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'thin' } }
    
    worksheet.mergeCells('D4:F4')
    worksheet.getCell('D4').value = 'Vehículos Activos'
    worksheet.getCell('D4').font = { bold: true, name: 'Calibri', size: 9 }
    worksheet.getCell('D4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('D4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell('D4').border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'thin' } }
    
    worksheet.mergeCells('G4:I4')
    worksheet.getCell('G4').value = 'Total de Cargas'
    worksheet.getCell('G4').font = { bold: true, name: 'Calibri', size: 9 }
    worksheet.getCell('G4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('G4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell('G4').border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'thin' } }
    
    worksheet.getCell('J4').value = 'Precio/Litro'
    worksheet.getCell('J4').font = { bold: true, name: 'Calibri', size: 9 }
    worksheet.getCell('J4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('J4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell('J4').border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'thin' } }

    // KPI values - row 5 (merge 3 columns each)
    worksheet.mergeCells('A5:C5')
    worksheet.getCell('A5').value = formatARSKPI(totalFacturado)
    worksheet.getCell('A5').font = { bold: true, name: 'Calibri', size: 13 }
    worksheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A5').border = { top: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } }
    
    worksheet.mergeCells('D5:F5')
    worksheet.getCell('D5').value = String(vehiculosActivos)
    worksheet.getCell('D5').font = { bold: true, name: 'Calibri', size: 13 }
    worksheet.getCell('D5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('D5').border = { top: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } }
    
    worksheet.mergeCells('G5:I5')
    worksheet.getCell('G5').value = String(totalCargas)
    worksheet.getCell('G5').font = { bold: true, name: 'Calibri', size: 13 }
    worksheet.getCell('G5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('G5').border = { top: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } }
    
    worksheet.getCell('J5').value = formatARSKPI(precioPromedio)
    worksheet.getCell('J5').font = { bold: true, name: 'Calibri', size: 13 }
    worksheet.getCell('J5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('J5').border = { top: { style: 'thin' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } }

    // Row 6: Empty row
    const row6 = worksheet.getRow(6)
    row6.height = 8

    // SECTION 3 - Consumption by Secretaría (rows 7-19)
    let currentRow = 7
    
    // Row 7: Section title
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'CONSUMO POR SECRETARÍA'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).font = { ...worksheet.getCell(`A${currentRow}`).font, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    const sectionTitleRow7 = worksheet.getRow(7)
    sectionTitleRow7.height = 18
    currentRow++

    // Row 8: Headers
    const headers = ['Secretaría', 'Cargas', 'Inf. Diesel (L)', 'Nafta Super (L)', 'Infinia (L)', 'D.Diesel 500 (L)', 'Importe', '% del Total', 'Total Litros', '% Litros']
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
      cell.value = header
      cell.font = { name: 'Calibri', size: 9, bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
    })
    const headerRow8 = worksheet.getRow(8)
    headerRow8.height = 16
    currentRow++

    // Group consumption by MainArea
    const consumptionByArea: Record<string, any> = {}

    // Initialize consumption by area
    fuelLogs.forEach(log => {
      const areaName = log.card?.area?.name || 'Sin Área'
      if (!consumptionByArea[areaName]) {
        consumptionByArea[areaName] = { 
          cargas: 0, 
          infDieselL: 0, 
          naftaSuperL: 0, 
          infiniaL: 0, 
          diesel500L: 0, 
          importe: 0 
        }
      }
      
      consumptionByArea[areaName].cargas++
      consumptionByArea[areaName].importe += log.amount
      
      // Group by fuel type - Fix fuel classification logic
      const desc = (log.description || '').toUpperCase()
      if (desc.includes('D.DIESEL') || desc.includes('DIESEL 500') || desc === 'D.DIESEL 500') {
        consumptionByArea[areaName].diesel500L += log.gallons
      } else if (desc.includes('INFINIA DIESEL') || (desc.includes('INFINIA') && desc.includes('DIESEL'))) {
        consumptionByArea[areaName].infDieselL += log.gallons
      } else if (desc.includes('NAFTA') || desc.includes('SUPER')) {
        consumptionByArea[areaName].naftaSuperL += log.gallons
      } else if (desc.includes('INFINIA')) {
        consumptionByArea[areaName].infiniaL += log.gallons
      }
    })
    // Display consumption by area with alternating backgrounds
    let dataRowIndex = 0
    Object.keys(consumptionByArea).forEach(areaName => {
      const area = consumptionByArea[areaName]
      const totalImporte = area.importe
      const porcentajeTotal = totalFacturado > 0 ? (totalImporte / totalFacturado) * 100 : 0
      
      // Alternating background colors
      const bgColor = dataRowIndex % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9'
      
      worksheet.getCell(`A${currentRow}`).value = areaName
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`B${currentRow}`).value = area.cargas.toString()
      worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`B${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`C${currentRow}`).value = area.infDieselL.toFixed(2).replace('.', ',')
      worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`C${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`D${currentRow}`).value = area.naftaSuperL.toFixed(2).replace('.', ',')
      worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`D${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`E${currentRow}`).value = area.infiniaL.toFixed(2).replace('.', ',')
      worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`E${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`F${currentRow}`).value = area.diesel500L.toFixed(2).replace('.', ',')
      worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`F${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`G${currentRow}`).value = formatARS(totalImporte)
      worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`G${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`G${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`H${currentRow}`).value = `${porcentajeTotal.toFixed(1).replace('.', ',')}%`
      worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`H${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      // Column I: Total Litros
      const totalLitrosRow = area.infDieselL + area.naftaSuperL + area.infiniaL + area.diesel500L
      worksheet.getCell(`I${currentRow}`).value = totalLitrosRow.toFixed(2).replace('.', ',')
      worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`I${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      // Column J: % Litros
      const totalAllLitros = Object.values(consumptionByArea).reduce((sum, area) => 
        sum + area.infDieselL + area.naftaSuperL + area.infiniaL + area.diesel500L, 0)
      const porcentajeLitros = totalAllLitros > 0 ? (totalLitrosRow / totalAllLitros) * 100 : 0
      worksheet.getCell(`J${currentRow}`).value = `${porcentajeLitros.toFixed(1).replace('.', ',')}%`
      worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`J${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      const dataRow = worksheet.getRow(currentRow)
      dataRow.height = 14
      currentRow++
      dataRowIndex++
    })

    // TOTAL row with light gray background
    const totals = Object.keys(consumptionByArea).reduce((acc, areaName) => {
      const area = consumptionByArea[areaName]
      acc.cargas += area.cargas
      acc.infDieselL += area.infDieselL
      acc.naftaSuperL += area.naftaSuperL
      acc.infiniaL += area.infiniaL
      acc.diesel500L += area.diesel500L
      acc.importe += area.importe
      return acc
    }, { cargas: 0, infDieselL: 0, naftaSuperL: 0, infiniaL: 0, diesel500L: 0, importe: 0 })

    worksheet.getCell(`A${currentRow}`).value = 'TOTAL'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`B${currentRow}`).value = totals.cargas.toString()
    worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`B${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`C${currentRow}`).value = totals.infDieselL.toFixed(2).replace('.', ',')
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`C${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`D${currentRow}`).value = totals.naftaSuperL.toFixed(2).replace('.', ',')
    worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`D${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`E${currentRow}`).value = totals.infiniaL.toFixed(2).replace('.', ',')
    worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`E${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`F${currentRow}`).value = totals.diesel500L.toFixed(2).replace('.', ',')
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`G${currentRow}`).value = formatARS(totals.importe)
    worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`G${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`G${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`H${currentRow}`).value = `${((totals.importe / totalFacturado) * 100).toFixed(1).replace('.', ',')}%`
    worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`H${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    // Column I: Total Litros (sum of all fuel types)
    const totalLitrosGrand = totals.infDieselL + totals.naftaSuperL + totals.infiniaL + totals.diesel500L
    worksheet.getCell(`I${currentRow}`).value = totalLitrosGrand.toFixed(2).replace('.', ',')
    worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`I${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    // Column J: % Litros (should be 100,0%)
    worksheet.getCell(`J${currentRow}`).value = '100,0%'
    worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`J${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    const totalRow = worksheet.getRow(currentRow)
    totalRow.height = 16
    currentRow++

// Row 19: Empty row
    const row19 = worksheet.getRow(19)
    row19.height = 8

    // SECTION 4 - Top 5 Vehicles (rows 20-27)
    currentRow = 20
    
    // Row 20: Section title
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'TOP 5 VEHÍCULOS — MAYOR CONSUMO'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).font = { ...worksheet.getCell(`A${currentRow}`).font, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    const sectionTitleRow20 = worksheet.getRow(20)
    sectionTitleRow20.height = 18
    currentRow++

    // Row 21: Headers
    worksheet.getCell(`A${currentRow}`).value = 'Dominio'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `B${currentRow}:C${currentRow}`)
    worksheet.getCell(`B${currentRow}`).value = 'Secretaría'
    worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`B${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`D${currentRow}`).value = 'Diesel L'
    worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`D${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`E${currentRow}`).value = 'Nafta L'
    worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`E${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`F${currentRow}`).value = 'Infinia L'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`G${currentRow}`).value = 'D.Diesel 500 L'
    worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`G${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`G${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`H${currentRow}`).value = 'Total L'
    worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`H${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`I${currentRow}`).value = 'Importe'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`I${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`J${currentRow}`).value = '% del Total'
    worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`J${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getRow(currentRow).height = 16
    currentRow++

    // Calculate fuel type totals for distribution
    const fuelTypeTotals: Record<string, { litros: number, importe: number }> = fuelLogs.reduce((acc, log) => {
      let fuelType = 'Otros'
      let litros = log.gallons
      let importe = log.amount
      
      // Fix fuel classification logic
      const desc = (log.description || '').toUpperCase()
      if (desc.includes('D.DIESEL') || desc.includes('DIESEL 500') || desc === 'D.DIESEL 500') {
        fuelType = 'D.Diesel 500 (L)'
      } else if (desc.includes('INFINIA DIESEL') || (desc.includes('INFINIA') && desc.includes('DIESEL'))) {
        fuelType = 'Inf. Diesel (L)'
      } else if (desc.includes('NAFTA') || desc.includes('SUPER')) {
        fuelType = 'Nafta Super (L)'
      } else if (desc.includes('INFINIA')) {
        fuelType = 'Infinia (L)'
      }
      
      if (!acc[fuelType]) {
        acc[fuelType] = { litros: 0, importe: 0 }
      }
      acc[fuelType].litros += litros
      acc[fuelType].importe += importe
      return acc
    }, {} as Record<string, { litros: number, importe: number }>)

    // Initialize vehicle consumption
    const vehicleConsumption: Record<string, any> = {}
    fuelLogs.forEach(log => {
      const dominio = log.dominio || log.card?.cardNumber || 'Sin Dominio'
      const secretaria = log.card?.area?.name || 'Sin Secretaría'
      
      if (!vehicleConsumption[dominio]) {
        vehicleConsumption[dominio] = { 
          dominio, 
          secretaria, 
          infDieselL: 0, 
          naftaSuperL: 0, 
          infiniaL: 0, 
          diesel500L: 0, 
          importe: 0
        }
      }
      
      vehicleConsumption[dominio].secretaria = secretaria
      vehicleConsumption[dominio].importe += log.amount
      
      // Group by fuel type - Fix fuel classification logic
      const desc = (log.description || '').toUpperCase()
      if (desc.includes('D.DIESEL') || desc.includes('DIESEL 500') || desc === 'D.DIESEL 500') {
        vehicleConsumption[dominio].diesel500L += log.gallons
      } else if (desc.includes('INFINIA DIESEL') || (desc.includes('INFINIA') && desc.includes('DIESEL'))) {
        vehicleConsumption[dominio].infDieselL += log.gallons
      } else if (desc.includes('NAFTA') || desc.includes('SUPER')) {
        vehicleConsumption[dominio].naftaSuperL += log.gallons
      } else if (desc.includes('INFINIA')) {
        vehicleConsumption[dominio].infiniaL += log.gallons
      }
    })

    // Sort vehicles by total amount and get top 5
    const top5Vehicles = Object.keys(vehicleConsumption)
      .sort((a, b) => vehicleConsumption[b].importe - vehicleConsumption[a].importe)
      .slice(0, 5)

    // Data rows 22-26 (Top 5 vehicles)
    for (let i = 0; i < 5 && currentRow <= 26; i++) {
      const bgColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9'
      const vehicle = vehicleConsumption[top5Vehicles[i]]
      const totalLitros = vehicle.infDieselL + vehicle.naftaSuperL + vehicle.infiniaL + vehicle.diesel500L
      
      worksheet.getCell(`A${currentRow}`).value = vehicle.dominio
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      safeMerge(worksheet, `B${currentRow}:C${currentRow}`)
      worksheet.getCell(`B${currentRow}`).value = vehicle.secretaria
      worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`B${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`D${currentRow}`).value = vehicle.infDieselL.toFixed(2).replace('.', ',')
      worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`D${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`E${currentRow}`).value = vehicle.naftaSuperL.toFixed(2).replace('.', ',')
      worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`E${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`F${currentRow}`).value = vehicle.infiniaL.toFixed(2).replace('.', ',')
      worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`F${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`G${currentRow}`).value = vehicle.diesel500L.toFixed(2).replace('.', ',')
      worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`G${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`G${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`H${currentRow}`).value = totalLitros.toFixed(2).replace('.', ',')
      worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`H${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`I${currentRow}`).value = formatARS(vehicle.importe)
      worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`I${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`J${currentRow}`).value = `${((vehicle.importe / totalFacturado) * 100).toFixed(1).replace('.', ',')}%`
      worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`J${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getRow(currentRow).height = 14
      currentRow++
    }

    // Row 27: Empty row
    const row27 = worksheet.getRow(27)
    row27.height = 8

    // SECTION 5 - Fuel Distribution (rows 28-31)
    currentRow = 28
    
    // Row 28: Section title
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'DISTRIBUCIÓN POR COMBUSTIBLE'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).font = { ...worksheet.getCell(`A${currentRow}`).font, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 18
    currentRow++

    // Row 29: Headers
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Combustible'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`E${currentRow}`).value = 'Litros'
    worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`E${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`F${currentRow}`).value = '% del Total'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getRow(currentRow).height = 16
    currentRow++

    // Data rows 30-31: Fuel distribution data - Show ALL 4 fuel types explicitly defined
    const fuelTypes = [
      { label: 'Inf. Diesel (L)', key: 'infDiesel' },
      { label: 'Nafta Super (L)', key: 'naftaSuper' },
      { label: 'Infinia (L)', key: 'infinia' },
      { label: 'D.Diesel 500 (L)', key: 'dDiesel500' }
    ]
    
    for (let i = 0; i < fuelTypes.length; i++) {
      const bgColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9'
      const fuelType = fuelTypes[i]
      const total = fuelTypeTotals[fuelType.label] || { litros: 0, importe: 0 }
      const porcentajeTotal = totalFacturado > 0 ? (total.importe / totalFacturado) * 100 : 0
      
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
      worksheet.getCell(`A${currentRow}`).value = fuelType.label
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`E${currentRow}`).value = total.litros.toFixed(2).replace('.', ',')
      worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`E${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`F${currentRow}`).value = `${porcentajeTotal.toFixed(1).replace('.', ',')}%`
      worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`F${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      const fuelDataRow = worksheet.getRow(currentRow)
      fuelDataRow.height = 14
      fuelDataRow.hidden = false
      currentRow++
    }

    // SECTION 6 - ANÁLISIS COMPARATIVO (rows 32+)
    // Ensure we have proper spacing
    if (currentRow < 32) {
      worksheet.getRow(currentRow).height = 8
      currentRow = 32
    }
    
    // Row 32: Section title
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'ANÁLISIS COMPARATIVO'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).font = { ...worksheet.getCell(`A${currentRow}`).font, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 18
    currentRow++

    // BLOCK 1 - "VARIACIÓN VS. PERÍODO ANTERIOR" table
    // Row 34: Headers
    worksheet.getCell(`A${currentRow}`).value = 'Secretaría'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `B${currentRow}:C${currentRow}`)
    worksheet.getCell(`B${currentRow}`).value = 'Factura Ant.'
    worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`B${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `D${currentRow}:E${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = 'Factura Act.'
    worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`D${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `F${currentRow}:G${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = 'Δ Importe'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `H${currentRow}:I${currentRow}`)
    worksheet.getCell(`H${currentRow}`).value = 'Δ %'
    worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`H${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`J${currentRow}`).value = 'Tendencia'
    worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
    worksheet.getCell(`J${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 16
    currentRow++

    // Data rows - only include areas that appear in CURRENT factura
    let comparisonRowIndex = 0
    Object.keys(consumptionByArea).forEach(areaName => {
      const currentArea = consumptionByArea[areaName]
      const previousArea = previousByArea.find(p => p.mainAreaId === currentArea.mainAreaId)
      
      const currentTotal = currentArea.importe || 0
      const previousTotal = previousArea?.totalCost || 0
      const difference = currentTotal - previousTotal
      const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0
      
      // Alternating background colors
      const bgColor = comparisonRowIndex % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9'
      
      worksheet.getCell(`A${currentRow}`).value = areaName
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }

      safeMerge(worksheet, `B${currentRow}:C${currentRow}`)
      worksheet.getCell(`B${currentRow}`).value = previousFactura ? formatARSKPI(previousTotal) : 'Sin dato anterior'
      worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`B${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }

      safeMerge(worksheet, `D${currentRow}:E${currentRow}`)
      worksheet.getCell(`D${currentRow}`).value = formatARSKPI(currentTotal)
      worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`D${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }

      safeMerge(worksheet, `F${currentRow}:G${currentRow}`)
      worksheet.getCell(`F${currentRow}`).value = formatARSKPI(difference)
      worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`F${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }

      safeMerge(worksheet, `H${currentRow}:I${currentRow}`)
      worksheet.getCell(`H${currentRow}`).value = previousTotal > 0 ? `${percentageChange >= 0 ? '+' : '-'}${percentageChange.toFixed(1).replace('.', ',')}%` : 'N/A'
      worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`H${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }

      worksheet.getCell(`J${currentRow}`).value = difference > 0 ? '▲' : difference < 0 ? '▼' : '='
      worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 9 }
      worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      worksheet.getCell(`J${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      const dataRow = worksheet.getRow(currentRow)
      dataRow.height = 14
      currentRow++
      comparisonRowIndex++
    })

    // TOTAL row
    const currentTotalAmount = Object.values(consumptionByArea).reduce((sum, area) => sum + (area.importe || 0), 0)
    const previousTotalAmount = previousByArea.reduce((sum, area) => sum + area.totalCost, 0)
    const totalDifference = currentTotalAmount - previousTotalAmount
    const totalPercentageChange = previousTotalAmount > 0 ? (totalDifference / previousTotalAmount) * 100 : 0

    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'TOTAL'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `B${currentRow}:C${currentRow}`)
    worksheet.getCell(`B${currentRow}`).value = previousFactura ? formatARSKPI(previousTotalAmount) : 'Sin dato anterior'
    worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`B${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `D${currentRow}:E${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = formatARSKPI(currentTotalAmount)
    worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`D${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `F${currentRow}:G${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = formatARSKPI(totalDifference)
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `H${currentRow}:I${currentRow}`)
    worksheet.getCell(`H${currentRow}`).value = previousTotalAmount > 0 ? `${totalPercentageChange >= 0 ? '+' : '-'}${totalPercentageChange.toFixed(1).replace('.', ',')}%` : 'N/A'
    worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`H${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`J${currentRow}`).value = totalDifference > 0 ? '▲' : totalDifference < 0 ? '▼' : '='
    worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 9, bold: true }
    worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    worksheet.getCell(`J${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 16
    currentRow++

    // BLOCK 2 - "EVOLUCIÓN DEL PRECIO POR LITRO" (single info row)
    // Row 36: Empty spacer
    worksheet.getRow(currentRow).height = 8
    currentRow++

    // Row 37: Section title
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'EVOLUCIÓN DEL PRECIO POR LITRO'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).font = { ...worksheet.getCell(`A${currentRow}`).font, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 18
    currentRow++

    // Row 38: Data row
    const currentPrecioPromedio = precioPromedio
    let previousPrecioPromedio = 0
    if (previousFactura) {
      const previousPeriodTotals = await prisma.fuelLog.aggregate({
        where: { factura: previousFactura, status: 'IMPORTED' },
        _sum: { totalCost: true, gallons: true }
      })
      previousPrecioPromedio = previousPeriodTotals._sum.totalCost && previousPeriodTotals._sum.gallons > 0 
        ? previousPeriodTotals._sum.totalCost / previousPeriodTotals._sum.gallons 
        : 0
    }
    const precioVariation = currentPrecioPromedio - previousPrecioPromedio
    const precioPercentageChange = previousPrecioPromedio > 0 ? (precioVariation / previousPrecioPromedio) * 100 : 0

    safeMerge(worksheet, `A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Precio actual:'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `C${currentRow}:E${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = 'Precio anterior:'
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`C${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `F${currentRow}:H${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = 'Variación:'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `I${currentRow}:J${currentRow}`)
    worksheet.getCell(`I${currentRow}`).value = previousFactura ? `${precioPercentageChange >= 0 ? '+' : '-'}${precioPercentageChange.toFixed(1).replace('.', ',')}%` : 'Sin dato anterior'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`I${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 22
    currentRow++

    // BLOCK 3 - "CONCENTRACIÓN DEL GASTO" (single info row)
    // Row 39: Empty spacer
    worksheet.getRow(currentRow).height = 8
    currentRow++

    // Row 40: Section title
    safeMerge(worksheet, `A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'CONCENTRACIÓN DEL GASTO'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
    worksheet.getCell(`A${currentRow}`).font = { ...worksheet.getCell(`A${currentRow}`).font, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 18
    currentRow++

    // Row 41: Data row
    const currentTop3Total = Object.values(consumptionByArea)
      .sort((a, b) => (b.importe || 0) - (a.importe || 0))
      .slice(0, 3)
      .reduce((sum, area) => sum + (area.importe || 0), 0)
    
    let previousTop3Total = 0
    let previousConcentration = 0
    if (previousFactura) {
      const previousAreasSorted = previousByArea.sort((a, b) => b.totalCost - a.totalCost)
      previousTop3Total = previousAreasSorted.slice(0, 3).reduce((sum, area) => sum + area.totalCost, 0)
      previousConcentration = previousTotalAmount > 0 ? (previousTop3Total / previousTotalAmount) * 100 : 0
    }
    
    const currentConcentration = currentTotalAmount > 0 ? (currentTop3Total / currentTotalAmount) * 100 : 0
    const concentrationVariation = currentConcentration - previousConcentration

    safeMerge(worksheet, `A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Top 3 actual:'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `C${currentRow}:E${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = `${currentConcentration.toFixed(1).replace('.', ',')}% del gasto total`
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`C${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `F${currentRow}:H${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = 'Top 3 anterior:'
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `G${currentRow}:J${currentRow}`)
    worksheet.getCell(`G${currentRow}`).value = previousFactura ? `${previousConcentration.toFixed(1).replace('.', ',')}% del gasto total` : 'Sin dato anterior'
    worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`G${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`G${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `A${currentRow}:F${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Δ concentración:'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    safeMerge(worksheet, `G${currentRow}:J${currentRow}`)
    worksheet.getCell(`G${currentRow}`).value = previousFactura ? `${concentrationVariation >= 0 ? '+' : '-'}${concentrationVariation.toFixed(1).replace('.', ',')} puntos porcentuales` : 'Sin dato anterior'
    worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`G${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
    worksheet.getCell(`G${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    worksheet.getRow(currentRow).height = 22
    currentRow++

    // Set print area to A1:J50 for portrait A4
    worksheet.pageSetup.printArea = 'A1:J50'

    // FIX 2: Disable wrap_text on ALL cells to prevent Excel from overriding row heights
    const lastRow = Math.max(currentRow, 50) // Ensure we cover all used rows
    for (let r = 1; r <= lastRow; r++) {
      const row = worksheet.getRow(r)
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.alignment) {
          cell.alignment = { ...cell.alignment, wrapText: false }
        } else {
          cell.alignment = { wrapText: false }
        }
      })
    }

    // Set row heights again AFTER disabling wrapText to ensure they persist
    for (let i = 1; i <= 50; i++) {
      const row = worksheet.getRow(i)
      if (i === 1 || i === 2) {
        row.height = 20
      }
      else if (i === 3 || i === 6 || i === 19 || i === 27) {
        row.height = 8
      }
      else if (i === 4 || i === 5) {
        row.height = 22
      }
      else if ([7, 20, 28].includes(i)) {
        row.height = 18
      }
      else if ([8, 21, 29, 33].includes(i)) {
        row.height = 16
      }
      else {
        row.height = 14
      }
      row.hidden = false
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Set response headers
    const response = new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Resumen Ejecutivo.xlsx"`
      }
    })

    console.log('=== SUMMARY REPORT GENERATION SUCCESS ===')
    return response

  } catch (error) {
    console.error('=== SUMMARY REPORT GENERATION ERROR ===')
    console.error('Full error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { 
        error: 'Failed to generate summary report',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack available'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}