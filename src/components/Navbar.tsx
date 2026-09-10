import React from 'react';
import { Instagram, Lock, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  onOpenAdmin: () => void;
  isOwnerLoggedIn: boolean;
  onLogoutOwner?: () => void;
  activeView: 'booking' | 'admin';
  setActiveView: (view: 'booking' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdmin,
  isOwnerLoggedIn,
  onLogoutOwner,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#18231a]/90 backdrop-blur-md border-b border-[#2e3e31]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo
          variant="horizontal"
          size="md"
          onClick={() => setActiveView('booking')}
        />

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Instagram @rayaestética button */}
          <a
            href="https://instagram.com/rayaestetica"
            target="_blank"
            rel="noopener noreferrer"
            id="nav-instagram-link"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#ebd8b7] hover:text-white bg-[#263529] hover:bg-[#2f4233] border border-[#3e5241] rounded-full transition-all duration-200"
            title="Siga @rayaestética no Instagram"
          >
            <Instagram className="w-4 h-4 text-[#d9bf92]" />
            <span className="hidden sm:inline">@rayaestética</span>
            <span className="sm:hidden">Instagram</span>
          </a>

          {/* If Owner is already logged in, show quick switcher */}
          {isOwnerLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                id="nav-toggle-view"
                onClick={() => setActiveView(activeView === 'admin' ? 'booking' : 'admin')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
                  activeView === 'admin'
                    ? 'bg-[#d6be96] text-[#172119] font-semibold'
                    : 'bg-[#29392c] text-[#ebd8b7] border border-[#3f5342]'
                }`}
              >
                {activeView === 'admin' ? (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Ver Agendamento</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#8fe299]" />
                    <span>Painel do Dono</span>
                  </>
                )}
              </button>
              {onLogoutOwner && (
                <button
                  id="nav-logout-btn"
                  onClick={onLogoutOwner}
                  className="text-xs text-[#a3b1a6] hover:text-white underline px-1"
                  title="Sair do modo administrador"
                >
                  Sair
                </button>
              )}
            </div>
          ) : (
            /* Discreet hidden access trigger for website owner */
            <button
              id="discreet-owner-access-btn"
              onClick={onOpenAdmin}
              className="group p-2 rounded-full text-[#6b7d70] hover:text-[#ebd8b7] hover:bg-[#253428] transition-all"
              title="Acesso da Administração"
              aria-label="Acesso restrito do proprietário"
            >
              <Lock className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
