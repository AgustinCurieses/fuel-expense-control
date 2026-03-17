'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, Save, X, Search, AlertCircle } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Card, MainArea, SubArea, CardFormData } from '@/types'

interface PendingCard {
  cardNumber: string
  count: number
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [mainAreas, setMainAreas] = useState<MainArea[]>([])
  const [subAreas, setSubAreas] = useState<SubArea[]>([])
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [assigningCard, setAssigningCard] = useState<PendingCard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    identification: '',
    areaId: '',
    subAreaId: ''
  })
  const [assignFormData, setAssignFormData] = useState({
    identification: '',
    mainAreaId: '',
    subAreaId: ''
  })
  const [isLoading, setIsLoading] = useState(true)

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

  const filteredCards = cards.filter(card =>
    card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    setFormData({ cardNumber: '', identification: '', areaId: '', subAreaId: '' })
    setEditingCard(null)
    setIsModalOpen(false)
  }

  const handleEdit = (card: Card) => {
    setEditingCard(card)
    setFormData({
      cardNumber: card.cardNumber,
      identification: card.identification || '',
      areaId: card.areaId,
      subAreaId: card.subAreaId || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (card: Card) => {
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
      
      // Show success message
      alert(`Tarjeta asignada. ${result.updatedCount} cargas actualizadas.`)
      
      // Close modal and refresh data
      setIsAssignModalOpen(false)
      setAssigningCard(null)
      await loadData()
    } catch (err) {
      console.error('Error assigning card:', err)
      alert('Error al asignar tarjeta')
    }
  }

  const resetAssignForm = () => {
    setAssignFormData({ identification: '', mainAreaId: '', subAreaId: '' })
    setAssigningCard(null)
    setIsAssignModalOpen(false)
  }

  const getAreaName = (areaId: string) => {
    const area = mainAreas.find(a => a.id === areaId)
    return area?.name || 'Desconocido'
  }

  const getSubAreaName = (subAreaId: string) => {
    const subArea = subAreas.find(s => s.id === subAreaId)
    return subArea?.name || ''
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
    return dateObj.toLocaleDateString()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Asignación de Tarjetas</h1>
            <p className="text-gray-600">Administre las tarjetas de combustible y asígnelas a áreas</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Tarjeta
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar tarjetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Cards Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tarjetas de Combustible</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {filteredCards.length} tarjetas
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número de Tarjeta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subárea
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creada
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{card.cardNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{card.identification || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getAreaName(card.areaId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {card.subAreaId ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {getSubAreaName(card.subAreaId)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(card.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(card)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(card)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Cards Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Tarjetas Pendientes de Asignación
                {pendingCards.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {pendingCards.length}
                  </span>
                )}
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            {pendingCards.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-green-600 font-medium">No hay tarjetas pendientes de asignación</div>
                <div className="text-gray-500 text-sm mt-1">Todas las tarjetas han sido asignadas correctamente</div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Tarjeta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargas Pendientes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingCards.map((pendingCard) => (
                    <tr key={pendingCard.cardNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 text-orange-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{pendingCard.cardNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          {pendingCard.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleAssignCard(pendingCard)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Asignar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
              required
            />

            {formData.areaId && (
              <SearchableSelect
                label="Subárea (Opcional)"
                value={formData.subAreaId}
                onChange={(value) => setFormData({ ...formData, subAreaId: value })}
                options={getSubAreaOptions(formData.areaId)}
                placeholder="Buscar subárea..."
              />
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
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Tarjeta
              </label>
              <div className="text-sm font-semibold text-gray-900">
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
      </div>
    </MainLayout>
  )
}
