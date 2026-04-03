-- =============================================
-- SISTEMA DE GESTIÓN DE HÁBITOS DE ESTUDIO
-- Esquema de Base de Datos - Supabase
-- =============================================

-- Habilitar extensión para UUID (requerida para uuid_generate_v4 en PG < 14)
-- En Supabase moderno se puede usar gen_random_uuid() sin extensión,
-- pero la mantenemos por compatibilidad.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: perfiles (extiende auth.users)
-- =============================================
CREATE TABLE public.perfiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: materias
-- =============================================
CREATE TABLE public.materias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Color hexadecimal
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: actividades
-- =============================================
CREATE TYPE tipo_actividad AS ENUM ('tarea', 'examen', 'proyecto', 'lectura', 'otro');
CREATE TYPE prioridad_actividad AS ENUM ('alta', 'media', 'baja');

CREATE TABLE public.actividades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    materia_id UUID REFERENCES public.materias(id) ON DELETE SET NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo tipo_actividad DEFAULT 'tarea',
    prioridad prioridad_actividad DEFAULT 'media',
    fecha_limite TIMESTAMP WITH TIME ZONE,
    horas_planificadas DECIMAL(5,2) DEFAULT 0,
    horas_reales DECIMAL(5,2) DEFAULT 0,
    completada BOOLEAN DEFAULT FALSE,
    fecha_completada TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: registros_estudio (sesiones de estudio)
