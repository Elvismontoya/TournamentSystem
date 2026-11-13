import { LogIn, Plus, Trophy } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '../components/ui/Button.tsx';

interface TopBarProps {
  onCreateTournament: () => void;
  onLogin: () => void;
}

export function TopBar({ onCreateTournament, onLogin }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="page-container flex h-16 items-center gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary-600 text-white">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden font-display text-lg leading-tight font-semibold text-white sm:block">
            Tournament<span className="text-primary-300"> System</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/mis-torneos"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-display text-sm font-medium ${
                isActive ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:text-white'
              }`
            }
          >
            Mis torneos
          </NavLink>

          <Button variant="ghost" onClick={onLogin} className="h-9 px-3">
            <LogIn className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Iniciar sesión</span>
            <span className="sr-only sm:hidden">Iniciar sesión</span>
          </Button>

          <Button onClick={onCreateTournament} className="h-9 px-3 sm:px-4">
            <Plus className="size-4" aria-hidden="true" />
            Crear torneo
          </Button>
        </nav>
      </div>
    </header>
  );
}
