import { useState } from 'react'
import { Modal, Button, Input, Select } from '@/components/ui'

export function NuevaActividadModal({ isOpen, onClose, createActividad, materias = [] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'tarea',
    prioridad: 'media',
    materia_id: '',
    fecha_limite: '',
    horas_planificadas: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const actividad = {
      ...formData,
      materia_id: formData.materia_id || null,
      horas_planificadas: formData.horas_planificadas ? parseFloat(formData.horas_planificadas) : 0,
      fecha_limite: formData.fecha_limite || null
    }

    const { error } = await createActividad(actividad)

    if (error) {
      setError(error.message)
    } else {
      // Reset form and close
      setFormData({
        titulo: '',
        descripcion: '',
        tipo: 'tarea',
        prioridad: 'media',
        materia_id: '',
        fecha_limite: '',
        horas_planificadas: ''
      })
      onClose()
    }
    setLoading(false)
  }

  const tiposActividad = [
    { value: 'tarea', label: 'Tarea' },
    { value: 'examen', label: 'Examen' },
    { value: 'proyecto', label: 'Proyecto' },
    { value: 'lectura', label: 'Lectura' },
    { value: 'otro', label: 'Otro' }
  ]

  const prioridades = [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' }
  ]

  const materiasOptions = [
    { value: '', label: 'Sin materia' },
    ...materias.map(m => ({ value: m.id, label: m.nombre }))
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva actividad">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Título *"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          placeholder="Ej: Examen de Cálculo II"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            options={tiposActividad}
          />

          <Select
            label="Prioridad"
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            options={prioridades}
          />
        </div>

        <Select
          label="Materia"
          name="materia_id"
          value={formData.materia_id}
          onChange={handleChange}
          options={materiasOptions}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha límite"
            name="fecha_limite"
            type="datetime-local"
            value={formData.fecha_limite}
            onChange={handleChange}
          />

          <Input
            label="Horas planificadas"
            name="horas_planificadas"
            type="number"
            step="0.5"
            min="0"
            value={formData.horas_planificadas}
            onChange={handleChange}
            placeholder="Ej: 2.5"
          />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="input min-h-[80px] resize-none"
            placeholder="Notas adicionales sobre la actividad..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="secondary" 
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            loading={loading}
          >
            Crear actividad
          </Button>
        </div>
      </form>
    </Modal>
  )
}
