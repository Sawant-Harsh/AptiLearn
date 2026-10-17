import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import PageShell from '../components/PageShell';
import ProfileForm from '../components/ProfileForm';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user, isStudent, booting, deleteAccount, toast, api } = useApp();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  if (booting) return null;
  if (!user) return <Navigate to="/courses" replace />;
  if (!isStudent) return <Navigate to="/admin" replace />;

  const changePw = async (e) => {
    e.preventDefault();
    try { await api('/api/me/password', { method: 'POST', body: pw }); toast('Password updated.'); setPw({ current: '', next: '' }); } catch (err) { toast(err.message, 'error'); }
  };
  const del = async () => { try { await deleteAccount(); navigate('/'); toast('Your account has been deleted.'); } catch (e) { toast(e.message, 'error'); } };

  return (
    <PageShell>
      <h1 className="text-3xl font-extrabold tracking-tight">My profile</h1>
      <p className="muted mt-1">Edit or clear your personal details. Changes are saved to your account.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card p-6" aria-label="Personal details"><h2 className="mb-4 text-sm font-bold">Personal details</h2><ProfileForm /></section>
        <div className="space-y-6">
          <form onSubmit={changePw} className="card p-6">
            <h2 className="text-sm font-bold">Change password</h2>
            <div className="mt-4 space-y-3">
              {!user.picture && <div><label className="label" htmlFor="pw-cur">Current password</label><input id="pw-cur" type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></div>}
              <div><label className="label" htmlFor="pw-new">New password</label><input id="pw-new" type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="At least 6 characters" autoComplete="new-password" /></div>
              <button className="btn btn-secondary w-full" disabled={!pw.next}>Update password</button>
            </div>
          </form>
          <section className="card border-red-200 p-6">
            <h2 className="text-sm font-bold text-red-700">Delete account</h2>
            <p className="mt-1 text-xs text-slate-600">Permanently removes your account, progress, rank and notifications. This cannot be undone.</p>
            <button className="btn btn-danger mt-4 w-full" onClick={() => setConfirm(true)}><Trash2 size={15} /> Delete my account</button>
          </section>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete your account?" labelledBy="del-title">
        <div className="px-6 pb-6 pt-2"><p className="muted">All of your courses, progress, streak and ranking will be erased for good.</p>
          <div className="mt-5 flex justify-end gap-2"><button className="btn btn-secondary" onClick={() => setConfirm(false)}>Keep my account</button><button className="btn btn-danger" onClick={del}>Yes, delete</button></div></div>
      </Modal>
    </PageShell>
  );
}
