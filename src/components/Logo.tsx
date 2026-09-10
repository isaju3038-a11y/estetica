import React from 'react';

interface LogoProps {
  variant?: 'full-card' | 'horizontal' | 'mark-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  onClick,
}) => {
  // Delicate vector botanical monogram icon faithful to the uploaded branding
  const MonogramEmblem = ({ emblemSize = 48 }: { emblemSize?: number }) => (
    <svg
      width={emblemSize}
      height={emblemSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      {/* Botanical Lotus Floral Crown */}
      <g stroke="#E7DFD4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Center petal */}
        <path d="M50 14 C48 20 48 24 50 28 C52 24 52 20 50 14 Z" fill="#E7DFD4" fillOpacity="0.25" />
        {/* Left petals */}
        <path d="M47 21 C41 18 36 21 38 27 C42 27 46 25 47 21 Z" fill="#E7DFD4" fillOpacity="0.2" />
        <path d="M48 26 C43 27 41 31 44 34 C47 33 48 30 48 26 Z" fill="#E7DFD4" fillOpacity="0.15" />
        {/* Right petals */}
        <path d="M53 21 C59 18 64 21 62 27 C58 27 54 25 53 21 Z" fill="#E7DFD4" fillOpacity="0.2" />
        <path d="M52 26 C57 27 59 31 56 34 C53 33 52 30 52 26 Z" fill="#E7DFD4" fillOpacity="0.15" />
        {/* Base stem flourish */}
        <circle cx="50" cy="30" r="1.2" fill="#E7DFD4" />
      </g>

      {/* Monogram intertwined letterforms R & M with calligraphy curves */}
      <g stroke="#E7DFD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Main curved flourish sweeping from bottom left */}
        <path
          d="M26 38 C32 38 38 48 48 64 C56 76 60 78 72 78"
          strokeWidth="1.8"
          fill="none"
        />
        {/* 'R' Stem & Serif */}
        <path d="M37 36 L37 72" strokeWidth="2.4" />
        <path d="M33 36 L44 36" strokeWidth="1.8" />
        <path d="M33 72 L42 72" strokeWidth="1.8" />
        {/* 'R' Loop */}
        <path
          d="M37 36 C48 36 55 42 55 51 C55 60 46 62 37 62"
          strokeWidth="2.2"
          fill="none"
        />
        {/* 'R' Leg curving outward */}
        <path d="M46 60 C50 64 56 70 63 76" strokeWidth="2.2" />

        {/* 'M' secondary intertwining calligraphy loop */}
        <ellipse cx="61" cy="51" rx="14" ry="15" strokeWidth="1.8" fill="none" />
        <path d="M60 41 L60 76" strokeWidth="2" />
      </g>
    </svg>
  );

  if (variant === 'mark-only') {
    const s = size === 'sm' ? 32 : size === 'lg' ? 64 : size === 'xl' ? 96 : 44;
    return (
      <div className={`inline-flex items-center justify-center ${className}`} onClick={onClick}>
        <MonogramEmblem emblemSize={s} />
      </div>
    );
  }

  if (variant === 'full-card') {
    return (
      <div
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl bg-[#28362c] border border-[#445649]/60 shadow-2xl text-center group ${className}`}
      >
        <div className="mb-4">
          <MonogramEmblem emblemSize={84} />
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[0.18em] text-[#E7DFD4] uppercase">
          RAYA MONTEIRO
        </h1>
        <div className="flex items-center gap-3 w-full max-w-[280px] my-3">
          <div className="h-[1px] flex-1 bg-[#E7DFD4]/30"></div>
          <div className="w-1.5 h-1.5 rotate-45 bg-[#cbb387]/70"></div>
          <div className="h-[1px] flex-1 bg-[#E7DFD4]/30"></div>
        </div>
        <p className="text-[11px] sm:text-xs font-medium tracking-[0.38em] text-[#E7DFD4]/90 uppercase">
          CLÍNICA DE ESTÉTICA
        </p>
      </div>
    );
  }

  // Default: Horizontal Header Logo
  const emblemDim = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 cursor-pointer select-none group ${className}`}
    >
      <div className="p-1 rounded-lg bg-[#28362c] border border-[#3e4f42] flex items-center justify-center shadow-inner">
        <MonogramEmblem emblemSize={emblemDim} />
      </div>
      <div className="flex flex-col">
        <span className="font-serif-luxury text-xl sm:text-2xl tracking-[0.16em] text-[#E7DFD4] font-medium leading-none">
          RAYA MONTEIRO
        </span>
        <span className="text-[9px] sm:text-[10px] font-medium tracking-[0.32em] text-[#cbb387] uppercase mt-1 leading-none">
          CLÍNICA DE ESTÉTICA
        </span>
      </div>
    </div>
  );
};
