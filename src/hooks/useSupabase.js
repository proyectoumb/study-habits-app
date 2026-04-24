import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useMaterias() {
  const { user } = useAuth()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMaterias = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('materias').select('*').eq('activa', true).order('nombre')
    setLoading(false)
    if (error) { setError(error.message); return }
    setMaterias(data || [])
  }, [user?.id])

  useEffect(() => { fetchMaterias() }, [fetchMaterias])

  const createMateria = async (materia) => {
    const { data, error } = await supabase
      .from('materias').insert([{ ...materia, user_id: user.id }]).select().single()
    if (!error) setMaterias(prev => [...prev, data])
    return { data, error }
  }

  const updateMateria = async (id, updates) => {
    const { data, error } = await supabase
      .from('materias').update(updates).eq('id', id).select().single()
    if (!error) setMaterias(prev => prev.map(m => m.id === id ? data : m))
    return { data, error }
  }

  const deleteMateria = async (id) => {
    const { error } = await supabase.from('materias').update({ activa: false }).eq('id', id)
    if (!error) setMaterias(prev => prev.filter(m => m.id !== id))
    return { error }
  }

  return { materias, loading, error, createMateria, updateMateria, deleteMateria, refresh: fetchMaterias }
}

export function useActividades(filters = {}) {
  const { user } = useAuth()
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchActividades = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('actividades')
      .select('*, materia:materias(id, nombre, color)')
      .order('fecha_limite', { ascending: true })

    if (filters.completada !== undefined) query = query.eq('completada', filters.completada)
    if (filters.materia_id) query = query.eq('materia_id', filters.materia_id)
    if (filters.prioridad) query = query.eq('prioridad', filters.prioridad)

    const { data, error } = await query
    setLoading(false)
    if (error) { setError(error.message); return }
    setActividades(data || [])
  }, [user?.id, filters.completada, filters.materia_id, filters.prioridad])

  useEffect(() => { fetchActividades() }, [fetchActividades])

  const createActividad = async (actividad) => {
    const { data, error } = await supabase
      .from('actividades')
      .insert([{ ...actividad, user_id: user.id }])
      .select('*, materia:materias(id, nombre, color)')
      .single()
    if (!error) setActividades(prev => [...prev, data])
    return { data, error }
  }

  const updateActividad = async (id, updates) => {
    const { data, error } = await supabase
      .from('actividades').update(updates).eq('id', id)
      .select('*, materia:materias(id, nombre, color)').single()
    if (!error) setActividades(prev => prev.map(a => a.id === id ? data : a))
    return { data, error }
  }

  const deleteActividad = async (id) => {
    const { error } = await supabase.from('actividades').delete().eq('id', id)
    if (!error) setActividades(prev => prev.filter(a => a.id !== id))
    return { error }
  }

  const toggleCompletada = async (id, completada) => {
    return updateActividad(id, {
      completada,
      fecha_completada: completada ? new Date().toISOString() : null
    })
  }

  return { actividades, loading, error, createActividad, updateActividad, deleteActividad, toggleCompletada, refresh: fetchActividades }
}

export function useRegistrosEstudio(fechaInicio, fechaFin) {
  const { user } = useAuth()
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRegistros = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('registros_estudio')
      .select('*, actividad:actividades(id, titulo, materia:materias(nombre, color))')
      .order('fecha', { ascending: false })
    if (fechaInicio) query = query.gte('fecha', fechaInicio)
    if (fechaFin) query = query.lte('fecha', fechaFin)
    const { data, error } = await query
    setLoading(false)
    if (error) { setError(error.message); return }
    setRegistros(data || [])
  }, [user?.id, fechaInicio, fechaFin])

  useEffect(() => { fetchRegistros() }, [fetchRegistros])

  const createRegistro = async (registro) => {
    const { data, error } = await supabase
      .from('registros_estudio').insert([{ ...registro, user_id: user.id }]).select().single()
    if (!error) setRegistros(prev => [data, ...prev])
    return { data, error }
  }

  return { registros, loading, error, createRegistro, refresh: fetchRegistros }
}

