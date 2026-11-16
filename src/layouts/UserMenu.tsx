import { LogOut, Settings, User, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface UserMenuProps {
  /** There are no accounts yet: logging out shows the login form. */
  onLogout: () => void;
}

interface MenuItem {
  label: string;
  icon: LucideIcon;
  /** Not built yet: shown, but can't be chosen. */
  soon?: boolean;
  onSelect?: () => void;
  danger?: boolean;
}

/**
 * Account menu: a round profile picture in the navbar that opens Mi perfil, Configuración
 * (of the account) and Cerrar sesión. Closes on Escape, on a click outside, or after choosing.
 */
export function UserMenu({ onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const items: MenuItem[] = [
    { label: 'Mi perfil', icon: User, soon: true },
    { label: 'Configuración', icon: Settings, soon: true },
    { label: 'Cerrar sesión', icon: LogOut, onSelect: onLogout, danger: true },
  ];

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de la cuenta"
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="grid size-9 place-items-center rounded-full bg-primary-500/20 text-primary-200 ring-1 ring-primary-500/40 transition-colors hover:bg-primary-500/30 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:outline-none"
      >
        {/* Profile picture placeholder until there are accounts. */}
        <User className="size-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Cuenta"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 py-1 shadow-2xl"
        >
          <div className="border-b border-neutral-800 px-4 py-3">
            <p className="font-display text-sm font-medium text-white">Organizador</p>
            <p className="text-xs text-neutral-500">Cuenta de prueba</p>
          </div>
          {items.map(({ label, icon: Icon, soon, onSelect, danger }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              disabled={soon}
              onClick={() => {
                setOpen(false);
                onSelect?.();
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                danger
                  ? 'text-red-300 hover:bg-red-500/10'
                  : 'text-neutral-200 hover:bg-neutral-800 disabled:text-neutral-500 disabled:hover:bg-transparent'
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {soon && <span className="text-[11px] text-neutral-500">Próximamente</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
