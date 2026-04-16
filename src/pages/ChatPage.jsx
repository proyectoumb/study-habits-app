import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, Button, Spinner, Avatar } from '@/components/ui'
import { Send, Bot, Trash2, Sparkles } from 'lucide-react'

const SYSTEM_PROMPT = `Eres un asistente de estudio amigable y experto llamado StudyBot. Tu objetivo es ayudar a estudiantes a mejorar sus hábitos de estudio y rendimiento académico.

Puedes ayudar con:
- Técnicas de estudio efectivas (Pomodoro, repetición espaciada, mapas mentales, etc.)
- Organización del tiempo y planificación
- Consejos para concentrarse mejor
- Estrategias para memorizar información
- Preparación para exámenes
- Manejo del estrés académico
- Motivación y productividad

Responde siempre en español, de forma clara y concisa. Usa emojis ocasionalmente para hacer la conversación más amigable. Si no sabes algo, admítelo honestamente.`

export function ChatPage() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const messagesEndRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Cargar historial al montar
  useEffect(() => {
    loadChatHistory()
  }, [user])

  // Procesar mensaje inicial si viene de otra página
  useEffect(() => {
    if (location.state?.initialMessage && !loadingHistory) {
      setInput(location.state.initialMessage)
      // Limpiar el state para evitar reenvíos
      window.history.replaceState({}, document.title)
    }
  }, [location.state, loadingHistory])

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChatHistory = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('conversaciones_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)

    if (!error && data) {
      setMessages(data.map(msg => ({
        id: msg.id,
        role: msg.rol,
        content: msg.contenido
      })))
    }
    setLoadingHistory(false)
  }

  const saveMessage = async (role, content) => {
    if (!user) return

    await supabase
      .from('conversaciones_chat')
      .insert([{
        user_id: user.id,
        rol: role,
        contenido: content
      }])
  }

  const clearHistory = async () => {
    if (!window.confirm('¿Estás seguro de borrar el historial de chat?')) return

    const { error } = await supabase
      .from('conversaciones_chat')
      .delete()
      .eq('user_id', user.id)

    if (!error) {
      setMessages([])
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Agregar mensaje del usuario
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage
    }
    setMessages(prev => [...prev, newUserMessage])
    await saveMessage('user', userMessage)

    try {
      // Preparar mensajes para la API
      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ]

      // Llamar a la API de Google Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: apiMessages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            }))
          })
        }
      )

      if (!response.ok) {
        throw new Error('Error en la API')
      }

      const data = await response.json()
      const assistantMessage = data.candidates[0].content.parts[0].text

      // Agregar respuesta del asistente
      const newAssistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantMessage
      }
      setMessages(prev => [...prev, newAssistantMessage])
      await saveMessage('assistant', assistantMessage)

    } catch (error) {
      console.error('Error:', error)
      // Agregar mensaje de error
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, verifica que la API key esté configurada correctamente o intenta de nuevo más tarde.'
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setLoading(false)
  }

  const sugerencias = [
    '¿Cómo puedo concentrarme mejor?',
    '¿Qué es la técnica Pomodoro?',
    'Tips para estudiar antes de un examen',
    '¿Cómo organizo mi tiempo de estudio?'
  ]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-xl">
            <Bot className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Asistente de Estudio</h1>
            <p className="text-sm text-gray-500">Powered by Claude AI</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 className="w-4 h-4" />
            Limpiar chat
          </Button>
        )}
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Hola! Soy tu asistente de estudio
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Puedo ayudarte con técnicas de estudio, organización del tiempo,
                preparación para exámenes y más. ¿En qué puedo ayudarte?
              </p>

              {/* Sugerencias */}
              <div className="flex flex-wrap justify-center gap-2">
                {sugerencias.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sug)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar nombre={profile?.nombre} size="sm" />
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="input flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
