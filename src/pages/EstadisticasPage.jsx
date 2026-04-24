import { useState, useRef } from 'react'
import { useEstadisticas, useActividades, useRegistrosEstudio } from '@/hooks/useSupabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, Button, Spinner } from '@/components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import {
  Download,
  Clock,
  Target,
  CheckCircle,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export function EstadisticasPage() {
  const { profile } = useAuth()
  const { stats, horasPorDia, loading } = useEstadisticas()
  const { actividades } = useActividades()
  const [exportando, setExportando] = useState(false)
  const reportRef = useRef(null)

  // Calcular estadísticas adicionales
  const actividadesPorTipo = actividades.reduce((acc, act) => {
    acc[act.tipo] = (acc[act.tipo] || 0) + 1
    return acc
  }, {})

  const dataTipos = Object.entries(actividadesPorTipo).map(([tipo, count]) => ({
    name: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    value: count
  }))

  const completadas = actividades.filter(a => a.completada).length
  const pendientes = actividades.filter(a => !a.completada).length
  const porcentajeCompletadas = actividades.length > 0
    ? Math.round((completadas / actividades.length) * 100)
    : 0

  // Función para exportar PDF
  const exportarPDF = async () => {
    if (!reportRef.current) return

    setExportando(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      // Título
      pdf.setFontSize(20)
      pdf.text('Reporte de Hábitos de Estudio', pdfWidth / 2, 15, { align: 'center' })

      pdf.setFontSize(10)
      pdf.text(`Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`, pdfWidth / 2, 22, { align: 'center' })
      pdf.text(`Usuario: ${profile?.nombre}`, pdfWidth / 2, 28, { align: 'center' })

      pdf.addImage(imgData, 'PNG', imgX, 35, imgWidth * ratio * 0.9, imgHeight * ratio * 0.9)

      pdf.save(`reporte-estudios-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al generar el PDF. Inténtalo de nuevo.')
    }
    setExportando(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500 mt-1">Analiza tu progreso y rendimiento</p>
        </div>
        <Button onClick={exportarPDF} loading={exportando}>
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Contenido del reporte */}
      <div ref={reportRef} className="space-y-6">
        {/* Stats principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Horas esta semana</p>
            <p className="text-2xl font-semibold mt-1">{stats.horasSemana.toFixed(1)}</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Cumplimiento semanal</p>
            <p className="text-2xl font-semibold mt-1 text-green-600">{stats.cumplimiento}%</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.cumplimiento >= 80 ? 'bg-green-500' :
                  stats.cumplimiento >= 50 ? 'bg-amber-500' : 'bg-red-400'
                }`}
                style={{ width: `${stats.cumplimiento}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Horas reales vs. planificadas</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Completadas</p>
            <p className="text-2xl font-semibold mt-1">{completadas} / {actividades.length}</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Racha actual</p>
            <p className="text-2xl font-semibold mt-1">{stats.racha} días</p>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Horas por día */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Horas de estudio por día</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horasPorDia}>
                  <XAxis
                    dataKey="dia"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value} horas`, 'Estudiado']}
                  />
                  <Bar dataKey="horas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Actividades por tipo */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Distribución por tipo</h3>
            <div className="h-64">
              {dataTipos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataTipos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {dataTipos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No hay datos suficientes
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Progreso de completadas */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Progreso de actividades</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completadas: {completadas}</span>
              <span className="text-gray-600">Pendientes: {pendientes}</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${porcentajeCompletadas}%` }}
              />
            </div>
            <p className="text-center text-2xl font-semibold text-green-600">
              {porcentajeCompletadas}% completado
            </p>
          </div>
        </Card>

        {/* Recomendaciones */}
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h3 className="font-semibold text-gray-900 mb-3">Recomendaciones</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {stats.horasSemana < 10 && (
              <li>• Intenta aumentar tus horas de estudio semanales para alcanzar al menos 10 horas.</li>
            )}
            {stats.cumplimiento < 70 && (
              <li>• Tu cumplimiento está por debajo del 70%. Considera planificar sesiones más cortas pero más frecuentes.</li>
            )}
            {stats.racha < 3 && (
              <li>• Mantén la constancia estudiando al menos un poco cada día para construir una racha.</li>
            )}
            {stats.cumplimiento >= 80 && (
              <li>• ¡Excelente trabajo! Tu cumplimiento es muy bueno. Sigue así.</li>
            )}
            {stats.racha >= 7 && (
              <li>• ¡Increíble! Llevas más de una semana de racha. La consistencia es clave.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
