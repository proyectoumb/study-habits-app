import { useState } from 'react'
import { useActividades, useMaterias } from '@/hooks/useSupabase'
import { Card, Button, Badge, Spinner, EmptyState, Modal, Input, Select } from '@/components/ui'
import { NuevaActividadModal } from '@/components/activities/NuevaActividadModal'
import { 
  Plus, 
  Search, 
  Filter, 
  Check, 
  Trash2, 
  Edit2,
  Calendar,
  Clock,
  ListTodo
} from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

export function ActividadesPage() {
  const [filtros, setFiltros] = useState({ completada: false })
  const [searchTerm, setSearchTerm] = useState('')
  const [showNuevaActividad, setShowNuevaActividad] = useState(false)
  const [editingActividad, setEditingActividad] = useState(null)
  
  const { actividades, loading, createActividad, toggleCompletada, deleteActividad, updateActividad } = useActividades(filtros)
  const { materias } = useMaterias()

  const actividadesFiltradas = actividades.filter(a => 
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.materia?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha'
    const date = parseISO(fecha)
    if (isToday(date)) return 'Hoy'
    if (isTomorrow(date)) return 'Mañana'
    return format(date, "d 'de' MMMM", { locale: es })
  }

  const getFechaStatus = (fecha) => {
    if (!fecha) return 'none'
    const date = parseISO(fecha)
    if (isPast(date) && !isToday(date)) return 'overdue'
    if (isToday(date)) return 'today'
    if (isTomorrow(date)) return 'tomorrow'
    return 'future'
  }

  const handleToggleCompletada = async (id, currentState) => {
    await toggleCompletada(id, !currentState)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta actividad?')) {
      await deleteActividad(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Actividades</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tus tareas, exámenes y proyectos</p>
        </div>
        <Button onClick={() => setShowNuevaActividad(true)}>
          <Plus className="w-4 h-4" />
          Nueva actividad
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltros({ completada: false })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                !filtros.completada 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFiltros({ completada: true })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filtros.completada 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completadas
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de actividades */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : actividadesFiltradas.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListTodo className="w-16 h-16" />}
            title={filtros.completada ? "No hay actividades completadas" : "No hay actividades pendientes"}
            description={filtros.completada 
              ? "Las actividades que marques como completadas aparecerán aquí"
              : "Crea una nueva actividad para comenzar a organizar tu estudio"
            }
            action={
              !filtros.completada && (
                <Button onClick={() => setShowNuevaActividad(true)}>
                  <Plus className="w-4 h-4" />
                  Nueva actividad
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {actividadesFiltradas.map((actividad) => {
            const fechaStatus = getFechaStatus(actividad.fecha_limite)
            
            return (
              <Card 
                key={actividad.id}
                className={`p-4 ${actividad.completada ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleCompletada(actividad.id, actividad.completada)}
                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      actividad.completada 
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {actividad.completada && <Check className="w-3 h-3" />}
                  </button>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-medium ${actividad.completada ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {actividad.titulo}
                        </h3>
                        {actividad.descripcion && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {actividad.descripcion}
                          </p>
                        )}
                      </div>
                      <Badge variant={actividad.prioridad}>
                        {actividad.prioridad.charAt(0).toUpperCase() + actividad.prioridad.slice(1)}
                      </Badge>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      {actividad.materia && (
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: actividad.materia.color }}
                          />
                          {actividad.materia.nombre}
                        </div>
                      )}
                      {actividad.fecha_limite && (
                        <div className={`flex items-center gap-1.5 ${
                          fechaStatus === 'overdue' ? 'text-red-600' :
                          fechaStatus === 'today' ? 'text-amber-600' : ''
                        }`}>
                          <Calendar className="w-4 h-4" />
                          {formatFecha(actividad.fecha_limite)}
                        </div>
                      )}
                      {actividad.horas_planificadas > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {actividad.horas_planificadas}h planificadas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingActividad(actividad)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(actividad.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modales */}
      <NuevaActividadModal
        isOpen={showNuevaActividad}
        onClose={() => setShowNuevaActividad(false)}
        createActividad={createActividad}
        materias={materias}
      />

      {/* Modal de edición */}
      {editingActividad && (
        <EditActividadModal
          actividad={editingActividad}
          materias={materias}
          onClose={() => setEditingActividad(null)}
          onSave={async (updates) => {
            await updateActividad(editingActividad.id, updates)
            setEditingActividad(null)
          }}
        />
      )}
    </div>
  )
}

// Modal de edición
function EditActividadModal({ actividad, materias, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: actividad.titulo,
    descripcion: actividad.descripcion || '',
    tipo: actividad.tipo,
    prioridad: actividad.prioridad,
    materia_id: actividad.materia_id || '',
    fecha_limite: actividad.fecha_limite ? actividad.fecha_limite.slice(0, 16) : '',
    horas_planificadas: actividad.horas_planificadas || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave({
      ...formData,
      materia_id: formData.materia_id || null,
      horas_planificadas: formData.horas_planificadas ? parseFloat(formData.horas_planificadas) : 0,
      fecha_limite: formData.fecha_limite || null
    })
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

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar actividad">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
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
          options={[
            { value: '', label: 'Sin materia' },
            ...materias.map(m => ({ value: m.id, label: m.nombre }))
          ]}
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
          />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="input min-h-[80px] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}
