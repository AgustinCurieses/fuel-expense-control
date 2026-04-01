export interface User {
  id: string
  email: string
  name?: string
  role: 'admin' | 'editor' | 'viewer'
  isActive?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MainArea {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  subAreas?: SubArea[]
  cards?: Card[]
  fuelLogs?: FuelLog[]  // Added reverse relation
}

export interface SubArea {
  id: string
  name: string
  parentAreaId: string
  parentArea?: MainArea | null
  createdAt: Date
  updatedAt: Date
  cards?: Card[]
  fuelLogs?: FuelLog[]  // Added reverse relation
}

export interface Card {
  id: string
  cardNumber: string
  identification?: string | null
  areaId: string
  subAreaId?: string | null
  userId: string | null
  cardType?: string | null
  allowedFuel?: string | null
  area?: MainArea
  subArea?: SubArea | null
  user?: User
  fuelLogs?: FuelLog[]
  createdAt: Date
  updatedAt: Date
}

export interface FuelLog {
  id: string
  date: Date
  amount: number
  pricePerGallon: number
  totalCost: number
  gallons: number
  odometer?: number | null
  location?: string | null
  description?: string | null
  remito?: string | null  // Added for duplicate detection
  status?: string  // Added for pending card handling: IMPORTED, PENDING
  mainAreaId?: string | null  // Added for pending card resolution
  subAreaId?: string | null  // Added for pending card resolution
  cardNumber?: string | null  // Store card number for PENDING rows
  userId: string | null
  cardId?: string | null  // Made nullable for pending cards
  createdAt: Date
  updatedAt: Date
  user?: User | null
  card?: Card | null
  mainArea?: MainArea | null  // Added reverse relation
  subArea?: SubArea | null  // Added reverse relation
}

export interface ImportSettings {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  mappings?: ImportMapping[]
}

export interface ImportMapping {
  id: string
  internalField: string
  rawColumnName: string
  settingsId: string
  createdAt: Date
  updatedAt: Date
  settings?: ImportSettings | null
}

export interface ExcelImportData {
  fecha: Date
  establecimiento: string
  localidad: string
  tarjeta: string
  conductorAutorizado: string
  dominio: string
  remito: string
  producto: string
  litros: number
  importe: number
}

export interface ColumnMapping {
  internalField: keyof ExcelImportData
  rawColumnName: string
  required: boolean
}

export interface ImportResult {
  success: boolean
  totalRows: number
  importedRows: number
  pendingRows: number  // Added for unknown cards
  duplicateRows: number  // Added for duplicates
  failedRows: number
  errors: string[]
  warnings: string[]
}

export interface AreaFormData {
  name: string
  parentAreaId?: string
  type: 'main' | 'sub'
}

export interface CardFormData {
  cardNumber: string
  identification?: string | null
  areaId: string
  subAreaId?: string | null
  cardType?: string
  allowedFuel?: string
}

export interface ExcelMapping {
  dateColumn: string
  cardNumberColumn: string
  amountColumn: string
  litersColumn: string
}
