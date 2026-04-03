import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function ChartComparativo({ data }) {
  // Transformar datos para incluir horas planificadas (mock por ahora)
  const chartData = data.map(item => ({
    ...item,
    planificadas: Math.max(item.horas + Math.random() * 2 - 1, 0).toFixed(1),
    reales: item.horas.toFixed(1)
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4}>
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
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => [`${value} horas`, '']}
            labelStyle={{ fontWeight: 500, marginBottom: 4 }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            iconType="square"
            iconSize={10}
            formatter={(value) => (
              <span className="text-sm text-gray-600">
                {value === 'planificadas' ? 'Planificadas' : 'Reales'}
              </span>
            )}
          />
          <Bar 
            dataKey="planificadas" 
            fill="#DBEAFE" 
            radius={[4, 4, 0, 0]}
            name="planificadas"
          />
          <Bar 
            dataKey="reales" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]}
            name="reales"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
