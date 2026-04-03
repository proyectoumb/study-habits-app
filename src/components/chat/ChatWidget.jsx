import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/components/ui'
import { MessageSquare, Send, ArrowRight } from 'lucide-react'

export function ChatWidget() {
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      // Navegar al chat completo con el mensaje
      navigate('/chat', { state: { initialMessage: message } })
    }
  }

  const sugerencias = [
    '¿Cómo puedo estudiar mejor?',
    'Técnicas para concentrarme',
    'Organizar mi tiempo'
  ]

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-50 rounded-lg">
          <MessageSquare className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="font-semibold text-gray-900">Asistente de estudio</h2>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600">
          ¡Hola! Puedo ayudarte con técnicas de estudio, organización del tiempo y recomendaciones personalizadas. ¿En qué te ayudo?
        </p>
      </div>

      {/* Sugerencias */}
      <div className="flex flex-wrap gap-2 mb-4">
        {sugerencias.map((sug, i) => (
          <button
            key={i}
            onClick={() => setMessage(sug)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="input flex-1"
        />
        <Button type="submit" disabled={!message.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Link to full chat */}
      <button
        onClick={() => navigate('/chat')}
        className="w-full mt-3 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
      >
        Abrir chat completo <ArrowRight className="w-4 h-4" />
      </button>
    </Card>
  )
}
