import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCardIdentification() {
  try {
    console.log('=== Updating Card Identification from FuelLog dominio ===')
    
    // Fetch all cards that have at least one FuelLog with a non-null dominio field
    const cardsWithLogs = await prisma.card.findMany({
      where: {
        fuelLogs: {
          some: {
            dominio: {
              not: null
            }
          }
        }
      },
      include: {
        fuelLogs: {
          where: {
            dominio: {
              not: null
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    console.log(`Found ${cardsWithLogs.length} cards with FuelLogs containing dominio`)

    let updatedCount = 0
    let skippedCount = 0

    // Process each card
    for (const card of cardsWithLogs) {
      // Find the most recent FuelLog where dominio is not null
      const mostRecentLog = card.fuelLogs.find(log => log.dominio !== null)
      
      if (mostRecentLog && mostRecentLog.dominio) {
        // Update card identification with the dominio value
        await prisma.card.update({
          where: {
            id: card.id
          },
          data: {
            identification: mostRecentLog.dominio
          }
        })
        
        console.log(`Updated card ${card.cardNumber}: "${mostRecentLog.dominio}"`)
        updatedCount++
      } else {
        console.log(`Skipped card ${card.cardNumber}: no valid dominio found`)
        skippedCount++
      }
    }

    console.log('\n=== Update Summary ===')
    console.log(`Cards updated: ${updatedCount}`)
    console.log(`Cards skipped: ${skippedCount}`)
    console.log('Total cards processed:', cardsWithLogs.length)
    
  } catch (error) {
    console.error('Error updating card identification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
updateCardIdentification()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