export function useEstadisticas() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ horasSemana: 0, cumplimiento: 0, pendientes: 0, racha: 0 })
  const [horasPorDia, setHorasPorDia] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
        const hace7Dias = new Date()
        hace7Dias.setDate(hace7Dias.getDate() - 7)
        const fechaInicio = hace7Dias.toISOString().split('T')[0]

        const [{ data: registrosSemana }, { data: actividadesSemana }, { data: actividadesPendientes }] =
          await Promise.all([
            supabase.from('registros_estudio').select('fecha, horas').gte('fecha', fechaInicio),
            supabase.from('actividades').select('fecha_limite, horas_planificadas')
              .gte('fecha_limite', fechaInicio)
              .not('horas_planificadas', 'is', null)
              .gt('horas_planificadas', 0),
            supabase.from('actividades').select('id').eq('completada', false)
          ])

        // RF11: % cumplimiento = horas reales / horas planificadas esta semana
        const horasRealesSemana = registrosSemana?.reduce((s, r) => s + parseFloat(r.horas), 0) || 0
        const horasPlanificadasSemana = actividadesSemana?.reduce((s, a) => s + parseFloat(a.horas_planificadas || 0), 0) || 0
        const cumplimiento = horasPlanificadasSemana > 0
          ? Math.min(Math.round((horasRealesSemana / horasPlanificadasSemana) * 100), 100)
          : 0

        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const horasPorDiaMap = {}
        for (let i = 6; i >= 0; i--) {
          const fecha = new Date()
          fecha.setDate(fecha.getDate() - i)
          const fechaStr = fecha.toISOString().split('T')[0]
          horasPorDiaMap[fechaStr] = { dia: diasSemana[fecha.getDay()], fecha: fechaStr, horas: 0, planificadas: 0 }
        }
        registrosSemana?.forEach(r => {
          if (horasPorDiaMap[r.fecha]) horasPorDiaMap[r.fecha].horas += parseFloat(r.horas)
        })
        actividadesSemana?.forEach(a => {
          const fechaAct = a.fecha_limite?.split('T')[0]
          if (fechaAct && horasPorDiaMap[fechaAct]) {
            horasPorDiaMap[fechaAct].planificadas += parseFloat(a.horas_planificadas || 0)
          }
        })

        const hace30Dias = new Date()
        hace30Dias.setDate(hace30Dias.getDate() - 30)
        const { data: registrosRacha } = await supabase
          .from('registros_estudio').select('fecha')
          .gte('fecha', hace30Dias.toISOString().split('T')[0])
        const fechasConEstudio = new Set(registrosRacha?.map(r => r.fecha) || [])
        let racha = 0
        for (let i = 0; i < 30; i++) {
          const fecha = new Date()
          fecha.setDate(fecha.getDate() - i)
          const fechaStr = fecha.toISOString().split('T')[0]
          if (fechasConEstudio.has(fechaStr)) racha++
          else if (i > 0) break
        }

        setStats({
          horasSemana: horasRealesSemana,
          cumplimiento,
          pendientes: actividadesPendientes?.length || 0,
          racha
        })
        setHorasPorDia(Object.values(horasPorDiaMap))
      } catch (e) {
        console.error('Error estadísticas:', e)
      } finally {
        setLoading(false)
      }
  }, [user?.id])

  useEffect(() => { fetchStats() }, [fetchStats])

  return { stats, horasPorDia, loading, refresh: fetchStats }
}

export function useMensajeMotivacional() {
  const { profile } = useAuth()
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    const fetchMensaje = async () => {
      // Intentar generar mensaje con Gemini
      try {
        const nombre = profile?.nombre || 'estudiante'
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{ text: `Genera un mensaje motivacional corto (máximo 2 oraciones) para un estudiante llamado ${nombre}. Solo devuelve el mensaje, sin comillas ni explicaciones adicionales.` }]
              }]
            })
          }
        )
        if (!response.ok) throw new Error('Gemini error')
        const data = await response.json()
        const texto = data.candidates[0].content.parts[0].text.trim()
        setMensaje({ mensaje: texto, autor: 'StudyBot ✨' })
        return
      } catch {
        // Fallback: tabla estática de Supabase
      }

      const { data } = await supabase.from('mensajes_motivacionales').select('*').eq('activo', true)
      if (data && data.length > 0) setMensaje(data[Math.floor(Math.random() * data.length)])
    }

    fetchMensaje()
  }, [profile?.nombre])

  return { mensaje }
}
