import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to format dates
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
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
    console.log('=== Fetching Fuel Type Alerts ===')
    
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

    // Process each card
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
          console.log(`Alert for card ${card.cardNumber}: ${suspiciousLoads.length} suspicious loads (${primaryGroup} primary)`)
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
          console.log(`Alert for card ${card.cardNumber}: ${suspiciousLoads.length} suspicious loads (allowedFuel: ${card.allowedFuel})`)
        }
      }
    }

    console.log(`Total fuel type alerts: ${alerts.length}`)

    return NextResponse.json(alerts)

  } catch (error) {
    console.error('Error fetching fuel type alerts:', error)
    return NextResponse.json(
      { error: 'Error fetching fuel type alerts' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
