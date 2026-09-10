import React, { useState, useMemo } from 'react';
import {
  TimeSlot,
  Appointment,
  Procedure,
  ClinicSettings,
  AppointmentStatus,
} from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Database,
  Sliders,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CalendarCheck,
  Shield,
  Eye,
  Settings,
  Send,
} from 'lucide-react';
import { SUPABASE_SCHEMA_SQL, getSupabaseClient } from '../lib/supabase';
import { generateInitialSlots, formatDateKey } from '../data/defaultData';

interface AdminPanelProps {
  slots: TimeSlot[];
  appointments: Appointment[];
  procedures: Procedure[];
  settings: ClinicSettings;
  onSaveSlots: (slots: TimeSlot[]) => Promise<boolean>;
  onUpdateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentStatus
  ) => Promise<boolean>;
  onSaveProcedures: (procedures: Procedure[]) => Promise<boolean>;
  onSaveSettings: (settings: ClinicSettings) => void;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  slots,
  appointments,
  procedures,
  settings,
  onSaveSlots,
  onUpdateAppointmentStatus,
  onSaveProcedures,
  onSaveSettings,
  onExitAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    'calendar' | 'appointments' | 'procedures' | 'supabase'
  >('calendar');

  // Calendar slot creator state
  const todayStr = useMemo(() => formatDateKey(new Date()), []);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => formatDateKey(new Date()));
  const [newSlotTime, setNewSlotTime] = useState<string>('09:00');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Appointments filter state
  const [appointmentFilter, setAppointmentFilter] = useState<
    'todos' | AppointmentStatus
  >('todos');

  // Procedure editing state
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [isAddingNewProcedure, setIsAddingNewProcedure] = useState(false);

  // Supabase settings state
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [ownerPin, setOwnerPin] = useState(settings.ownerPin || 'raya2026');
  const [copiedSql, setCopiedSql] = useState(false);

  // Test connection status
  const isSupabaseActive = Boolean(getSupabaseClient());

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    slots.forEach((s) => {
      const list = map.get(s.date) || [];
      list.push(s);
      map.set(s.date, list);
    });
    return map;
  }, [slots]);

  // Sorted unique dates for the calendar
  const uniqueDates = useMemo(() => {
    return Array.from(slotsByDate.keys()).sort();
  }, [slotsByDate]);

  // Slots for the current selected date in admin
  const currentAdminSlots = useMemo(() => {
    return (slotsByDate.get(selectedCalendarDate) || []).sort((a, b) =>
      a.time.localeCompare(b.time)
    );
  }, [slotsByDate, selectedCalendarDate]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    if (appointmentFilter === 'todos') return appointments;
    return appointments.filter((a) => a.status === appointmentFilter);
  }, [appointments, appointmentFilter]);

  // Handler: Add a single time slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendarDate || !newSlotTime) return;

    // Check if slot already exists
    const exists = slots.some(
      (s) => s.date === selectedCalendarDate && s.time === newSlotTime
    );
    if (exists) {
      showFeedback(`O horário ${newSlotTime} já existe para ${selectedCalendarDate}.`);
      return;
    }

    const newSlot: TimeSlot = {
      id: `slot_${selectedCalendarDate}_${newSlotTime.replace(':', '')}`,
      date: selectedCalendarDate,
      time: newSlotTime,
      isAvailable: true,
    };

    const updated = [...slots, newSlot];
    await onSaveSlots(updated);
    showFeedback(`Horário ${newSlotTime} adicionado para ${selectedCalendarDate}!`);
  };

  // Handler: Batch generate slots for selected date
  const handleBatchGenerateDay = async (targetDate: string) => {
    const standardTimes = ['09:00', '10:30', '13:30', '15:00', '16:30', '18:00'];
    const newSlots: TimeSlot[] = [];

    standardTimes.forEach((t) => {
      const already = slots.some((s) => s.date === targetDate && s.time === t);
      if (!already) {
        newSlots.push({
          id: `slot_${targetDate}_${t.replace(':', '')}`,
          date: targetDate,
          time: t,
          isAvailable: true,
        });
      }
    });

    if (newSlots.length === 0) {
      showFeedback('Todos os horários padrão já existem para esta data.');
      return;
    }

    const updated = [...slots, ...newSlots];
    await onSaveSlots(updated);
    showFeedback(`${newSlots.length} horários criados para ${targetDate}!`);
  };

  // Handler: Batch generate / refill slots for the next 30 days
  const handleBatchGenerateMonth = async () => {
    const generated = generateInitialSlots();
    const existingBooked = slots.filter((s) => !s.isAvailable || s.bookedByAppointmentId);
    const merged = [
      ...existingBooked,
      ...generated.filter(
        (g) => !existingBooked.some((e) => e.date === g.date && e.time === g.time)
      ),
    ];
    await onSaveSlots(merged);
    showFeedback('Grade oficial de horários para os próximos 30 dias gerada com sucesso!');
  };

  // Handler: Toggle slot availability
  const handleToggleSlotAvailability = async (slotId: string) => {
    const updated = slots.map((s) =>
      s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s
    );
    await onSaveSlots(updated);
  };

  // Handler: Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    const updated = slots.filter((s) => s.id !== slotId);
    await onSaveSlots(updated);
    showFeedback('Horário removido com sucesso.');
  };

  // Handler: Save Procedure
  const handleSaveProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProcedure) return;

    let updated: Procedure[];
    if (isAddingNewProcedure) {
      updated = [...procedures, editingProcedure];
    } else {
      updated = procedures.map((p) =>
        p.id === editingProcedure.id ? editingProcedure : p
      );
    }

    await onSaveProcedures(updated);
    setEditingProcedure(null);
    setIsAddingNewProcedure(false);
    showFeedback('Procedimento salvo com sucesso!');
  };

  // Handler: Save Supabase & Admin Settings
  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ClinicSettings = {
      ...settings,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      ownerPin: ownerPin.trim(),
    };
    onSaveSettings(updated);
    showFeedback('Configurações salvas com sucesso!');
  };

  // Copy SQL script to clipboard
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#304233]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#d6be96]/20 text-[#ebd8b7] border border-[#d6be96]/30">
              Acesso Exclusivo do Proprietário
            </span>
            {isSupabaseActive ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/70 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Persistência Local Ativa
              </span>
            )}
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl text-[#f4efe8] font-normal">
            Painel Administrativo da Raya Estética
          </h1>
          <p className="text-xs sm:text-sm text-[#9fad9f] mt-1">
            Gerencie datas, horários disponíveis para os clientes, agendamentos e catálogo de procedimentos.
          </p>
        </div>

        {/* Action Button to switch back to client booking view */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExitAdmin}
            id="admin-view-booking-page-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#28392b] hover:bg-[#344837] text-[#ebd8b7] text-sm font-medium border border-[#405443] transition-all"
          >
            <Eye className="w-4 h-4 text-[#d6be96]" />
            <span>Ver Agendamento como Cliente</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#27382a] border border-[#d6be96]/50 text-[#ebd8b7] text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#8fe299]" />
            <span>{feedbackMsg}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-[#172119] rounded-2xl border border-[#2b3a2d]">
        <button
          onClick={() => setActiveTab('calendar')}
          id="tab-btn-calendar"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'calendar'
              ? 'bg-[#d6be96] text-[#172119] shadow-md'
              : 'text-[#c6d4c8] hover:text-white hover:bg-[#223024]'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendário & Horários ({slots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          id="tab-btn-appointments"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'appointments'
              ? 'bg-[#d6be96] text-[#172119] shadow-md'
              : 'text-[#c6d4c8] hover:text-white hover:bg-[#223024]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>
            Agendamentos dos Clientes ({appointments.length})
          </span>
          {appointments.filter((a) => a.status === 'pendente').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-bold">
              {appointments.filter((a) => a.status === 'pendente').length} novo(s)
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('procedures')}
          id="tab-btn-procedures"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'procedures'
              ? 'bg-[#d6be96] text-[#172119] shadow-md'
              : 'text-[#c6d4c8] hover:text-white hover:bg-[#223024]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Procedimentos ({procedures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          id="tab-btn-supabase"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'supabase'
              ? 'bg-[#d6be96] text-[#172119] shadow-md'
              : 'text-[#c6d4c8] hover:text-white hover:bg-[#223024]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Banco Supabase & PIN</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CALENDAR & HORÁRIOS DISPONÍVEIS */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-8">
          {/* Calendar Controller & Creator Card */}
          <div className="bg-[#1e2c21] border border-[#324534] rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif-luxury text-2xl text-[#f4efe8] font-medium">
                  Configurar Horários e Dias da Clínica
                </h2>
                <p className="text-xs sm:text-sm text-[#9fad9f] mt-0.5">
                  Estes são os horários que aparecerão para seus clientes escolherem e agendarem no site.
                </p>
              </div>

              {/* Quick Batch actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchGenerateMonth}
                  id="batch-generate-month-btn"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#223325] hover:bg-[#2c4030] text-[#ebd8b7] text-xs font-semibold border border-[#3c533f] transition-all"
                  title="Garante horários disponíveis para os próximos 30 dias no calendário dos clientes"
                >
                  <RefreshCw className="w-4 h-4 text-[#d6be96]" />
                  <span>Renovar Grade dos Próximos 30 Dias</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchGenerateDay(selectedCalendarDate)}
                  id="batch-generate-day-btn"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#283a2c] hover:bg-[#344b39] text-[#ebd8b7] text-xs font-semibold border border-[#405643] transition-all"
                >
                  <Plus className="w-4 h-4 text-[#d6be96]" />
                  <span>Gerar Grade para este Dia</span>
                </button>
              </div>
            </div>

            {/* Selector bar: Select Date + Add Slot Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end bg-[#18231a] p-5 rounded-2xl border border-[#293a2c]">
              {/* Select Date */}
              <div className="lg:col-span-4">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#ebd8b7] mb-1.5">
                  Data de Trabalho:
                </label>
                <input
                  type="date"
                  value={selectedCalendarDate}
                  onChange={(e) => setSelectedCalendarDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#212f23] border border-[#384c3b] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                />
              </div>

              {/* Add Single Time Slot */}
              <form onSubmit={handleAddSlot} className="lg:col-span-8 flex flex-wrap sm:flex-nowrap items-end gap-3">
                <div className="w-full sm:w-48">
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#ebd8b7] mb-1.5">
                    Novo Horário:
                  </label>
                  <input
                    type="time"
                    required
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#212f23] border border-[#384c3b] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                  />
                </div>

                <button
                  type="submit"
                  id="add-custom-slot-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#d6be96] hover:bg-[#e4d2b2] text-[#172119] font-bold text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Horário</span>
                </button>
              </form>
            </div>

            {/* Displaying slots for selected date */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#cbb387] flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horários Cadastrados para {selectedCalendarDate} ({currentAdminSlots.length})
                </h3>
              </div>

              {currentAdminSlots.length === 0 ? (
                <div className="py-8 text-center bg-[#172319]/60 rounded-2xl border border-dashed border-[#344837] p-6">
                  <p className="text-sm text-[#b2c0b5]">
                    Nenhum horário criado para {selectedCalendarDate}.
                  </p>
                  <p className="text-xs text-[#7e8f82] mt-1">
                    Adicione um horário acima ou clique em "Gerar Grade Completa para este Dia".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {currentAdminSlots.map((slot) => {
                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          !slot.isAvailable
                            ? 'bg-[#18221a] border-[#394a3b] opacity-85'
                            : 'bg-[#223124] border-[#3d5140] hover:border-[#57725c]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-base font-bold text-[#f5f1eb]">
                            {slot.time}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            title="Remover horário"
                            className="text-[#849587] hover:text-red-400 p-1 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          {slot.bookedByAppointmentId ? (
                            <span className="block text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-1 rounded text-center border border-amber-800/60">
                              Agendado
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleSlotAvailability(slot.id)}
                              className={`w-full text-[10px] font-semibold px-2 py-1 rounded text-center transition-all ${
                                slot.isAvailable
                                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                              }`}
                            >
                              {slot.isAvailable ? 'Liberado (Vago)' : 'Bloqueado'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Date List Overview */}
          <div className="bg-[#1e2c21] border border-[#324534] rounded-3xl p-6 sm:p-8">
            <h3 className="font-serif-luxury text-xl text-[#f4efe8] font-medium mb-3">
              Visão Geral de Todas as Datas no Calendário
            </h3>
            <p className="text-xs text-[#9fad9f] mb-4">
              Clique em qualquer dia abaixo para visualizar e ajustar os horários correspondentes.
            </p>

            <div className="flex flex-wrap gap-2">
              {uniqueDates.map((dateStr) => {
                const count = (slotsByDate.get(dateStr) || []).length;
                const free = (slotsByDate.get(dateStr) || []).filter((s) => s.isAvailable).length;
                const isCurrent = selectedCalendarDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                      isCurrent
                        ? 'bg-[#d6be96] text-[#172119] border-[#d6be96] font-bold'
                        : 'bg-[#1a251c] text-[#cfdcd1] border-[#37493a] hover:bg-[#253527]'
                    }`}
                  >
                    <span>{dateStr}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isCurrent
                          ? 'bg-[#172119] text-[#d6be96]'
                          : 'bg-[#293a2c] text-[#a5b6a8]'
                      }`}
                    >
                      {free}/{count} vagos
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AGENDAMENTOS DOS CLIENTES */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="bg-[#1e2c21] border border-[#324534] rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif-luxury text-2xl text-[#f4efe8] font-medium">
                Agendamentos Solicitados pelos Clientes
              </h2>
              <p className="text-xs sm:text-sm text-[#9fad9f] mt-0.5">
                Visualize os clientes que garantiram seus horários, contate-os no WhatsApp e atualize o status.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#172119] rounded-xl border border-[#2f3f31]">
              {(['todos', 'pendente', 'confirmado', 'concluido', 'cancelado'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setAppointmentFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      appointmentFilter === st
                        ? 'bg-[#d6be96] text-[#172119] font-bold'
                        : 'text-[#a3b3a5] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-[#172319]/60 rounded-2xl border border-dashed border-[#344837] p-6">
              <CalendarCheck className="w-10 h-10 text-[#cbb387] mx-auto mb-3 opacity-60" />
              <p className="text-base text-[#f5f1eb] font-medium">
                Nenhum agendamento encontrado nesta categoria.
              </p>
              <p className="text-xs text-[#8e9e92] mt-1">
                Quando os clientes agendarem no site, eles aparecerão aqui instantaneamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => {
                const phoneDigits = apt.clientPhone.replace(/\D/g, '');
                const waText = encodeURIComponent(
                  `Olá ${apt.clientName}! Aqui é da Clínica Raya Estética (@rayaestética). Estou entrando em contato sobre seu agendamento de *${apt.procedureName}* para o dia *${apt.date}* às *${apt.time}*.`
                );
                const waUrl = `https://api.whatsapp.com/send?phone=55${phoneDigits}&text=${waText}`;

                return (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl bg-[#172319] border border-[#324534] hover:border-[#4b634e] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Client & Booking details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="font-serif-luxury text-xl font-bold text-[#f5f1eb]">
                          {apt.clientName}
                        </h4>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            apt.status === 'confirmado'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : apt.status === 'pendente'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : apt.status === 'concluido'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                              : 'bg-red-950/80 text-red-300 border-red-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#b8c6bb]">
                        <span className="text-[#ebd8b7] font-semibold">
                          Procedimento: {apt.procedureName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#cbb387]" />
                          {apt.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#cbb387]" />
                          {apt.time}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[#dcd1be]">
                          <Phone className="w-3.5 h-3.5 text-[#cbb387]" />
                          {apt.clientPhone}
                        </span>
                      </div>

                      {apt.notes && (
                        <p className="text-xs text-[#8fa093] italic bg-[#1f2e21] p-2 rounded-lg border border-[#2b3c2e] mt-1 max-w-xl">
                          Observação: "{apt.notes}"
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#2b3b2d]">
                      {/* WhatsApp contact button */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25d366]/20 hover:bg-[#25d366] text-[#25d366] hover:text-white text-xs font-semibold border border-[#25d366]/40 transition-all"
                        title="Abrir conversa no WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Falar no WhatsApp</span>
                      </a>

                      {/* Status changer buttons */}
                      {apt.status !== 'confirmado' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'confirmado')}
                          className="px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 text-xs font-medium border border-emerald-800/80 transition-all"
                        >
                          Confirmar
                        </button>
                      )}
                      {apt.status !== 'concluido' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'concluido')}
                          className="px-3 py-2 rounded-xl bg-[#243427] hover:bg-[#2f4332] text-[#d6be96] text-xs font-medium border border-[#3d5240] transition-all"
                        >
                          Concluir
                        </button>
                      )}
                      {apt.status !== 'cancelado' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'cancelado')}
                          className="px-3 py-2 rounded-xl bg-red-950/50 hover:bg-red-900 text-red-300 text-xs font-medium border border-red-800/60 transition-all"
                          title="Cancelar agendamento e liberar o horário no calendário"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROCEDIMENTOS & SERVIÇOS */}
      {/* ========================================================================= */}
      {activeTab === 'procedures' && (
        <div className="space-y-6">
          <div className="bg-[#1e2c21] border border-[#324534] rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif-luxury text-2xl text-[#f4efe8] font-medium">
                  Catálogo de Procedimentos Estéticos
                </h2>
                <p className="text-xs sm:text-sm text-[#9fad9f] mt-0.5">
                  Edite os procedimentos exigidos (Aplicar preenchimento, Botox, Queixo, Bigode chinês) ou adicione novos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProcedure({
                    id: `proc_${Date.now()}`,
                    name: '',
                    subtitle: '',
                    description: '',
                    durationMinutes: 45,
                    priceEstimate: 'Sob avaliação personalizada',
                  });
                  setIsAddingNewProcedure(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d6be96] hover:bg-[#e4d2b2] text-[#172119] font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Procedimento</span>
              </button>
            </div>

            {/* List of Procedures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {procedures.map((proc) => (
                <div
                  key={proc.id}
                  className="p-5 rounded-2xl bg-[#18231a] border border-[#334735] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-serif-luxury text-xl font-bold text-[#f5f1eb]">
                          {proc.name}
                        </h3>
                        {proc.subtitle && (
                          <span className="text-xs text-[#cbb387] uppercase tracking-wider font-semibold">
                            {proc.subtitle}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingProcedure({ ...proc });
                          setIsAddingNewProcedure(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#273729] hover:bg-[#344837] text-xs text-[#ebd8b7] border border-[#405442]"
                      >
                        Editar
                      </button>
                    </div>

                    <p className="text-xs text-[#b0c0b3] leading-relaxed mb-3">
                      {proc.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#2d3e30] flex items-center justify-between text-xs text-[#8ea092]">
                    <span>Duração: {proc.durationMinutes} min</span>
                    <span className="text-[#ebd8b7]">{proc.priceEstimate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal / Form to edit or add procedure */}
          {editingProcedure && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-3xl bg-[#1e2a20] border border-[#3f5342] p-6 sm:p-8 shadow-2xl">
                <h3 className="font-serif-luxury text-2xl text-[#f4efe8] font-medium mb-4">
                  {isAddingNewProcedure ? 'Novo Procedimento' : 'Editar Procedimento'}
                </h3>

                <form onSubmit={handleSaveProcedure} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1">
                      Nome do Procedimento:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProcedure.name}
                      onChange={(e) =>
                        setEditingProcedure({ ...editingProcedure, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1">
                      Subtítulo (opcional):
                    </label>
                    <input
                      type="text"
                      value={editingProcedure.subtitle || ''}
                      onChange={(e) =>
                        setEditingProcedure({ ...editingProcedure, subtitle: e.target.value })
                      }
                      placeholder="Ex: Toxina Botulínica, Ácido Hialurônico"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1">
                      Descrição:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editingProcedure.description}
                      onChange={(e) =>
                        setEditingProcedure({
                          ...editingProcedure,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1">
                        Duração (minutos):
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="240"
                        value={editingProcedure.durationMinutes}
                        onChange={(e) =>
                          setEditingProcedure({
                            ...editingProcedure,
                            durationMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1">
                        Estimativa de Valor:
                      </label>
                      <input
                        type="text"
                        value={editingProcedure.priceEstimate || ''}
                        onChange={(e) =>
                          setEditingProcedure({
                            ...editingProcedure,
                            priceEstimate: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingProcedure(null)}
                      className="px-4 py-2.5 rounded-xl bg-[#28372b] text-[#c6d4c8] hover:text-white text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#d6be96] hover:bg-[#e4d2b2] text-[#172119] font-bold text-xs uppercase tracking-wider"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BANCO SUPABASE & CONFIGURAÇÕES */}
      {/* ========================================================================= */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-[#1e2c21] border border-[#324534] rounded-3xl p-6 sm:p-8">
            <h2 className="font-serif-luxury text-2xl text-[#f4efe8] font-medium mb-1">
              Conexão com Banco de Dados Supabase
            </h2>
            <p className="text-xs sm:text-sm text-[#9fad9f] mb-6">
              O aplicativo já está preparado para salvar diretamente no seu projeto Supabase em tempo real.
            </p>

            {/* Connection status card */}
            <div className="mb-6 p-4 rounded-2xl bg-[#17231a] border border-[#2f4031] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSupabaseActive
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'
                      : 'bg-amber-900/40 text-amber-300 border border-amber-600'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#f5f1eb]">
                    {isSupabaseActive
                      ? 'Conectado ao Supabase com Sucesso'
                      : 'Armazenamento Local Ativo (Supabase Opcional)'}
                  </h4>
                  <p className="text-xs text-[#9fad9f]">
                    {isSupabaseActive
                      ? 'Os agendamentos e horários são sincronizados com a nuvem do Supabase.'
                      : 'Todos os agendamentos e horários são salvos de forma segura no navegador. Insira suas chaves abaixo para sincronizar na nuvem.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSaveSettingsSubmit} className="space-y-4 max-w-2xl mb-8">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1.5">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1.5">
                  Supabase Anon Key:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#ebd8b7] mb-1.5">
                  Senha de Acesso do Dono (PIN):
                </label>
                <input
                  type="text"
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  className="w-full sm:w-60 px-4 py-2.5 rounded-xl bg-[#162017] border border-[#364938] text-[#f4efe8] text-sm focus:outline-none focus:border-[#d6be96]"
                />
              </div>

              <button
                type="submit"
                id="save-supabase-settings-btn"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d6be96] hover:bg-[#e4d2b2] text-[#172119] font-bold text-xs uppercase tracking-wider transition-all"
              >
                <span>Salvar Credenciais</span>
              </button>
            </form>

            {/* SQL Schema helper snippet */}
            <div className="border-t border-[#304232] pt-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#ebd8b7]">
                    Script SQL com Tabelas, RLS & Políticas de Armazenamento (Storage)
                  </h3>
                  <p className="text-xs text-[#9fad9f] mt-0.5">
                    Inclui criação de tabelas, índices de busca, Row Level Security (RLS), bucket de arquivos <code className="text-[#d6be96]">raya-media</code> com políticas de armazenamento e dados iniciais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#293c2d] hover:bg-[#364e3b] text-xs text-[#ebd8b7] border border-[#405643] transition-all shrink-0"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL Completo</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#9fad9f] mb-3">
                Abra seu painel no <strong>Supabase</strong> (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#d6be96] underline hover:text-[#ebd8b7]">supabase.com</a>), entre em <strong>SQL Editor</strong>, cole o código abaixo e clique em <strong>Run</strong>:
              </p>
              <pre className="p-4 rounded-xl bg-[#131b14] border border-[#263528] text-xs font-mono text-[#a3d4af] overflow-x-auto max-h-96 whitespace-pre">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
