import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastApi, type ToastTone } from './toastContext.ts';

/** Id of the last toast shown (ids only need to be unique). */
let lastId = 0;

/** How long each kind stays on screen (errors a bit longer, to read them). */
const DURATION: Record<ToastTone, number> = { success: 5000, info: 5000, error: 8000 };

const TONE: Record<ToastTone, { icon: typeof Info; style: string; iconStyle: string }> = {
  success: {
    icon: CircleCheck,
    style: 'border-secondary-500/40',
    iconStyle: 'text-secondary-300',
  },
  error: { icon: CircleAlert, style: 'border-red-500/50', iconStyle: 'text-red-300' },
  info: { icon: Info, style: 'border-primary-500/40', iconStyle: 'text-primary-300' },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const { icon: Icon, style, iconStyle } = TONE[toast.tone];
  const close = () => {
    onClose(toast.id);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, DURATION[toast.tone]);
    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, toast.tone, onClose]);

  return (
    <li
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border bg-neutral-900 px-4 py-3 text-sm shadow-2xl shadow-black/50 ${style}`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${iconStyle}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold text-white">{toast.title}</p>
        {toast.text && <p className="mt-0.5 text-neutral-300">{toast.text}</p>}
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar aviso"
        className="-mt-0.5 -mr-1 rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * Keeps the toasts and shows them in the bottom-right corner. The list is a popover so it
 * shows above an open modal too (both live in the browser's top layer; the last one shown
 * goes on top, so it is shown again on each new toast).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => {
    const push = (tone: ToastTone) => (title: string, text?: string) => {
      lastId += 1;
      const id = lastId;
      // At most 4 at a time: the oldest go first.
      setToasts((current) => [...current.slice(-3), { id, tone, title, text }]);
    };
    return { success: push('success'), error: push('error'), info: push('info') };
  }, []);

  // Shown again for each new toast (back on top of any modal); hidden when there are none.
  const newest = toasts.at(-1)?.id;
  useEffect(() => {
    const list = listRef.current;
    if (!list || !('showPopover' in list)) return;
    if (list.matches(':popover-open')) list.hidePopover();
    if (newest !== undefined) list.showPopover();
  }, [newest]);
  const empty = toasts.length === 0;
  useEffect(() => {
    const list = listRef.current;
    if (empty && list?.matches(':popover-open')) list.hidePopover();
  }, [empty]);

  return (
    <ToastContext value={api}>
      {children}
      <div
        ref={listRef}
        popover="manual"
        aria-label="Avisos"
        className="inset-auto right-4 bottom-4 m-0 w-[min(24rem,calc(100%-2rem))] overflow-visible border-0 bg-transparent p-0"
      >
        <ol className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={remove} />
          ))}
        </ol>
      </div>
    </ToastContext>
  );
}
