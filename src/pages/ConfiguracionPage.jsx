import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, Button, Input, Avatar } from '@/components/ui'
import { User, Mail, Save, Check } from 'lucide-react'

export function ConfiguracionPage() {
  const { profile, updateProfile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    email: profile?.email || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await updateProfile({
      nombre: formData.nombre
    })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Administra tu cuenta y preferencias</p>
      </div>

      {/* Perfil */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Información del perfil</h2>
        
        <div className="flex items-center gap-6 mb-6">
          <Avatar nombre={profile?.nombre} size="lg" />
          <div>
            <p className="font-medium text-gray-900">{profile?.nombre}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Correo electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                className="input pl-10 bg-gray-50"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">El correo no se puede cambiar</p>
          </div>

          <div className="pt-2">
            <Button type="submit" loading={loading} disabled={saved}>
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Cuenta */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cuenta</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Plan actual</p>
              <p className="text-sm text-gray-500">Versión gratuita</p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
              Activo
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Miembro desde</p>
              <p className="text-sm text-gray-500">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('es', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Zona de peligro */}
      <Card className="p-6 border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Zona de peligro</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Cerrar sesión te desconectará de tu cuenta. Tus datos permanecerán guardados.
        </p>

        <Button variant="danger" onClick={signOut}>
          Cerrar sesión
        </Button>
      </Card>
    </div>
  )
}
