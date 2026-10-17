import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pop-in pointer-events-auto flex items-start gap-2.5 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-pop">
          {t.tone === 'error' ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />}
          <p className="flex-1">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
