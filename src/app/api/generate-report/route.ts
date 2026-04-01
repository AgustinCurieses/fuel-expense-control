import { NextRequest, NextResponse } from 'next/server'
import * as ExcelJS from 'exceljs'
import { prisma } from '@/lib/database'
import { getSystemSettings } from '@/lib/system-settings'

// Argentine currency format
function formatARS(value: number): string {
  const parts = value.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return '$ ' + parts[0] + ',' + parts[1]
}

// Colors (matching executive summary palette)
const NAVY  = 'FF1F3864'
const LT_BLU = 'FFBDD7EE'
const WHITE  = 'FFFFFFFF'
const BLCK   = 'FF000000'

function safeMerge(ws: ExcelJS.Worksheet, range: string) {
  try { ws.unMergeCells(range) } catch {}
  ws.mergeCells(range)
}

type StyleOpts = {
  val?: ExcelJS.CellValue
  bold?: boolean
  size?: number
  color?: string
  bg?: string
  h?: ExcelJS.Alignment['horizontal']
  v?: ExcelJS.Alignment['vertical']
  border?: 'medium' | 'thin'
  wrap?: boolean
}

function S(cell: ExcelJS.Cell, opts: StyleOpts) {
  if (opts.val !== undefined) cell.value = opts.val
  cell.font = {
    name: 'Calibri',
    bold:  opts.bold  ?? false,
    size:  opts.size  ?? 11,
    color: { argb: opts.color ?? BLCK }
  }
  if (opts.bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } }
  cell.alignment = {
    horizontal: opts.h    ?? 'center',
    vertical:   opts.v    ?? 'middle',
    wrapText:   opts.wrap ?? false
  }
  if (opts.border) {
    const b = { style: opts.border as ExcelJS.BorderStyle }
    cell.border = { top: b, bottom: b, left: b, right: b }
  }
}

export async function GET(request: NextRequest) {
  try {
    const sysSettings = await getSystemSettings()
    const orgName = sysSettings.org_name.toUpperCase()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')
    const areaId    = searchParams.get('areaId')
    const factura   = searchParams.get('factura')

    if (!factura && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Either factura number or both startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Parse dates
    let start, end
    if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split('-').map(Number)
      start = new Date(sy, sm - 1, sd, 0, 0, 0)
      const [ey, em, ed] = endDate.split('-').map(Number)
      end = new Date(ey, em - 1, ed, 23, 59, 59, 999)
    }

    // Build where clause
    const whereClause: any = { status: 'IMPORTED', cardId: { not: null } }
    if (start && end) whereClause.date = { gte: start, lte: end }
    if (areaId)       whereClause.mainAreaId = areaId
    if (factura)      whereClause.factura = factura

    const fuelLogs = await prisma.fuelLog.findMany({
      where: whereClause,
      include: { card: { include: { area: true, subArea: true } }, user: true },
      orderBy: { date: 'asc' }
    })

    const areaName = fuelLogs.length > 0 && fuelLogs[0].card?.area?.name
      ? fuelLogs[0].card.area.name
      : 'Área Desconocida'

    const formatDateTitle = (dateStr: string): string => {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    }
    const formatDateDisplay = (d: Date): string => {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      return `${dd}/${mm}/${d.getFullYear()}`
    }

    const title = factura
      ? `${areaName} — Factura ${factura}`
      : `${areaName} — Período ${formatDateTitle(startDate!)} al ${formatDateTitle(endDate!)}`

    // ── Workbook ────────────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(areaName, {
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
      }
    })

    ws.columns = [
      { width: 24.29 }, // A - Dependencia
      { width: 18 },    // B - Tarjeta
      { width: 32.29 }, // C - Conductor Autorizado
      { width: 14.29 }, // D - Dominio
      { width: 13.86 }, // E - Producto
      { width: 7.43 },  // F - Litros
      { width: 17 },    // G - Importe
      { width: 13 },    // H - Fecha
      { width: 39.57 }, // I - Establecimiento
      { width: 9.86 },  // J - Localidad
      { width: 15 }     // K - Remito
    ]

    const C  = (col: string, row: number) => ws.getCell(`${col}${row}`)
    const M  = (rng: string) => safeMerge(ws, rng)
    const RH = (row: number, h: number) => { ws.getRow(row).height = h }

    // ── Row 1: Org name header ──────────────────────────────────────────────
    M('A1:K1')
    S(C('A', 1), { val: orgName, bold: true, size: 14, color: WHITE, bg: NAVY, border: 'medium' })
    RH(1, 22)

    // ── Row 2: Report title ─────────────────────────────────────────────────
    M('A2:K2')
    S(C('A', 2), { val: title, bold: true, size: 11, color: WHITE, bg: NAVY, h: 'left', border: 'medium' })
    RH(2, 18)

    // ── Row 3: Column headers ───────────────────────────────────────────────
    const headers = [
      'Dependencia', 'Tarjeta', 'Conductor Autorizado', 'Dominio',
      'Producto', 'Litros', 'Importe', 'Fecha',
      'Establecimiento', 'Localidad', 'Remito'
    ]
    const colLetters = ['A','B','C','D','E','F','G','H','I','J','K']
    headers.forEach((header, i) => {
      S(C(colLetters[i], 3), {
        val: header, bold: true, size: 11,
        color: WHITE, bg: NAVY, border: 'medium'
      })
    })
    RH(3, 16)

    // ── Data rows ───────────────────────────────────────────────────────────
    let currentRow = 4
    for (const log of fuelLogs) {
      const row = ws.getRow(currentRow)

      const setCell = (colIdx: number, value: ExcelJS.CellValue, halign: ExcelJS.Alignment['horizontal'] = 'left') => {
        const cell = row.getCell(colIdx)
        S(cell, { val: value, size: 11, h: halign, border: 'thin' })
      }

      setCell(1,  log.card?.subArea?.name || '')
      setCell(2,  log.card?.cardNumber || '')
      setCell(3,  log.conductor || '')
      setCell(4,  log.dominio || '')
      setCell(5,  log.description || '')
      setCell(6,  log.gallons || 0, 'right')
      setCell(7,  formatARS(log.amount), 'right')
      setCell(8,  formatDateDisplay(new Date(log.date)), 'center')
      setCell(9,  log.location || '')
      setCell(10, log.localidad || '')
      setCell(11, log.remito || '', 'right')

      currentRow++
    }

    // ── Total row ───────────────────────────────────────────────────────────
    const totalRow = currentRow
    const totalImporte = fuelLogs.reduce((sum, log) => sum + (log.amount || 0), 0)

    M(`A${totalRow}:F${totalRow}`)
    S(C('A', totalRow), {
      val: 'Total :',
      bold: true, size: 11, h: 'right', bg: LT_BLU, border: 'medium'
    })
    S(C('G', totalRow), {
      val: formatARS(totalImporte),
      bold: true, size: 11, h: 'right', bg: LT_BLU, border: 'medium'
    })
    // H–K of total row: blank, no fill, no border
    ;['H','I','J','K'].forEach(col => {
      const cell = C(col, totalRow)
      cell.value = null
      cell.fill  = { type: 'pattern', pattern: 'none' }
      cell.border = {}
    })
    RH(totalRow, 16)

    // ── Generate buffer ─────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer()

    const filenameBase = factura
      ? `reporte_factura_${factura}`
      : `reporte_${startDate}_${endDate}`

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
