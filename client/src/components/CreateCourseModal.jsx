import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';

const blank = { name: '', category: '', level: 'Beginner', hours: 10, description: '', topics: '', imageUrl: '', generateQuestions: true };

export default function CreateCourseModal({ open, onClose }) {
  const { api, courses, toast, config, refreshCourses } = useApp();
  const navigate = useNavigate();
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const cats = [...new Set(courses.map((c) => c.category))];

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (f.name.trim().length < 3) return setErr('Course name must be at least 3 characters.');
    if (f.topics.split('\n').filter((t) => t.trim()).length < 2) return setErr('Add at least two topics, one per line.');
    setBusy(true);
    try {
      const d = await api('/api/admin/courses', { method: 'POST', body: { ...f, topics: f.topics.split('\n') } });
      toast(`Course "${d.course.name}" is live for all students.${d.aiNote ? ` ${d.aiNote}` : ''}`);
      await refreshCourses(); setF(blank); onClose(); navigate(`/admin/course/${d.course.id}`);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create new course" labelledBy="cc-title" width="max-w-xl">
      <form onSubmit={submit} className="space-y-4 px-6 pb-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label" htmlFor="cc-name">Course name</label><input id="cc-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cloud Computing Fundamentals" /></div>
          <div><label className="label" htmlFor="cc-cat">Category</label><input id="cc-cat" list="cc-cats" className="input" value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Choose or type" /><datalist id="cc-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="cc-level">Level</label><select id="cc-level" className="input" value={f.level} onChange={(e) => set('level', e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div><div><label className="label" htmlFor="cc-hours">Hours</label><input id="cc-hours" type="number" min={1} className="input" value={f.hours} onChange={(e) => set('hours', e.target.value)} /></div></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="cc-desc">Description</label><textarea id="cc-desc" rows={2} className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="cc-topics">Topics (one per line, each becomes a module)</label><textarea id="cc-topics" rows={4} className="input" value={f.topics} onChange={(e) => set('topics', e.target.value)} placeholder={'Virtualization\nStorage\nNetworking'} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="cc-img">Cover image URL (optional)</label><input id="cc-img" className="input" value={f.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." /></div>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={f.generateQuestions} onChange={(e) => set('generateQuestions', e.target.checked)} /><span>Generate starter diagnostic questions with AI{!config.aiEnabled && <span className="block text-xs text-amber-700">AI is not configured, so questions will not be generated.</span>}</span></label>
        {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />} Create course</button></div>
      </form>
    </Modal>
  );
}
