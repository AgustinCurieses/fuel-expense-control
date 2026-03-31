import { PrismaClient } from '@prisma/client'
import { MainArea, SubArea, Card, FuelLog, CardFormData } from '@/types'

// Create a singleton Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Areas Service
export class AreasService {
  static async getAllMainAreas(): Promise<MainArea[]> {
    const areas = await prisma.mainArea.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return areas.map(area => ({
      ...area,
      createdAt: new Date(area.createdAt),
      updatedAt: new Date(area.updatedAt)
    }))
  }

  static async createMainArea(name: string): Promise<MainArea> {
    const area = await prisma.mainArea.create({
      data: { name }
    })
    return {
      ...area,
      createdAt: new Date(area.createdAt),
      updatedAt: new Date(area.updatedAt)
    }
  }

  static async updateMainArea(id: string, name: string): Promise<MainArea> {
    try {
      const area = await prisma.mainArea.update({
        where: { id },
        data: { name, updatedAt: new Date() }
      })
      return {
        ...area,
        createdAt: new Date(area.createdAt),
        updatedAt: new Date(area.updatedAt)
      }
    } catch (error) {
      throw error
    }
  }

  static async deleteMainArea(id: string): Promise<void> {
    await prisma.mainArea.delete({
      where: { id }
    })
  }

  static async getAllSubAreas(): Promise<SubArea[]> {
    const subAreas = await prisma.subArea.findMany({
      include: { parentArea: true },
      orderBy: { createdAt: 'desc' }
    })
    return subAreas.map(subArea => ({
      ...subArea,
      createdAt: new Date(subArea.createdAt),
      updatedAt: new Date(subArea.updatedAt)
    }))
  }

  static async createSubArea(name: string, parentAreaId: string): Promise<SubArea> {
    const subArea = await prisma.subArea.create({
      data: { name, parentAreaId }
    })
    return {
      ...subArea,
      createdAt: new Date(subArea.createdAt),
      updatedAt: new Date(subArea.updatedAt)
    }
  }

  static async updateSubArea(id: string, name: string, parentAreaId: string): Promise<SubArea> {
    const subArea = await prisma.subArea.update({
      where: { id },
      data: { name, parentAreaId, updatedAt: new Date() }
    })
    return {
      ...subArea,
      createdAt: new Date(subArea.createdAt),
      updatedAt: new Date(subArea.updatedAt)
    }
  }

  static async deleteSubArea(id: string): Promise<void> {
    await prisma.subArea.delete({
      where: { id }
    })
  }
}

// Cards Service
export class CardsService {
  static async getAllCards(): Promise<Card[]> {
    const cards = await prisma.card.findMany({
      include: { area: true, subArea: true },
      orderBy: { createdAt: 'desc' }
    })
    return cards.map(card => ({
      ...card,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt)
    }))
  }

  static async updateCard(id: string, data: CardFormData): Promise<Card> {
    const card = await prisma.card.update({
      where: { id },
      data: {
        cardNumber: data.cardNumber,
        identification: data.identification,
        areaId: data.areaId,
        subAreaId: data.subAreaId,
        updatedAt: new Date()
      }
    })
    return {
      ...card,
      identification: card.identification || null,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt)
    }
  }

  static async deleteCard(id: string): Promise<void> {
    await prisma.card.delete({
      where: { id }
    })
  }

  static async getCardsByArea(areaId: string): Promise<Card[]> {
    const cards = await prisma.card.findMany({
      where: { areaId },
      include: { area: true, subArea: true },
      orderBy: { createdAt: 'desc' }
    })
    return cards.map(card => ({
      ...card,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt)
    }))
  }
}

// Fuel Logs Service
export class FuelLogsService {
  static async getFuelLogsByCard(cardId: string): Promise<FuelLog[]> {
    const logs = await prisma.fuelLog.findMany({
      where: { cardId, status: 'IMPORTED' },
      include: { card: true },
      orderBy: { date: 'desc' }
    })
    return logs.map(log => ({
      ...log,
      createdAt: new Date(log.createdAt),
      updatedAt: new Date(log.updatedAt)
    }))
  }

  static async getFuelLogsByArea(areaId: string): Promise<FuelLog[]> {
    const logs = await prisma.fuelLog.findMany({
      where: { card: { areaId }, status: 'IMPORTED' },
      include: { card: true },
      orderBy: { date: 'desc' }
    })
    return logs.map(log => ({
      ...log,
      createdAt: new Date(log.createdAt),
      updatedAt: new Date(log.updatedAt)
    }))
  }
}
