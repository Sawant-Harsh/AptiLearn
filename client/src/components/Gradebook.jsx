import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Download, Filter, Search, Send } from 'lucide-react';
import { Avatar, Badge, Bar } from './ui';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { masteryLevel } from '../utils/scoring';
import { cn, downloadBlob, toCsv } from '../utils/format';

const STATUS = { completed: { label: 'Completed', tone: 'emerald' }, progress: { label: 'In progress', tone: 'amber' }, 'not-started': { label: 'Not started', tone: 'slate' } };

function template(r) {
  const first = r.name.split(' ')[0];
  const weak = [...r.topics].sort((a, b) => a.value - b.value)[0];
  if (r.atRisk) return `Hi ${first}, I noticed your ${r.courseName} diagnostic score is ${r.score}%. Let's strengthen ${weak ? weak.topic : 'the core topics'} together: watch the lesson, take a quick test, and ask AptiBot if you get stuck. I'm here to help.`;
  if (r.score != null) return `Hi ${first}, great progress in ${r.courseName}! You scored ${r.score}%. Keep your streak going and try a harder quick test${weak ? ` on ${weak.topic}` : ''} to climb the rankings.`;
  return `Hi ${first}, welcome to ${r.courseName}! Take the diagnostic assessment when you can so we can build your personalised learning plan.`;
}

