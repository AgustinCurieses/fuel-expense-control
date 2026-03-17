import * as XLSX from 'xlsx'
import { ExcelMapping, FuelLog, Card, MainArea, SubArea } from '@/types'

export interface ProcessedRow {
  date: Date
  cardNumber: string
  amount: number
  liters: number
  rawRow: any[]
  rowIndex: number
}

export interface UnknownCard {
  cardNumber: string
  rowCount: number
  firstOccurrence: number
  totalAmount: number
  totalLiters: number
}

export interface ProcessingResult {
  processedRows: ProcessedRow[]
  unknownCards: UnknownCard[]
  areaSummary: Record<string, { amount: number; liters: number; name: string }>
  totalAmount: number
  totalLiters: number
  totalRows: number
}

export interface ExcelProcessorConfig {
  mapping: ExcelMapping
  cards: Card[]
  mainAreas: MainArea[]
  subAreas: SubArea[]
}

export class ExcelProcessor {
  private config: ExcelProcessorConfig

  constructor(config: ExcelProcessorConfig) {
    this.config = config
  }

  async processFile(file: File): Promise<ProcessingResult> {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (jsonData.length < 2) {
      throw new Error('Excel file must contain at least a header row and one data row')
    }

    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1)

    // Find column indices based on mapping
    const columnIndices = this.findColumnIndices(headers)
    
    if (!columnIndices.dateColumn || !columnIndices.cardNumberColumn || 
        !columnIndices.amountColumn || !columnIndices.litersColumn) {
      throw new Error('Could not find all required columns in the Excel file')
    }

    // Process each row
    const processedRows: ProcessedRow[] = []
    const unknownCardsMap = new Map<string, UnknownCard>()
    const areaSummary: Record<string, { amount: number; liters: number; name: string }> = {}

    dataRows.forEach((row, index) => {
      try {
        const processedRow = this.processRow(row, index + 2, columnIndices)
        if (processedRow) {
          processedRows.push(processedRow)

          // Check if card exists in database
          const card = this.findCard(processedRow.cardNumber)
          
          if (!card) {
            // Handle unknown card
            const existing = unknownCardsMap.get(processedRow.cardNumber)
            if (existing) {
              existing.rowCount++
              existing.totalAmount += processedRow.amount
              existing.totalLiters += processedRow.liters
            } else {
              unknownCardsMap.set(processedRow.cardNumber, {
                cardNumber: processedRow.cardNumber,
                rowCount: 1,
                firstOccurrence: index + 2,
                totalAmount: processedRow.amount,
                totalLiters: processedRow.liters
              })
            }
          } else {
            // Update area summary
            const areaName = this.getAreaName(card.areaId)
            const areaKey = card.areaId
            
            if (!areaSummary[areaKey]) {
              areaSummary[areaKey] = { amount: 0, liters: 0, name: areaName }
            }
            
            areaSummary[areaKey].amount += processedRow.amount
            areaSummary[areaKey].liters += processedRow.liters
          }
        }
      } catch (error) {
        console.warn(`Error processing row ${index + 2}:`, error)
      }
    })

    const unknownCards = Array.from(unknownCardsMap.values())
    const totalAmount = processedRows.reduce((sum, row) => sum + row.amount, 0)
    const totalLiters = processedRows.reduce((sum, row) => sum + row.liters, 0)

    return {
      processedRows,
      unknownCards,
      areaSummary,
      totalAmount,
      totalLiters,
      totalRows: processedRows.length
    }
  }

  private findColumnIndices(headers: string[]) {
    const mapping = this.config.mapping
    
    return {
      dateColumn: this.findColumnIndex(headers, [mapping.dateColumn]),
      cardNumberColumn: this.findColumnIndex(headers, [mapping.cardNumberColumn]),
      amountColumn: this.findColumnIndex(headers, [mapping.amountColumn]),
      litersColumn: this.findColumnIndex(headers, [mapping.litersColumn])
    }
  }

  private findColumnIndex(headers: string[], possibleNames: string[]): number | null {
    for (const name of possibleNames) {
      const index = headers.findIndex(header => 
        header && header.toString().toLowerCase().trim() === name.toLowerCase().trim()
      )
      if (index !== -1) return index
    }
    return null
  }

  private processRow(row: any[], rowIndex: number, columnIndices: any): ProcessedRow | null {
    try {
      const dateValue = row[columnIndices.dateColumn]
      const cardNumberValue = row[columnIndices.cardNumberColumn]
      const amountValue = row[columnIndices.amountColumn]
      const litersValue = row[columnIndices.litersColumn]

      if (!dateValue || !cardNumberValue || !amountValue || !litersValue) {
        return null
      }

      // Parse date
      let date: Date
      if (typeof dateValue === 'number') {
        // Excel date number
        date = new Date((dateValue - 25569) * 86400 * 1000)
      } else if (typeof dateValue === 'string') {
        // Try to parse as string date
        date = new Date(dateValue)
        if (isNaN(date.getTime())) {
          return null
        }
      } else {
        date = new Date(dateValue)
      }

      // Parse numbers
      const amount = parseFloat(amountValue.toString().replace(/[^0-9.-]/g, ''))
      const liters = parseFloat(litersValue.toString().replace(/[^0-9.-]/g, ''))

      if (isNaN(amount) || isNaN(liters)) {
        return null
      }

      // Clean card number
      const cardNumber = cardNumberValue.toString().trim()

      return {
        date,
        cardNumber,
        amount,
        liters,
        rawRow: row,
        rowIndex
      }
    } catch (error) {
      return null
    }
  }

  private findCard(cardNumber: string): Card | null {
    return this.config.cards.find(card => 
      card.cardNumber.toLowerCase().trim() === cardNumber.toLowerCase().trim()
    ) || null
  }

  private getAreaName(areaId: string): string {
    const area = this.config.mainAreas.find(a => a.id === areaId)
    return area?.name || 'Unknown Area'
  }

  convertToFuelLogs(processedRows: ProcessedRow[], cards: Card[]): Omit<FuelLog, 'id' | 'createdAt' | 'updatedAt'>[] {
    return processedRows.map(row => {
      const card = cards.find(c => 
        c.cardNumber.toLowerCase().trim() === row.cardNumber.toLowerCase().trim()
      )
      
      if (!card) {
        throw new Error(`Card not found for card number: ${row.cardNumber}`)
      }

      return {
        date: row.date,
        amount: row.amount,
        pricePerGallon: row.liters > 0 ? row.amount / row.liters : 0,
        totalCost: row.amount,
        gallons: row.liters,
        odometer: undefined,
        location: undefined,
        description: undefined,
        userId: card.userId,
        cardId: card.id
      }
    })
  }
}
