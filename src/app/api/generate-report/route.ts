import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Get fuel logs within date range
    const fuelLogs = await prisma.fuelLog.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        card: {
          include: {
            area: true,
            subArea: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    if (fuelLogs.length === 0) {
      return NextResponse.json(
        { error: 'No fuel logs found in the specified date range' },
        { status: 404 }
      )
    }

    // Group by MainArea
    const groupedByArea = fuelLogs.reduce((groups, log) => {
      const areaName = log.card.area.name
      if (!groups[areaName]) {
        groups[areaName] = []
      }
      groups[areaName].push(log)
      return groups
    }, {} as Record<string, typeof fuelLogs>)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create a worksheet for each MainArea
    Object.entries(groupedByArea).forEach(([areaName, logs]) => {
      // Create worksheet data
      const worksheetData: any[][] = []

      // Add title row (merged A1:H1)
      const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
      
      const title = `Secretaria: ${areaName} - Periodo ${formatDate(new Date(startDate))} Al ${formatDate(new Date(endDate))}`
      worksheetData.push([title])
      worksheetData.push([]) // Empty row for spacing

      // Add headers
      const headers = [
        'Dependencia',
        'Tarjeta',
        'Conductor Autorizado',
        'Dominio',
        'Producto',
        'Litros',
        'Importe',
        'Fecha',
        'Establecimiento',
        'Localidad',
        'Remito'
      ]
      worksheetData.push(headers)

      // Add data rows
      let totalImporte = 0
      logs.forEach(log => {
        const formatDate = (date: Date | string | null): string => {
          if (!date) return ''
          const d = new Date(date)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          return `${day}/${month}/${year}`
        }

        const row = [
          log.card?.subArea?.name || 'Sin asignar',
          log.card?.cardNumber || '',
          '', // Conductor Autorizado - not available in current schema
          log.card?.identification || '',
          log.description || '',
          log.gallons,
          log.amount,
          formatDate(log.date),
          log.location || '',
          '', // Localidad - not available in current schema
          ''  // Remito - not available in current schema
        ]
        worksheetData.push(row)
        totalImporte += log.amount
      })

      // Add total row
      worksheetData.push([
        'Total :',
        '', '', '', '', '', '',
        totalImporte,
        '', '', '', ''
      ])

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Merge title cells A1:H1
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]

      // Set column widths
      worksheet['!cols'] = [
        { width: 24 }, // A - Dependencia
        { width: 18 }, // B - Tarjeta
        { width: 32 }, // C - Conductor Autorizado
        { width: 14 }, // D - Dominio
        { width: 14 }, // E - Producto
        { width: 7 },  // F - Litros
        { width: 13 }, // G - Importe
        { width: 18 }, // H - Fecha
        { width: 40 }, // I - Establecimiento
        { width: 10 }, // J - Localidad
        { width: 13 }  // K - Remito
      ]

      // Format title row
      const titleCell = worksheet['A1']
      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 11 },
          alignment: { horizontal: 'center' }
        }
      }

      // Format headers row (row 3, index 2)
      headers.forEach((header, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: index })
        const cell = worksheet[cellAddress]
        if (cell) {
          cell.s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center' }
          }
        }
      })

      // Format data rows
      for (let i = 3; i < worksheetData.length - 1; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: i, c: 6 }) // Importe column
        const cell = worksheet[cellAddress]
        if (cell && cell.v) {
          cell.s = {
            font: { sz: 11 },
            numFmt: '$ #,##0.00' // Argentine currency format
          }
        }
      }

      // Format total row
      const totalRow = worksheetData.length - 1
      const totalCellAddress = XLSX.utils.encode_cell({ r: totalRow, c: 6 })
      const totalCell = worksheet[totalCellAddress]
      if (totalCell) {
        totalCell.s = {
          font: { bold: true, sz: 11 },
          alignment: { horizontal: 'right' },
          numFmt: '$ #,##0.00'
        }
      }

      // Merge total row cells A:F
      worksheet['!merges']!.push({ s: { r: totalRow, c: 0 }, e: { r: totalRow, c: 5 } })

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, areaName.substring(0, 31)) // Excel sheet name max 31 chars
    })

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return the file
    const fileName = `Reporte_Fuel_${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
