import React from 'react';
import { Instagram, MapPin, Phone, Lock, Heart, Shield } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onOpenAdmin: () => void;
  instagram: string;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, instagram }) => {
  return (
    <footer className="bg-[#141b15] border-t border-[#253227] text-[#a0b0a3] pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-[#253227]">
          {/* Brand Info */}
          <div className="space-y-4 text-center md:text-left">
            <Logo variant="horizontal" size="md" />
            <p className="text-xs text-[#8e9e92] leading-relaxed max-w-sm">
              Especializada em procedimentos de alta performance com resultados naturais, seguros e sofisticados.
            </p>
          </div>

          {/* Social & Contact */}
          <div className="space-y-3 text-center md:text-left">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#d6be96]">
              Atendimento & Redes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://instagram.com/rayaestetica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#ebd8b7] hover:text-white transition-colors"
                >
                  <Instagram className="w-4 h-4 text-[#d6be96]" />
                  <span>{instagram}</span>
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2 text-[#8e9e92]">
                <MapPin className="w-4 h-4 text-[#d6be96]" />
                <span>Atendimento exclusivo com horário marcado</span>
              </li>
            </ul>
          </div>

          {/* Procedures quick list */}
          <div className="space-y-3 text-center md:text-left">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#d6be96]">
              Procedimentos em Destaque
            </h4>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#1e2a20] border border-[#304233] text-[11px] text-[#cfdad1]">
                Aplicar preenchimento
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#1e2a20] border border-[#304233] text-[11px] text-[#cfdad1]">
                Botox
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#1e2a20] border border-[#304233] text-[11px] text-[#cfdad1]">
                Queixo
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#1e2a20] border border-[#304233] text-[11px] text-[#cfdad1]">
                Bigode chinês
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright & Discreet owner access */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#708073]">
          <p>© {new Date().getFullYear()} Raya Estética. Todos os direitos reservados.</p>

          {/* Discreet Owner Access Link in Footer */}
          <button
            onClick={onOpenAdmin}
            id="footer-secret-admin-btn"
            className="group inline-flex items-center gap-1.5 text-[#59695c] hover:text-[#ebd8b7] text-[11px] transition-colors py-1 px-2 rounded hover:bg-[#1a241c]"
            title="Acesso reservado ao proprietário"
          >
            <Lock className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            <span>Área da Administração</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
