import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/database'
import { getSystemSettings } from '@/lib/system-settings'
import { requireRole } from '@/lib/serverAuth'

// Helper function to resolve card area based on history
async function getCardAreaAtDate(cardId: string, date: Date) {
  const historyRecord = await prisma.cardAreaHistory.findFirst({
    where: {
      cardId: cardId,
      validFrom: {
        lte: date
      },
      OR: [
        { validTo: { gte: date } },
        { validTo: null }
      ]
    },
    orderBy: {
      validFrom: 'desc'
    }
  })

  return historyRecord
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'editor')
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const useAlternativeImporte = formData.get('useAlternativeImporte') === 'true'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read the Excel file
    const sysSettings = await getSystemSettings()
    const sheetIndex = Math.max(0, parseInt(sysSettings.excel_sheet_index) || 0)
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[sheetIndex] ?? workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      return NextResponse.json(
        { error: 'Excel file must have at least a header row and one data row' },
        { status: 400 }
      )
    }

    // Get column mappings from database - COMPLETE 11 FIELD MAPPINGS
    let mappings = {
      fecha: 'FECHA', // Line 47
      establecimiento: 'ESTABLECIMIENTO', // Line 48
      localidad: 'LOCALIDAD', // Line 49
      tarjeta: 'TARJETA', // Line 50
      conductorAutorizado: 'CONDUCTOR', // Line 51
      dominio: 'IDENTIFICACION TARJETA', // Line 52
      remito: 'REMITO', // Line 53
      producto: 'PRODUCTO', // Line 54
      factura: 'FACTURA', // Line 30
      litros: 'LITROS UNIDADES', // Line 55
      importe: 'IMP TOT PVP ESTABLECIMIENTO', // Line 56
      importeYER: 'IMP TOT YER' // Line 57
    }

    try {
      const settings = await prisma.importSettings.findFirst({
        where: { isActive: true },
        include: { mappings: true }
      })
      
      if (settings && settings.mappings) {
        mappings = settings.mappings.reduce((acc: any, mapping: any) => {
          acc[mapping.internalField] = mapping.rawColumnName
          return acc
        }, {} as typeof mappings)
      } else {
      }

      // Update importe column if alternative is selected
      if (useAlternativeImporte) {
        mappings.importe = mappings.importeYER
      }
    } catch (error) {
      // Silently fall back to defaults - don't crash the import
    }

    // Create column index map
    const headers = data[0] as string[]
    
    const columnIndexMap: Record<string, number> = {}
    
    Object.entries(mappings).forEach(([field, columnName]) => {
      const index = headers.findIndex(header => 
        header && header.toString().trim().toUpperCase() === columnName.toUpperCase()
      )
      if (index !== -1) {
        columnIndexMap[field] = index
      } else {
      }
    })
    

    // Validate required columns - ONLY tarjeta and importe are strictly required
    const requiredFields = ['tarjeta', 'importe']
    const missingFields = requiredFields.filter(field => columnIndexMap[field] === undefined)
    
    
    if (missingFields.length > 0) {
      const missingFieldDetails = missingFields.map(field => {
        const expectedColumn = mappings[field as keyof typeof mappings]
        return `Campo "${field}" - Columna esperada: "${expectedColumn}"`
      })
      
      
      return NextResponse.json(
        { 
          error: `Columnas requeridas no encontradas: ${missingFieldDetails.join(', ')}`,
          availableColumns: headers,
          missingColumns: missingFields.map(field => ({
            field,
            expectedColumn: mappings[field as keyof typeof mappings]
          }))
        },
        { status: 400 }
      )
    }
    

    // Get all cards for lookup
    const cards = await prisma.card.findMany({
      include: { area: true, subArea: true }
    })
    const cardMap = new Map(cards.map(card => [card.cardNumber, card]))

    // Process data rows
    const discoveredFacturas = new Set<string>()
    const results: any = {
      success: true,
      totalRows: data.length - 1,
      importedRows: 0,
      pendingRows: 0,
      duplicateRows: 0,
      updatedRows: 0,  // New field for factura updates
      failedRows: 0,
      errors: [],
      warnings: [],
      importedData: []
    }

    // Ensure we have a valid user
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Default User'
        }
      })
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[]
      
      try {
        // Extract data using column mappings - HANDLE OPTIONAL FIELDS GRACEFULLY
        const rowData: any = {}
        Object.entries(columnIndexMap).forEach(([field, colIndex]) => {
          const value = row[colIndex]
          if (field === 'fecha') {
            // Use the comprehensive date parsing function
            const parseExcelDate = (value: any): Date => {
              if (!value) return new Date()

              // Excel numeric serial (e.g. 45336.21)
              if (typeof value === 'number') {
                const excelEpoch = new Date(1899, 11, 30)
                const days = Math.floor(value)
                const d = new Date(excelEpoch.getTime() + days * 86400000)
                return new Date(d.getFullYear(), d.getMonth(), d.getDate())
              }

              // Already a Date object
              if (value instanceof Date) {
                return new Date(value.getFullYear(), value.getMonth(), value.getDate())
              }

              // String in DD/MM/YYYY format (with or without time)
              const str = String(value).trim()
              const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
              if (match) {
                return new Date(+match[3], +match[2] - 1, +match[1])
              }

              return new Date()
            }

            rowData[field] = parseExcelDate(value)
          } else if (field === 'litros' || field === 'importe') {
            // Store full precision without rounding
            const valueStr = value ? value.toString().replace(',', '.') : '0'
            const parsedValue = parseFloat(valueStr)
            rowData[field] = isNaN(parsedValue) ? 0 : parsedValue
          } else {
            // For optional fields, store empty string if not found
            rowData[field] = value ? value.toString().trim() : ''
          }
        })

        // Check for duplicate using remito field
        if (rowData.remito) {
          const existingLog = await prisma.fuelLog.findFirst({
            where: { remito: rowData.remito }
          })
          
          if (existingLog) {
            // Check if existing log has null factura and new row has factura value
            if (existingLog.factura === null && rowData.factura) {
              // Update only the factura field
              await prisma.fuelLog.update({
                where: { id: existingLog.id },
                data: { factura: rowData.factura }
              })
              results.updatedRows++
              results.warnings.push(`Fila ${i + 1}: Remito "${rowData.remito}" existente - actualizado con número de factura`)
              if (rowData.factura) discoveredFacturas.add(rowData.factura)
              continue
            } else {
              // Skip as duplicate (factura already exists or no new factura provided)
              results.duplicateRows++
              results.warnings.push(`Fila ${i + 1}: Remito "${rowData.remito}" ya existe en la base de datos`)
              continue
            }
          }
        }

        // Validate only strictly required fields: tarjeta and importe
        if (!rowData.tarjeta || !rowData.importe) {
          results.failedRows++
          results.errors.push(`Fila ${i + 1}: Faltan datos requeridos (Tarjeta o Importe)`)
          continue
        }

        // Find card
        const card = cardMap.get(rowData.tarjeta)
        if (!card) {
          // Save as PENDING instead of failing
          results.pendingRows++
          results.warnings.push(`Fila ${i + 1}: Tarjeta "${rowData.tarjeta}" no encontrada - guardada como PENDIENTE`)
          
          const fuelLogDate = rowData.fecha || new Date()
          const fuelLog = await prisma.fuelLog.create({
            data: {
              date: fuelLogDate,
              amount: rowData.importe,
              pricePerGallon: rowData.litros > 0 ? rowData.importe / rowData.litros : 0,
              totalCost: rowData.importe,
              gallons: rowData.litros || 0,
              location: rowData.establecimiento || null,
              description: rowData.producto || null,
              remito: rowData.remito || null,
              conductor: rowData.conductorAutorizado || null,
              localidad: rowData.localidad || null,
              dominio: rowData.dominio || null,
              factura: rowData.factura || null,
              status: 'PENDING',  // Set status to PENDING
              mainAreaId: null,  // Will be resolved later
              subAreaId: null,   // Will be resolved later
              cardNumber: rowData.tarjeta,  // Store card number for pending rows
              userId: user.id
              // cardId: null // Don't set cardId for unknown cards
            }
          })
          continue
        }

        // Create fuel log with all available data
        const fuelLogDate = rowData.fecha || new Date()
        
        // Resolve area based on history
        const areaHistory = await getCardAreaAtDate(card.id, fuelLogDate)
        const mainAreaId = areaHistory?.mainAreaId || card.areaId
        const subAreaId = areaHistory?.subAreaId || card.subAreaId

        const fuelLog = await prisma.fuelLog.create({
          data: {
            date: fuelLogDate,
            amount: rowData.importe,
            pricePerGallon: rowData.litros > 0 ? rowData.importe / rowData.litros : 0,
            totalCost: rowData.importe,
            gallons: rowData.litros || 0,
            location: rowData.establecimiento || null,
            description: rowData.producto || null,
            remito: rowData.remito || null,
            conductor: rowData.conductorAutorizado || null,
            localidad: rowData.localidad || null,
            dominio: rowData.dominio || null,
            factura: rowData.factura || null,
            status: 'IMPORTED',  // Set status to IMPORTED
            mainAreaId: mainAreaId,  // Resolve area from history
            subAreaId: subAreaId,  // Resolve subarea from history
            userId: user.id,
            cardId: card.id
          }
        })

        results.importedRows++
        results.importedData.push({
          ...fuelLog,
          card: { ...card, area: card.area, subArea: card.subArea }
        })
        if (rowData.factura) discoveredFacturas.add(rowData.factura)
      } catch (error) {
        results.failedRows++
        results.errors.push(`Fila ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    results.success = results.failedRows === 0

    await logAction({
      action: 'IMPORT_EXCEL',
      entity: 'FuelLog',
      detail: {
        imported: results.importedRows,
        pending: results.pendingRows,
        duplicates: results.duplicateRows,
        failed: results.failedRows
      }
    })

    return NextResponse.json({ ...results, discoveredFacturas: Array.from(discoveredFacturas) })
  } catch (error) {
    console.error('Error processing Excel file:', error)
    return NextResponse.json(
      { error: 'Failed to process Excel file' },
      { status: 500 }
    )
  }
}