-- =============================================
CREATE TABLE public.registros_estudio (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    actividad_id UUID REFERENCES public.actividades(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    horas DECIMAL(4,2) NOT NULL CHECK (horas > 0 AND horas <= 24),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: mensajes_motivacionales
-- =============================================
CREATE TABLE public.mensajes_motivacionales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mensaje TEXT NOT NULL,
    autor VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: conversaciones_chat (historial del chatbot)
-- =============================================
CREATE TYPE rol_mensaje AS ENUM ('user', 'assistant');

CREATE TABLE public.conversaciones_chat (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rol rol_mensaje NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo accede a sus propios datos
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_estudio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversaciones_chat ENABLE ROW LEVEL SECURITY;

-- Políticas para PERFILES
CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON public.perfiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.perfiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil"
    ON public.perfiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para MATERIAS
CREATE POLICY "Usuarios pueden ver sus materias"
    ON public.materias FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear materias"
    ON public.materias FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus materias"
    ON public.materias FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus materias"
    ON public.materias FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para ACTIVIDADES
CREATE POLICY "Usuarios pueden ver sus actividades"
    ON public.actividades FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear actividades"
    ON public.actividades FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus actividades"
    ON public.actividades FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus actividades"
    ON public.actividades FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para REGISTROS_ESTUDIO
CREATE POLICY "Usuarios pueden ver sus registros"
    ON public.registros_estudio FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear registros"
    ON public.registros_estudio FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus registros"
    ON public.registros_estudio FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus registros"
    ON public.registros_estudio FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para CONVERSACIONES_CHAT
CREATE POLICY "Usuarios pueden ver sus conversaciones"
    ON public.conversaciones_chat FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear mensajes"
    ON public.conversaciones_chat FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Mensajes motivacionales son públicos (solo lectura)
ALTER TABLE public.mensajes_motivacionales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer mensajes motivacionales"
    ON public.mensajes_motivacionales FOR SELECT
    USING (activo = TRUE);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_perfiles_updated_at
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
    BEFORE UPDATE ON public.materias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actividades_updated_at
    BEFORE UPDATE ON public.actividades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombre, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ÍNDICES (mejoran el rendimiento de consultas)
-- =============================================

CREATE INDEX idx_materias_user_id ON public.materias(user_id);
CREATE INDEX idx_actividades_user_id ON public.actividades(user_id);
CREATE INDEX idx_actividades_materia_id ON public.actividades(materia_id);
CREATE INDEX idx_actividades_completada ON public.actividades(completada);
CREATE INDEX idx_registros_estudio_user_id ON public.registros_estudio(user_id);
CREATE INDEX idx_registros_estudio_fecha ON public.registros_estudio(fecha);
CREATE INDEX idx_registros_estudio_actividad_id ON public.registros_estudio(actividad_id);
CREATE INDEX idx_conversaciones_chat_user_id ON public.conversaciones_chat(user_id);

-- =============================================
-- FUNCIÓN: Actualizar horas_reales en actividades
-- Se dispara cuando se insertan/actualizan/eliminan registros_estudio
-- =============================================

CREATE OR REPLACE FUNCTION public.sync_horas_reales()
RETURNS TRIGGER AS $$
DECLARE
    v_actividad_id UUID;
BEGIN
    -- Determinar qué actividad_id revisar
    IF TG_OP = 'DELETE' THEN
        v_actividad_id := OLD.actividad_id;
    ELSE
        v_actividad_id := NEW.actividad_id;
    END IF;

    -- Si no tiene actividad asociada, no hacer nada
    IF v_actividad_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Actualizar horas_reales sumando todos los registros de esa actividad
    UPDATE public.actividades
    SET horas_reales = COALESCE((
        SELECT SUM(horas)
        FROM public.registros_estudio
        WHERE actividad_id = v_actividad_id
    ), 0)
    WHERE id = v_actividad_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar horas_reales
CREATE TRIGGER sync_horas_reales_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.registros_estudio
    FOR EACH ROW EXECUTE FUNCTION public.sync_horas_reales();

-- =============================================
-- VISTAS ÚTILES (con security_barrier para respetar RLS)
-- =============================================

-- Vista: Resumen semanal de horas por usuario
CREATE OR REPLACE VIEW public.resumen_semanal
WITH (security_barrier = true) AS
SELECT
    user_id,
    DATE_TRUNC('week', fecha) AS semana,
    SUM(horas) AS horas_totales,
    COUNT(*) AS sesiones
FROM public.registros_estudio
GROUP BY user_id, DATE_TRUNC('week', fecha);

-- Vista: Estadísticas de actividades por usuario
-- Nota: usa horas_reales de actividades, que se sincroniza automáticamente
-- mediante el trigger sync_horas_reales_trigger
CREATE OR REPLACE VIEW public.estadisticas_actividades
WITH (security_barrier = true) AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE completada = FALSE) AS pendientes,
    COUNT(*) FILTER (WHERE completada = TRUE) AS completadas,
    SUM(horas_planificadas) AS total_horas_planificadas,
    SUM(horas_reales) AS total_horas_reales,
    CASE
        WHEN SUM(horas_planificadas) > 0
        THEN ROUND((SUM(horas_reales) / SUM(horas_planificadas) * 100)::numeric, 1)
        ELSE 0
    END AS porcentaje_cumplimiento
FROM public.actividades
GROUP BY user_id;

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar mensajes motivacionales de ejemplo
INSERT INTO public.mensajes_motivacionales (mensaje, autor) VALUES
('El éxito es la suma de pequeños esfuerzos repetidos día tras día.', 'Robert Collier'),
('La educación es el arma más poderosa que puedes usar para cambiar el mundo.', 'Nelson Mandela'),
('El único modo de hacer un gran trabajo es amar lo que haces.', 'Steve Jobs'),
('No te preocupes por los fracasos, preocúpate por las chances que pierdes cuando ni siquiera lo intentas.', 'Jack Canfield'),
('El conocimiento es poder.', 'Francis Bacon'),
('Nunca consideres el estudio como una obligación, sino como una oportunidad para penetrar en el bello y maravilloso mundo del saber.', 'Albert Einstein'),
('La perseverancia es la madre del éxito.', 'Proverbio'),
('Cada día es una nueva oportunidad para aprender algo nuevo.', 'Anónimo'),
('El futuro pertenece a quienes creen en la belleza de sus sueños.', 'Eleanor Roosevelt'),
('La disciplina es el puente entre las metas y los logros.', 'Jim Rohn');
