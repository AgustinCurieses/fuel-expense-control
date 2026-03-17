import * as XLSX from 'xlsx'
import { FuelLog, Card, MainArea, SubArea, ExcelMapping } from '@/types'

export interface ExportData {
  fuelLogs: (FuelLog & { 
    card: Card & { area: MainArea; subArea?: SubArea }
  })[]
  areaName: string
  subAreaName?: string
  mapping: ExcelMapping
}

export class ExcelExporter {
  static exportAreaReport(data: ExportData, filename?: string): void {
    const workbook = XLSX.utils.book_new()
    const worksheet = this.createWorksheet(data)
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fuel Report')
    
    // Apply styling to the worksheet
    this.applyWorksheetStyling(worksheet, data.fuelLogs.length)
    
    const defaultFilename = `${data.areaName.replace(/\s+/g, '_')}_Fuel_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename || defaultFilename)
  }

  private static createWorksheet(data: ExportData): XLSX.WorkSheet {
    const { fuelLogs, areaName, subAreaName, mapping } = data
    
    // Create headers based on mapping configuration
    const headers = [
      mapping.dateColumn || 'Date',
      mapping.cardNumberColumn || 'Card Number',
      'Area',
      subAreaName ? 'Sub-area' : undefined,
      'Amount ($)',
      'Liters',
      'Price per Liter ($)',
      'Location',
      'Description'
    ].filter(Boolean) as string[]

    // Create data rows
    const rows = fuelLogs.map(log => {
      const row: any[] = []
      
      // Add columns in the configured order
      row.push(log.date.toLocaleDateString())
      row.push(log.card.cardNumber)
      row.push(log.card.area.name)
      if (subAreaName) {
        row.push(log.card.subArea?.name || 'N/A')
      }
      row.push(log.totalCost)
      row.push(log.gallons)
      row.push(log.pricePerGallon)
      row.push(log.location || '')
      row.push(log.description || '')
      
      return row
    })

    // Calculate totals
    const totalsRow = [
      'TOTAL',
      '',
      '',
      subAreaName ? '' : undefined,
      fuelLogs.reduce((sum, log) => sum + log.totalCost, 0),
      fuelLogs.reduce((sum, log) => sum + log.gallons, 0),
      fuelLogs.length > 0 ? 
        fuelLogs.reduce((sum, log) => sum + log.totalCost, 0) / fuelLogs.reduce((sum, log) => sum + log.gallons, 0) : 0,
      '',
      ''
    ].filter(Boolean) as any[]

    // Combine headers, data, and totals
    const worksheetData = [headers, ...rows, totalsRow]
    
    return XLSX.utils.aoa_to_sheet(worksheetData)
  }

  private static applyWorksheetStyling(worksheet: XLSX.WorkSheet, dataRowCount: number): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Card Number
      { wch: 15 }, // Area
      { wch: 15 }, // Sub-area
      { wch: 12 }, // Amount
      { wch: 10 }, // Liters
      { wch: 12 }, // Price per Liter
      { wch: 15 }, // Location
      { wch: 20 }, // Description
    ]
    
    worksheet['!cols'] = colWidths.slice(0, range.e.c + 1)

    // Apply currency formatting to amount columns
    for (let row = 1; row <= dataRowCount + 1; row++) { // +1 for totals row
      // Amount column (index 4 or 5 depending on sub-area)
      const amountCol = range.e.c >= 5 ? 4 : 3
      const amountCell = XLSX.utils.encode_cell({ r: row, c: amountCol })
      if (worksheet[amountCell]) {
        worksheet[amountCell].z = '$#,##0.00'
        worksheet[amountCell].t = 'n'
      }

      // Price per Liter column
      const priceCol = range.e.c >= 7 ? 6 : 5
      const priceCell = XLSX.utils.encode_cell({ r: row, c: priceCol })
      if (worksheet[priceCell]) {
        worksheet[priceCell].z = '$#,##0.00'
        worksheet[priceCell].t = 'n'
      }
    }

    // Format header row
    for (let col = 0; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
      if (worksheet[headerCell]) {
        worksheet[headerCell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'FFE6B6' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Format totals row
    const totalsRow = dataRowCount + 1
    for (let col = 0; col <= range.e.c; col++) {
      const totalsCell = XLSX.utils.encode_cell({ r: totalsRow, c: col })
      if (worksheet[totalsCell]) {
        worksheet[totalsCell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E6F3FF' } }
        }
      }
    }

    // Add borders to all cells
    for (let row = 0; row <= dataRowCount + 1; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col })
        if (worksheet[cell]) {
          worksheet[cell].s = {
            ...worksheet[cell].s,
            border: {
              top: { style: 'thin', color: { auto: 1 } },
              bottom: { style: 'thin', color: { auto: 1 } },
              left: { style: 'thin', color: { auto: 1 } },
              right: { style: 'thin', color: { auto: 1 } }
            }
          }
        }
      }
    }
  }

  static exportMultipleAreas(areasData: Array<{ name: string; data: ExportData }>, filename?: string): void {
    const workbook = XLSX.utils.book_new()
    
    areasData.forEach((areaData, index) => {
      const worksheet = this.createWorksheet(areaData.data)
      const sheetName = areaData.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31) // Excel sheet name limit
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    })
    
    const defaultFilename = `Multiple_Areas_Fuel_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename || defaultFilename)
  }
}
