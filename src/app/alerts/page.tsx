'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Download, Filter, ChevronDown, ChevronRight, Fuel, Car, Building2 } from 'lucide-react'
import { clsx } from 'clsx'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'

interface SuspiciousLoad {
  date: string
  product: string
  liters: number
  amount: number
  remito: string
  factura: string | null
}

interface FuelTypeAlert {
  cardNumber: string
  dominio: string
  subArea: string
  mainArea: string
  mainAreaId: string | null
  primaryGroup: 'nafta' | 'gasoil'
  suspiciousLoads: SuspiciousLoad[]
}

interface AreaGroup {
  mainArea: string
  mainAreaId: string | null
  alerts: FuelTypeAlert[]
  totalLoads: number
}

type FilterMode = 'factura' | 'period'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<FuelTypeAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [filterMode, setFilterMode] = useState<FilterMode>('factura')
  const [availableFacturas, setAvailableFacturas] = useState<{ factura: string; label: string }[]>([])
  const [selectedFactura, setSelectedFactura] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())
  const [exportingArea, setExportingArea] = useState<string | null>(null)
  const [isExportingAll, setIsExportingAll] = useState(false)

  useEffect(() => {
    fetch('/api/facturas')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const items = data.filter((f: any) => f.factura).map((f: any) => ({ factura: f.factura, label: f.label || `Factura ${f.factura}` }))
        setAvailableFacturas(items)
        if (items.length > 0) setSelectedFactura(items[0].factura)
      })
      .catch(() => {})
  }, [])

  const hasFilter = filterMode === 'factura'
    ? !!selectedFactura
    : !!(startDate && endDate)

  const buildParams = useCallback((extra?: Record<string, string>) => {
    const p = new URLSearchParams()
    if (filterMode === 'factura' && selectedFactura) {
      p.set('factura', selectedFactura)
    } else if (filterMode === 'period' && startDate && endDate) {
      p.set('startDate', startDate)
      p.set('endDate', endDate)
    }
    if (extra) Object.entries(extra).forEach(([k, v]) => v && p.set(k, v))
    return p.toString()
  }, [filterMode, selectedFactura, startDate, endDate])

  const fetchAlerts = useCallback(async () => {
    if (!hasFilter) return
    setLoading(true)
    try {
      const res = await fetch(`/api/alerts/fuel-type?${buildParams()}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
        // Auto-expand all areas on load
        const areaNames = Array.from(new Set(data.map((a: FuelTypeAlert) => a.mainArea))) as string[]
        setExpandedAreas(new Set(areaNames))
      }
    } catch {}
    finally { setLoading(false) }
  }, [hasFilter, buildParams])

  // Group alerts by secretaría
  const areaGroups: AreaGroup[] = (() => {
    const map = new Map<string, AreaGroup>()
    for (const alert of alerts) {
      const key = alert.mainArea
      if (!map.has(key)) {
        map.set(key, { mainArea: key, mainAreaId: alert.mainAreaId, alerts: [], totalLoads: 0 })
      }
      const group = map.get(key)!
      group.alerts.push(alert)
      group.totalLoads += alert.suspiciousLoads.length
    }
    return Array.from(map.values()).sort((a, b) => b.totalLoads - a.totalLoads)
  })()

  const totalLoads   = alerts.reduce((s, a) => s + a.suspiciousLoads.length, 0)
  const totalCards   = alerts.length
  const totalAreas   = areaGroups.length

  const toggleArea = (name: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const handleExport = async (areaId?: string | null) => {
    const isAll = !areaId
    if (isAll) setIsExportingAll(true)
    else setExportingArea(areaId!)
    try {
      const extra = areaId ? { areaId } : {}
      const res = await fetch(`/api/alerts/fuel-type/export?${buildParams(extra as any)}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const cd   = res.headers.get('content-disposition')
      a.download = cd?.match(/filename="(.+)"/)?.[1] ?? 'alertas.xlsx'
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {}
    finally {
      setIsExportingAll(false)
      setExportingArea(null)
    }
  }

  const formatARS = (n: number) =>
    '$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Alertas de Combustible</h1>
            <p className="text-sm text-slate-500 mt-0.5">Detección de cargas con combustible no autorizado</p>
          </div>
          {hasFilter && alerts.length > 0 && (
            <Button onClick={() => handleExport()} disabled={isExportingAll} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {isExportingAll ? 'Exportando...' : 'Exportar Todo'}
            </Button>
          )}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />

            {/* Mode toggle */}
            <div className="flex rounded-md border border-slate-200 overflow-hidden">
              <button
                onClick={() => setFilterMode('factura')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  filterMode === 'factura'
                    ? 'bg-navy-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                Por Factura
              </button>
              <button
                onClick={() => setFilterMode('period')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium transition-colors border-l border-slate-200',
                  filterMode === 'period'
                    ? 'bg-navy-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                Por Período
              </button>
            </div>

            {/* Filter inputs */}
            {filterMode === 'factura' ? (
              <div className="w-52">
                <Select
                  value={selectedFactura}
                  onChange={e => setSelectedFactura(e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar factura…' },
                    ...availableFacturas.map(f => ({ value: f.factura, label: f.label }))
                  ]}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  placeholder="Desde"
                />
                <span className="text-gray-400 text-sm">al</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  placeholder="Hasta"
                />
              </div>
            )}

            <Button onClick={fetchAlerts} disabled={!hasFilter || loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Prompt when no filter applied yet */}
        {!loading && alerts.length === 0 && !hasFilter && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Seleccione una factura o período</p>
            <p className="text-sm text-slate-400 mt-1">Las alertas se analizan dentro del período seleccionado</p>
          </div>
        )}

        {/* No alerts for the selected period */}
        {!loading && hasFilter && alerts.length === 0 && (
          <div className="bg-white rounded-lg border border-green-200 p-12 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <p className="text-base font-semibold text-green-700">Sin alertas en este período</p>
            <p className="text-sm text-green-500 mt-1">No se detectaron cargas con combustible no autorizado</p>
          </div>
        )}

        {/* Stats + results */}
        {!loading && alerts.length > 0 && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-800 font-mono">{totalLoads}</p>
                  <p className="text-sm text-slate-500">Cargas sospechosas</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-800 font-mono">{totalCards}</p>
                  <p className="text-sm text-slate-500">Tarjetas afectadas</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-navy-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-800 font-mono">{totalAreas}</p>
                  <p className="text-sm text-slate-500">Secretarías con alertas</p>
                </div>
              </div>
            </div>

            {/* Per-area sections */}
            <div className="space-y-3">
              {areaGroups.map(group => (
                <div key={group.mainArea} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {/* Section header */}
                  <div
                    className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleArea(group.mainArea)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedAreas.has(group.mainArea)
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                      }
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{group.mainArea}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          {group.totalLoads} {group.totalLoads === 1 ? 'alerta' : 'alertas'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {group.alerts.length} {group.alerts.length === 1 ? 'tarjeta' : 'tarjetas'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={e => { e.stopPropagation(); handleExport(group.mainAreaId) }}
                      disabled={exportingArea === group.mainAreaId}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      {exportingArea === group.mainAreaId ? 'Exportando...' : 'Exportar'}
                    </Button>
                  </div>

                  {/* Table */}
                  {expandedAreas.has(group.mainArea) && (
                    <div className="border-t border-slate-100 overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-navy-600">
                            {['Dominio', 'Dependencia', 'Comb. Permitido', 'Producto Cargado', 'Fecha', 'Litros', 'Importe', 'Remito'].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-white/80 uppercase tracking-wider whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.alerts.flatMap(alert =>
                            alert.suspiciousLoads.map((load, li) => (
                              <tr key={`${alert.cardNumber}-${li}`} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{alert.dominio}</td>
                                <td className="px-4 py-2.5 text-sm text-slate-600">{alert.subArea}</td>
                                <td className="px-4 py-2.5 text-sm">
                                  <span className={clsx(
                                    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full border',
                                    alert.primaryGroup === 'nafta'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-navy-50 text-navy-700 border-navy-200'
                                  )}>
                                    {alert.primaryGroup === 'nafta' ? 'Nafta' : 'Gasoil'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-sm text-red-700 font-medium">{load.product}</td>
                                <td className="px-4 py-2.5 text-sm text-slate-600 whitespace-nowrap">{load.date}</td>
                                <td className="px-4 py-2.5 text-sm text-slate-600 text-right font-mono">{load.liters.toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-sm text-slate-800 text-right font-mono whitespace-nowrap">{formatARS(load.amount)}</td>
                                <td className="px-4 py-2.5 text-sm text-slate-400">{load.remito}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">
                <strong className="text-slate-700">Nota:</strong> Se detectan cargas con combustible diferente al autorizado en la tarjeta. Vehículos con permiso &quot;ambos&quot; y maquinaria no generan alertas.
              </p>
            </div>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm text-slate-500">Analizando cargas del período seleccionado...</p>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
