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

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Resumen Ejecutivo')

    // Set page setup
    worksheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9, // A4
      margins: {
        left: 0.278,
        right: 0.014,
        top: 0.75,
        bottom: 0.75,
        header: 0.417,
        footer: 0.417
      }
    }

    // Set column widths (auto-fit, minimum 12)
    worksheet.columns = [
      { width: 12 }, // A
      { width: 12 }, // B
      { width: 12 }, // C
      { width: 12 }, // D
      { width: 12 }, // E
      { width: 12 }, // F
      { width: 12 }, // G
      { width: 12 }, // H
      { width: 12 }, // I
      { width: 12 }, // J
      { width: 12 }, // K
      { width: 12 }, // L
      { width: 12 }, // M
      { width: 12 }, // N
      { width: 12 }, // O
      { width: 12 }, // P
      { width: 12 }, // Q
      { width: 12 }, // R
      { width: 12 }, // S
      { width: 12 }, // T
      { width: 12 }, // U
      { width: 12 }, // V
      { width: 12 }, // W
      { width: 12 }, // X
      { width: 12 }, // Y
      { width: 12 }, // Z
    ]

    // SECTION 1 - Institutional Header (rows 1-2)
    worksheet.mergeCells('A1:P1')
    worksheet.getCell('A1').value = 'MUNICIPALIDAD DE LUJÁN — Subdirección de Patrimonio'
    worksheet.getCell('A1').font = { name: 'Calibri', size: 12, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A1').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    const periodLabel = factura 
      ? `Factura N°: ${factura}`
      : startDate && endDate 
        ? `Período: ${startDate} Al ${endDate}`
        : 'Todos los períodos'

    worksheet.mergeCells('A2:P2')
    worksheet.getCell('A2').value = `Resumen de Consumo de Combustible — ${periodLabel}`
    worksheet.getCell('A2').font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A2').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // SECTION 2 - KPI Boxes (rows 4-5) - 4 horizontal boxes
    let currentRow = 4

    // Calculate KPIs
    const totalFacturado = fuelLogs.reduce((sum, log) => sum + log.amount, 0)
    const activeVehicles = new Set(fuelLogs.map(log => log.card?.cardNumber)).size
    const totalCargas = fuelLogs.length
    const totalLitros = fuelLogs.reduce((sum, log) => sum + log.gallons, 0)
    const precioPromedio = totalLitros > 0 ? totalFacturado / totalLitros : 0

    console.log('KPIs calculated:', { totalFacturado, activeVehicles, totalCargas, totalLitros, precioPromedio })

    // KPI Box 1 - Total Facturado (A4:D5)
    worksheet.mergeCells('A4:D4')
    worksheet.getCell('A4').value = 'Total Facturado'
    worksheet.getCell('A4').font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A4').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.mergeCells('A5:D5')
    worksheet.getCell('A5').value = formatARS(totalFacturado)
    worksheet.getCell('A5').font = { name: 'Calibri', size: 14, bold: true }
    worksheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('A5').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // KPI Box 2 - Vehículos Activos (E4:H5)
    worksheet.mergeCells('E4:H4')
    worksheet.getCell('E4').value = 'Vehículos Activos'
    worksheet.getCell('E4').font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell('E4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('E4').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.mergeCells('E5:H5')
    worksheet.getCell('E5').value = activeVehicles.toString()
    worksheet.getCell('E5').font = { name: 'Calibri', size: 14, bold: true }
    worksheet.getCell('E5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('E5').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // KPI Box 3 - Total de Cargas (I4:L5)
    worksheet.mergeCells('I4:L4')
    worksheet.getCell('I4').value = 'Total de Cargas'
    worksheet.getCell('I4').font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell('I4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('I4').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.mergeCells('I5:L5')
    worksheet.getCell('I5').value = totalCargas.toString()
    worksheet.getCell('I5').font = { name: 'Calibri', size: 14, bold: true }
    worksheet.getCell('I5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('I5').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // KPI Box 4 - Precio Promedio/Litro (M4:P5)
    worksheet.mergeCells('M4:P4')
    worksheet.getCell('M4').value = 'Precio Promedio/Litro'
    worksheet.getCell('M4').font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell('M4').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('M4').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.mergeCells('M5:P5')
    worksheet.getCell('M5').value = `$ ${precioPromedio.toFixed(2).replace('.', ',')}`
    worksheet.getCell('M5').font = { name: 'Calibri', size: 14, bold: true }
    worksheet.getCell('M5').alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell('M5').border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    currentRow = 6 // Row after KPIs

    // SECTION 3 - Consumption by Secretaría (starts at row 8)
    currentRow++
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Consumo por Secretaría'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    currentRow++

    // Headers for consumption table
    const headers = ['Secretaría', 'Cargas', 'Inf. Diesel (L)', 'Nafta Super (L)', 'Infinia (L)', 'D.Diesel 500 (L)', 'Importe', '% del Total']
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
      cell.value = header
      cell.font = { name: 'Calibri', size: 10, bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
    })
    currentRow++

    // Group consumption by MainArea
    const consumptionByArea = fuelLogs.reduce((acc, log) => {
      const areaName = log.card?.area?.name || 'Sin Área'
      if (!acc[areaName]) {
        acc[areaName] = { 
          cargas: 0, 
          infDieselL: 0, 
          naftaSuperL: 0, 
          infiniaL: 0, 
          diesel500L: 0, 
          importe: 0 
        }
      }
      
      acc[areaName].cargas++
      acc[areaName].importe += log.amount
      
      // Group by fuel type based on description
      if (log.description?.toLowerCase().includes('diesel') || log.description?.toLowerCase().includes('diesel')) {
        acc[areaName].infDieselL += log.gallons
      } else if (log.description?.toLowerCase().includes('nafta') || log.description?.toLowerCase().includes('super')) {
        acc[areaName].naftaSuperL += log.gallons
      } else if (log.description?.toLowerCase().includes('infinia')) {
        acc[areaName].infiniaL += log.gallons
      } else {
        acc[areaName].diesel500L += log.gallons
      }
      
      return acc
    }, {})

    // Calculate totals for each area
    Object.keys(consumptionByArea).forEach(areaName => {
      const area = consumptionByArea[areaName]
      const totalImporte = area.importe
      const porcentajeTotal = totalFacturado > 0 ? (totalImporte / totalFacturado) * 100 : 0
      
      worksheet.getCell(`A${currentRow}`).value = areaName
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`B${currentRow}`).value = area.cargas.toString()
      worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`B${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`C${currentRow}`).value = area.infDieselL.toFixed(2).replace('.', ',')
      worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`C${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`D${currentRow}`).value = area.naftaSuperL.toFixed(2).replace('.', ',')
      worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`D${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`E${currentRow}`).value = area.infiniaL.toFixed(2).replace('.', ',')
      worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`E${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`F${currentRow}`).value = area.diesel500L.toFixed(2).replace('.', ',')
      worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`F${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`G${currentRow}`).value = formatARS(totalImporte)
      worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`G${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`H${currentRow}`).value = `${porcentajeTotal.toFixed(1)}%`
      worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`H${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      currentRow++
    })

    // TOTAL row
    worksheet.getCell(`A${currentRow}`).value = 'TOTAL'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // Calculate totals for each column
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

    // TOTAL row - only once
    worksheet.getCell(`A${currentRow}`).value = 'TOTAL'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    worksheet.getCell(`B${currentRow}`).value = totals.cargas.toString()
    worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`B${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`C${currentRow}`).value = totals.infDieselL.toFixed(2).replace('.', ',')
    worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`C${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`D${currentRow}`).value = totals.naftaSuperL.toFixed(2).replace('.', ',')
    worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`D${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`E${currentRow}`).value = totals.infiniaL.toFixed(2).replace('.', ',')
    worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`E${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`F${currentRow}`).value = totals.diesel500L.toFixed(2).replace('.', ',')
    worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`F${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`G${currentRow}`).value = formatARS(totals.importe)
    worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`G${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    worksheet.getCell(`H${currentRow}`).value = `${((totals.importe / totalFacturado) * 100).toFixed(1)}%`
    worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`H${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    
    currentRow++

// SECTION 4 - Top 5 vehicles by consumption (starts after section 3)
currentRow++ // Leave one empty row

worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
worksheet.getCell(`A${currentRow}`).value = 'Top 5 Vehículos — Mayor Consumo'
worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
worksheet.getCell(`A${currentRow}`).border = {
  top: { style: 'medium' },
  bottom: { style: 'medium' },
  left: { style: 'medium' },
  right: { style: 'medium' }
}
currentRow++

// Headers for top 5 vehicles table
const top5Headers = ['Dominio', 'Secretaría', 'Dependencia', 'Inf. Diesel (L)', 'Nafta Super (L)', 'Infinia (L)', 'D.Diesel 500 (L)', 'Importe']
top5Headers.forEach((header, index) => {
  const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
  cell.value = header
  cell.font = { name: 'Calibri', size: 10, bold: true }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' }
  }
})
currentRow++

// Group by vehicle and calculate totals
    const vehicleConsumption: Record<string, any> = fuelLogs.reduce((acc, log) => {
      const dominio = log.card?.cardNumber || 'Sin Dominio'
      const secretaria = log.card?.area?.name || 'Sin Secretaría'
      const dependencia = log.card?.subArea?.name || 'Sin Dependencia'
      
      if (!acc[dominio]) {
        acc[dominio] = { 
          dominio, 
          secretaria, 
          dependencia, 
          infDieselL: 0, 
          naftaSuperL: 0, 
          infiniaL: 0, 
          diesel500L: 0, 
          importe: 0 
        }
      }
      
      acc[dominio].secretaria = secretaria
      acc[dominio].dependencia = dependencia
      acc[dominio].importe += log.amount
      
      // Group by fuel type
      if (log.description?.toLowerCase().includes('diesel') || log.description?.toLowerCase().includes('diesel')) {
        acc[dominio].infDieselL += log.gallons
      } else if (log.description?.toLowerCase().includes('nafta') || log.description?.toLowerCase().includes('super')) {
        acc[dominio].naftaSuperL += log.gallons
      } else if (log.description?.toLowerCase().includes('infinia')) {
        acc[dominio].infiniaL += log.gallons
      } else {
        acc[dominio].diesel500L += log.gallons
      }
      
      return acc
    }, {})

    // Sort vehicles by total amount and get top 5
    const top5Vehicles = Object.keys(vehicleConsumption)
      .sort((a, b) => vehicleConsumption[b].importe - vehicleConsumption[a].importe)
      .slice(0, 5)

    top5Vehicles.forEach((dominio, index) => {
      const vehicle = vehicleConsumption[dominio]
      if (!vehicle) return
      
      worksheet.getCell(`A${currentRow}`).value = dominio
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`B${currentRow}`).value = vehicle.secretaria
      worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`B${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`C${currentRow}`).value = vehicle.dependencia
      worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`C${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`D${currentRow}`).value = vehicle.infDieselL.toFixed(2)
      worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`D${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`E${currentRow}`).value = vehicle.naftaSuperL.toFixed(2)
      worksheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`E${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`F${currentRow}`).value = vehicle.infiniaL.toFixed(2)
      worksheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`F${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`G${currentRow}`).value = formatARS(vehicle.importe)
      worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`G${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`H${currentRow}`).value = `${(vehicle.infDieselL + vehicle.naftaSuperL + vehicle.infiniaL + vehicle.diesel500L).toFixed(2)}`
      worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`H${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      currentRow++
    })

    currentRow++ // Leave one empty row

    // SECTION 5 - Distribution by fuel type (same row as section 4, to the right)
    worksheet.mergeCells(`J${currentRow}:M${currentRow}`)
    worksheet.getCell(`J${currentRow}`).value = 'Distribución por Combustible'
    worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`J${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    currentRow++

    // Headers for fuel distribution table
    const distHeaders = ['Combustible', 'Litros', 'Importe', '% del Total']
    distHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(74 + index)}${currentRow}`) // J, K, L, M
      cell.value = header
      cell.font = { name: 'Calibri', size: 10, bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
    })
    currentRow++

    // Calculate totals by fuel type
    const fuelTypeTotals: Record<string, any> = fuelLogs.reduce((acc, log) => {
      let fuelType = 'Otros'
      let litros = log.gallons
      let importe = log.amount
      
      if (log.description?.toLowerCase().includes('diesel') || log.description?.toLowerCase().includes('diesel')) {
        fuelType = 'Inf. Diesel (L)'
      } else if (log.description?.toLowerCase().includes('nafta') || log.description?.toLowerCase().includes('super')) {
        fuelType = 'Nafta Super (L)'
      } else if (log.description?.toLowerCase().includes('infinia')) {
        fuelType = 'Infinia (L)'
      } else if (log.description?.toLowerCase().includes('500')) {
        fuelType = 'D.Diesel 500 (L)'
      }
      
      if (!acc[fuelType]) {
        acc[fuelType] = { litros: 0, importe: 0 }
      }
      acc[fuelType].litros += litros
      acc[fuelType].importe += importe
      return acc
    }, {})

    // Display totals by fuel type
    Object.keys(fuelTypeTotals).forEach(fuelType => {
      const total = fuelTypeTotals[fuelType]
      const porcentajeTotal = totalFacturado > 0 ? (total.importe / totalFacturado) * 100 : 0
      
      worksheet.getCell(`J${currentRow}`).value = fuelType
      worksheet.getCell(`J${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`J${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`K${currentRow}`).value = total.litros.toFixed(2).replace('.', ',')
      worksheet.getCell(`K${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`K${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`K${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`L${currentRow}`).value = formatARS(total.importe)
      worksheet.getCell(`L${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`L${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`L${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`M${currentRow}`).value = `${porcentajeTotal.toFixed(1)}%`
      worksheet.getCell(`M${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`M${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`M${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      currentRow++
    })

    currentRow++ // Leave one empty row

    // SECTION 6 - Automatic alerts (last section)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Alertas Automáticas'
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }
    currentRow++

    // Sub-header for consumption table
    const alertHeaders = ['Vehículo', 'Secretaría', 'Litros', 'vs. Promedio']
    alertHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}${currentRow}`)
      cell.value = header
      cell.font = { name: 'Calibri', size: 10, bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
    })
    currentRow++

    // Generate alerts
    const alerts = []
    const averageConsumptionPerVehicle = activeVehicles > 0 ? totalLitros / activeVehicles : 0
    
    // Alert 1: High consumption vehicles (> 50% above average) - TOP 5 ONLY
    const highConsumptionVehicles = Object.keys(vehicleConsumption)
      .map(dominio => {
        const vehicle = vehicleConsumption[dominio]
        if (!vehicle) return null
        
        const vehicleLitros = vehicle.infDieselL + vehicle.naftaSuperL + vehicle.infiniaL + vehicle.diesel500L
        return {
          dominio,
          secretaria: vehicle.secretaria,
          litros: vehicleLitros,
          vsPromedio: vehicleLitros > averageConsumptionPerVehicle * 1.5
        }
      })
      .filter(v => v !== null && v.vsPromedio)
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 5)

    if (highConsumptionVehicles.length > 0) {
      // Add table header
      currentRow++
      worksheet.getCell(`A${currentRow}`).value = 'Vehículo'
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`B${currentRow}`).value = 'Secretaría'
      worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
      worksheet.getCell(`B${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`C${currentRow}`).value = 'Litros'
      worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
      worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`C${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
      
      worksheet.getCell(`D${currentRow}`).value = 'vs. Promedio'
      worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 10, bold: true }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell(`D${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }

      // Add top 5 high consumption vehicles
      highConsumptionVehicles.forEach(vehicle => {
        currentRow++
        worksheet.getCell(`A${currentRow}`).value = vehicle.dominio
        worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10 }
        worksheet.getCell(`A${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        
        worksheet.getCell(`B${currentRow}`).value = vehicle.secretaria
        worksheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10 }
        worksheet.getCell(`B${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        
        worksheet.getCell(`C${currentRow}`).value = vehicle.litros.toFixed(2).replace('.', ',')
        worksheet.getCell(`C${currentRow}`).font = { name: 'Calibri', size: 10 }
        worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.getCell(`C${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        
        worksheet.getCell(`D${currentRow}`).value = `+${((vehicle.litros / averageConsumptionPerVehicle - 1) * 100).toFixed(1)}%`
        worksheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 10 }
        worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.getCell(`D${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        
        worksheet.getCell(`G${currentRow}`).value = vehicle.litros.toFixed(2).replace('.', ',')
        worksheet.getCell(`G${currentRow}`).font = { name: 'Calibri', size: 10 }
        worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.getCell(`G${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        
        worksheet.getCell(`H${currentRow}`).value = `+${((vehicle.litros / averageConsumptionPerVehicle - 1) * 100).toFixed(1)}%`
        worksheet.getCell(`H${currentRow}`).font = { name: 'Calibri', size: 10 }
        worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.getCell(`H${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
      })

      // Add note if more vehicles exceed threshold
      const totalHighConsumption = Object.keys(vehicleConsumption)
        .map(dominio => {
          const vehicle = vehicleConsumption[dominio]
          if (!vehicle) return false
          const vehicleLitros = vehicle.infDieselL + vehicle.naftaSuperL + vehicle.infiniaL + vehicle.diesel500L
          return vehicleLitros > averageConsumptionPerVehicle * 1.5
        })
        .filter(v => v).length

      if (totalHighConsumption > 5) {
        currentRow++
        worksheet.getCell(`A${currentRow}`).value = `y ${totalHighConsumption - 5} vehículos más con consumo elevado`
        worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 9, italic: true }
        worksheet.getCell(`A${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
      }
    } else {
      currentRow++
      worksheet.getCell(`A${currentRow}`).value = '✅ Sin alertas de consumo elevado'
      worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10 }
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
    }

    // Alert 2: Areas with high spending (> 40% of total)
    const highSpendingAreas = Object.keys(consumptionByArea)
      .filter(areaName => {
        const area = consumptionByArea[areaName]
        const porcentajeTotal = (area.importe / totalFacturado) * 100
        return porcentajeTotal > 40
      })

    if (highSpendingAreas.length > 0) {
      currentRow++
      highSpendingAreas.forEach(areaName => {
        const area = consumptionByArea[areaName]
        const porcentajeTotal = (area.importe / totalFacturado) * 100
        worksheet.getCell(`A${currentRow}`).value = `🟢 ${areaName}: ${porcentajeTotal.toFixed(1)}% del gasto total (${formatARS(area.importe)})`
        worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10 }
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }
        worksheet.getCell(`A${currentRow}`).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        currentRow++
      })
    }

    // Alert 3: Informational
    const totalVehicles = Object.keys(vehicleConsumption).length
    const avgPricePerLiter = totalLitros > 0 ? totalFacturado / totalLitros : 0
    currentRow++
    worksheet.getCell(`A${currentRow}`).value = `🔵 ${totalVehicles} vehículos activos este período | Precio promedio por litro: $ ${avgPricePerLiter.toFixed(2)}`
    worksheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10 }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
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
