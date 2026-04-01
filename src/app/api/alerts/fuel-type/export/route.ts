import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import * as ExcelJS from 'exceljs'
import { getSystemSettings } from '@/lib/system-settings'

function formatDate(date: Date): string {
  const day   = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year  = date.getFullYear()
  return `${day}/${month}/${year}`
}

function getFuelGroup(product: string): 'nafta' | 'gasoil' | 'unknown' {
  if (!product) return 'unknown'
  const p = product.toUpperCase()
  if (p.includes('NAFTA') || (p.includes('INFINIA') && !p.includes('DIESEL'))) return 'nafta'
  if (p.includes('INFINIA DIESEL') || p.includes('D.DIESEL')) return 'gasoil'
  return 'unknown'
}

const NAVY   = 'FF1F3864'
const WHITE  = 'FFFFFFFF'
const BLCK   = 'FF000000'

function safeMerge(ws: ExcelJS.Worksheet, range: string) {
  try { ws.unMergeCells(range) } catch {}
  ws.mergeCells(range)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factura   = searchParams.get('factura')
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')
    const areaId    = searchParams.get('areaId')

    const sysSettings = await getSystemSettings()
    const orgName = sysSettings.org_name.toUpperCase()

    // Build the FuelLog filter
    const logWhere: any = { status: 'IMPORTED' }
    if (factura) {
      logWhere.factura = factura
    } else if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split('-').map(Number)
      const [ey, em, ed] = endDate.split('-').map(Number)
      logWhere.date = {
        gte: new Date(sy, sm - 1, sd, 0, 0, 0),
        lte: new Date(ey, em - 1, ed, 23, 59, 59, 999)
      }
    }

    const cardWhere: any = { fuelLogs: { some: logWhere } }
    if (areaId) cardWhere.areaId = areaId

    const cardsWithLogs = await prisma.card.findMany({
      where: cardWhere,
      include: {
        fuelLogs: { where: logWhere, orderBy: { date: 'desc' } },
        area: true,
        subArea: true
      }
    })

    const alerts: any[] = []

    for (const card of cardsWithLogs) {
      if (card.cardType === 'maquinaria' || card.allowedFuel === 'ambos') continue

      let suspiciousLoads: any[] = []
      let primaryGroup: 'nafta' | 'gasoil'

      if (!card.cardType || !card.allowedFuel) {
        const naftaLogs  = card.fuelLogs.filter(l => getFuelGroup(l.description || '') === 'nafta')
        const gasoilLogs = card.fuelLogs.filter(l => getFuelGroup(l.description || '') === 'gasoil')
        const naftaL  = naftaLogs.reduce((s, l) => s + (l.gallons || 0), 0)
        const gasoilL = gasoilLogs.reduce((s, l) => s + (l.gallons || 0), 0)
        if (naftaL === 0 && gasoilL === 0) continue
        primaryGroup    = gasoilL > naftaL ? 'gasoil' : 'nafta'
        suspiciousLoads = primaryGroup === 'nafta' ? gasoilLogs : naftaLogs
      } else {
        primaryGroup = card.allowedFuel === 'nafta' ? 'nafta' : 'gasoil'
        if (card.allowedFuel === 'nafta') {
          suspiciousLoads = card.fuelLogs.filter(l => {
            const p = (l.description || '').toUpperCase()
            return p.includes('DIESEL') || p.includes('D.DIESEL')
          })
        } else {
          suspiciousLoads = card.fuelLogs.filter(l => {
            const p = (l.description || '').toUpperCase()
            return (p.includes('NAFTA') || p.includes('INFINIA')) && !p.includes('DIESEL')
          })
        }
      }

      if (suspiciousLoads.length > 0) {
        alerts.push({
          mainArea: card.area?.name || 'Sin Secretaría',
          subArea:  card.subArea?.name || 'Sin Dependencia',
          dominio:  card.identification || 'Sin Dominio',
          primaryGroup,
          suspiciousLoads: suspiciousLoads.map(l => ({
            date:    formatDate(l.date),
            product: l.description || 'Sin Producto',
            liters:  l.gallons     || 0,
            amount:  l.amount      || 0,
            remito:  l.remito      || 'Sin Remito'
          }))
        })
      }
    }

    // Flatten and sort
    const rows = alerts.flatMap(a =>
      a.suspiciousLoads.map((l: any) => ({
        secretaria:            a.mainArea,
        dependencia:           a.subArea,
        dominio:               a.dominio,
        combustiblePermitido:  a.primaryGroup === 'nafta' ? 'Nafta' : 'Gasoil',
        productoCargado:       l.product,
        fecha:                 l.date,
        litros:                l.liters,
        importe:               l.amount,
        remito:                l.remito
      }))
    )
    rows.sort((a: any, b: any) => {
      const da = new Date(a.fecha.split('/').reverse().join('-'))
      const db = new Date(b.fecha.split('/').reverse().join('-'))
      return db.getTime() - da.getTime()
    })

    // Build period label for title
    const periodLabel = factura
      ? `Factura ${factura}`
      : startDate && endDate
        ? `${startDate.split('-').reverse().join('/')} al ${endDate.split('-').reverse().join('/')}`
        : 'Todos los períodos'

    const areaLabel = areaId
      ? (rows[0]?.secretaria || 'Secretaría')
      : 'Todas las Secretarías'

    // Build workbook
    const wb  = new ExcelJS.Workbook()
    const ws  = wb.addWorksheet('Alertas', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 } }
    })

    ws.columns = [
      { width: 22 }, // A - Secretaría
      { width: 22 }, // B - Dependencia
      { width: 14 }, // C - Dominio
      { width: 16 }, // D - Comb. Permitido
      { width: 18 }, // E - Producto Cargado
      { width: 12 }, // F - Fecha
      { width: 10 }, // G - Litros
      { width: 15 }, // H - Importe
      { width: 15 }, // I - Remito
    ]

    const cols = ['A','B','C','D','E','F','G','H','I']
    const C = (col: string, row: number) => ws.getCell(`${col}${row}`)

    // Row 1: org name
    safeMerge(ws, 'A1:I1')
    const c1 = C('A', 1)
    c1.value = orgName
    c1.font      = { name: 'Calibri', bold: true, size: 14, color: { argb: WHITE } }
    c1.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    c1.alignment = { horizontal: 'center', vertical: 'middle' }
    c1.border    = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    ws.getRow(1).height = 22

    // Row 2: title
    safeMerge(ws, 'A2:I2')
    const c2 = C('A', 2)
    c2.value = `Alertas de Combustible — ${areaLabel} — ${periodLabel}`
    c2.font      = { name: 'Calibri', bold: true, size: 11, color: { argb: WHITE } }
    c2.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    c2.alignment = { horizontal: 'left', vertical: 'middle' }
    c2.border    = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    ws.getRow(2).height = 18

    // Row 3: headers
    const headers = ['Secretaría', 'Dependencia', 'Dominio', 'Comb. Permitido', 'Producto Cargado', 'Fecha', 'Litros', 'Importe', 'Remito']
    headers.forEach((h, i) => {
      const cell = C(cols[i], 3)
      cell.value     = h
      cell.font      = { name: 'Calibri', bold: true, size: 11, color: { argb: WHITE } }
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border    = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }
    })
    ws.getRow(3).height = 16

    // Data rows
    rows.forEach((row: any, idx: number) => {
      const r  = idx + 4
      const values = [
        row.secretaria, row.dependencia, row.dominio,
        row.combustiblePermitido, row.productoCargado,
        row.fecha, row.litros, row.importe, row.remito
      ]
      values.forEach((v, i) => {
        const cell = C(cols[i], r)
        cell.value     = v
        cell.font      = { name: 'Calibri', size: 11, color: { argb: BLCK } }
        cell.alignment = { horizontal: i >= 6 ? 'right' : 'left', vertical: 'middle' }
        cell.border    = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      })
    })

    const buffer   = await wb.xlsx.writeBuffer()
    const fileSlug = areaId ? `alertas_${areaLabel.replace(/\s/g, '_')}` : 'alertas_combustible'
    const datePart = factura ? `factura_${factura}` : startDate ? `${startDate}_${endDate}` : 'todos'
    const filename = `${fileSlug}_${datePart}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error exporting fuel type alerts' }, { status: 500 })
  }
}
