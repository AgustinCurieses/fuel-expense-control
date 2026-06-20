import { NextRequest, NextResponse } from 'next/server'
import * as ExcelJS from 'exceljs'
import { prisma } from '@/lib/database'
import { getSystemSettings } from '@/lib/system-settings'
import { createCanvas } from '@napi-rs/canvas'

function formatARS(amount: number): string {
  return '$ ' + amount.toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatNum(n: number, decimals = 1): string {
  return n.toFixed(decimals)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatARSDelta(n: number): string {
  const abs = formatARS(Math.abs(n))
  return n >= 0 ? `+${abs}` : `-${abs}`
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function safeMerge(ws: ExcelJS.Worksheet, range: string) {
  try { ws.unMergeCells(range) } catch {}
  ws.mergeCells(range)
}

// Colors
const NAVY   = 'FF1F3864'
const LT_BLU = 'FFBDD7EE'
const KPI_BG = 'FFE8F0FE'
const WHITE  = 'FFFFFFFF'
const RED_FG = 'FFC00000'
const GRN_FG = 'FF375623'
const ORG_FG = 'FF833C00'
const RED_BG = 'FFFCE4D6'
const GRN_BG = 'FFE2EFDA'
const ORG_BG = 'FFFFEAD6'
const BLCK   = 'FF000000'
const GRAY   = 'FF666666'

// Nombres exactos en BD (sin tildes)
const AREAS_DB_ORDER = [
  'Salud', 'Proteccion Ciudadana', 'Intendencia', 'Jefatura de Gabinete',
  'Obras Publicas', 'Desarrollo Humano', 'Desarrollo Productivo',
  'Economia', 'Gobierno', 'Servicios Publicos'
]

const DISPLAY_NAME: Record<string, string> = {
  'Proteccion Ciudadana': 'Protección Ciudadana',
  'Obras Publicas':       'Obras Públicas',
  'Economia':             'Economía',
  'Servicios Publicos':   'Servicios Públicos'
}
const dn = (n: string) => DISPLAY_NAME[n] ?? n

const SPAN_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

type StyleOpts = {
  val?: ExcelJS.CellValue
  bold?: boolean
  size?: number
  color?: string
  bg?: string
  h?: ExcelJS.Alignment['horizontal']
  v?: ExcelJS.Alignment['vertical']
  border?: 'medium' | 'thin'
  italic?: boolean
  wrap?: boolean
}

function S(cell: ExcelJS.Cell, opts: StyleOpts) {
  if (opts.val !== undefined) cell.value = opts.val
  cell.font = {
    name: 'Calibri',
    bold:   opts.bold   ?? false,
    size:   opts.size   ?? 11,
    italic: opts.italic ?? false,
    color:  { argb: opts.color ?? BLCK }
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

function drawDailyBarChart(
  labels: string[],
  values: number[],
  width: number,
  height: number,
  title: string
): Buffer | null {
  try {
    const canvas = createCanvas(width, height) as any
    const ctx    = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const n = labels.length
    if (n === 0) return null

    const padL = 70, padR = 20, padT = 50, padB = 36
    const cW = width - padL - padR
    const cH = height - padT - padB
    const maxVal = Math.max(...values, 1)

    // Title
    ctx.fillStyle = '#1F3864'
    ctx.font      = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, width / 2, 32)

    // Y-axis grid + labels
    for (let t = 0; t <= 5; t++) {
      const v = (t / 5) * maxVal
      const y = padT + cH - (t / 5) * cH
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth   = 1
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + cW, y); ctx.stroke()
      const lbl = v >= 1000 ? `${(v / 1000).toFixed(1)}k L` : `${v.toFixed(0)} L`
      ctx.fillStyle  = '#555'
      ctx.font       = '11px sans-serif'
      ctx.textAlign  = 'right'
      ctx.fillText(lbl, padL - 6, y + 4)
    }

    // Bars
    const slotW = cW / n
    const barW  = Math.max(4, slotW * 0.68)

    values.forEach((v, i) => {
      const barH = (v / maxVal) * cH
      const x    = padL + i * slotW + (slotW - barW) / 2
      const y    = padT + cH - barH
      ctx.fillStyle = '#2E75B6'
      ctx.fillRect(x, y, barW, barH)
      ctx.fillStyle  = '#555'
      ctx.font       = '11px sans-serif'
      ctx.textAlign  = 'center'
      ctx.fillText(labels[i], x + barW / 2, padT + cH + 16)
    })

    // Axes
    ctx.strokeStyle = '#999'
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + cH); ctx.lineTo(padL + cW, padT + cH)
    ctx.stroke()

    return canvas.toBuffer('image/png') as Buffer
  } catch (e) {
    console.error('drawDailyBarChart error:', e)
    return null
  }
}

const AREA_COLORS = [
  '#1F3864', '#2E75B6', '#4472C4', '#70AD47', '#ED7D31',
  '#FFC000', '#C00000', '#7030A0', '#00B0F0', '#92D050'
]

function drawPieChart(
  labels: string[],
  values: number[],
  colors: string[],
  width: number,
  height: number,
  title: string
): Buffer | null {
  try {
    const canvas = createCanvas(width, height) as any
    const ctx    = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const total = values.reduce((s, v) => s + v, 0)

    ctx.fillStyle = '#1F3864'
    ctx.font      = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, width / 2, 32)

    if (total === 0) return canvas.toBuffer('image/png') as Buffer

    const legendH = labels.length * 22 + 14
    const availH  = height - 52 - legendH
    const cx = width / 2
    const cy = 52 + availH / 2
    const r  = Math.min(cx - 20, availH / 2) * 0.88

    let startAngle = -Math.PI / 2
    values.forEach((v, i) => {
      const sweep = (v / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep)
      ctx.closePath()
      ctx.fillStyle   = colors[i] || '#ccc'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth   = 2
      ctx.stroke()

      if (v / total > 0.06) {
        const midAngle = startAngle + sweep / 2
        const lx = cx + Math.cos(midAngle) * r * 0.62
        const ly = cy + Math.sin(midAngle) * r * 0.62
        ctx.fillStyle  = '#ffffff'
        ctx.font       = 'bold 12px sans-serif'
        ctx.textAlign  = 'center'
        ctx.fillText(`${(v / total * 100).toFixed(0)}%`, lx, ly + 4)
      }
      startAngle += sweep
    })

    const legendStartY = cy + r + 18
    labels.forEach((label, i) => {
      const ly  = legendStartY + i * 22
      const pct = (values[i] / total * 100).toFixed(1)
      ctx.fillStyle = colors[i] || '#ccc'
      ctx.fillRect(24, ly - 12, 14, 14)
      ctx.fillStyle = '#333'
      ctx.font      = '12px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${label}  ${pct}%`, 44, ly)
    })

    return canvas.toBuffer('image/png') as Buffer
  } catch (e) {
    console.error('drawPieChart error:', e)
    return null
  }
}


export async function GET(request: NextRequest) {
  try {
    const sysSettings = await getSystemSettings()
    const orgName = sysSettings.org_name.toUpperCase()

    const { searchParams } = new URL(request.url)
    const facturasParam = searchParams.get('facturas')
    const prevParam     = searchParams.get('prevFacturas')
    const monthLabel    = searchParams.get('monthLabel') ?? ''
    // legacy
    const factura       = searchParams.get('factura')
    const startDate     = searchParams.get('startDate')
    const endDate       = searchParams.get('endDate')

    const isMonthly = !!facturasParam
    const isPartial = monthLabel.toLowerCase().includes('quincena')

    // ── Where clauses ─────────────────────────────────────────────────────
    const base: Record<string, unknown> = { status: 'IMPORTED', cardId: { not: null } }

    const currWhere: Record<string, unknown> = { ...base }
    if (isMonthly) {
      currWhere.factura = { in: facturasParam!.split(',').filter(Boolean) }
    } else if (factura) {
      currWhere.factura = factura
    } else if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split('-').map(Number)
      const [ey, em, ed] = endDate.split('-').map(Number)
      const s = new Date(sy, sm - 1, sd, 0, 0, 0)
      const e = new Date(ey, em - 1, ed, 23, 59, 59, 999)
      currWhere.date = { gte: s, lte: e }
    }

    const prevWhere: Record<string, unknown> = { ...base }
    if (isMonthly && prevParam) {
      prevWhere.factura = { in: prevParam.split(',').filter(Boolean) }
    }

    // ── Queries ────────────────────────────────────────────────────────────
    const include = { card: true, mainArea: true }

    // currWhere/prevWhere filtran cardId != null para cálculos de área/vehículo.
    // Para distribución por combustible usamos una query SIN ese filtro para
    // incluir todos los logs importados (incluso tarjetas pendientes de asignación).
    const fuelWhere: Record<string, unknown> = { status: 'IMPORTED' }
    if (isMonthly) {
      fuelWhere.factura = { in: facturasParam!.split(',').filter(Boolean) }
    } else if (factura) {
      fuelWhere.factura = factura
    } else if (currWhere.date) {
      fuelWhere.date = currWhere.date
    }

    const [currLogs, allFuelLogs] = await Promise.all([
      prisma.fuelLog.findMany({ where: currWhere, include }),
      prisma.fuelLog.findMany({
        where: fuelWhere,
        select: { description: true, gallons: true, totalCost: true }
      })
    ])

    if (currLogs.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    const prevLogs = (isMonthly && prevParam)
      ? await prisma.fuelLog.findMany({ where: prevWhere, include })
      : []

    // ── Aggregates ────────────────────────────────────────────────────────
    const agg = (logs: typeof currLogs) => ({
      total:    logs.reduce((s, l) => s + l.totalCost, 0),
      litros:   logs.reduce((s, l) => s + l.gallons,   0),
      vehicles: Array.from(new Set(logs.map(l => l.cardId).filter(Boolean))).length
    })

    const curr = agg(currLogs)
    const prev = agg(prevLogs)
    const currPrecio  = curr.litros > 0 ? curr.total / curr.litros : 0
    const prevPrecio  = prev.litros > 0 ? prev.total / prev.litros : 0
    const varTotal    = curr.total  - prev.total
    const varTotalPct = prev.total  > 0 ? (varTotal / prev.total) * 100 : 0
    const priceEffect  = (currPrecio - prevPrecio) * prev.litros
    const volumeEffect = (curr.litros - prev.litros) * currPrecio
    const pricePct    = prevPrecio  > 0 ? (currPrecio  - prevPrecio)  / prevPrecio  * 100 : 0
    const litrosPct   = prev.litros > 0 ? (curr.litros - prev.litros) / prev.litros * 100 : 0

    // ── Group by area ─────────────────────────────────────────────────────
    type AreaRow = { total: number; litros: number }
    const groupByArea = (logs: typeof currLogs) => {
      const m = new Map<string, AreaRow>()
      logs.forEach(l => {
        const name = l.mainArea?.name ?? 'Sin Área'
        const ex = m.get(name)
        if (ex) { ex.total += l.totalCost; ex.litros += l.gallons }
        else     m.set(name, { total: l.totalCost, litros: l.gallons })
      })
      return m
    }
    const currByArea = groupByArea(currLogs)
    const prevByArea = groupByArea(prevLogs)

    // ── Price evolution per quincena ──────────────────────────────────────
    type PricePoint = { label: string; precio: number; minDate: Date }
    const priceEvolution: PricePoint[] = []

    if (isMonthly) {
      const allFacturas = [
        ...(prevParam     ? prevParam.split(',').filter(Boolean)     : []),
        ...(facturasParam ? facturasParam.split(',').filter(Boolean) : [])
      ]
      for (const f of allFacturas) {
        const logs = await prisma.fuelLog.findMany({
          where: { factura: f, status: 'IMPORTED' },
          select: { date: true, totalCost: true, gallons: true },
          orderBy: { date: 'asc' }
        })
        if (logs.length === 0) continue
        const t = logs.reduce((s, l) => s + l.totalCost, 0)
        const g = logs.reduce((s, l) => s + l.gallons,   0)
        if (g === 0) continue
        const medianDate = logs[Math.floor(logs.length / 2)].date
        const quinc = medianDate.getDate() <= 15 ? '1ra quincena' : '2da quincena'
        priceEvolution.push({
          label:   `${quinc} ${SPAN_MONTHS[medianDate.getMonth()]} ${medianDate.getFullYear()}`,
          precio:  t / g,
          minDate: logs[0].date
        })
      }
      priceEvolution.sort((a, b) => a.minDate.getTime() - b.minDate.getTime())
    }

    // ── Top 5 vehicles ────────────────────────────────────────────────────
    type VehicleRow = { ident: string; area: string; total: number; litros: number }
    const vmap = new Map<string, VehicleRow>()
    currLogs.forEach(l => {
      if (!l.cardId) return
      const ident = l.card?.identification ?? l.card?.cardNumber ?? 'Sin ID'
      const area  = l.mainArea?.name ?? 'Sin Área'
      const ex = vmap.get(l.cardId)
      if (ex) { ex.total += l.totalCost; ex.litros += l.gallons }
      else     vmap.set(l.cardId, { ident, area, total: l.totalCost, litros: l.gallons })
    })
    const top5 = Array.from(vmap.values()).sort((a, b) => b.total - a.total).slice(0, 5)

    // ── Daily litros ──────────────────────────────────────────────────────
    const dailyLitrosMap = new Map<string, number>()
    currLogs.forEach(l => {
      const dayKey = String(l.date.getDate()).padStart(2, '0')
      dailyLitrosMap.set(dayKey, (dailyLitrosMap.get(dayKey) ?? 0) + l.gallons)
    })
    const dailyLabels = Array.from(dailyLitrosMap.keys()).sort()
    const dailyValues = dailyLabels.map(k => dailyLitrosMap.get(k)!)

    // ── Fuel type breakdown ───────────────────────────────────────────────
    // Usa allFuelLogs (sin filtro cardId) para capturar todos los tipos
    // incluyendo tarjetas pendientes de asignación.
    const FUEL_NAMES = ['Nafta Super', 'Infinia', 'Infinia Diesel', 'D.Diesel 500'] as const
    type FuelName = typeof FUEL_NAMES[number]
    const fuelBreakdown = new Map<FuelName, { litros: number; importe: number }>(
      FUEL_NAMES.map(f => [f, { litros: 0, importe: 0 }])
    )
    allFuelLogs.forEach(l => {
      const p = (l.description || '').toUpperCase().trim()
      let fk: FuelName | null = null
      if      (p.includes('NAFTA') && !p.includes('DIESEL'))                               fk = 'Nafta Super'
      else if (p.includes('INFINIA') && (p.includes('DIESEL') || p.includes('GAS OIL') || p.includes('GASOIL'))) fk = 'Infinia Diesel'
      else if (p.includes('INFINIA'))                                                       fk = 'Infinia'
      else if (p.includes('D.DIESEL') || p.includes('D. DIESEL') || p.includes('DIESEL 500')) fk = 'D.Diesel 500'
      else if (p.includes('DIESEL') || p.includes('GAS OIL') || p.includes('GASOIL'))     fk = 'D.Diesel 500'
      if (fk) { const fd = fuelBreakdown.get(fk)!; fd.litros += l.gallons; fd.importe += l.totalCost }
    })

    // ── Interpretive text for Descomposición ──────────────────────────────
    const hasPrev    = isMonthly && prevLogs.length > 0
    const isUp       = varTotal > 0
    const mainDriver = Math.abs(priceEffect) >= Math.abs(volumeEffect) ? 'precio' : 'consumo'

    let interpretation = ''
    if (hasPrev) {
      if (isUp) {
        interpretation = mainDriver === 'precio'
          ? `El gasto aumentó respecto al mes anterior. El principal factor es el incremento de precios de YPF (+${formatNum(pricePct, 1)}%). El consumo ${litrosPct >= 0 ? 'también aumentó' : 'se redujo'} un ${formatNum(Math.abs(litrosPct), 1)}%.`
          : `El gasto aumentó respecto al mes anterior. El principal factor es el mayor consumo de combustible (+${formatNum(litrosPct, 1)}%). Los precios de YPF ${pricePct >= 0 ? 'subieron' : 'bajaron'} un ${formatNum(Math.abs(pricePct), 1)}%.`
      } else {
        interpretation = mainDriver === 'consumo'
          ? `El gasto se redujo respecto al mes anterior. La disminución en el consumo (${formatNum(litrosPct, 1)}%) es el principal factor, parcialmente compensada por el aumento de precios de YPF (+${formatNum(pricePct, 1)}%).`
          : `El gasto se redujo respecto al mes anterior. La baja de precios de YPF (${formatNum(pricePct, 1)}%) es el principal factor. El consumo ${litrosPct >= 0 ? 'aumentó' : 'también se redujo'} un ${formatNum(Math.abs(litrosPct), 1)}%.`
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXCEL — Portrait A4, 7 columnas (A–G)
    // A=32, B=18, C=18, D=16, E=10, F=6, G=8
    // ═══════════════════════════════════════════════════════════════════════
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Resumen Ejecutivo', {
      pageSetup: {
        paperSize: 9,
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
      }
    })

    ws.columns = [
      { width: 32 }, // A
      { width: 18 }, // B
      { width: 24 }, // C
      { width: 16 }, // D
      { width: 10 }, // E
      { width: 8  }, // F  (ampliado de 6 a 8)
      { width: 10 }, // G  (ampliado de 8 a 10)
    ]

    const COLS = ['A','B','C','D','E','F','G'] as const
    type Col = typeof COLS[number]
    const C  = (col: Col | string, row: number) => ws.getCell(`${col}${row}`)
    const M  = (rng: string) => safeMerge(ws, rng)
    const RH = (row: number, h: number) => {
      const r = ws.getRow(row)
      r.height = h
      // Forzar customHeight en el modelo interno de ExcelJS
      const internalRow = r as unknown as Record<string, Record<string, unknown>>
      const model = internalRow._model ?? internalRow.model
      if (model) { model.height = h; model.customHeight = true }
    }

    let r = 1

    // ── HEADER ─────────────────────────────────────────────────────────────
    M(`A${r}:G${r}`)
    S(C('A',r), { val: orgName, bold: true, size: 14, color: WHITE, bg: NAVY, border: 'medium' })
    RH(r, 24); r++

    M(`A${r}:D${r}`)
    S(C('A',r), { val: `Resumen Ejecutivo de Combustible — ${monthLabel}`, bold: true, size: 11, color: WHITE, bg: NAVY, h: 'left', border: 'medium' })
    M(`E${r}:G${r}`)
    S(C('E',r), { val: `Generado: ${formatDate(new Date())}`, size: 10, color: WHITE, bg: NAVY, h: 'right', border: 'medium' })
    RH(r, 18); r++

    RH(r, 6); r++ // spacer

    if (isPartial) {
      M(`A${r}:G${r}`)
      S(C('A',r), {
        val: `Nota: este resumen corresponde \u00FAnicamente a la ${monthLabel}. La variaci\u00F3n se compara contra la misma quincena del mes anterior.`,
        size: 10, italic: true, color: ORG_FG, bg: ORG_BG, h: 'left', border: 'thin', wrap: true
      })
      RH(r, 24); r++
    }

    // ── KPIs NIVEL 1 — Resumen financiero ────────────────────────────────
    // A:B = Total Gastado | C:D = Mes Anterior | E:G = Variación %
    M(`A${r}:B${r}`); S(C('A',r), { val: 'Total Gastado',  bold: true, size: 10, bg: KPI_BG, border: 'thin' })
    M(`C${r}:D${r}`); S(C('C',r), { val: 'Mes Anterior',   bold: true, size: 10, bg: KPI_BG, border: 'thin' })
    M(`E${r}:G${r}`); S(C('E',r), { val: 'Variación %',    bold: true, size: 10, bg: KPI_BG, border: 'thin' })
    RH(r, 16); r++

    M(`A${r}:B${r}`)
    S(C('A',r), { val: formatARS(curr.total), bold: true, size: 16, bg: WHITE, border: 'medium' })
    M(`C${r}:D${r}`)
    S(C('C',r), { val: hasPrev ? formatARS(prev.total) : '—', bold: true, size: 16, bg: WHITE, border: 'medium' })
    M(`E${r}:G${r}`)
    S(C('E',r), {
      val: hasPrev ? `${varTotalPct >= 0 ? '+' : ''}${formatNum(varTotalPct, 1)}%` : '—',
      bold: true, size: 18,
      bg: hasPrev ? (isUp ? RED_BG : GRN_BG) : WHITE,
      color: hasPrev ? (isUp ? RED_FG : GRN_FG) : BLCK,
      border: 'medium'
    })
    RH(r, 28); r++

    RH(r, 4); r++ // mini spacer entre niveles

    // ── KPIs NIVEL 2 — Detalle operativo ─────────────────────────────────
    // A:B = Variación $ | C:D = Litros | E:F = Precio/L | G = Vehículos
    M(`A${r}:B${r}`); S(C('A',r), { val: 'Variación $',        bold: true, size: 10, bg: KPI_BG, border: 'thin' })
    M(`C${r}:D${r}`); S(C('C',r), { val: 'Litros consumidos',  bold: true, size: 10, bg: KPI_BG, border: 'thin' })
    M(`E${r}:F${r}`); S(C('E',r), { val: 'Precio / L',         bold: true, size: 10, bg: KPI_BG, border: 'thin' })
    S(C('G',r),       { val: 'Vehículos',                       bold: true, size: 10, bg: KPI_BG, border: 'thin' })
    RH(r, 16); r++

    M(`A${r}:B${r}`)
    S(C('A',r), {
      val: hasPrev ? formatARSDelta(varTotal) : '—',
      bold: true, size: 13,
      bg: hasPrev ? (isUp ? RED_BG : GRN_BG) : WHITE,
      color: hasPrev ? (isUp ? RED_FG : GRN_FG) : BLCK,
      border: 'medium'
    })
    M(`C${r}:D${r}`)
    S(C('C',r), { val: `${formatNum(curr.litros, 0)} L`, bold: true, size: 13, bg: WHITE, border: 'medium' })
    M(`E${r}:F${r}`)
    S(C('E',r), { val: formatARS(currPrecio), bold: true, size: 13, bg: WHITE, border: 'medium' })
    S(C('G',r), { val: `${curr.vehicles}`,   bold: true, size: 13, bg: WHITE, border: 'medium' })
    RH(r, 24); r++

    RH(r, 8); r++ // spacer

    // ── GASTO POR SECRETARÍA ───────────────────────────────────────────────
    M(`A${r}:G${r}`)
    S(C('A',r), { val: 'GASTO POR SECRETARÍA', bold: true, size: 11, color: WHITE, bg: NAVY, border: 'medium' })
    RH(r, 18); r++

    // Headers — F = Tend., G = Litros
    const tblH = ['Secretaría', '$ Actual', '$ Anterior', 'Δ $', 'Δ %', 'Tend.', 'Litros']
    tblH.forEach((h, i) => S(C(COLS[i], r), { val: h, bold: true, size: 10, bg: LT_BLU, border: 'thin' }))
    RH(r, 16); r++

    let alt = false
    let sumCurr = 0, sumPrev = 0, sumLitros = 0

    for (const areaName of AREAS_DB_ORDER) {
      const cArea = currByArea.get(areaName)
      const pArea = prevByArea.get(areaName)
      const cVal    = cArea?.total  ?? 0
      const pVal    = pArea?.total  ?? 0
      const cLitros = cArea?.litros ?? 0
      const delta    = cVal - pVal
      const deltaPct = pVal > 0 ? (delta / pVal) * 100 : (cVal > 0 ? 100 : 0)
      sumCurr += cVal; sumPrev += pVal; sumLitros += cLitros

      let semaf = ''; let dBg = alt ? LT_BLU : WHITE; let dClr = BLCK
      if (hasPrev) {
        if      (deltaPct >  15) { semaf = '▲'; dBg = RED_BG; dClr = RED_FG }
        else if (deltaPct >   5) { semaf = '▲'; dBg = ORG_BG; dClr = ORG_FG }
        else if (deltaPct <  -5) { semaf = '▼'; dBg = GRN_BG; dClr = GRN_FG }
        else                     { semaf = '='; dBg = alt ? LT_BLU : WHITE; dClr = BLCK }
      }
      const rowBg = alt ? LT_BLU : WHITE

      S(C('A',r), { val: dn(areaName),   size: 11, bg: rowBg, h: 'left', border: 'thin' })
      S(C('B',r), { val: formatARS(cVal), size: 11, bg: rowBg,            border: 'thin' })
      S(C('C',r), { val: pVal > 0 ? formatARS(pVal) : '—', size: 11, bg: rowBg, border: 'thin' })
      S(C('D',r), { val: hasPrev ? formatARSDelta(delta) : '—',
                    size: 11, bg: dBg, color: dClr, border: 'thin' })
      S(C('E',r), { val: hasPrev ? `${deltaPct >= 0 ? '+' : ''}${formatNum(deltaPct,1)}%` : '—',
                    size: 11, bg: dBg, color: dClr, border: 'thin' })
      S(C('F',r), { val: semaf, bold: true, size: 12, bg: dBg, color: dClr, border: 'thin' })
      S(C('G',r), { val: cLitros > 0 ? `${formatNum(cLitros, 0)} L` : '—',
                    size: 10, bg: rowBg, border: 'thin' })
      RH(r, 15); r++
      alt = !alt
    }

    // Total row
    const totDelta    = sumCurr - sumPrev
    const totDeltaPct = sumPrev > 0 ? (totDelta / sumPrev) * 100 : 0

    S(C('A',r), { val: 'TOTAL',          bold: true, size: 11, bg: NAVY, color: WHITE, h: 'left', border: 'medium' })
    S(C('B',r), { val: formatARS(sumCurr), bold: true, size: 11, bg: NAVY, color: WHITE,           border: 'medium' })
    S(C('C',r), { val: sumPrev > 0 ? formatARS(sumPrev) : '—', bold: true, size: 11, bg: NAVY, color: WHITE, border: 'medium' })
    S(C('D',r), { val: hasPrev ? formatARSDelta(totDelta) : '—', bold: true, size: 11, bg: NAVY, color: WHITE, border: 'medium' })
    S(C('E',r), { val: hasPrev ? `${totDeltaPct >= 0 ? '+' : ''}${formatNum(totDeltaPct,1)}%` : '—', bold: true, size: 11, bg: NAVY, color: WHITE, border: 'medium' })
    S(C('F',r), { val: '',               bold: true, size: 11, bg: NAVY, color: WHITE,           border: 'medium' })
    S(C('G',r), { val: sumLitros > 0 ? `${formatNum(sumLitros, 0)} L` : '—', bold: true, size: 11, bg: NAVY, color: WHITE, border: 'medium' })
    RH(r, 16); r++

    RH(r, 8); r++ // spacer

    // ── DESCOMPOSICIÓN DE LA VARIACIÓN ────────────────────────────────────
    if (hasPrev) {
      M(`A${r}:G${r}`)
      S(C('A',r), { val: 'DESCOMPOSICIÓN DE LA VARIACIÓN', bold: true, size: 11, color: WHITE, bg: NAVY, border: 'medium' })
      RH(r, 18); r++

      // Fila 1 — Labels principales
      M(`A${r}:B${r}`); S(C('A',r), { val: 'Variación total',     bold: true, size: 10, bg: KPI_BG, border: 'thin' })
      M(`C${r}:D${r}`); S(C('C',r), { val: 'Efecto precio (YPF)', bold: true, size: 10, bg: KPI_BG, border: 'thin' })
      M(`E${r}:G${r}`); S(C('E',r), { val: 'Efecto consumo',      bold: true, size: 10, bg: KPI_BG, border: 'thin' })
      RH(r, 16); r++

      // Fila 2 — Valores principales
      M(`A${r}:B${r}`)
      S(C('A',r), { val: formatARSDelta(varTotal), bold: true, size: 14,
                    bg: isUp ? RED_BG : GRN_BG, color: isUp ? RED_FG : GRN_FG, border: 'medium' })
      M(`C${r}:D${r}`)
      S(C('C',r), {
        val: `${formatARSDelta(priceEffect)}  (precio ${pricePct >= 0 ? '+' : ''}${formatNum(pricePct, 1)}%)`,
        bold: true, size: 10, bg: WHITE, border: 'medium'
      })
      M(`E${r}:G${r}`)
      S(C('E',r), {
        val: `${formatARSDelta(volumeEffect)}  (litros ${litrosPct >= 0 ? '+' : ''}${formatNum(litrosPct, 1)}%)`,
        bold: true, size: 10, bg: WHITE, border: 'medium'
      })
      RH(r, 24); r++

      // Fila 3 — Detalle de precio y litros (ant → act)
      M(`A${r}:B${r}`); S(C('A',r), { val: 'Precio / L',  bold: true, size: 10, bg: KPI_BG, border: 'thin' })
      M(`C${r}:D${r}`); S(C('C',r), { val: 'Litros mes actual',   bold: true, size: 10, bg: KPI_BG, border: 'thin' })
      M(`E${r}:G${r}`); S(C('E',r), { val: 'Litros mes anterior', bold: true, size: 10, bg: KPI_BG, border: 'thin' })
      RH(r, 16); r++

      // Fila 4 — Valores de detalle
      M(`A${r}:B${r}`)
      S(C('A',r), {
        val: `${formatARS(prevPrecio)} → ${formatARS(currPrecio)}`,
        bold: false, size: 11, bg: WHITE, border: 'medium'
      })
      M(`C${r}:D${r}`)
      S(C('C',r), { val: `${formatNum(curr.litros, 0)} L`, bold: true, size: 11, bg: WHITE, border: 'medium' })
      M(`E${r}:G${r}`)
      S(C('E',r), { val: `${formatNum(prev.litros, 0)} L`, bold: true, size: 11, bg: WHITE, border: 'medium' })
      RH(r, 20); r++

      // Fila 5 — Texto interpretativo
      M(`A${r}:G${r}`)
      S(C('A',r), {
        val: interpretation,
        size: 10, italic: true, color: GRAY,
        bg: 'FFF8F8F8', h: 'left', v: 'middle',
        border: 'thin', wrap: true
      })
      RH(r, 28); r++

      RH(r, 8); r++ // spacer
    }

    // ── EVOLUCIÓN DEL PRECIO / LITRO ──────────────────────────────────────
    if (priceEvolution.length > 0) {
      M(`A${r}:G${r}`)
      S(C('A',r), { val: 'EVOLUCIÓN DEL PRECIO / LITRO', bold: true, size: 11, color: WHITE, bg: NAVY, border: 'medium' })
      RH(r, 18); r++

      // Headers — G = Δ acumulado
      M(`A${r}:C${r}`); S(C('A',r), { val: 'Período',    bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      S(C('D',r),                    { val: 'Precio / L', bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      S(C('E',r),                    { val: 'Δ $',        bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      S(C('F',r),                    { val: 'Δ %',        bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      S(C('G',r),                    { val: 'Δ acum.',    bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      RH(r, 16); r++

      const firstPrecio = priceEvolution[0].precio

      priceEvolution.forEach((p, i) => {
        const pv        = i > 0 ? priceEvolution[i - 1] : null
        const delta     = pv ? p.precio - pv.precio : 0
        const deltaPct  = pv && pv.precio > 0 ? (delta / pv.precio) * 100 : 0
        const accumPct  = i > 0 && firstPrecio > 0 ? (p.precio - firstPrecio) / firstPrecio * 100 : 0
        const bg        = i % 2 === 0 ? WHITE : LT_BLU
        const clr       = delta > 0 ? RED_FG : delta < 0 ? GRN_FG : BLCK
        const accumClr  = accumPct > 0 ? RED_FG : accumPct < 0 ? GRN_FG : BLCK

        M(`A${r}:C${r}`)
        S(C('A',r), { val: p.label,   size: 11, bg, h: 'left', border: 'thin' })
        S(C('D',r), { val: formatARS(p.precio), size: 11, bold: true, bg, border: 'thin' })
        S(C('E',r), { val: pv ? formatARSDelta(delta) : '—',
                      size: 10, bg, color: pv ? clr : BLCK, border: 'thin' })
        S(C('F',r), { val: pv ? `${deltaPct >= 0 ? '+' : ''}${formatNum(deltaPct,1)}%` : '—',
                      size: 10, bg, color: pv ? clr : BLCK, border: 'thin' })
        S(C('G',r), { val: i > 0 ? `${accumPct >= 0 ? '+' : ''}${formatNum(accumPct,1)}%` : '—',
                      size: 10, bold: i > 0, bg, color: i > 0 ? accumClr : BLCK, border: 'thin' })
        RH(r, 15); r++
      })

      RH(r, 8); r++ // spacer
    }

    // ── TOP 5 VEHÍCULOS / MAQUINARIA ──────────────────────────────────────
    if (top5.length > 0) {
      M(`A${r}:G${r}`)
      S(C('A',r), { val: 'TOP 5 VEHÍCULOS / MAQUINARIA POR GASTO', bold: true, size: 11, color: WHITE, bg: NAVY, border: 'medium' })
      RH(r, 18); r++

      M(`A${r}:B${r}`); S(C('A',r), { val: 'Identificación', bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      S(C('C',r),                    { val: 'Secretaría',     bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      M(`D${r}:E${r}`); S(C('D',r), { val: '$ Gastado',      bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      S(C('F',r),                    { val: 'Litros',         bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      S(C('G',r),                    { val: '% Total',        bold: true, size: 10, bg: LT_BLU, border: 'thin' })
      RH(r, 16); r++

      top5.forEach((v, i) => {
        const bg  = i % 2 === 0 ? WHITE : LT_BLU
        const pct = curr.total > 0 ? (v.total / curr.total) * 100 : 0

        M(`A${r}:B${r}`); S(C('A',r), { val: v.ident,                       size: 11, bold: true, bg, h: 'left', border: 'thin' })
        S(C('C',r),                    { val: dn(v.area),                    size: 10,             bg, h: 'left', border: 'thin' })
        M(`D${r}:E${r}`); S(C('D',r), { val: formatARS(v.total),             size: 11, bold: true, bg,           border: 'thin' })
        S(C('F',r),                    { val: `${formatNum(v.litros, 0)} L`,  size: 10,             bg,           border: 'thin' })
        S(C('G',r),                    { val: `${formatNum(pct, 1)}%`,        size: 10,             bg,           border: 'thin' })
        RH(r, 15); r++
      })
    }


    RH(r, 10); r++  // spacer before dashboard

    // ── ANÁLISIS POR TIPO DE COMBUSTIBLE ─────────────────────────────────
    M(`A${r}:G${r}`)
    S(C('A',r), { val: 'ANÁLISIS POR TIPO DE COMBUSTIBLE', bold: true, size: 11, color: WHITE, bg: NAVY, border: 'medium' })
    RH(r, 18); r++

    M(`A${r}:B${r}`); S(C('A',r), { val: 'Combustible',  bold: true, size: 10, bg: LT_BLU, border: 'thin' })
    S(C('C',r),                    { val: 'Litros',        bold: true, size: 10, bg: LT_BLU, border: 'thin' })
    S(C('D',r),                    { val: '% Litros',      bold: true, size: 10, bg: LT_BLU, border: 'thin' })
    M(`E${r}:F${r}`); S(C('E',r), { val: 'Importe',       bold: true, size: 10, bg: LT_BLU, border: 'thin' })
    S(C('G',r),                    { val: 'Precio / L',    bold: true, size: 10, bg: LT_BLU, border: 'thin' })
    RH(r, 16); r++

    // Total de allFuelLogs para calcular porcentajes correctos
    const totalFuelLitros = Array.from(fuelBreakdown.values()).reduce((s, f) => s + f.litros, 0)

    FUEL_NAMES.forEach((name, i) => {
      const fd    = fuelBreakdown.get(name) ?? { litros: 0, importe: 0 }
      const bg    = i % 2 === 0 ? WHITE : LT_BLU
      const pctL  = totalFuelLitros > 0 ? fd.litros  / totalFuelLitros * 100 : 0
      const prL   = fd.litros  > 0 ? fd.importe / fd.litros  : 0
      const empty = fd.litros === 0
      M(`A${r}:B${r}`)
      S(C('A',r), { val: name,                                                  size: 11, bg, h: 'left', border: 'thin', italic: empty, color: BLCK })
      S(C('C',r), { val: empty ? 'Sin cargas' : `${formatNum(fd.litros,0)} L`,  size: 11, bg, border: 'thin', color: empty ? GRAY : BLCK })
      S(C('D',r), { val: empty ? '\u2014' : `${formatNum(pctL,1)}%`,            size: 11, bg, border: 'thin', color: empty ? GRAY : BLCK })
      M(`E${r}:F${r}`)
      S(C('E',r), { val: empty ? '\u2014' : formatARS(fd.importe),              size: 11, bg, border: 'thin', color: empty ? GRAY : BLCK })
      S(C('G',r), { val: empty ? '\u2014' : formatARS(prL),                     size: 11, bg, border: 'thin', color: empty ? GRAY : BLCK })
      RH(r, 15); r++
    })


    // -- DASHBOARD SHEET --
    const ws2 = wb.addWorksheet('Dashboard', {
      pageSetup: {
        paperSize: 9, orientation: 'portrait',
        fitToPage: true, fitToWidth: 1, fitToHeight: 1,
        margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 }
      }
    })
    ws2.columns = [
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
    ]
    const C2  = (col: string, row: number) => ws2.getCell(`${col}${row}`)
    const M2  = (rng: string) => safeMerge(ws2, rng)
    const RH2 = (row: number, h: number) => {
      const r2 = ws2.getRow(row)
      r2.height = h
      const internalRow2 = r2 as unknown as Record<string, Record<string, unknown>>
      const model2 = internalRow2._model ?? internalRow2.model
      if (model2) { model2.height = h; model2.customHeight = true }
    }

    M2('A1:H1')
    S(C2('A', 1), { val: orgName, bold: true, size: 14, color: WHITE, bg: NAVY, border: 'medium' })
    RH2(1, 24)
    M2('A2:H2')
    S(C2('A', 2), { val: `Dashboard de Combustible \u2014 ${monthLabel}`, bold: true, size: 11, color: WHITE, bg: NAVY, h: 'left', border: 'medium' })
    RH2(2, 18)
    RH2(3, 8)

    // Chart 1: barras verticales -- consumo diario de litros
    const dailyBarBuf = dailyLabels.length > 0 ? drawDailyBarChart(
      dailyLabels,
      dailyValues,
      1400, 500,
      'Consumo Diario de Combustible (L)'
    ) : null

    if (dailyBarBuf) {
      const bid = wb.addImage({ buffer: dailyBarBuf as any, extension: 'png' })
      ws2.addImage(bid, { tl: { col: 0, row: 3 }, br: { col: 8, row: 20 } } as any)
    }
    for (let i = 4; i <= 20; i++) RH2(i, 19)
    RH2(21, 8)

    // Chart 2: torta -- consumo por secretaria (litros)
    const areaAbbrev: Record<string, string> = {
      'Salud': 'Salud', 'Proteccion Ciudadana': 'Prot. Ciudadana',
      'Intendencia': 'Intendencia', 'Jefatura de Gabinete': 'Jef. Gabinete',
      'Obras Publicas': 'Obras P\u00FAblicas', 'Desarrollo Humano': 'Des. Humano',
      'Desarrollo Productivo': 'Des. Productivo', 'Economia': 'Econom\u00EDa',
      'Gobierno': 'Gobierno', 'Servicios Publicos': 'Servicios P\u00FAb.'
    }
    const areaForPie = AREAS_DB_ORDER
      .map(name => ({ label: areaAbbrev[name] ?? dn(name), litros: currByArea.get(name)?.litros ?? 0 }))
      .filter(a => a.litros > 0)
      .sort((a, b) => b.litros - a.litros)

    const pieBuf = areaForPie.length > 0 ? drawPieChart(
      areaForPie.map(a => a.label),
      areaForPie.map(a => a.litros),
      AREA_COLORS.slice(0, areaForPie.length),
      900, 560,
      'Consumo por Secretar\u00EDa (L)'
    ) : null

    if (pieBuf) {
      const pid = wb.addImage({ buffer: pieBuf as any, extension: 'png' })
      ws2.addImage(pid, { tl: { col: 1, row: 21 }, br: { col: 7, row: 38 } } as any)
    }
    for (let i = 22; i <= 38; i++) RH2(i, 18)

    // ── OUTPUT ────────────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer()
    const filename = monthLabel
      ? `Resumen Ejecutivo ${monthLabel}.xlsx`
      : 'Resumen Ejecutivo.xlsx'

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}