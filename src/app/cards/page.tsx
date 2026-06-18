'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, Save, X, Search, AlertCircle, Download, ChevronUp, ChevronDown, Pencil, ArrowRightLeft, History, Trash2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useToastContext } from '@/contexts/ToastContext'
import { Card, MainArea, SubArea, CardFormData } from '@/types'

interface PendingCard {
  cardNumber: string
  count: number
  identification: string | null
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [mainAreas, setMainAreas] = useState<MainArea[]>([])
  const [subAreas, setSubAreas] = useState<SubArea[]>([])
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [assigningCard, setAssigningCard] = useState<PendingCard | null>(null)
  const [reassigningCard, setReassigningCard] = useState<Card | null>(null)
  const [historyCard, setHistoryCard] = useState<Card | null>(null)
  const [cardHistory, setCardHistory] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAreaId, setFilterAreaId] = useState('')
  const [filterCardType, setFilterCardType] = useState('')
  const [filterAllowedFuel, setFilterAllowedFuel] = useState('')
  const [sortColumn, setSortColumn] = useState<'cardNumber' | 'identification' | 'area' | 'subArea' | 'cardType' | 'allowedFuel'>('cardNumber')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    identification: '',
    areaId: '',
    subAreaId: '',
    cardType: 'vehiculo',
    allowedFuel: 'nafta'
  })
  const [assignFormData, setAssignFormData] = useState({
    identification: '',
    mainAreaId: '',
    subAreaId: ''
  })
  const [reassignFormData, setReassignFormData] = useState({
    mainAreaId: '',
    subAreaId: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const { success, error: toastError } = useToastContext()

  // Export cards function
  const handleExportCards = async () => {
    try {
      const response = await fetch('/api/cards/export')
      if (!response.ok) {
        throw new Error('Error exporting cards')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'Tarjetas.xlsx'
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting cards:', err)
      toastError('Error al exportar', 'No se pudieron exportar las tarjetas')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [cardsResponse, areasResponse, pendingResponse] = await Promise.all([
        fetch('/api/cards'),
        fetch('/api/areas'),
        fetch('/api/pending-cards')
      ])
      
      if (!cardsResponse.ok || !areasResponse.ok || !pendingResponse.ok) {
        throw new Error('Failed to load data')
      }
      
      const cardsData = await cardsResponse.json()
      const areasData = await areasResponse.json()
      const pendingData = await pendingResponse.json()
      
      setCards(cardsData)
      setMainAreas(areasData.mainAreas)
      setSubAreas(areasData.subAreas)
      setPendingCards(pendingData)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getAreaName = (areaId: string) => {
    const area = mainAreas.find(a => a.id === areaId)
    return area?.name || 'Desconocido'
  }

  const getSubAreaName = (subAreaId: string) => {
    const subArea = subAreas.find(s => s.id === subAreaId)
    return subArea?.name || ''
  }

  const filteredCards = cards
    .filter(card => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = !q ||
        card.cardNumber.toLowerCase().includes(q) ||
        (card.identification || '').toLowerCase().includes(q)
      const matchesArea = !filterAreaId || card.areaId === filterAreaId
      const matchesType = !filterCardType || card.cardType === filterCardType
      const matchesFuel = !filterAllowedFuel || card.allowedFuel === filterAllowedFuel
      return matchesSearch && matchesArea && matchesType && matchesFuel
    })
    .sort((a, b) => {
      let aVal = '', bVal = ''
      if (sortColumn === 'cardNumber')     { aVal = a.cardNumber;                      bVal = b.cardNumber }
      else if (sortColumn === 'identification') { aVal = a.identification || '';       bVal = b.identification || '' }
      else if (sortColumn === 'area')      { aVal = getAreaName(a.areaId);             bVal = getAreaName(b.areaId) }
      else if (sortColumn === 'subArea')   { aVal = a.subAreaId ? getSubAreaName(a.subAreaId) : ''; bVal = b.subAreaId ? getSubAreaName(b.subAreaId) : '' }
      else if (sortColumn === 'cardType')  { aVal = a.cardType || '';                  bVal = b.cardType || '' }
      else if (sortColumn === 'allowedFuel') { aVal = a.allowedFuel || '';             bVal = b.allowedFuel || '' }
      const cmp = aVal.localeCompare(bVal, 'es')
      return sortDir === 'asc' ? cmp : -cmp
    })

  const totalPages = Math.ceil(filteredCards.length / PAGE_SIZE)
  const paginatedCards = filteredCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (col: typeof sortColumn) => {
    if (sortColumn === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortColumn(col); setSortDir('asc') }
    setPage(1)
  }

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value)
    setPage(1)
  }

  const SortIcon = ({ col }: { col: typeof sortColumn }) =>
    sortColumn === col
      ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />)
      : <ChevronDown className="w-3 h-3 inline ml-1 opacity-30" />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCard) {
        const response = await fetch('/api/cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCard.id,
            ...formData
          })
        })
        
        if (!response.ok) throw new Error('Failed to update card')
      } else {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!response.ok) throw new Error('Failed to create card')
      }

      await loadData()
      resetForm()
    } catch (err) {
      console.error('Error saving card:', err)
    }
  }

  const resetForm = () => {
    setFormData({ 
      cardNumber: '', 
      identification: '', 
      areaId: '', 
      subAreaId: '',
      cardType: 'vehiculo',
      allowedFuel: 'nafta'
    })
    setEditingCard(null)
    setIsModalOpen(false)
  }

  const handleEdit = (card: Card) => {
    setEditingCard(card)
    setFormData({
      cardNumber: card.cardNumber,
      identification: card.identification || '',
      areaId: card.areaId,
      subAreaId: card.subAreaId || '',
      cardType: card.cardType || 'vehiculo',
      allowedFuel: card.allowedFuel || 'nafta'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (card: Card) => {
    const label = card.identification ? `"${card.identification}"` : `tarjeta ${card.cardNumber}`
    if (!confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) return
    try {
      const response = await fetch(`/api/cards?id=${card.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete card')
      }

      await loadData()
    } catch (err) {
      console.error('Error deleting card:', err)
    }
  }

  const handleAssignCard = (pendingCard: PendingCard) => {
    setAssigningCard(pendingCard)
    setAssignFormData({
      identification: '',
      mainAreaId: '',
      subAreaId: ''
    })
    setIsAssignModalOpen(true)
  }

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!assigningCard || !assignFormData.mainAreaId) {
      return
    }

    try {
      const response = await fetch('/api/pending-cards/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardNumber: assigningCard.cardNumber,
          identification: assignFormData.identification,
          mainAreaId: assignFormData.mainAreaId,
          subAreaId: assignFormData.subAreaId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign card')
      }

      const result = await response.json()
      success('Tarjeta asignada', `${result.updatedCount} cargas actualizadas`)
      setIsAssignModalOpen(false)
      setAssigningCard(null)
      await loadData()
    } catch (err) {
      console.error('Error assigning card:', err)
      toastError('Error', 'No se pudo asignar la tarjeta')
    }
  }

  const resetAssignForm = () => {
    setAssignFormData({ identification: '', mainAreaId: '', subAreaId: '' })
    setAssigningCard(null)
    setIsAssignModalOpen(false)
  }

  const handleReassignCard = (card: Card) => {
    setReassigningCard(card)
    setReassignFormData({
      mainAreaId: card.areaId,
      subAreaId: card.subAreaId || ''
    })
    setIsReassignModalOpen(true)
  }

  const handleReassignSubmit = async () => {
    if (!reassigningCard) return

    try {
      const response = await fetch(`/api/cards/${reassigningCard.id}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mainAreaId: reassignFormData.mainAreaId,
          subAreaId: reassignFormData.subAreaId || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reassign card')
      }

      await loadData()
      setIsReassignModalOpen(false)
      setReassigningCard(null)
      success('Área reasignada', 'Los cambios se guardaron correctamente')
    } catch (err) {
      console.error('Error reassigning card:', err)
      toastError('Error', 'No se pudo reasignar el área')
    }
  }

  const resetReassignForm = () => {
    setReassignFormData({ mainAreaId: '', subAreaId: '' })
    setReassigningCard(null)
    setIsReassignModalOpen(false)
  }

  const handleViewHistory = async (card: Card) => {
    setHistoryCard(card)
    try {
      const response = await fetch(`/api/cards/${card.id}/history`)
      if (response.ok) {
        const history = await response.json()
        setCardHistory(history)
      }
    } catch (err) {
      console.error('Error loading card history:', err)
    }
    setIsHistoryModalOpen(true)
  }

  const getSubAreasForArea = (areaId: string) => {
    return subAreas.filter(sub => sub.parentAreaId === areaId)
  }

  const mainAreaOptions = mainAreas.map(area => ({
    value: area.id,
    label: area.name
  }))

  const getSubAreaOptions = (areaId: string) => {
    return getSubAreasForArea(areaId).map(subArea => ({
      value: subArea.id,
      label: subArea.name
    }))
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('es-AR')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Tarjetas</h1>
            <p className="text-sm text-slate-500 mt-0.5">Administre las tarjetas de combustible y asígnelas a áreas</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleExportCards} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Tarjetas
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tarjeta
            </Button>
          </div>
        </div>


        {/* Pending Cards Section */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-800">
                Tarjetas Pendientes de Asignación
              </h2>
              {pendingCards.length > 0 && (
                <Badge variant="warning">{pendingCards.length}</Badge>
              )}
            </div>
          </div>

          <div className="p-5">
            {pendingCards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-medium text-green-700">Sin tarjetas pendientes</p>
                <p className="text-xs text-slate-500 mt-1">Todas las tarjetas han sido asignadas correctamente</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-navy-600">
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Nro. Tarjeta</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Identificación</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Cargas pendientes</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-white/80 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingCards.map((pendingCard) => (
                    <tr key={pendingCard.cardNumber} className="hover:bg-slate-50">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-medium text-slate-800 font-mono">{pendingCard.cardNumber}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-700">
                        {pendingCard.identification || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge variant="warning">{pendingCard.count}</Badge>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleAssignCard(pendingCard)}
                          className="text-sm font-medium text-navy-600 hover:text-navy-800"
                        >
                          Asignar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {/* Cards Table */}
        <div className="bg-white rounded-lg border border-slate-200">
          {/* Table header + filters */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-navy-600" />
                <h2 className="text-sm font-semibold text-slate-800">Tarjetas Registradas</h2>
                <Badge variant="info">{filteredCards.length} de {cards.length}</Badge>
              </div>
            </div>

            {/* Filter row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 text-slate-800"
                  placeholder="Nro. o identificación..."
                  value={searchTerm}
                  onChange={handleFilterChange(setSearchTerm)}
                />
              </div>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 text-slate-800"
                value={filterAreaId}
                onChange={handleFilterChange(setFilterAreaId)}
              >
                <option value="">Todas las secretarías</option>
                {mainAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 text-slate-800"
                value={filterCardType}
                onChange={handleFilterChange(setFilterCardType)}
              >
                <option value="">Todos los tipos</option>
                <option value="vehiculo">Vehículo</option>
                <option value="maquinaria">Maquinaria</option>
              </select>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 text-slate-800"
                value={filterAllowedFuel}
                onChange={handleFilterChange(setFilterAllowedFuel)}
              >
                <option value="">Todo combustible</option>
                <option value="nafta">Nafta</option>
                <option value="gasoil">Gasoil</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-navy-600">
                  <th scope="col" className="px-5 py-3 text-left">
                    <button onClick={() => handleSort('cardNumber')} aria-sort={sortColumn === 'cardNumber' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="flex items-center gap-1 text-xs font-medium text-white/80 uppercase tracking-wider hover:text-white">
                      Nro. Tarjeta <SortIcon col="cardNumber" />
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3 text-left">
                    <button onClick={() => handleSort('identification')} aria-sort={sortColumn === 'identification' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="flex items-center gap-1 text-xs font-medium text-white/80 uppercase tracking-wider hover:text-white">
                      Identificación <SortIcon col="identification" />
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3 text-left">
                    <button onClick={() => handleSort('area')} aria-sort={sortColumn === 'area' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="flex items-center gap-1 text-xs font-medium text-white/80 uppercase tracking-wider hover:text-white">
                      Secretaría <SortIcon col="area" />
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3 text-left">
                    <button onClick={() => handleSort('subArea')} aria-sort={sortColumn === 'subArea' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="flex items-center gap-1 text-xs font-medium text-white/80 uppercase tracking-wider hover:text-white">
                      Dependencia <SortIcon col="subArea" />
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3 text-left">
                    <button onClick={() => handleSort('cardType')} aria-sort={sortColumn === 'cardType' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="flex items-center gap-1 text-xs font-medium text-white/80 uppercase tracking-wider hover:text-white">
                      Tipo <SortIcon col="cardType" />
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3 text-left">
                    <button onClick={() => handleSort('allowedFuel')} aria-sort={sortColumn === 'allowedFuel' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="flex items-center gap-1 text-xs font-medium text-white/80 uppercase tracking-wider hover:text-white">
                      Combustible <SortIcon col="allowedFuel" />
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-white/80 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-5 w-28 rounded-full" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-5 w-24 rounded-full" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-14" /></td>
                      <td className="px-5 py-3.5 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                      No se encontraron tarjetas con los filtros aplicados.
                    </td>
                  </tr>
                ) : paginatedCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-800 font-mono">{card.cardNumber}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-800">
                      {card.identification || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-navy-50 text-navy-700 border border-navy-200">
                        {getAreaName(card.areaId)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {card.subAreaId ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {getSubAreaName(card.subAreaId)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-700 capitalize">
                      {card.cardType || '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-700 capitalize">
                      {card.allowedFuel || '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => handleEdit(card)}
                          aria-label="Editar tarjeta"
                          title="Editar"
                          className="p-1.5 text-navy-600 hover:bg-navy-50 rounded-md transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleReassignCard(card)}
                          aria-label="Reasignar área"
                          title="Reasignar"
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleViewHistory(card)}
                          aria-label="Ver historial de áreas"
                          title="Historial"
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <History className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(card)}
                          aria-label="Eliminar tarjeta"
                          title="Eliminar"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
              <span>
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredCards.length)} de {filteredCards.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`px-3 py-1 rounded-md border text-sm ${page === p ? 'bg-navy-600 text-white border-navy-600' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        {p}
                      </button>
                    )
                  )
                }
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={editingCard ? 'Editar Tarjeta' : 'Agregar Nueva Tarjeta'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Número de Tarjeta"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
              placeholder="1234-5678-9012-3456"
              required
            />

            <Input
              label="Identificación"
              value={formData.identification || ''}
              onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
              placeholder="Patente AF-123-JK"
            />

            <SearchableSelect
              label="Área Principal"
              value={formData.areaId}
              onChange={(value) => setFormData({ ...formData, areaId: value, subAreaId: '' })}
              options={mainAreaOptions}
              placeholder="Buscar área principal..."
            />

            {formData.areaId && (
              <SearchableSelect
                label="Subárea (Opcional)"
                value={formData.subAreaId ?? ''}
                onChange={(value) => setFormData({ ...formData, subAreaId: value })}
                options={getSubAreaOptions(formData.areaId)}
                placeholder="Buscar subárea..."
              />
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Tarjeta
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cardType"
                    value="vehiculo"
                    checked={formData.cardType === 'vehiculo'}
                    onChange={(e) => {
                      const newCardType = e.target.value
                      setFormData({ 
                        ...formData, 
                        cardType: newCardType,
                        allowedFuel: newCardType === 'vehiculo' ? formData.allowedFuel || 'nafta' : 'ambos'
                      })
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">Vehículo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cardType"
                    value="maquinaria"
                    checked={formData.cardType === 'maquinaria'}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        cardType: e.target.value,
                        allowedFuel: 'ambos'
                      })
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">Maquinaria o Equipo</span>
                </label>
              </div>
            </div>

            {formData.cardType === 'vehiculo' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Combustible Permitido
                </label>
                <select
                  value={formData.allowedFuel || 'nafta'}
                  onChange={(e) => setFormData({ ...formData, allowedFuel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
                >
                  <option value="nafta">Nafta (Super/Infinia)</option>
                  <option value="gasoil">Gasoil (Diesel)</option>
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingCard ? 'Actualizar' : 'Crear'} Tarjeta
              </Button>
            </div>
          </form>
        </Modal>

        {/* Assignment Modal */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={resetAssignForm}
          title="Asignar Tarjeta Pendiente"
          size="md"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Número de Tarjeta
              </label>
              <div className="text-sm font-medium text-slate-800">
                {assigningCard?.cardNumber}
              </div>
            </div>

            <Input
              label="Identificación"
              value={assignFormData.identification}
              onChange={(e) => setAssignFormData({ ...assignFormData, identification: e.target.value })}
              placeholder="Patente o nombre del equipo"
            />

            <SearchableSelect
              label="Área Principal"
              value={assignFormData.mainAreaId}
              onChange={(value) => setAssignFormData({ ...assignFormData, mainAreaId: value, subAreaId: '' })}
              options={mainAreaOptions}
              placeholder="Buscar área principal..."
            />

            {assignFormData.mainAreaId && (
              <SearchableSelect
                label="Sub-área (Opcional)"
                value={assignFormData.subAreaId}
                onChange={(value) => setAssignFormData({ ...assignFormData, subAreaId: value })}
                options={getSubAreaOptions(assignFormData.mainAreaId)}
                placeholder="Buscar subárea..."
              />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={resetAssignForm}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Guardar y Asignar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reassign Modal */}
        <Modal
          isOpen={isReassignModalOpen}
          onClose={resetReassignForm}
          title="Reasignar Área"
          size="md"
        >
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Número de Tarjeta
              </label>
              <div className="text-sm font-medium text-slate-800">
                {reassigningCard?.cardNumber}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Identificación Actual
              </label>
              <div className="text-sm font-medium text-slate-800">
                {reassigningCard?.identification || '-'}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Área Actual
              </label>
              <div className="text-sm font-medium text-slate-800">
                {reassigningCard ? `${getAreaName(reassigningCard.areaId)} - ${reassigningCard.subAreaId ? getSubAreaName(reassigningCard.subAreaId) : 'Sin subárea'}` : '-'}
              </div>
            </div>

            <SearchableSelect
              label="Nueva Área Principal"
              value={reassignFormData.mainAreaId}
              onChange={(value) => setReassignFormData({ ...reassignFormData, mainAreaId: value, subAreaId: '' })}
              options={mainAreaOptions}
              placeholder="Buscar área principal..."
            />

            {reassignFormData.mainAreaId && (
              <SearchableSelect
                label="Nueva Sub-área"
                value={reassignFormData.subAreaId}
                onChange={(value) => setReassignFormData({ ...reassignFormData, subAreaId: value })}
                options={getSubAreaOptions(reassignFormData.mainAreaId)}
                placeholder="Buscar subárea..."
              />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={resetReassignForm}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Confirmar Reasignación
              </Button>
            </div>
          </form>
        </Modal>

        {/* History Modal */}
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title="Historial de Áreas"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Tarjeta
              </label>
              <div className="text-sm font-medium text-slate-800">
                {historyCard?.cardNumber} - {historyCard?.identification || '-'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-navy-600">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Área Principal</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Sub-área</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Desde</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Hasta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cardHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-800">{record.mainArea?.name || '—'}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">{record.subArea?.name || '—'}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">{formatDate(record.validFrom)}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">
                        {record.validTo ? formatDate(record.validTo) : <span className="font-medium text-green-700">Actual</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cardHistory.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-400">
                  No hay historial disponible
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsHistoryModalOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}
