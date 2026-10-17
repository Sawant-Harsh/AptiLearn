import { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function AdminProfileDrawer({ open, onClose }) {
  const { logout, toast } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/50 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-label="Admin profile" className="slide-in flex h-full w-full max-w-md flex-col bg-white shadow-pop">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-extrabold">Admin profile</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="muted mb-4">Create, edit or clear your details. Your sign-in email is fixed.</p>
          <ProfileForm />
        </div>
        <footer className="border-t border-slate-200 p-4">
          <button className="btn btn-secondary w-full !text-red-600" onClick={() => { onClose(); logout(); navigate('/'); toast('You have been signed out.'); }}><LogOut size={16} /> Log out</button>
        </footer>
      </aside>
    </div>
  );
}
