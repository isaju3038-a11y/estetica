import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Appointment, ClinicSettings, Procedure, TimeSlot } from '../types';
import { DEFAULT_PROCEDURES, DEFAULT_SETTINGS, generateInitialSlots } from '../data/defaultData';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const storedSettings = getStoredSettings();
  const url = (storedSettings.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = (storedSettings.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && currentUrl === url && currentKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    currentUrl = url;
    currentKey = key;
    return cachedClient;
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    return null;
  }
}

// Local storage fallbacks & cache keys
const STORAGE_KEYS = {
  PROCEDURES: 'raya_procedures_v1',
  SLOTS: 'raya_slots_v1',
  APPOINTMENTS: 'raya_appointments_v1',
  SETTINGS: 'raya_settings_v1',
};

export function getStoredSettings(): ClinicSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Erro ao ler settings locais:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: ClinicSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Data API: Procedures
export async function fetchProcedures(): Promise<Procedure[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('procedures')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        return data as Procedure[];
      }
    } catch (e) {
      console.warn('Supabase fetchProcedures fallback:', e);
    }
  }

  // Fallback to local
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROCEDURES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Fallback local procedures error:', e);
  }
  localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(DEFAULT_PROCEDURES));
  return DEFAULT_PROCEDURES;
}

export async function saveProcedures(procedures: Procedure[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(procedures));
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('procedures').upsert(procedures);
    } catch (e) {
      console.warn('Supabase saveProcedures sync error:', e);
    }
  }
  return true;
}

// Data API: TimeSlots (Calendar & Horários)
export async function fetchSlots(): Promise<TimeSlot[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('available_slots')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as TimeSlot[];
      }
    } catch (e) {
      console.warn('Supabase fetchSlots fallback:', e);
    }
  }

  // Fallback to local storage
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLOTS);
    if (raw) {
      const parsed: TimeSlot[] = JSON.parse(raw);
      // Ensure there are slots for today or future dates
      const hasFutureSlots = parsed.some((s) => s.date >= todayStr && s.isAvailable);
      if (hasFutureSlots) {
        return parsed;
      }
      // If slots are outdated, merge with new initial slots
      const initial = generateInitialSlots();
      const existingBooked = parsed.filter((s) => !s.isAvailable);
      const merged = [...existingBooked, ...initial.filter((init) => !existingBooked.some((ex) => ex.date === init.date && ex.time === init.time))];
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('Fallback local slots error:', e);
  }

  const initial = generateInitialSlots();
  localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(initial));
  return initial;
}

export async function saveSlots(slots: TimeSlot[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('available_slots').upsert(slots);
    } catch (e) {
      console.warn('Supabase saveSlots sync error:', e);
    }
  }
  return true;
}

// Data API: Appointments (Agendamentos dos Clientes)
export async function fetchAppointments(): Promise<Appointment[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (!error && data) {
        return data as Appointment[];
      }
    } catch (e) {
      console.warn('Supabase fetchAppointments fallback:', e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Fallback local appointments error:', e);
  }
  return [];
}

export async function createAppointment(appointment: Appointment): Promise<boolean> {
  // Update local appointments
  const current = await fetchAppointments();
  const updated = [appointment, ...current];
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));

  // Mark the slot as booked or create it as booked
  const currentSlots = await fetchSlots();
  let slotFound = false;
  const updatedSlots = currentSlots.map((slot) => {
    if (slot.date === appointment.date && slot.time === appointment.time) {
      slotFound = true;
      return { ...slot, isAvailable: false, bookedByAppointmentId: appointment.id };
    }
    return slot;
  });

  if (!slotFound) {
    updatedSlots.push({
      id: `slot_${appointment.date}_${appointment.time.replace(':', '')}`,
      date: appointment.date,
      time: appointment.time,
      isAvailable: false,
      bookedByAppointmentId: appointment.id,
    });
  }

  await saveSlots(updatedSlots);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('appointments').insert([appointment]);
      await client.from('available_slots').upsert({
        id: `slot_${appointment.date}_${appointment.time.replace(':', '')}`,
        date: appointment.date,
        time: appointment.time,
        isAvailable: false,
        bookedByAppointmentId: appointment.id,
      });
    } catch (e) {
      console.warn('Supabase createAppointment sync error:', e);
    }
  }

  return true;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: Appointment['status']
): Promise<boolean> {
  const current = await fetchAppointments();
  const updated = current.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a));
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));

  // If appointment was cancelled, free up the slot
  if (newStatus === 'cancelado') {
    const target = current.find((a) => a.id === appointmentId);
    if (target) {
      const slots = await fetchSlots();
      const updatedSlots = slots.map((slot) => {
        if (slot.date === target.date && slot.time === target.time) {
          return { ...slot, isAvailable: true, bookedByAppointmentId: undefined };
        }
        return slot;
      });
      await saveSlots(updatedSlots);
    }
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('appointments').update({ status: newStatus }).eq('id', appointmentId);
    } catch (e) {
      console.warn('Supabase updateStatus error:', e);
    }
  }

  return true;
}

