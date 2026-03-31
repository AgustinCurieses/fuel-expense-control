'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, ChevronDown, ChevronRight, Edit, Trash2, Network } from 'lucide-react'
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
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<MainArea | SubArea | null>(null)
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    type: 'main',
    parentAreaId: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const { success, error } = useToastContext()

  useEffect(() => { loadData() }, [])


  const loadData = async () => {
    try {
      const response = await fetch('/api/areas')
      if (!response.ok) throw new Error('Failed to load areas')
      const data = await response.json()
      setMainAreas(data.mainAreas)
      setSubAreas(data.subAreas)
    } catch {
      error('Error al cargar datos', 'No se pudieron cargar las secretarías')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (formData.type === 'main') {
        if (editingArea && !('parentAreaId' in editingArea)) {
          const response = await fetch('/api/areas', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingArea.id, type: 'main', name: formData.name })
          })
          if (!response.ok) throw new Error('Failed to update')
          success('Secretaría actualizada', `${formData.name} fue actualizada exitosamente`)
        } else {
          const response = await fetch('/api/areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'main', name: formData.name })
          })
          if (!response.ok) throw new Error('Failed to create')
          success('Secretaría creada', `${formData.name} fue creada exitosamente`)
        }
      } else {
        if (editingArea && 'parentAreaId' in editingArea) {
          const response = await fetch('/api/areas', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingArea.id, type: 'sub', name: formData.name, parentAreaId: formData.parentAreaId })
          })
          if (!response.ok) throw new Error('Failed to update')
          success('Dependencia actualizada', `${formData.name} fue actualizada exitosamente`)
        } else {
          const response = await fetch('/api/areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'sub', name: formData.name, parentAreaId: formData.parentAreaId })
          })
          if (!response.ok) throw new Error('Failed to create')
          success('Dependencia creada', `${formData.name} fue creada exitosamente`)
        }
      }
      await loadData()
      resetForm()
    } catch {
      error('Operación fallida', 'No se pudo guardar. Intente nuevamente.')
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
    const label = 'parentAreaId' in area ? 'dependencia' : 'secretaría'
    if (!confirm(`¿Eliminar la ${label} "${area.name}"?`)) return
    try {
      const type = 'parentAreaId' in area ? 'sub' : 'main'
      const response = await fetch(`/api/areas?id=${area.id}&type=${type}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      await loadData()
      success('Eliminado', `${area.name} fue eliminada correctamente`)
    } catch {
      error('Error al eliminar', 'No se pudo eliminar. Intente nuevamente.')
    }
  }

  const toggleExpand = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev)
      if (next.has(areaId)) next.delete(areaId)
      else next.add(areaId)
      return next
    })
  }

  const openNewDependencia = (parentAreaId: string) => {
    setEditingArea(null)
    setFormData({ name: '', type: 'sub', parentAreaId })
    setIsModalOpen(true)
  }

  const isEditing = !!editingArea
  const editingIsSub = isEditing && 'parentAreaId' in editingArea!
  const modalTitle = isEditing
    ? (editingIsSub ? 'Editar Dependencia' : 'Editar Secretaría')
    : 'Nueva Secretaría / Dependencia'

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Secretarías</h1>
            <p className="text-gray-600">Administre secretarías y sus dependencias</p>
          </div>
          <Button onClick={() => { setEditingArea(null); setFormData({ name: '', type: 'main', parentAreaId: '' }); setIsModalOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mainAreas.length}</p>
              <p className="text-sm text-gray-500">Secretarías</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
            <div className="p-2.5 bg-green-50 rounded-lg">
              <Network className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{subAreas.length}</p>
              <p className="text-sm text-gray-500">Dependencias</p>
            </div>
          </div>
        </div>

        {/* Accordion list */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-sm text-gray-400">
            Cargando...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
            {mainAreas.map((area) => {
              const deps = subAreas.filter(s => s.parentAreaId === area.id)
              const expanded = expandedAreas.has(area.id)
              return (
                <div key={area.id}>
                  {/* Secretaría row */}
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 group">
                    <button
                      onClick={() => toggleExpand(area.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      {expanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      }
                      <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-semibold text-gray-900 truncate">{area.name}</span>
                      <span className="ml-2 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {deps.length} {deps.length === 1 ? 'dependencia' : 'dependencias'}
                      </span>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">
                      <button
                        onClick={() => openNewDependencia(area.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Agregar dependencia"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(area)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar secretaría"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(area)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="Eliminar secretaría"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dependencias */}
                  {expanded && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {deps.length === 0 ? (
                        <div className="pl-14 pr-5 py-3 text-sm text-gray-400 italic">
                          Sin dependencias
                        </div>
                      ) : (
                        deps.map((dep, idx) => (
                          <div
                            key={dep.id}
                            className={`flex items-center justify-between pl-14 pr-5 py-3 hover:bg-gray-100 group/dep${idx < deps.length - 1 ? ' border-b border-gray-100' : ''}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{dep.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/dep:opacity-100 transition-opacity shrink-0 ml-3">
                              <button
                                onClick={() => handleEdit(dep)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                title="Editar dependencia"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(dep)}
                                className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                                title="Eliminar dependencia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={modalTitle}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'main' | 'sub', parentAreaId: '' })}
              options={[
                { value: 'main', label: 'Secretaría' },
                { value: 'sub', label: 'Dependencia' }
              ]}
              disabled={isEditing}
            />

            <Input
              label={formData.type === 'main' ? 'Nombre de la Secretaría' : 'Nombre de la Dependencia'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={formData.type === 'main' ? 'Ej: Secretaría de Salud' : 'Ej: Hospital Municipal'}
              required
            />

            {formData.type === 'sub' && (
              <Select
                label="Secretaría"
                value={formData.parentAreaId}
                onChange={(e) => setFormData({ ...formData, parentAreaId: e.target.value })}
                options={[
                  { value: '', label: 'Seleccione una secretaría...' },
                  ...mainAreas.map(area => ({ value: area.id, label: area.name }))
                ]}
                required
              />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Guardar cambios' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
