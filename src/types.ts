export interface Procedure {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  durationMinutes: number;
  priceEstimate?: string;
  iconName?: string;
  popular?: boolean;
}

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  isAvailable: boolean;
  bookedByAppointmentId?: string;
  createdAt?: string;
}

export type AppointmentStatus = 'pendente' | 'confirmado' | 'concluido' | 'cancelado';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  procedureId: string;
  procedureName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface ClinicSettings {
  name: string;
  instagram: string;
  phone: string;
  address: string;
  ownerPin: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
