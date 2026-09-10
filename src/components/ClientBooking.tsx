import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Procedure, TimeSlot, Appointment } from '../types';
import { ProcedureCard } from './ProcedureCard';
import { Logo } from './Logo';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle2,
  CalendarCheck,
  Send,
  Sparkles,
  ArrowRight,
  Info,
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
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(procedures[0] || null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Form fields
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Extract unique available dates from slots
  const availableDates = useMemo(() => {
    const datesMap = new Map<string, number>();
    const todayStr = new Date().toISOString().split('T')[0];

    slots.forEach((s) => {
      // only future or today and available
      if (s.isAvailable && s.date >= todayStr) {
        datesMap.set(s.date, (datesMap.get(s.date) || 0) + 1);
      }
    });

    return Array.from(datesMap.keys()).sort();
  }, [slots]);

  // Set default selected date once available dates are computed
  React.useEffect(() => {
    if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Slots for the currently chosen date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return slots
      .filter((s) => s.date === selectedDate && s.isAvailable)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [slots, selectedDate]);

  // Reset selected time if date changes
  React.useEffect(() => {
    if (slotsForSelectedDate.length > 0) {
      // Pick first slot by default if none selected or invalid
      if (!selectedTime || !slotsForSelectedDate.some((s) => s.time === selectedTime)) {
        setSelectedTime(slotsForSelectedDate[0].time);
      }
    } else {
      setSelectedTime('');
    }
  }, [slotsForSelectedDate, selectedTime]);

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
    if (!selectedDate || !selectedTime) {
      setErrorMessage('Por favor, selecione a data e o horário desejado.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMessage('Por favor, preencha seu nome completo.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Por favor, informe um número de telefone/WhatsApp válido.');
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
            colors: ['#cbb387', '#dfc8a2', '#4e6452', '#ffffff'],
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
    const cleanPhone = '5511999998888'; // Pode ser atualizado pelo proprietário
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
        <div className="bg-[#243328] border border-[#d6be96]/60 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#d6be96]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 bg-[#d6be96]/20 border border-[#d6be96] text-[#d6be96] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#f5f1eb] font-medium mb-2">
            Agendamento Solicitado com Sucesso!
          </h2>
          <p className="text-sm sm:text-base text-[#c8d4cb] max-w-lg mx-auto mb-8">
            Seu horário foi reservado exclusivamente no sistema da{' '}
            <strong className="text-[#ebd8b7] font-semibold">Raya Estética</strong>.
          </p>

          {/* Booking Voucher / Ticket */}
          <div className="bg-[#1b251d] border border-[#3b4c3e] rounded-2xl p-6 text-left mb-8 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#2e3e31]">
              <span className="text-xs uppercase tracking-wider text-[#a0b0a3]">Procedimento</span>
              <span className="font-serif-luxury text-xl font-semibold text-[#ebd8b7]">
                {confirmedBooking.procedureName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#2e3e31]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a0b0a3] block mb-1">
                  Data
                </span>
                <span className="text-base font-medium text-[#f5f1eb] flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#cbb387]" />
                  {formatted.dayNumber} {formatted.monthName} ({formatted.weekday})
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a0b0a3] block mb-1">
                  Horário
                </span>
                <span className="text-base font-medium text-[#f5f1eb] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#cbb387]" />
                  {confirmedBooking.time}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a0b0a3] block mb-1">
                  Cliente
                </span>
                <span className="text-sm font-medium text-[#f5f1eb]">
                  {confirmedBooking.clientName}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#a0b0a3] block mb-1">
                  WhatsApp
                </span>
                <span className="text-sm font-medium text-[#f5f1eb]">
                  {confirmedBooking.clientPhone}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={getWhatsAppShareLink(confirmedBooking)}
              target="_blank"
              rel="noopener noreferrer"
              id="whatsapp-confirm-booking-btn"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#25d366] hover:bg-[#20b858] text-white font-medium shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Enviar via WhatsApp</span>
            </a>

            <button
              onClick={() => {
                setConfirmedBooking(null);
                setClientName('');
                setClientPhone('');
                setNotes('');
              }}
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#2a3a2d] hover:bg-[#324536] text-[#ebd8b7] font-medium border border-[#435747] transition-all"
            >
              Fazer Novo Agendamento
            </button>
          </div>

          <p className="text-xs text-[#8e9e92] mt-6">
            Acompanhe nossos resultados no Instagram{' '}
            <a
              href="https://instagram.com/rayaestetica"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#cbb387] underline hover:text-white"
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
        <p className="text-xs sm:text-sm font-medium tracking-[0.3em] uppercase text-[#cbb387] mb-2">
          Agendamento de Consultas & Procedimentos
        </p>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-normal text-[#f4eee6] tracking-[0.06em] max-w-3xl mx-auto leading-tight">
          Realce sua beleza com precisão, elegância e naturalidade.
        </h1>
        <p className="text-sm sm:text-base text-[#b8c6bb] max-w-xl mx-auto mt-4 font-light leading-relaxed">
          Selecione o procedimento estético desejado e reserve seu dia e horário disponível no calendário oficial da clínica.
        </p>
      </div>

      {/* Main Booking Stepper Flow */}
      <form onSubmit={handleSubmitBooking} className="space-y-12">
        {/* STEP 1: Select Procedure */}
        <section id="section-procedures" className="bg-[#1a251c]/80 border border-[#2b3a2d] rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#cbb387] block mb-1">
                Passo 1 de 3
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#f5f1eb] font-medium">
                Escolha o Procedimento
              </h2>
            </div>
            {selectedProcedure && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-[#2a3b2d] text-[#ebd8b7] border border-[#405444]">
                <Sparkles className="w-3.5 h-3.5 text-[#d6be96]" />
                Selecionado: {selectedProcedure.name}
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

        {/* STEP 2: Select Date & Available Time Slot */}
        <section id="section-datetime" className="bg-[#1a251c]/80 border border-[#2b3a2d] rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#cbb387] block mb-1">
              Passo 2 de 3
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#f5f1eb] font-medium">
              Data e Horário Disponíveis
            </h2>
            <p className="text-xs sm:text-sm text-[#9fad9f] mt-1">
              Horários disponibilizados e atualizados diretamente pelo proprietário da clínica.
            </p>
          </div>

          {availableDates.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#233125] border border-[#3b4c3e] text-center text-[#b8c6bb]">
              <CalendarIcon className="w-8 h-8 text-[#cbb387] mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium text-[#f5f1eb]">
                Nenhum horário aberto no momento.
              </p>
              <p className="text-xs text-[#a0b0a3] mt-1">
                O proprietário da clínica está atualizando a grade de horários. Você também pode nos contatar pelo Instagram{' '}
                <a
                  href="https://instagram.com/rayaestetica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#cbb387] underline font-medium"
                >
                  {clinicInstagram}
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Date Selector Pills */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#cbb387] mb-3">
                  1. Selecione o dia:
                </label>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {availableDates.map((dateStr) => {
                    const info = formatDateDisplay(dateStr);
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        id={`date-pill-${dateStr}`}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`shrink-0 flex flex-col items-center justify-center min-w-[76px] px-3 py-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-[#d6be96] text-[#172119] border-[#d6be96] shadow-md font-semibold'
                            : 'bg-[#212e23] text-[#cfdcd1] border-[#37493a] hover:bg-[#28372b] hover:border-[#4d6351]'
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                          {info.weekday}
                        </span>
                        <span className="text-xl font-serif-luxury font-bold my-0.5">
                          {info.dayNumber}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider opacity-80">
                          {info.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid for the selected date */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#cbb387] mb-3">
                  2. Escolha o horário vago ({slotsForSelectedDate.length} disponíveis neste dia):
                </label>

                {slotsForSelectedDate.length === 0 ? (
                  <p className="text-xs text-[#a0b0a3] italic">
                    Não há horários restantes para a data selecionada. Escolha outro dia acima.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {slotsForSelectedDate.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          id={`time-slot-${slot.time.replace(':', '')}`}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-3 px-2 rounded-xl text-center border font-medium text-sm transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#d6be96] text-[#172119] border-[#d6be96] shadow-md font-bold ring-2 ring-[#d6be96]/40'
                              : 'bg-[#223024] text-[#e3ece4] border-[#364939] hover:bg-[#2b3d2e] hover:border-[#506754]'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[#172119]' : 'text-[#cbb387]'}`} />
                          <span>{slot.time}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* STEP 3: Client Details */}
        <section id="section-client-info" className="bg-[#1a251c]/80 border border-[#2b3a2d] rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#cbb387] block mb-1">
              Passo 3 de 3
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#f5f1eb] font-medium">
              Dados do Paciente
            </h2>
            <p className="text-xs sm:text-sm text-[#9fad9f] mt-1">
              Informe seus dados de contato para confirmação da reserva pela equipe da clínica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nome Completo */}
            <div>
              <label
                htmlFor="client-name-input"
                className="block text-xs font-medium uppercase tracking-wider text-[#ebd8b7] mb-1.5"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#212f24] border border-[#384c3b] text-[#f5f1eb] placeholder-[#6d7f71] focus:outline-none focus:border-[#d6be96] focus:ring-1 focus:ring-[#d6be96] transition-colors text-sm"
                />
              </div>
            </div>

            {/* WhatsApp / Telefone */}
            <div>
              <label
                htmlFor="client-phone-input"
                className="block text-xs font-medium uppercase tracking-wider text-[#ebd8b7] mb-1.5"
              >
                WhatsApp / Telefone <span className="text-red-400">*</span>
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#212f24] border border-[#384c3b] text-[#f5f1eb] placeholder-[#6d7f71] focus:outline-none focus:border-[#d6be96] focus:ring-1 focus:ring-[#d6be96] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Observações / Queixas / Informações adicionais */}
            <div className="sm:col-span-2">
              <label
                htmlFor="client-notes-input"
                className="block text-xs font-medium uppercase tracking-wider text-[#ebd8b7] mb-1.5"
              >
                Observações ou Dúvidas (Opcional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-[#8a9d8e] absolute left-3.5 top-3.5 pointer-events-none" />
                <textarea
                  id="client-notes-input"
                  rows={2}
                  placeholder="Tem alguma dúvida ou já fez algum procedimento anterior?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#212f24] border border-[#384c3b] text-[#f5f1eb] placeholder-[#6d7f71] focus:outline-none focus:border-[#d6be96] focus:ring-1 focus:ring-[#d6be96] transition-colors text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action Card */}
          <div className="mt-8 pt-6 border-t border-[#2e3e31] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#a3b3a6] text-center sm:text-left">
              Ao agendar, seu horário é reservado diretamente na agenda da{' '}
              <strong className="text-[#ebd8b7]">Raya Estética</strong>.
            </div>

            <button
              type="submit"
              id="submit-booking-button"
              disabled={isSubmitting || !selectedProcedure || !selectedDate || !selectedTime}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#d6be96] hover:bg-[#e4d2b2] text-[#172119] font-bold shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#172119] border-t-transparent rounded-full animate-spin" />
                  <span>Reservando...</span>
                </>
              ) : (
                <>
                  <span>Garantir Meu Horário</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};
