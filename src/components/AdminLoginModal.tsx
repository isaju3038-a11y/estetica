import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === correctPin.trim()) {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#1e2a20] border border-[#3e5241] p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#98a89b] hover:text-white rounded-full hover:bg-[#28372b] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#293b2d] border border-[#d6be96]/40 flex items-center justify-center mx-auto mb-3 text-[#d6be96]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#f4efe8] font-medium">
            Acesso do Proprietário
          </h2>
          <p className="text-xs text-[#a0b0a3] mt-1">
            Área restrita para gerenciamento de horários e agendamentos da Raya Estética.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#ebd8b7] mb-2">
              Senha de Acesso (PIN)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#7d9081] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                autoFocus
                placeholder="Digite a senha..."
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#172119] border border-[#3b4c3e] text-[#f4efe8] placeholder-[#5a6d5e] focus:outline-none focus:border-[#d6be96] focus:ring-1 focus:ring-[#d6be96] text-sm tracking-widest"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>Senha incorreta. Verifique e tente novamente.</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              id="admin-login-submit-btn"
              className="w-full py-3.5 rounded-xl bg-[#d6be96] hover:bg-[#e4d2b2] text-[#172119] font-bold text-sm uppercase tracking-wider transition-all shadow-md"
            >
              Entrar no Painel
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-[#78897c]">
              Senha padrão inicial: <code className="text-[#cbb387] bg-[#172119] px-1.5 py-0.5 rounded">raya2026</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
