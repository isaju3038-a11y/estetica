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
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#d6be96]/20 text-[#ebd8b7] border border-[#d6be96]/50 mb-2">
              <Sparkles className="w-3 h-3 text-[#d6be96]" />
              Procedimento em Alta
            </span>
          )}
          <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#ffffff] leading-tight tracking-tight">
            {procedure.name}
          </h3>
          {procedure.subtitle && (
            <p className="text-xs font-semibold text-[#d6be96] tracking-wider uppercase mt-1">
              {procedure.subtitle}
            </p>
          )}
        </div>

        {/* Radio/Check selector */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
            isSelected
              ? 'bg-[#d6be96] border-[#d6be96] text-[#121a14] shadow-md'
              : 'border-[#4e6452] bg-[#1a251c]'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#dce7de] mb-4 leading-relaxed font-normal">
        {procedure.description}
      </p>

      {/* Footer Info: Duration & Price note */}
      <div className="pt-3 border-t border-[#344537] flex items-center justify-between text-xs text-[#b5c7b8]">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="w-4 h-4 text-[#d6be96]" />
          <span>Aprox. {procedure.durationMinutes} minutos</span>
        </div>
        {procedure.priceEstimate && (
          <span className="text-[#ebd8b7] font-bold text-xs">
            {procedure.priceEstimate}
          </span>
        )}
      </div>
    </div>
  );
};
