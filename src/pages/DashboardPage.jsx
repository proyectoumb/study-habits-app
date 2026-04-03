import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useActividades, useEstadisticas, useMensajeMotivacional, useMaterias } from '@/hooks/useSupabase'
import { Card, Badge, Button, Spinner } from '@/components/ui'
import { ChartComparativo } from '@/components/dashboard/ChartComparativo'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { NuevaActividadModal } from '@/components/activities/NuevaActividadModal'
import { 
  Plus, 
  Clock, 
  Target, 
  ListTodo, 
  Flame,
  ChevronRight,
  FileText,
  BookOpen,
  Settings,
  Sparkles
} from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function DashboardPage() {
  const { profile } = useAuth()
  const { actividades, loading: loadingActividades, createActividad } = useActividades({ completada: false })
  const { materias } = useMaterias()
  const { stats, horasPorDia, refresh: refreshStats } = useEstadisticas()
  const { mensaje } = useMensajeMotivacional()
  const [showNuevaActividad, setShowNuevaActividad] = useState(false)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const formatFechaRelativa = (fecha) => {
    if (!fecha) return 'Sin fecha'
    const date = parseISO(fecha)
    if (isToday(date)) return 'Hoy'
    if (isTomorrow(date)) return 'Mañana'
    return format(date, "EEEE d 'de' MMMM", { locale: es })
  }

  const proximasActividades = actividades
    .filter(a => a.fecha_limite)
    .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{getGreeting()}, {profile?.nombre?.split(' ')[0]}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Mis hábitos de estudio</h1>
        </div>
        <Button onClick={() => setShowNuevaActividad(true)}>
          <Plus className="w-4 h-4" />
          Nueva actividad
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Horas esta semana</p>
          <p className="text-2xl font-semibold">{stats.horasSemana.toFixed(1)}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Cumplimiento</p>
          <p className="text-2xl font-semibold text-green-600">{stats.cumplimiento}%</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <ListTodo className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-semibold">{stats.pendientes}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Racha actual</p>
          <p className="text-2xl font-semibold">{stats.racha} días</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">Horas planificadas vs reales</h2>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
                <option>Esta semana</option>
                <option>Este mes</option>
              </select>
            </div>
            <ChartComparativo data={horasPorDia} />
          </Card>

          {/* Activities */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Próximas actividades</h2>
              <Link to="/actividades" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingActividades ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : proximasActividades.length === 0 ? (
              <div className="text-center py-8">
                <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tienes actividades pendientes</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setShowNuevaActividad(true)}
                >
                  Crear actividad
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {proximasActividades.map((actividad) => (
                  <div 
                    key={actividad.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div 
                      className={`w-2.5 h-2.5 rounded-full ${
                        actividad.prioridad === 'alta' ? 'bg-red-500' :
                        actividad.prioridad === 'media' ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{actividad.titulo}</p>
                      <p className="text-sm text-gray-500">
                        {actividad.materia?.nombre || 'Sin materia'} · {formatFechaRelativa(actividad.fecha_limite)}
                      </p>
                    </div>
                    <Badge variant={actividad.prioridad}>
                      {actividad.prioridad.charAt(0).toUpperCase() + actividad.prioridad.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Motivational Message */}
          {mensaje && (
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Mensaje del día</span>
              </div>
              <p className="text-gray-800 font-medium leading-relaxed">"{mensaje.mensaje}"</p>
              {mensaje.autor && (
                <p className="text-sm text-gray-600 mt-2">— {mensaje.autor}</p>
              )}
            </div>
          )}

          {/* AI Chat Widget */}
          <ChatWidget />

          {/* Quick Actions */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
            <div className="space-y-2">
              <Link 
                to="/estadisticas"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Exportar reporte PDF</span>
              </Link>
              <Link 
                to="/materias"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Gestionar materias</span>
              </Link>
              <Link 
                to="/configuracion"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Configuración</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Nueva Actividad Modal */}
      <NuevaActividadModal
        isOpen={showNuevaActividad}
        onClose={() => setShowNuevaActividad(false)}
        createActividad={async (data) => {
          const result = await createActividad(data)
          if (!result.error) refreshStats()
          return result
        }}
        materias={materias}
      />
    </div>
  )
}
