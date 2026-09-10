import React, { useState, useEffect } from 'react';
import {
  Procedure,
  TimeSlot,
  Appointment,
  ClinicSettings,
  AppointmentStatus,
} from './types';
import {
  fetchProcedures,
  fetchSlots,
  fetchAppointments,
  createAppointment,
  saveSlots,
  updateAppointmentStatus,
  saveProcedures,
  getStoredSettings,
  saveStoredSettings,
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { ClientBooking } from './components/ClientBooking';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Footer } from './components/Footer';

export default function App() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<ClinicSettings>(getStoredSettings());

  // Navigation & Access State
  const [activeView, setActiveView] = useState<'booking' | 'admin'>('booking');
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [loadedProcs, loadedSlots, loadedApts] = await Promise.all([
          fetchProcedures(),
          fetchSlots(),
          fetchAppointments(),
        ]);
        setProcedures(loadedProcs);
        setSlots(loadedSlots);
        setAppointments(loadedApts);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Keyboard shortcut for owner: Ctrl + Shift + R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (isOwnerLoggedIn) {
          setActiveView((prev) => (prev === 'admin' ? 'booking' : 'admin'));
        } else {
          setIsLoginModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwnerLoggedIn]);

  // Handle client booking submission
  const handleBookAppointment = async (appointment: Appointment): Promise<boolean> => {
    try {
      const ok = await createAppointment(appointment);
      if (ok) {
        // Refresh local slots and appointments
        const [updatedSlots, updatedApts] = await Promise.all([
          fetchSlots(),
          fetchAppointments(),
        ]);
        setSlots(updatedSlots);
        setAppointments(updatedApts);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Handle saving time slots (Admin)
  const handleSaveSlots = async (newSlots: TimeSlot[]): Promise<boolean> => {
    setSlots(newSlots);
    return await saveSlots(newSlots);
  };

  // Handle appointment status update (Admin)
  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<boolean> => {
    const ok = await updateAppointmentStatus(appointmentId, status);
    if (ok) {
      const [updatedSlots, updatedApts] = await Promise.all([
        fetchSlots(),
        fetchAppointments(),
      ]);
      setSlots(updatedSlots);
      setAppointments(updatedApts);
      return true;
    }
    return false;
  };

  // Handle saving procedures (Admin)
  const handleSaveProcedures = async (newProcs: Procedure[]): Promise<boolean> => {
    setProcedures(newProcs);
    return await saveProcedures(newProcs);
  };

  // Handle saving clinic settings (Admin)
  const handleSaveSettings = (newSettings: ClinicSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Handle successful login of owner
  const handleOwnerLoginSuccess = () => {
    setIsOwnerLoggedIn(true);
    setIsLoginModalOpen(false);
    setActiveView('admin');
  };

  const handleOwnerLogout = () => {
    setIsOwnerLoggedIn(false);
    setActiveView('booking');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#19241b] text-[#f2ede6]">
      {/* Navigation Header */}
      <Navbar
        onOpenAdmin={() => {
          if (isOwnerLoggedIn) {
            setActiveView('admin');
          } else {
            setIsLoginModalOpen(true);
          }
        }}
        isOwnerLoggedIn={isOwnerLoggedIn}
        onLogoutOwner={handleOwnerLogout}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <div className="w-8 h-8 border-2 border-[#d6be96] border-t-transparent rounded-full animate-spin" />
            <p className="font-serif-luxury text-lg text-[#ebd8b7] tracking-wider">
              Carregando Raya Estética...
            </p>
          </div>
        ) : activeView === 'admin' && isOwnerLoggedIn ? (
          <AdminPanel
            slots={slots}
            appointments={appointments}
            procedures={procedures}
            settings={settings}
            onSaveSlots={handleSaveSlots}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onSaveProcedures={handleSaveProcedures}
            onSaveSettings={handleSaveSettings}
            onExitAdmin={() => setActiveView('booking')}
          />
        ) : (
          <ClientBooking
            procedures={procedures}
            slots={slots}
            onBookAppointment={handleBookAppointment}
            clinicInstagram={settings.instagram}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={() => {
          if (isOwnerLoggedIn) {
            setActiveView('admin');
          } else {
            setIsLoginModalOpen(true);
          }
        }}
        instagram={settings.instagram}
      />

      {/* Owner Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleOwnerLoginSuccess}
        correctPin={settings.ownerPin}
      />
    </div>
  );
}
