import { useState } from 'react'
import { useMaterias } from '@/hooks/useSupabase'
import { Card, Button, Spinner, EmptyState, Modal, Input } from '@/components/ui'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'

const COLORES_PREDEFINIDOS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export function MateriasPage() {
  const { materias, loading, createMateria, updateMateria, deleteMateria } = useMaterias()
  const [showModal, setShowModal] = useState(false)
  const [editingMateria, setEditingMateria] = useState(null)

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta materia? Las actividades asociadas quedarán sin materia.')) {
      await deleteMateria(id)
    }
  }

  const handleOpenEdit = (materia) => {
    setEditingMateria(materia)
    setShowModal(true)
  }

  const handleOpenNew = () => {
    setEditingMateria(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMateria(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Materias</h1>
          <p className="text-sm text-gray-500 mt-1">Organiza tus actividades por asignatura</p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4" />
          Nueva materia
        </Button>
      </div>

      {/* Lista de materias */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : materias.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="w-16 h-16" />}
            title="No hay materias"
            description="Crea materias para organizar mejor tus actividades de estudio"
            action={
              <Button onClick={handleOpenNew}>
                <Plus className="w-4 h-4" />
                Nueva materia
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.map((materia) => (
            <Card key={materia.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${materia.color}20` }}
                  >
                    <BookOpen 
                      className="w-5 h-5"
                      style={{ color: materia.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{materia.nombre}</h3>
                    {materia.descripcion && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {materia.descripcion}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(materia)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(materia.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <MateriaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        materia={editingMateria}
        onSave={async (data) => {
          if (editingMateria) {
            await updateMateria(editingMateria.id, data)
          } else {
            await createMateria(data)
          }
          handleCloseModal()
        }}
      />
    </div>
  )
}

function MateriaModal({ isOpen, onClose, materia, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: materia?.nombre || '',
    descripcion: materia?.descripcion || '',
    color: materia?.color || COLORES_PREDEFINIDOS[0]
  })

  // Actualizar form cuando cambie la materia
  useState(() => {
    if (materia) {
      setFormData({
        nombre: materia.nombre,
        descripcion: materia.descripcion || '',
        color: materia.color
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        color: COLORES_PREDEFINIDOS[0]
      })
    }
  }, [materia])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave(formData)
    setLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={materia ? 'Editar materia' : 'Nueva materia'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de la materia *"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Cálculo II"
          required
        />

        <div>
          <label className="label">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="input min-h-[80px] resize-none"
            placeholder="Notas sobre la materia..."
          />
        </div>

        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORES_PREDEFINIDOS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded-lg transition-transform ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            {materia ? 'Guardar cambios' : 'Crear materia'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
