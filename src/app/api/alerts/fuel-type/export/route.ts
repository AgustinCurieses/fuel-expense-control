import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const prisma = new PrismaClient()

// Helper function to format dates
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper function to get current date in DD-MM-YYYY format
function getCurrentDate(): string {
  const date = new Date()
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// Helper function to determine fuel group
function getFuelGroup(product: string): 'nafta' | 'gasoil' | 'unknown' {
  if (!product) return 'unknown'
  const productUpper = product.toUpperCase()
  
  // Group A (naftas)
  if (productUpper.includes('NAFTA') || productUpper.includes('INFINIA') && !productUpper.includes('DIESEL')) {
    return 'nafta'
  }
  
  // Group B (gasoil)
  if (productUpper.includes('DIESEL') || productUpper.includes('D.DIESEL')) {
    return 'gasoil'
  }
  
  return 'unknown'
}

export async function GET() {
  try {
    console.log('=== Exporting Fuel Type Alerts ===')
    
    // Get all cards that have FuelLogs with status = 'IMPORTED'
    const cardsWithLogs = await prisma.card.findMany({
      where: {
        fuelLogs: {
          some: {
            status: 'IMPORTED'
          }
        }
      },
      include: {
        fuelLogs: {
          where: {
            status: 'IMPORTED'
          },
          orderBy: {
            date: 'desc'
          }
        },
        area: true,
        subArea: true
      }
    })

    console.log(`Found ${cardsWithLogs.length} cards with imported fuel logs`)

    const alerts: any[] = []

    // Process each card (same logic as alerts API)
    for (const card of cardsWithLogs) {
      // Skip cards where cardType = "maquinaria" OR allowedFuel = "ambos"
      if (card.cardType === 'maquinaria' || card.allowedFuel === 'ambos') {
        continue
      }

      // For cards with null cardType or allowedFuel, use old historical analysis as fallback
      if (!card.cardType || !card.allowedFuel) {
        // Group fuel logs by fuel type group
        const naftaLogs = card.fuelLogs.filter(log => getFuelGroup(log.description || '') === 'nafta')
        const gasoilLogs = card.fuelLogs.filter(log => getFuelGroup(log.description || '') === 'gasoil')
        
        // Calculate total liters for each group
        const naftaLiters = naftaLogs.reduce((sum, log) => sum + (log.gallons || 0), 0)
        const gasoilLiters = gasoilLogs.reduce((sum, log) => sum + (log.gallons || 0), 0)
        
        // Determine primary group (whichever has more total liters)
        let primaryGroup: 'nafta' | 'gasoil' = 'nafta'
        if (gasoilLiters > naftaLiters) {
          primaryGroup = 'gasoil'
        }
        
        // If both groups have 0 liters, skip this card
        if (naftaLiters === 0 && gasoilLiters === 0) {
          continue
        }
        
        // Check for suspicious loads (logs from opposite group)
        const suspiciousLoads = primaryGroup === 'nafta' 
          ? gasoilLogs  // Gasoil loads for a nafta vehicle
          : naftaLogs   // Nafta loads for a gasoil vehicle
        
        // If there are suspicious loads, create an alert
        if (suspiciousLoads.length > 0) {
          const alert = {
            cardNumber: card.cardNumber,
            dominio: card.identification || 'Sin Dominio',
            subArea: card.subArea?.name || 'Sin Dependencia',
            mainArea: card.area?.name || 'Sin Secretaría',
            primaryGroup: primaryGroup,
            suspiciousLoads: suspiciousLoads.map(load => ({
              date: formatDate(load.date),
              product: load.description || 'Sin Producto',
              liters: load.gallons || 0,
              amount: load.amount || 0,
              remito: load.remito || 'Sin Remito'
            }))
          }
          
          alerts.push(alert)
        }
      } else {
        // Use new logic with cardType and allowedFuel
        let suspiciousLoads: any[] = []
        
        if (card.allowedFuel === 'nafta') {
          // Alert if any FuelLog has product "INFINIA DIESEL" or "D.DIESEL 500"
          suspiciousLoads = card.fuelLogs.filter(log => {
            const product = (log.description || '').toUpperCase()
            return product.includes('DIESEL') || product.includes('D.DIESEL')
          })
        } else if (card.allowedFuel === 'gasoil') {
          // Alert if any FuelLog has product "NAFTA SUPER" or "INFINIA"
          suspiciousLoads = card.fuelLogs.filter(log => {
            const product = (log.description || '').toUpperCase()
            return (product.includes('NAFTA') || product.includes('INFINIA')) && !product.includes('DIESEL')
          })
        }
        
        // If there are suspicious loads, create an alert
        if (suspiciousLoads.length > 0) {
          const alert = {
            cardNumber: card.cardNumber,
            dominio: card.identification || 'Sin Dominio',
            subArea: card.subArea?.name || 'Sin Dependencia',
            mainArea: card.area?.name || 'Sin Secretaría',
            primaryGroup: card.allowedFuel === 'nafta' ? 'nafta' : 'gasoil',
            suspiciousLoads: suspiciousLoads.map(load => ({
              date: formatDate(load.date),
              product: load.description || 'Sin Producto',
              liters: load.gallons || 0,
              amount: load.amount || 0,
              remito: load.remito || 'Sin Remito'
            }))
          }
          
          alerts.push(alert)
        }
      }
    }

    console.log(`Total fuel type alerts for export: ${alerts.length}`)

    // Flatten all suspicious loads for export
    const allAlerts = alerts.flatMap(alert =>
      alert.suspiciousLoads.map(load => ({
        dominio: alert.dominio,
        secretaria: alert.mainArea,
        dependencia: alert.subArea,
        combustiblePermitido: alert.primaryGroup === 'nafta' ? 'Nafta' : 'Gasoil',
        productoCargado: load.product,
        fecha: load.date,
        litros: load.liters,
        importe: load.amount,
        remito: load.remito
      }))
    )

    // Sort by date (most recent first)
    allAlerts.sort((a, b) => {
      const dateA = new Date(a.fecha.split('/').reverse().join('-'))
      const dateB = new Date(b.fecha.split('/').reverse().join('-'))
      return dateB.getTime() - dateA.getTime()
    })

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    
    // Create worksheet
    const worksheet = workbook.addWorksheet('Alertas de Combustible')
    
    // Page setup
    worksheet.pageSetup.paperSize = 9 // A4
    worksheet.pageSetup.orientation = 'landscape'
    worksheet.pageSetup.margins = {
      left: 0.75,
      right: 0.75,
      top: 1,
      bottom: 1,
      header: 0,
      footer: 0
    }

    // Title row
    worksheet.mergeCells('A1:I1')
    worksheet.getCell('A1').value = 'Alertas de Combustible — Municipalidad de Luján'
    worksheet.getCell('A1').font = { name: 'Calibri', size: 11, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

    // Header row
    const headers = ['Dominio', 'Secretaría', 'Dependencia', 'Combustible Permitido', 'Producto Cargado', 'Fecha', 'Litros', 'Importe', 'Remito']
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(2, index + 1)
      cell.value = header
      cell.font = { name: 'Calibri', size: 11, bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
    })

    // Data rows
    allAlerts.forEach((alert, index) => {
      const row = index + 3
      worksheet.getCell(`A${row}`).value = alert.dominio
      worksheet.getCell(`B${row}`).value = alert.secretaria
      worksheet.getCell(`C${row}`).value = alert.dependencia
      worksheet.getCell(`D${row}`).value = alert.combustiblePermitido
      worksheet.getCell(`E${row}`).value = alert.productoCargado
      worksheet.getCell(`F${row}`).value = alert.fecha
      worksheet.getCell(`G${row}`).value = alert.litros
      worksheet.getCell(`H${row}`).value = alert.importe
      worksheet.getCell(`I${row}`).value = alert.remito

      // Format data rows
      for (let col = 1; col <= 9; col++) {
        const cell = worksheet.getCell(row, col)
        cell.font = { name: 'Calibri', size: 11 }
        cell.border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
      }
    })

    // Column widths
    worksheet.getColumn(1).width = 15 // Dominio
    worksheet.getColumn(2).width = 20 // Secretaría
    worksheet.getColumn(3).width = 20 // Dependencia
    worksheet.getColumn(4).width = 18 // Combustible Permitido
    worksheet.getColumn(5).width = 20 // Producto Cargado
    worksheet.getColumn(6).width = 12 // Fecha
    worksheet.getColumn(7).width = 10 // Litros
    worksheet.getColumn(8).width = 12 // Importe
    worksheet.getColumn(9).width = 15 // Remito

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Generate filename with current date
    const today = getCurrentDate()
    const filename = `Alertas_Combustible_${today}.xlsx`

    // Return response
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error exporting fuel type alerts:', error)
    return NextResponse.json(
      { error: 'Error exporting fuel type alerts' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
