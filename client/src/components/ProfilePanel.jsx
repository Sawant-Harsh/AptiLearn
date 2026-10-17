import { useState } from 'react';
import { Award, Download, Pencil, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from './ui';
import { buildPdf } from '../utils/pdf';
import { downloadBlob } from '../utils/format';

const FIELDS = [
  ['name', 'Full name'], ['email', 'Institutional email'], ['roll', 'Roll number'],
  ['program', 'Program'], ['university', 'University'], ['phone', 'Phone (optional)'],
];

export default function ProfilePanel() {
  const { user, updateProfile, toast, result, course, topicMastery, completedLessons, streak, practiceLog } = useApp();
  const [form, setForm] = useState({ ...user });
  const [editing, setEditing] = useState(false);
  const dirty = FIELDS.some(([k]) => (form[k] || '') !== (user[k] || ''));

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('Name cannot be empty.', 'error');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast('Enter a valid email address.', 'error');
    updateProfile(Object.fromEntries(FIELDS.map(([k]) => [k, (form[k] || '').trim()])));
    setEditing(false);
    toast('Profile updated.');
  };

  const m = topicMastery(course.id).filter((t) => t.mastery != null).sort((a, b) => b.mastery - a.mastery);
  const best = m[0];
  const worst = m[m.length - 1];
  const practiceCount = practiceLog.length;

  const achievements = [
    { title: 'First diagnostic completed', done: !!result, note: result ? `${course.name} - ${Math.round(result.accuracy)}%` : 'Take a diagnostic to unlock' },
    { title: `${streak.count}-day learning streak`, done: streak.count >= 3, note: streak.count >= 3 ? 'Consistency pays off' : 'Reach 3 days to unlock' },
    { title: 'Lesson explorer', done: completedLessons.length >= 5, note: `${completedLessons.length} lessons completed` },
    { title: 'Practice regular', done: practiceCount >= 3, note: `${practiceCount} practice sets finished` },
  ];

  const certificate = (a) => {
    downloadBlob(buildPdf('Achievement', ['# Certificate of achievement', '', `Awarded to ${user.name}`, `${user.university}`, '', `Achievement: ${a.title}`, a.note, '', `Issued ${new Date().toLocaleDateString()}`]), `aptilearn-${a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Profile and personal details</h3>
          {!editing && <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost btn-sm"><Pencil size={14} /> Edit</button>}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={user.name} size="h-12 w-12 text-sm" />
          <div><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.program}</p></div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([k, label]) => (
            <div key={k} className={k === 'program' || k === 'email' ? 'sm:col-span-2' : ''}>
              <label className="label" htmlFor={`pf-${k}`}>{label}</label>
              <input id={`pf-${k}`} className="input disabled:bg-slate-50 disabled:text-slate-600" disabled={!editing} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        {editing && (
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => { setForm({ ...user }); setEditing(false); }}>Cancel</button>
            <button type="submit" disabled={!dirty} className="btn btn-primary"><Save size={15} /> Save changes</button>
          </div>
        )}
      </form>

      <div className="card p-5">
        <h3 className="text-sm font-bold">Progress and achievements</h3>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-extrabold">{result ? `${Math.round(result.accuracy)}%` : '-'}</p><p className="text-[11px] text-slate-500">Diagnostic accuracy</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-extrabold">{best ? `${best.mastery}%` : '-'}<span className="text-slate-300"> / </span>{worst ? `${worst.mastery}%` : '-'}</p><p className="text-[11px] text-slate-500">Strongest / weakest</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-extrabold">{(completedLessons.length * 0.18 + practiceCount * 0.2).toFixed(1)} h</p><p className="text-[11px] text-slate-500">Learning time</p></div>
        </div>
        <ul className="mt-5 divide-y divide-slate-100">
          {achievements.map((a) => (
            <li key={a.title} className="flex items-center gap-3 py-3">
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${a.done ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}><Award size={18} /></span>
              <div className="flex-1"><p className={`text-sm font-semibold ${a.done ? '' : 'text-slate-400'}`}>{a.title}</p><p className="text-xs text-slate-500">{a.note}</p></div>
              {a.done && <button onClick={() => certificate(a)} aria-label={`Download certificate for ${a.title}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Download size={16} /></button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
