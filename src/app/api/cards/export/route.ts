import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import ExcelJS from 'exceljs'

// Helper function to format dates
function formatDate(date: Date | null): string {
  if (!date) return 'Sin cargas'
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

export async function GET() {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Get all cards with their areas and fuel logs
    const allCards = await prisma.card.findMany({
      include: {
        fuelLogs: {
          where: { status: 'IMPORTED' },
          orderBy: { date: 'desc' }
        },
        area: true,
        subArea: true
      }
    })

    // Separate active and inactive cards
    const activeCards: any[] = []
    const inactiveCards: any[] = []

    for (const card of allCards) {
      // Filter logs for last 30 days
      const recentLogs = card.fuelLogs.filter(log => log.date >= thirtyDaysAgo)
      const hasRecentActivity = recentLogs.length > 0

      if (hasRecentActivity) {
        // Active card
        const lastLoad = recentLogs[0] // Most recent
        const totalLoads = recentLogs.length

        activeCards.push({
          cardNumber: card.cardNumber,
          identification: card.identification || '',
          area: card.area?.name || '',
          subArea: card.subArea?.name || '',
          lastLoad: formatDate(lastLoad.date),
          totalLoads: totalLoads.toString()
        })
      } else {
        // Inactive card
        const allLogs = card.fuelLogs
        const lastLoad = allLogs.length > 0 ? allLogs[0] : null
        const totalHistoricalLoads = allLogs.length

        inactiveCards.push({
          cardNumber: card.cardNumber,
          identification: card.identification || '',
          area: card.area?.name || '',
          subArea: card.subArea?.name || '',
          lastLoad: formatDate(lastLoad?.date || null),
          inactiveSince: formatDate(lastLoad?.date || null),
          totalHistoricalLoads: totalHistoricalLoads.toString()
        })
      }
    }

    // Sort active cards by area, then sub-area
    activeCards.sort((a, b) => {
      if (a.area === b.area) {
        return a.subArea.localeCompare(b.subArea)
      }
      return a.area.localeCompare(b.area)
    })

    // Sort inactive cards by area, then inactive since date
    inactiveCards.sort((a, b) => {
      if (a.area === b.area) {
        // For inactive since, we need to handle "Sin cargas" specially
        if (a.inactiveSince === 'Sin cargas' && b.inactiveSince !== 'Sin cargas') return 1
        if (a.inactiveSince !== 'Sin cargas' && b.inactiveSince === 'Sin cargas') return -1
        return a.inactiveSince.localeCompare(b.inactiveSince)
      }
      return a.area.localeCompare(b.area)
    })

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    
    // Sheet 1 - Active Cards
    const activeSheet = workbook.addWorksheet('Tarjetas Activas')
    
    // Page setup for active sheet
    activeSheet.pageSetup.paperSize = 9 // A4
    activeSheet.pageSetup.orientation = 'landscape'
    activeSheet.pageSetup.margins = {
      left: 0.75,
      right: 0.75,
      top: 1,
      bottom: 1,
      header: 0,
      footer: 0
    }

    // Title for active sheet
    activeSheet.mergeCells('A1:F1')
    activeSheet.getCell('A1').value = 'Tarjetas Activas — Municipalidad de Luján'
    activeSheet.getCell('A1').font = { name: 'Calibri', size: 11, bold: true }
    activeSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

    // Headers for active sheet
    const activeHeaders = ['Número de Tarjeta', 'Identificación', 'Área', 'Sub-área', 'Última Carga', 'Total Cargas']
    activeHeaders.forEach((header, index) => {
      const cell = activeSheet.getCell(2, index + 1)
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

    // Data for active sheet
    activeCards.forEach((card, index) => {
      const row = index + 3
      activeSheet.getCell(`A${row}`).value = card.cardNumber
      activeSheet.getCell(`B${row}`).value = card.identification
      activeSheet.getCell(`C${row}`).value = card.area
      activeSheet.getCell(`D${row}`).value = card.subArea
      activeSheet.getCell(`E${row}`).value = card.lastLoad
      activeSheet.getCell(`F${row}`).value = card.totalLoads

      // Format data rows
      for (let col = 1; col <= 6; col++) {
        const cell = activeSheet.getCell(row, col)
        cell.font = { name: 'Calibri', size: 11 }
        cell.border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
      }
    })

    // Column widths for active sheet
    activeSheet.getColumn(1).width = 20 // Número de Tarjeta
    activeSheet.getColumn(2).width = 25 // Identificación
    activeSheet.getColumn(3).width = 25 // Área
    activeSheet.getColumn(4).width = 25 // Sub-área
    activeSheet.getColumn(5).width = 15 // Última Carga
    activeSheet.getColumn(6).width = 15 // Total Cargas

    // Sheet 2 - Inactive Cards
    const inactiveSheet = workbook.addWorksheet('Tarjetas Inactivas')
    
    // Page setup for inactive sheet
    inactiveSheet.pageSetup.paperSize = 9 // A4
    inactiveSheet.pageSetup.orientation = 'landscape'
    inactiveSheet.pageSetup.margins = {
      left: 0.75,
      right: 0.75,
      top: 1,
      bottom: 1,
      header: 0,
      footer: 0
    }

    // Title for inactive sheet
    inactiveSheet.mergeCells('A1:G1')
    inactiveSheet.getCell('A1').value = 'Tarjetas Inactivas — Municipalidad de Luján'
    inactiveSheet.getCell('A1').font = { name: 'Calibri', size: 11, bold: true }
    inactiveSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

    // Headers for inactive sheet
    const inactiveHeaders = ['Número de Tarjeta', 'Identificación', 'Área', 'Sub-área', 'Última Carga', 'Inactiva Desde', 'Total Cargas Históricas']
    inactiveHeaders.forEach((header, index) => {
      const cell = inactiveSheet.getCell(2, index + 1)
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

    // Data for inactive sheet
    inactiveCards.forEach((card, index) => {
      const row = index + 3
      inactiveSheet.getCell(`A${row}`).value = card.cardNumber
      inactiveSheet.getCell(`B${row}`).value = card.identification
      inactiveSheet.getCell(`C${row}`).value = card.area
      inactiveSheet.getCell(`D${row}`).value = card.subArea
      inactiveSheet.getCell(`E${row}`).value = card.lastLoad
      inactiveSheet.getCell(`F${row}`).value = card.inactiveSince
      inactiveSheet.getCell(`G${row}`).value = card.totalHistoricalLoads

      // Format data rows
      for (let col = 1; col <= 7; col++) {
        const cell = inactiveSheet.getCell(row, col)
        cell.font = { name: 'Calibri', size: 11 }
        cell.border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
      }
    })

    // Column widths for inactive sheet
    inactiveSheet.getColumn(1).width = 20 // Número de Tarjeta
    inactiveSheet.getColumn(2).width = 25 // Identificación
    inactiveSheet.getColumn(3).width = 25 // Área
    inactiveSheet.getColumn(4).width = 25 // Sub-área
    inactiveSheet.getColumn(5).width = 15 // Última Carga
    inactiveSheet.getColumn(6).width = 15 // Inactiva Desde
    inactiveSheet.getColumn(7).width = 20 // Total Cargas Históricas

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Generate filename with current date
    const today = getCurrentDate()
    const filename = `Tarjetas_${today}.xlsx`

    // Return response
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error exporting cards' },
      { status: 500 }
    )
  }
}
