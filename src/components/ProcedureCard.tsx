import React from 'react';
import { Procedure } from '../types';
import { Sparkles, Clock, Check } from 'lucide-react';

interface ProcedureCardProps {
  procedure: Procedure;
  isSelected: boolean;
  onSelect: (procedure: Procedure) => void;
}

export const ProcedureCard: React.FC<ProcedureCardProps> = ({
  procedure,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      id={`procedure-card-${procedure.id}`}
      onClick={() => onSelect(procedure)}
      className={`relative cursor-pointer rounded-2xl p-5 sm:p-6 transition-all duration-300 border text-left flex flex-col justify-between ${
        isSelected
          ? 'bg-[#293a2c] border-[#d6be96] shadow-[0_0_24px_rgba(214,190,150,0.18)] translate-y-[-2px]'
          : 'bg-[#212e24] border-[#37493a] hover:border-[#526a56] hover:bg-[#253428]'
      }`}
    >
      {/* Top badges & select indicator */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          {procedure.popular && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#d6be96]/20 text-[#ebd8b7] border border-[#d6be96]/40 mb-1.5">
              <Sparkles className="w-3 h-3 text-[#d6be96]" />
              Procedimento em Alta
            </span>
          )}
          <h3 className="font-serif-luxury text-xl sm:text-2xl font-semibold text-[#f5f1eb] leading-tight">
            {procedure.name}
          </h3>
          {procedure.subtitle && (
            <p className="text-xs font-medium text-[#cbb387] tracking-wider uppercase mt-0.5">
              {procedure.subtitle}
            </p>
          )}
        </div>

        {/* Radio/Check selector */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
            isSelected
              ? 'bg-[#d6be96] border-[#d6be96] text-[#172119]'
              : 'border-[#4e6452] bg-[#1a251c]'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#b8c6bb] line-clamp-3 mb-4 leading-relaxed font-light">
        {procedure.description}
      </p>

      {/* Footer Info: Duration & Price note */}
      <div className="pt-3 border-t border-[#344537] flex items-center justify-between text-xs text-[#a0b0a3]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#cbb387]" />
          <span>Aprox. {procedure.durationMinutes} minutos</span>
        </div>
        {procedure.priceEstimate && (
          <span className="text-[#ebd8b7] font-medium text-[11px]">
            {procedure.priceEstimate}
          </span>
        )}
      </div>
    </div>
  );
};