// SQL Schema and Storage Policies string to help the owner set up Supabase instantly
export const SUPABASE_SCHEMA_SQL = `
-- =========================================================================
-- RAYA ESTÉTICA - BANCO DE DADOS & POLÍTICAS DE ARMAZENAMENTO SUPABASE
-- Acesse: https://supabase.com -> Seu Projeto -> SQL Editor -> Cole e clique em RUN
-- =========================================================================

-- 1. TABELA DE PROCEDIMENTOS ESTÉTICOS
CREATE TABLE IF NOT EXISTS public.procedures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  "durationMinutes" INT DEFAULT 45,
  "priceEstimate" TEXT,
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE HORÁRIOS DISPONÍVEIS (CALENDÁRIO DA CLÍNICA)
CREATE TABLE IF NOT EXISTS public.available_slots (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  "isAvailable" BOOLEAN DEFAULT true,
  "bookedByAppointmentId" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida de horários por data
CREATE INDEX IF NOT EXISTS idx_available_slots_date ON public.available_slots(date);
CREATE INDEX IF NOT EXISTS idx_available_slots_available ON public.available_slots("isAvailable");

-- 3. TABELA DE AGENDAMENTOS DOS CLIENTES
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  "clientName" TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "clientEmail" TEXT,
  "procedureId" TEXT NOT NULL,
  "procedureName" TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para agendamentos
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- =========================================================================
-- 4. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) NAS TABELAS
-- =========================================================================
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se já existirem (para permitir reexecução sem erros)
DROP POLICY IF EXISTS "Permitir leitura de procedimentos" ON public.procedures;
DROP POLICY IF EXISTS "Permitir gerenciamento de procedimentos" ON public.procedures;
DROP POLICY IF EXISTS "Permitir leitura de horários disponíveis" ON public.available_slots;
DROP POLICY IF EXISTS "Permitir atualização e inserção de horários" ON public.available_slots;
DROP POLICY IF EXISTS "Permitir exclusão de horários" ON public.available_slots;
DROP POLICY IF EXISTS "Permitir leitura de agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir clientes criarem agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir atualização de status dos agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir exclusão de agendamentos" ON public.appointments;

-- Políticas de Procedimentos
CREATE POLICY "Permitir leitura de procedimentos"
  ON public.procedures FOR SELECT
  USING (true);

CREATE POLICY "Permitir gerenciamento de procedimentos"
  ON public.procedures FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas de Horários Disponíveis
CREATE POLICY "Permitir leitura de horários disponíveis"
  ON public.available_slots FOR SELECT
  USING (true);

CREATE POLICY "Permitir atualização e inserção de horários"
  ON public.available_slots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir modificação de horários"
  ON public.available_slots FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de horários"
  ON public.available_slots FOR DELETE
  USING (true);

-- Políticas de Agendamentos
CREATE POLICY "Permitir leitura de agendamentos"
  ON public.appointments FOR SELECT
  USING (true);

CREATE POLICY "Permitir clientes criarem agendamentos"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de status dos agendamentos"
  ON public.appointments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de agendamentos"
  ON public.appointments FOR DELETE
  USING (true);

-- =========================================================================
-- 5. BUCKET DE ARMAZENAMENTO (SUPABASE STORAGE) & POLÍTICAS DE ARQUIVOS
-- Criação do Bucket 'raya-media' para fotos, resultados e comprovantes
-- Nota: 'storage.objects' já possui RLS ativado nativamente pelo Supabase
-- =========================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'raya-media',
  'raya-media',
  true,
  10485760, -- limite de 10MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Limpar políticas antigas de storage se existirem
DROP POLICY IF EXISTS "Storage Leitura Pública de Arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Storage Upload de Arquivos Permitido" ON storage.objects;
DROP POLICY IF EXISTS "Storage Atualização de Arquivos Permitida" ON storage.objects;
DROP POLICY IF EXISTS "Storage Exclusão de Arquivos Permitida" ON storage.objects;

-- POLÍTICA 1: Permitir que qualquer visitante visualize as fotos/arquivos públicos
CREATE POLICY "Storage Leitura Pública de Arquivos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'raya-media');

-- POLÍTICA 2: Permitir envio/upload de novas fotos e arquivos
CREATE POLICY "Storage Upload de Arquivos Permitido"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'raya-media');

-- POLÍTICA 3: Permitir atualização de arquivos no bucket
CREATE POLICY "Storage Atualização de Arquivos Permitida"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'raya-media');

-- POLÍTICA 4: Permitir exclusão de arquivos no bucket
CREATE POLICY "Storage Exclusão de Arquivos Permitida"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'raya-media');

-- =========================================================================
-- 6. DADOS INICIAIS (SEED) DOS 4 PROCEDIMENTOS DA RAYA ESTÉTICA
-- =========================================================================
INSERT INTO public.procedures (id, name, subtitle, description, "durationMinutes", "priceEstimate", popular)
VALUES
  (
    'preenchimento',
    'Aplicar preenchimento',
    'Ácido Hialurônico Premium',
    'Procedimento de preenchimento facial com ácido hialurônico para volumização labial, contorno mandibular, maçãs do rosto e sustentação tecidual com naturalidade.',
    60,
    'Sob consulta',
    true
  ),
  (
    'botox',
    'Botox',
    'Toxina Botulínica Preventiva e Reparadora',
    'Aplicação refinada de toxina botulínica para amenizar e prevenir rugas dinâmicas na testa, glabela (entre as sobrancelhas) e pés de galinha, mantendo a expressividade elegante.',
    45,
    'Sob consulta',
    true
  ),
  (
    'queixo',
    'Queixo',
    'Harmonização e Projeção de Mento',
    'Projeção milimétrica e definição do queixo com ácido hialurônico denso, melhorando o perfil facial, equilíbrio com o nariz e definição da mandíbula.',
    45,
    'Sob consulta',
    false
  ),
  (
    'bigode-chines',
    'Bigode chinês',
    'Preenchimento de Sulco Nasogeniano',
    'Suavização imediata das linhas e sulcos entre o nariz e o canto dos lábios, devolvendo o viço e o aspecto descansado ao rosto.',
    45,
    'Sob consulta',
    false
  )
ON CONFLICT (id) DO NOTHING;
`.trim();
