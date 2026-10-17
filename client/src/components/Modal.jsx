import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/format';

export default function Modal({ open, onClose, title, children, width = 'max-w-md', hideClose = false, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input, select, textarea, button:not([data-close])')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/50 p-4 backdrop-blur-[2px] sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={cn('pop-in relative my-8 w-full rounded-2xl bg-white shadow-pop', width)}>
        {!hideClose && (
          <button data-close onClick={onClose} aria-label="Close dialog" className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
            <X size={18} />
          </button>
        )}
        {title && <h2 id={labelledBy} className="px-6 pt-6 text-lg font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