export default function Gradebook({ rows = [], loading, showCourse = false, pageSize = 6, title = 'Diagnostic gradebook' }) {
  const { api, toast } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [riskOnly, setRiskOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => rows.filter((r) => {
    const t = q.trim().toLowerCase();
    if (t && !(r.name.toLowerCase().includes(t) || r.roll.toLowerCase().includes(t))) return false;
    if (status !== 'all' && r.status !== status) return false;
    return !(riskOnly && !r.atRisk);
  }).sort((a, b) => b.atRisk - a.atRisk || a.name.localeCompare(b.name)), [rows, q, status, riskOnly]);

  useEffect(() => setPage(0), [q, status, riskOnly]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const open = (r) => { setDetail(r); setMsg(template(r)); };
  const send = async () => {
    if (!msg.trim()) return toast('Write a message first.', 'error');
    setSending(true);
    try {
      const d = await api('/api/admin/support', { method: 'POST', body: { studentId: detail.studentId, message: msg, courseName: detail.courseName } });
      toast(d.delivered ? `Message delivered to ${detail.name}'s notifications.` : `Message sent to ${detail.name} (demo student).`);
      setDetail(null);
    } catch (e) { toast(e.message, 'error'); } finally { setSending(false); }
  };

  const exportCsv = () => {
    const csv = toCsv([['Student', 'Roll no', 'City', ...(showCourse ? ['Course'] : []), 'Score %', 'Mastery %', 'Status', 'At risk', 'Lessons done', 'Video completion %'],
      ...filtered.map((r) => [r.name, r.roll, r.city, ...(showCourse ? [r.courseName] : []), r.score ?? '', r.mastery ?? '', STATUS[r.status].label, r.atRisk ? 'Yes' : 'No', `${r.lessonsDone}/${r.lessonsTotal}`, r.videoPct])]);
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'aptilearn-gradebook.csv');
    toast(`Exported ${filtered.length} rows.`);
  };

  return (
    <section className="card p-5" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-extrabold">{title}</h2><button onClick={exportCsv} className="btn btn-secondary btn-sm"><Download size={14} /> Export CSV</button></div>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search students by name or roll no." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" /></div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="completed">Completed</option><option value="progress">In progress</option><option value="not-started">Not started</option></select>
        <button onClick={() => setRiskOnly((r) => !r)} aria-pressed={riskOnly} className={cn('btn btn-secondary', riskOnly && '!border-red-300 !bg-red-50 !text-red-700')}><Filter size={14} /> At-risk</button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-slate-300 text-xs text-slate-500"><th className="py-2 pr-3 font-semibold">Student</th><th className="px-3 py-2 font-semibold">Roll no.</th>{showCourse && <th className="px-3 py-2 font-semibold">Course</th>}<th className="px-3 py-2 font-semibold">Score</th><th className="px-3 py-2 font-semibold">Mastery</th><th className="px-3 py-2 font-semibold">Status</th><th className="py-2 pl-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="py-10 text-center text-slate-500">Loading students...</td></tr>}
            {!loading && slice.map((r) => {
              const lv = masteryLevel(r.mastery);
              return (
                <tr key={`${r.studentId}-${r.courseId}`} className={cn('border-b border-slate-200 last:border-0', r.atRisk && 'bg-red-50')}>
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-2.5"><Avatar name={r.name} size="h-7 w-7" /><div className="leading-tight"><span className="font-semibold">{r.name}</span>{r.city && <span className="block text-[11px] text-slate-400">{r.city}</span>}</div></div></td>
                  <td className="px-3 py-2.5 text-slate-500">{r.roll || '-'}</td>
                  {showCourse && <td className="px-3 py-2.5 text-xs text-slate-600">{r.courseName}</td>}
                  <td className={cn('px-3 py-2.5 font-bold tabular-nums', r.atRisk && 'text-red-600')}>{r.score == null ? '-' : `${r.score}%`}</td>
                  <td className="px-3 py-2.5"><div className="w-24"><Bar value={r.mastery ?? 0} color={lv.bar} height="h-1.5" /></div></td>
                  <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1"><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>{r.atRisk && <Badge tone="red">At-risk</Badge>}</div></td>
                  <td className="py-2.5 pl-3 text-right"><button onClick={() => open(r)} className={cn('inline-flex items-center gap-0.5 text-xs font-bold hover:underline', r.atRisk ? 'text-red-600' : 'text-brand-600')}>{r.atRisk ? 'Support' : 'View'} <ChevronRight size={13} /></button></td>
                </tr>
              );
            })}
            {!loading && !slice.length && <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-500">No students match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Showing {filtered.length ? page * pageSize + 1 : 0}-{Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length} students</span>
        <div className="flex gap-2"><button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button><button className="btn btn-secondary btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</button></div>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} labelledBy="student-title" width="max-w-lg">
        {detail && (
          <div className="px-6 pb-6 pt-3">
            <p className="text-xs text-slate-500">{detail.roll || 'No roll no.'} &middot; {detail.courseName} &middot; {STATUS[detail.status].label}{detail.atRisk ? ' \u00b7 At-risk' : ''}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-xl font-extrabold">{detail.score == null ? '-' : `${detail.score}%`}</p><p className="text-[11px] text-slate-500">Diagnostic</p></div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-xl font-extrabold">{detail.lessonsDone}/{detail.lessonsTotal}</p><p className="text-[11px] text-slate-500">Lessons done</p></div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-xl font-extrabold">{detail.videoPct}%</p><p className="text-[11px] text-slate-500">Video completion</p></div>
            </div>
            {detail.topics.length > 0 && <div className="mt-5 space-y-2.5"><p className="text-xs font-semibold text-slate-600">Topic mastery</p>{detail.topics.map((t) => <div key={t.topic} className="grid grid-cols-[140px_1fr_36px] items-center gap-3 text-xs"><span className="truncate">{t.topic}</span><Bar value={t.value} color={masteryLevel(t.value).bar} height="h-1.5" /><span className="text-right font-semibold">{t.value}%</span></div>)}</div>}
            <label className="label mt-5" htmlFor="support-msg">Message to {detail.name.split(' ')[0]} (shows in their notifications instantly)</label>
            <textarea id="support-msg" rows={4} className="input" value={msg} onChange={(e) => setMsg(e.target.value)} />
            <div className="mt-5 flex justify-end gap-2"><button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button><button className="btn btn-primary" onClick={send} disabled={sending}><Send size={15} /> {sending ? 'Sending...' : 'Send support message'}</button></div>
          </div>
        )}
      </Modal>
    </section>
  );
}
