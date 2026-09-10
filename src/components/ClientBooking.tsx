import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Procedure, TimeSlot, Appointment } from '../types';
import { ProcedureCard } from './ProcedureCard';
import { BookingCalendar } from './BookingCalendar';
import { Logo } from './Logo';
import { formatDateKey } from '../data/defaultData';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Send,
  Sparkles,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';

interface ClientBookingProps {
  procedures: Procedure[];
  slots: TimeSlot[];
  onBookAppointment: (appointment: Appointment) => Promise<boolean>;
  clinicInstagram: string;
}

export const ClientBooking: React.FC<ClientBookingProps> = ({
  procedures,
  slots,
  onBookAppointment,
  clinicInstagram,
}) => {
  // Step tracking: 1: Procedure, 2: Date & Time, 3: Client info
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(
    procedures[0] || null
  );

  // Initialize selectedDate with today or tomorrow (if today is Sunday)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    return formatDateKey(d);
  });

  const [selectedTime, setSelectedTime] = useState<string>('10:00');

  // Form fields
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const formatDateDisplay = (dateStr: string): { weekday: string; dayNumber: string; monthName: string; full: string } => {
    if (!dateStr) return { weekday: '', dayNumber: '', monthName: '', full: '' };
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return {
        weekday: weekday.toUpperCase(),
        dayNumber: String(day).padStart(2, '0'),
        monthName: monthName.toUpperCase(),
        full: d.toLocaleDateString('pt-BR', { dateStyle: 'full' }),
      };
    } catch {
      return { weekday: '', dayNumber: '', monthName: '', full: dateStr };
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    // Mask (11) 99999-9999
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setClientPhone(val);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedProcedure) {
      setErrorMessage('Por favor, selecione um procedimento.');
      return;
    }
    if (!selectedDate) {
      setErrorMessage('Por favor, selecione um dia no calendário.');
      return;
    }
    if (!selectedTime) {
      setErrorMessage('Por favor, selecione um horário disponível.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMessage('Por favor, preencha seu nome completo.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Por favor, informe um número de telefone/WhatsApp com DDD válido.');
      return;
    }

    setIsSubmitting(true);

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      procedureId: selectedProcedure.id,
      procedureName: selectedProcedure.name,
      date: selectedDate,
      time: selectedTime,
      notes: notes.trim() || undefined,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };

    try {
      const success = await onBookAppointment(newAppointment);
      if (success) {
        setConfirmedBooking(newAppointment);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#d6be96', '#ebd8b7', '#4e6452', '#ffffff'],
          });
        } catch {
          // ignore confetti if unsupported
        }
      } else {
        setErrorMessage('Não foi possível registrar o agendamento. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao salvar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppShareLink = (apt: Appointment) => {
    const cleanPhone = '5511999998888';
    const msg = encodeURIComponent(
      `Olá, Clínica Raya Estética (@rayaestética)! Acabei de agendar meu procedimento pelo site:\n\n` +
        `• Procedimento: *${apt.procedureName}*\n` +
        `• Data: *${apt.date}*\n` +
        `• Horário: *${apt.time}*\n` +
        `• Nome: *${apt.clientName}*\n` +
        `• WhatsApp: *${apt.clientPhone}*` +
        (apt.notes ? `\n• Observações: ${apt.notes}` : '') +
        `\n\nAguardo a confirmação do meu horário!`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  // If booking is confirmed, display luxury success receipt
  if (confirmedBooking) {
    const formatted = formatDateDisplay(confirmedBooking.date);
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-[#18241b] border-2 border-[#d6be96] rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#d6be96]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 bg-[#d6be96] text-[#121a14] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg font-black">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#ffffff] font-bold mb-2">
            Agendamento Confirmado!
          </h2>
          <p className="text-sm sm:text-base text-[#d8e5da] max-w-lg mx-auto mb-8 font-normal">
            Seu horário foi reservado com sucesso no sistema da{' '}
            <strong className="text-[#ebd8b7] font-bold">Raya Estética</strong>.
          </p>

          {/* Booking Voucher / Ticket */}
          <div className="bg-[#111a13] border border-[#344837] rounded-2xl p-6 text-left mb-8 space-y-4 shadow-inner">
            <div className="flex items-center justify-between pb-4 border-b border-[#253628]">
              <span className="text-xs uppercase tracking-wider text-[#a4b5a6] font-bold">Procedimento</span>
              <span className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#ebd8b7]">
                {confirmedBooking.procedureName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#253628]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a4b5a6] font-bold block mb-1">
                  Data
                </span>
                <span className="text-base font-bold text-[#ffffff] flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#d6be96]" />
                  {formatted.dayNumber} {formatted.monthName} ({formatted.weekday})
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a4b5a6] font-bold block mb-1">
                  Horário
                </span>
                <span className="text-base font-bold text-[#ffffff] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#d6be96]" />
                  {confirmedBooking.time}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a4b5a6] font-bold block mb-1">
                  Paciente
                </span>
                <span className="text-sm font-bold text-[#ffffff]">
                  {confirmedBooking.clientName}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a4b5a6] font-bold block mb-1">
                  WhatsApp
                </span>
                <span className="text-sm font-bold text-[#ffffff]">
                  {confirmedBooking.clientPhone}
                </span>
              </div>
            </div>

            {confirmedBooking.notes && (
              <div className="pt-3 border-t border-[#253628]">
                <span className="text-xs uppercase tracking-wider text-[#a4b5a6] font-bold block mb-1">
                  Observações
                </span>
                <span className="text-xs text-[#c8d8cb]">
                  {confirmedBooking.notes}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={getWhatsAppShareLink(confirmedBooking)}
              target="_blank"
              rel="noopener noreferrer"
              id="whatsapp-confirm-booking-btn"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#25d366] hover:bg-[#20b858] text-[#ffffff] font-extrabold shadow-lg transition-all text-sm tracking-wide"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Confirmação no WhatsApp</span>
            </a>

            <button
              onClick={() => {
                setConfirmedBooking(null);
                setClientName('');
                setClientPhone('');
                setNotes('');
              }}
              className="inline-flex items-center justify-center px-6 py-4 rounded-xl bg-[#223325] hover:bg-[#2c4030] text-[#ebd8b7] font-bold border border-[#3e5541] transition-all text-sm"
            >
              Fazer Outro Agendamento
            </button>
          </div>

          <p className="text-xs text-[#9bb09e] mt-6">
            Acompanhe nossas novidades no Instagram{' '}
            <a
              href="https://instagram.com/rayaestetica"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d6be96] underline font-bold hover:text-white"
            >
              {clinicInstagram}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Brand Hero Banner */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="flex justify-center mb-5">
          <Logo variant="mark-only" size="lg" />
        </div>
        <p className="text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-[#d6be96] mb-2">
          Agendamento de Consultas & Procedimentos
        </p>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-bold text-[#ffffff] tracking-tight max-w-3xl mx-auto leading-tight">
          Realce sua beleza com precisão, elegância e naturalidade.
        </h1>
        <p className="text-sm sm:text-base text-[#d8e5da] max-w-xl mx-auto mt-4 font-normal leading-relaxed">
          Selecione o procedimento estético desejado e reserve seu dia e horário disponível no calendário oficial da clínica.
        </p>
      </div>

      {/* Main Booking Stepper Flow */}
      <form onSubmit={handleSubmitBooking} className="space-y-10">
        {/* STEP 1: Select Procedure */}
        <section id="section-procedures" className="bg-[#18241b] border border-[#2b3c2e] rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#253628]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#d6be96] block mb-1">
                Passo 1 de 3
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#ffffff] font-bold">
                Escolha o Procedimento
              </h2>
            </div>
            {selectedProcedure && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#223325] text-[#ebd8b7] border border-[#3b523e]">
                <Sparkles className="w-3.5 h-3.5 text-[#d6be96]" />
                Selecionado: <span className="text-[#ffffff]">{selectedProcedure.name}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {procedures.map((proc) => (
              <ProcedureCard
                key={proc.id}
                procedure={proc}
                isSelected={selectedProcedure?.id === proc.id}
                onSelect={(p) => setSelectedProcedure(p)}
              />
            ))}
          </div>
        </section>

        {/* STEP 2: Real Calendar & Available Time Slots */}
        <section id="section-datetime" className="bg-[#18241b] border border-[#2b3c2e] rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-[#253628]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#d6be96] block mb-1">
              Passo 2 de 3
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#ffffff] font-bold">
              Calendário & Horários Disponíveis
            </h2>
            <p className="text-xs sm:text-sm text-[#c8d8cb] mt-1 font-normal">
              Selecione o dia desejado no calendário real abaixo para visualizar os horários vagos e garantir sua vaga.
            </p>
          </div>

          <BookingCalendar
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            slots={slots}
            onSelectDate={(date) => setSelectedDate(date)}
            onSelectTime={(time) => setSelectedTime(time)}
          />
        </section>

        {/* STEP 3: Client Details & Submission */}
        <section id="section-client-info" className="bg-[#18241b] border border-[#2b3c2e] rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-[#253628]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#d6be96] block mb-1">
              Passo 3 de 3
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#ffffff] font-bold">
              Dados do Paciente
            </h2>
            <p className="text-xs sm:text-sm text-[#c8d8cb] mt-1 font-normal">
              Informe seus dados de contato para confirmação da reserva pela equipe da clínica.
            </p>
          </div>

          {/* Quick confirmation recap chip */}
          <div className="mb-6 p-4 rounded-2xl bg-[#131d15] border border-[#2a3c2d] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#a0b2a3]">Procedimento:</span>
              <span className="font-bold text-[#ebd8b7]">{selectedProcedure?.name || 'Não selecionado'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#a0b2a3]">Data:</span>
              <span className="font-bold text-[#ffffff]">{selectedDate || 'Não selecionada'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#a0b2a3]">Horário:</span>
              <span className="font-bold text-[#d6be96]">{selectedTime || 'Não selecionado'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nome Completo */}
            <div>
              <label
                htmlFor="client-name-input"
                className="block text-xs font-bold uppercase tracking-wider text-[#ebd8b7] mb-1.5"
              >
                Nome Completo <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8a9d8e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="client-name-input"
                  type="text"
                  required
                  placeholder="Ex: Maria Clara Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#131d15] border border-[#344837] text-[#ffffff] font-medium placeholder-[#6a7c6e] focus:outline-none focus:border-[#d6be96] focus:ring-1 focus:ring-[#d6be96] transition-colors text-sm"
                />
              </div>
            </div>

            {/* WhatsApp / Telefone */}
            <div>
              <label
                htmlFor="client-phone-input"
                className="block text-xs font-bold uppercase tracking-wider text-[#ebd8b7] mb-1.5"
              >
                WhatsApp / Telefone com DDD <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8a9d8e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="client-phone-input"
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={clientPhone}
                  onChange={handlePhoneChange}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#131d15] border border-[#344837] text-[#ffffff] font-medium placeholder-[#6a7c6e] focus:outline-none focus:border-[#d6be96] focus:ring-1 focus:ring-[#d6be96] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Observações / Queixas */}
            <div className="sm:col-span-2">
              <label
                htmlFor="client-notes-input"
                className="block text-xs font-bold uppercase tracking-wider text-[#ebd8b7] mb-1.5"
              >
                Observações ou Dúvidas (Opcional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-[#8a9d8e] absolute left-3.5 top-3.5 pointer-events-none" />
                <textarea
                  id="client-notes-input"
                  rows={2}
                  placeholder="Tem alguma dúvida ou já realizou algum procedimento anterior?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#131d15] border border-[#344837] text-[#ffffff] font-medium placeholder-[#6a7c6e] focus:outline-none focus:border-[#d6be96] focus:ring-1 focus:ring-[#d6be96] transition-colors text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action Card */}
          <div className="mt-8 pt-6 border-t border-[#253628] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#a3b3a6] text-center sm:text-left">
              Ao confirmar, seu horário é reservado imediatamente na agenda da{' '}
              <strong className="text-[#ebd8b7] font-bold">Raya Estética</strong>.
            </div>

            <button
              type="submit"
              id="submit-booking-button"
              disabled={isSubmitting || !selectedProcedure || !selectedDate || !selectedTime}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-xl bg-[#d6be96] hover:bg-[#ebd8b7] text-[#121a14] font-extrabold shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#121a14] border-t-transparent rounded-full animate-spin" />
                  <span>Reservando Horário...</span>
                </>
              ) : (
                <>
                  <span>Confirmar Agendamento</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

