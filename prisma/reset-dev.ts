import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🔄 Starting database reset...')
  
  try {
    // Delete data in the specified order to respect foreign key constraints
    console.log('🗑️  Deleting FuelLog records...')
    await prisma.fuelLog.deleteMany({})
    
    console.log('🗑️  Deleting CardAreaHistory records...')
    await prisma.cardAreaHistory.deleteMany({})
    
    console.log('🗑️  Deleting Card records...')
    await prisma.card.deleteMany({})
    
    console.log('🗑️  Deleting SubArea records...')
    await prisma.subArea.deleteMany({})
    
    console.log('🗑️  Deleting MainArea records...')
    await prisma.mainArea.deleteMany({})
    
    console.log('🗑️  Deleting FacturaTotal records...')
    await prisma.facturaTotal.deleteMany({})
    
    console.log('🗑️  Deleting ImportMapping records...')
    await prisma.importMapping.deleteMany({})
    
    console.log('🗑️  Deleting ImportSettings records...')
    await prisma.importSettings.deleteMany({})
    
    console.log('✅ Database reset completed successfully!')
    console.log('📱 User records were preserved.')
    
    // Run the seed script
    console.log('🌱 Running seed script...')
    execSync('npx prisma db seed', { stdio: 'inherit' })
    
    console.log('🎉 Database reset and seed completed!')
    
  } catch (error) {
    console.error('❌ Error during database reset:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
