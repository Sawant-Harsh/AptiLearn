import { useEffect, useState } from 'react';
import { Eraser, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from './ui';

const FIELDS = {
  student: [['name', 'Full name', true], ['roll', 'Roll number'], ['program', 'Program / course of study'], ['university', 'University / institution'], ['phone', 'Phone'], ['city', 'City'], ['bio', 'About you', false, true]],
  admin: [['name', 'Full name', true], ['designation', 'Designation'], ['organization', 'Organisation'], ['phone', 'Phone'], ['city', 'City'], ['bio', 'About', false, true]],
};

const valueOf = (user, k) => (k === 'name' ? user.name : user.profile?.[k] || '');

export default function ProfileForm({ onSaved }) {
  const { user, updateProfile, toast } = useApp();
  const fields = FIELDS[user.role];
  const initial = () => Object.fromEntries(fields.map(([k]) => [k, valueOf(user, k)]));
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(initial()), [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = fields.some(([k]) => form[k] !== valueOf(user, k));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('Name cannot be empty.', 'error');
    setBusy(true);
    try { await updateProfile(form); toast('Profile updated.'); onSaved?.(); } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save}>
      <div className="flex items-center gap-3">
        <Avatar name={user.name} picture={user.picture} size="h-14 w-14 text-base" />
        <div className="min-w-0"><p className="truncate font-bold">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="pf-email">Email (cannot be changed)</label>
          <input id="pf-email" className="input bg-slate-100 text-slate-500" value={user.email} disabled />
        </div>
        {fields.map(([k, label, required, area]) => (
          <div key={k} className={area || k === 'name' ? 'sm:col-span-2' : ''}>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor={`pf-${k}`}>{label}</label>
              {!required && form[k] && <button type="button" onClick={() => setForm({ ...form, [k]: '' })} className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600"><Eraser size={11} /> Clear</button>}
            </div>
            {area ? <textarea id={`pf-${k}`} rows={3} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /> : <input id={`pf-${k}`} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />}
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => setForm(initial())}>Reset</button>
        <button className="btn btn-primary" disabled={!dirty || busy}><Save size={15} /> {busy ? 'Saving...' : 'Save changes'}</button>
      </div>
    </form>
  );
}
