import { Trophy } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { UserMenu } from './UserMenu.tsx';

interface TopBarProps {
  /** There are no accounts yet: logging out shows the login form. */
  onLogout: () => void;
}

export function TopBar({ onLogout }: TopBarProps) {
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

        <nav aria-label="Principal" className="ml-auto flex items-center gap-2 sm:gap-3">
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

          <UserMenu onLogout={onLogout} />
        </nav>
      </div>
    </header>
  );
}
