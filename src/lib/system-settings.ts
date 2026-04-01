import { prisma } from '@/lib/database'

export const SETTING_DEFAULTS: Record<string, string> = {
  org_name:                 'Municipalidad de Luján',
  org_province:             'Buenos Aires',
  card_inactivity_days:     '30',
  excel_sheet_index:        '0',
  billing_period:           'quincenal',
  factura_tolerance_green:  '1',
  factura_tolerance_yellow: '100',
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.systemSettings.findMany()
    const result = { ...SETTING_DEFAULTS }
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  } catch {
    return { ...SETTING_DEFAULTS }
  }
}
