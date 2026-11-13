import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CreateTournamentModal } from '../pages/admin/CreateTournamentModal.tsx';
import { LoginModal } from '../pages/auth/LoginModal.tsx';
import { TopBar } from './TopBar.tsx';

/** Shared with child pages through useOutletContext(). */
export interface AppLayoutContext {
  openCreateTournament: () => void;
  openLogin: () => void;
}

type OpenModal = 'create' | 'login' | null;

export function AppLayout() {
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const context: AppLayoutContext = {
    openCreateTournament: () => {
      setOpenModal('create');
    },
    openLogin: () => {
      setOpenModal('login');
    },
  };
  const closeModal = () => {
    setOpenModal(null);
  };

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar onCreateTournament={context.openCreateTournament} onLogin={context.openLogin} />

      <main className="flex-1">
        <Outlet context={context} />
      </main>

      <CreateTournamentModal open={openModal === 'create'} onClose={closeModal} />
      <LoginModal open={openModal === 'login'} onClose={closeModal} />
    </div>
  );
}
