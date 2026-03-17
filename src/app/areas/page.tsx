'use client'

import { useState, useEffect } from 'react'
import { Plus, MapPin, FolderTree, Edit, Trash2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToastContext } from '@/contexts/ToastContext'
import { MainArea, SubArea, AreaFormData } from '@/types'

export default function AreasPage() {
  const [mainAreas, setMainAreas] = useState<MainArea[]>([])
  const [subAreas, setSubAreas] = useState<SubArea[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<MainArea | SubArea | null>(null)
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    type: 'main',
    parentAreaId: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const { success, error } = useToastContext()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/areas')
      if (!response.ok) throw new Error('Failed to load areas')
      
      const data = await response.json()
      setMainAreas(data.mainAreas)
      setSubAreas(data.subAreas)
    } catch (err) {
      error('Error al cargar datos', 'No se pudieron cargar las áreas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Form data:', formData)
      console.log('Editing area:', editingArea)
      
      if (formData.type === 'main') {
        if (editingArea && 'parentAreaId' in editingArea === false) {
          console.log('Updating main area:', editingArea.id)
          const response = await fetch('/api/areas', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingArea.id,
              type: 'main',
              name: formData.name
            })
          })
          
          if (!response.ok) throw new Error('Failed to update area')
          success('Área Actualizada', `${formData.name} ha sido actualizada exitosamente`)
        } else {
          console.log('Creating main area:', formData.name)
          const response = await fetch('/api/areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'main',
              name: formData.name
            })
          })
          
          if (!response.ok) throw new Error('Failed to create area')
          success('Área Creada', `${formData.name} ha sido creada exitosamente`)
        }
      } else {
        if (editingArea && 'parentAreaId' in editingArea) {
          console.log('Updating sub area:', editingArea.id)
          const response = await fetch('/api/areas', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingArea.id,
              type: 'sub',
              name: formData.name,
              parentAreaId: formData.parentAreaId
            })
          })
          
          if (!response.ok) throw new Error('Failed to update sub-area')
          success('Subárea Actualizada', `${formData.name} ha sido actualizada exitosamente`)
        } else {
          console.log('Creating sub area:', formData.name, formData.parentAreaId)
          const response = await fetch('/api/areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'sub',
              name: formData.name,
              parentAreaId: formData.parentAreaId
            })
          })
          
          if (!response.ok) throw new Error('Failed to create sub-area')
          success('Subárea Creada', `${formData.name} ha sido creada exitosamente`)
        }
      }

      await loadData()
      resetForm()
    } catch (err) {
      console.error('Database error:', err)
      error('Operación Fallida', 'No se pudo guardar el área. Intente nuevamente.')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', type: 'main', parentAreaId: '' })
    setEditingArea(null)
    setIsModalOpen(false)
  }

  const handleEdit = (area: MainArea | SubArea) => {
    setEditingArea(area)
    setFormData({
      name: area.name,
      type: 'parentAreaId' in area ? 'sub' : 'main',
      parentAreaId: 'parentAreaId' in area ? area.parentAreaId : ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (area: MainArea | SubArea) => {
    try {
      const type = 'parentAreaId' in area ? 'sub' : 'main'
      const response = await fetch(`/api/areas?id=${area.id}&type=${type}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete area')
      
      await loadData()
      success('Eliminado', 'Área eliminada exitosamente')
    } catch (err) {
      error('Error al eliminar', 'No se pudo eliminar el área')
    }
  }

  const getAreaName = (areaId: string) => {
    const area = mainAreas.find(a => a.id === areaId)
    return area?.name || 'Desconocido'
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString()
  }

  const getParentAreaName = (parentAreaId: string) => {
    const area = mainAreas.find(a => a.id === parentAreaId)
    return area?.name || 'Desconocido'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Áreas</h1>
            <p className="text-gray-600">Administre áreas principales y subáreas para el seguimiento de gastos de combustible</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Nueva Área
          </Button>
        </div>

        {/* Main Areas Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Áreas Principales</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad de Subáreas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mainAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{area.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subAreas.filter(sub => sub.parentAreaId === area.id).length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(area.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(area)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(area)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sub-areas Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FolderTree className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Subáreas</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FolderTree className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{area.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getParentAreaName(area.parentAreaId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(area.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(area)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(area)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={editingArea ? 'Editar Área' : 'Agregar Nueva Área'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre del Área"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ingrese el nombre del área"
              required
            />

            <Select
              label="Tipo de Área"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'main' | 'sub' })}
              options={[
                { value: 'main', label: 'Área Principal' },
                { value: 'sub', label: 'Subárea' }
              ]}
            />

            {formData.type === 'sub' && (
              <Select
                label="Área Principal"
                value={formData.parentAreaId}
                onChange={(e) => setFormData({ ...formData, parentAreaId: e.target.value })}
                options={mainAreas.map(area => ({
                  value: area.id,
                  label: area.name
                }))}
                required
              />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingArea ? 'Actualizar' : 'Crear'} Área
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
