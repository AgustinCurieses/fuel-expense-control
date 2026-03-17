import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting card area history seeding...')
  
  try {
    // Get all existing cards
    const cards = await prisma.card.findMany({
      include: {
        area: true,
        subArea: true
      }
    })

    console.log(`Found ${cards.length} cards to create history records for`)

    // Create initial history record for each card
    for (const card of cards) {
      // Check if history record already exists
      const existingHistory = await prisma.cardAreaHistory.findFirst({
        where: {
          cardId: card.id,
          validTo: null
        }
      })

      if (!existingHistory) {
        await prisma.cardAreaHistory.create({
          data: {
            cardId: card.id,
            mainAreaId: card.areaId,
            subAreaId: card.subAreaId || undefined,
            validFrom: new Date('2000-01-01'),
            validTo: null
          }
        })
        console.log(`✅ Created history record for card ${card.cardNumber}`)
      } else {
        console.log(`⏭️  History record already exists for card ${card.cardNumber}`)
      }
    }

    console.log('🎉 Card area history seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding card area history:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
