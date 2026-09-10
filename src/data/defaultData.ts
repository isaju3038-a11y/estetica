import { Procedure, ClinicSettings, TimeSlot } from '../types';

export const DEFAULT_PROCEDURES: Procedure[] = [
  {
    id: 'preenchimento',
    name: 'Aplicar preenchimento',
    subtitle: 'Ácido Hialurônico',
    description: 'Restaura o volume facial, delineia contornos e preenche lábios com naturalidade e elegância.',
    durationMinutes: 60,
    priceEstimate: 'Sob avaliação personalizada',
    popular: true,
  },
  {
    id: 'botox',
    name: 'Botox',
    subtitle: 'Toxina Botulínica',
    description: 'Suaviza rugas de expressão na testa, glabela e pés de galinha, promovendo aspecto descansado e rejuvenescido.',
    durationMinutes: 45,
    priceEstimate: 'Sob avaliação personalizada',
    popular: true,
  },
  {
    id: 'queixo',
    name: 'Queixo',
    subtitle: 'Harmonização de Mento',
    description: 'Projeção e alinhamento do queixo para equilibrar o perfil e harmonizar as proporções da face.',
    durationMinutes: 45,
    priceEstimate: 'Sob avaliação personalizada',
  },
  {
    id: 'bigode-chines',
    name: 'Bigode chinês',
    subtitle: 'Sulco Nasogeniano',
    description: 'Ameniza as linhas profundas entre as narinas e o canto dos lábios, devolvendo frescor e vitalidade ao rosto.',
    durationMinutes: 45,
    priceEstimate: 'Sob avaliação personalizada',
  },
];

export const DEFAULT_SETTINGS: ClinicSettings = {
  name: 'Raya Estética',
  instagram: '@rayaestética',
  phone: '(11) 99999-8888',
  address: 'Atendimento exclusivo com hora marcada',
  ownerPin: 'raya2026', // PIN secreto padrão para acesso do dono
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

// Standard clinic hours for Raya Estética
export const STANDARD_CLINIC_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '11:30',
  '13:30',
  '14:30',
  '15:30',
  '16:30',
  '17:30',
  '18:30',
];

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate realistic starting slots for today and the next 30 days
export function generateInitialSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = ['09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30', '17:30'];
  const today = new Date();

  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // skip sundays (0)
    if (d.getDay() === 0) continue;

    const dateStr = formatDateKey(d);
    times.forEach((time) => {
      slots.push({
        id: `slot_${dateStr}_${time.replace(':', '')}`,
        date: dateStr,
        time,
        isAvailable: true,
      });
    });
  }

  return slots;
}
