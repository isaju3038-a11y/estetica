import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Check,
  Sun,
  Sunset,
  Sparkles,
  Info,
} from 'lucide-react';
import { TimeSlot } from '../types';
import { STANDARD_CLINIC_HOURS, formatDateKey } from '../data/defaultData';

interface BookingCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  slots: TimeSlot[];
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS = [
  { short: 'Dom', full: 'Domingo' },
  { short: 'Seg', full: 'Segunda-feira' },
  { short: 'Ter', full: 'Terça-feira' },
  { short: 'Qua', full: 'Quarta-feira' },
  { short: 'Qui', full: 'Quinta-feira' },
  { short: 'Sex', full: 'Sexta-feira' },
  { short: 'Sáb', full: 'Sábado' },
];

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedDate,
  selectedTime,
  slots,
  onSelectDate,
  onSelectTime,
}) => {
  // Reference today
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  // Current calendar month view state
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Can we navigate back? (Prevent viewing past months)
  const isCurrentMonthOrPast =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  const handlePrevMonth = () => {
    if (isCurrentMonthOrPast) return;
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(todayKey);
  };

  // Compute month matrix
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon, etc.
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      isSunday: boolean;
    }> = [];

    // Empty cells for padding before 1st of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        dateKey: `pad-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isSunday: i === 0,
      });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const key = formatDateKey(d);
      const isPast = key < todayKey;
      const isToday = key === todayKey;
      const isSunday = d.getDay() === 0;

      days.push({
        dateKey: key,
        dayNumber: day,
        isCurrentMonth: true,
        isPast,
        isToday,
        isSunday,
      });
    }

    return days;
  }, [viewYear, viewMonth, todayKey]);

  // Compute available and booked times for the currently selected date
  const { availableTimes, bookedTimes } = useMemo(() => {
    if (!selectedDate) {
      return { availableTimes: [], bookedTimes: new Set<string>() };
    }

    // Find all slots registered for this date
    const dateSlots = slots.filter((s) => s.date === selectedDate);
    const booked = new Set<string>();

    dateSlots.forEach((s) => {
      if (!s.isAvailable || s.bookedByAppointmentId) {
        booked.add(s.time);
      }
    });

    // If admin added custom slots for this date, combine them with standard hours
    const allKnownTimes = new Set<string>(STANDARD_CLINIC_HOURS);
    dateSlots.forEach((s) => allKnownTimes.add(s.time));

    const sortedTimes = Array.from(allKnownTimes).sort();

    // If selected date is today, disable times that already passed
    const isToday = selectedDate === todayKey;
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    const filtered = sortedTimes.filter((t) => {
      if (!isToday) return true;
      const [h, m] = t.split(':').map(Number);
      if (h < currentHour || (h === currentHour && m <= currentMinute + 15)) {
        booked.add(t); // mark as passed
      }
      return true;
    });

    return {
      availableTimes: filtered,
      bookedTimes: booked,
    };
  }, [selectedDate, slots, todayKey, today]);

  // Split into Morning and Afternoon slots
  const morningTimes = availableTimes.filter((t) => {
    const hour = parseInt(t.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonTimes = availableTimes.filter((t) => {
    const hour = parseInt(t.split(':')[0], 10);
    return hour >= 12;
  });

  // Display label for selected date
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const dayStr = String(d).padStart(2, '0');
      const monthStr = MONTH_NAMES[m - 1];
      return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayStr} de ${monthStr} de ${y}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. CALENDÁRIO MENSAL REAL */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#141e16] border border-[#2b3c2e] rounded-3xl p-5 sm:p-7 shadow-xl">
        {/* Calendar Header with Navigation */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#253628]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#223325] border border-[#344b38] flex items-center justify-center text-[#d6be96]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#d6be96] block">
                Escolha o Dia do Atendimento
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#ffffff] font-serif-luxury tracking-tight">
                {MONTH_NAMES[viewMonth]} <span className="text-[#d6be96]">{viewYear}</span>
              </h3>
            </div>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-2">
            {!isCurrentMonthOrPast && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#223325] hover:bg-[#2c4030] text-[#e8ded1] border border-[#384e3c] transition-all"
              >
                Voltar a Hoje
              </button>
            )}

            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isCurrentMonthOrPast}
              className={`p-2.5 rounded-xl border transition-all ${
                isCurrentMonthOrPast
                  ? 'opacity-30 cursor-not-allowed bg-[#172219] border-[#253628] text-zinc-500'
                  : 'bg-[#223325] hover:bg-[#2c4030] text-[#f5f1eb] border-[#384e3c]'
              }`}
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl bg-[#223325] hover:bg-[#2c4030] text-[#f5f1eb] border border-[#384e3c] transition-all"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of the week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {WEEKDAYS.map((wd, index) => (
            <div
              key={wd.short}
              className={`py-2 text-xs sm:text-sm font-bold uppercase tracking-wider ${
                index === 0 ? 'text-amber-300/60' : 'text-[#d6be96]'
              }`}
            >
              {wd.short}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((item) => {
            if (!item.isCurrentMonth) {
              return (
                <div
                  key={item.dateKey}
                  className="h-12 sm:h-14 rounded-2xl bg-transparent"
                />
              );
            }

            const isSelected = selectedDate === item.dateKey;
            const isClickable = !item.isPast && !item.isSunday;

            return (
              <button
                key={item.dateKey}
                type="button"
                id={`calendar-day-${item.dateKey}`}
                disabled={!isClickable}
                onClick={() => {
                  onSelectDate(item.dateKey);
                  // Default to first open time slot if currently selected time is not available
                  if (!selectedTime) {
                    onSelectTime('10:00');
                  }
                }}
                className={`group relative h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#d6be96] text-[#121a14] font-extrabold shadow-lg ring-2 ring-[#ebd8b7] scale-[1.03] z-10'
                    : isClickable
                    ? 'bg-[#1e2c21] hover:bg-[#273a2b] text-[#ffffff] font-bold border border-[#324534] hover:border-[#d6be96]'
                    : item.isSunday
                    ? 'bg-[#151f17]/40 text-[#556958] border border-transparent cursor-not-allowed opacity-60'
                    : 'bg-[#162018]/50 text-[#556859] border border-transparent cursor-not-allowed opacity-40'
                }`}
              >
                {/* Day number */}
                <span className="text-sm sm:text-base tracking-tight">
                  {item.dayNumber}
                </span>

                {/* Subtitle tag / badge */}
                {isSelected ? (
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#121a14]">
                    Selecionado
                  </span>
                ) : item.isToday ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#d6be96]">
                    Hoje
                  </span>
                ) : item.isSunday ? (
                  <span className="text-[8px] uppercase tracking-wider text-[#738575]">
                    Fechado
                  </span>
                ) : isClickable ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5 group-hover:scale-125 transition-transform" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-[#253628] flex flex-wrap items-center justify-between gap-3 text-xs text-[#a0b2a3]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-medium text-[#c8d8cb]">Dias com Horários Livres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d6be96]" />
              <span className="font-medium text-[#c8d8cb]">Dia Selecionado</span>
            </div>
          </div>
          <span className="text-[11px] text-[#869989]">
            Atendimento de Segunda a Sábado
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. HORÁRIOS DISPONÍVEIS NO DIA SELECIONADO */}
      {/* ------------------------------------------------------------- */}
      {selectedDate ? (
        <div className="bg-[#141e16] border border-[#2b3c2e] rounded-3xl p-5 sm:p-7 shadow-xl">
          {/* Selected Date Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#253628]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#d6be96] block">
                Passo 2.2: Escolha o Horário
              </span>
              <h4 className="text-lg sm:text-xl font-bold text-[#ffffff] flex items-center gap-2 mt-0.5">
                <Clock className="w-5 h-5 text-[#d6be96]" />
                <span>Horários para:</span>
                <span className="text-[#ebd8b7] font-semibold">{selectedDateFormatted}</span>
              </h4>
            </div>

            {selectedTime && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#223325] border border-[#3b523e] text-xs font-bold text-[#ffffff]">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Horário Selecionado:</span>
                <span className="text-[#d6be96] text-sm">{selectedTime}</span>
              </div>
            )}
          </div>

          {/* Shift 1: MANHÃ */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[#d6be96]">
              <Sun className="w-4 h-4 text-amber-300" />
              <span>Turno da Manhã</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {morningTimes.map((time) => {
                const isBooked = bookedTimes.has(time);
                const isSelected = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    id={`time-slot-${time.replace(':', '')}`}
                    disabled={isBooked}
                    onClick={() => onSelectTime(time)}
                    className={`py-3 px-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                      isSelected
                        ? 'bg-[#d6be96] text-[#121a14] border-[#d6be96] shadow-lg ring-2 ring-[#ebd8b7] font-extrabold scale-[1.02]'
                        : isBooked
                        ? 'bg-[#151e17] text-[#556958] border-[#223023] cursor-not-allowed opacity-50'
                        : 'bg-[#1e2c21] hover:bg-[#283b2c] text-[#ffffff] border-[#324534] hover:border-[#d6be96] shadow-sm'
                    }`}
                  >
                    <Clock
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#121a14]' : isBooked ? 'text-[#556958]' : 'text-[#d6be96]'
                      }`}
                    />
                    <span>{time}</span>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    {isBooked && (
                      <span className="text-[10px] font-normal text-red-400 ml-0.5">
                        (Ocupado)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift 2: TARDE */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[#d6be96]">
              <Sunset className="w-4 h-4 text-amber-400" />
              <span>Turno da Tarde & Noite</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {afternoonTimes.map((time) => {
                const isBooked = bookedTimes.has(time);
                const isSelected = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    id={`time-slot-${time.replace(':', '')}`}
                    disabled={isBooked}
                    onClick={() => onSelectTime(time)}
                    className={`py-3 px-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                      isSelected
                        ? 'bg-[#d6be96] text-[#121a14] border-[#d6be96] shadow-lg ring-2 ring-[#ebd8b7] font-extrabold scale-[1.02]'
                        : isBooked
                        ? 'bg-[#151e17] text-[#556958] border-[#223023] cursor-not-allowed opacity-50'
                        : 'bg-[#1e2c21] hover:bg-[#283b2c] text-[#ffffff] border-[#324534] hover:border-[#d6be96] shadow-sm'
                    }`}
                  >
                    <Clock
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#121a14]' : isBooked ? 'text-[#556958]' : 'text-[#d6be96]'
                      }`}
                    />
                    <span>{time}</span>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    {isBooked && (
                      <span className="text-[10px] font-normal text-red-400 ml-0.5">
                        (Ocupado)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
