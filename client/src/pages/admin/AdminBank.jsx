import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, Trash2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ManualQuestionForm from '../../components/ManualQuestionForm';
import { Badge, difficultyTone } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { useAdminData } from '../../lib/useAdminData';
import { cn } from '../../utils/format';

const SRC = { seed: ['Built-in', 'slate'], ai: ['AI generated', 'indigo'], admin: ['Admin added', 'navy'] };

export default function AdminBank() {
  const { user, isAdmin, booting, courses, api, toast } = useApp();
  const { data, loading } = useAdminData('/api/admin/questions');
  const [courseId, setCourseId] = useState('');
  const [source, setSource] = useState('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => (data || []).filter((x) => (!courseId || x.courseId === courseId) && (source === 'all' || x.source === source) && x.text.toLowerCase().includes(q.toLowerCase())), [data, courseId, source, q]);
  if (booting) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/courses" replace />;
  const name = (id) => courses.find((c) => c.id === id)?.name || id;

  const toggle = async (x) => { try { await api(`/api/admin/questions/${x.id}`, { method: 'PATCH', body: { published: !x.published } }); toast(x.published ? 'Hidden from students.' : 'Now live for students.'); } catch (e) { toast(e.message, 'error'); } };
  const remove = async (x) => { try { await api(`/api/admin/questions/${x.id}`, { method: 'DELETE' }); toast('Question deleted.'); } catch (e) { toast(e.message, 'error'); } };

  return (
    <PageShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Question bank</h1>
      <p className="muted mt-1">All built-in, AI-generated and admin-added questions. New AI questions appear here instantly.</p>
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card p-5" aria-label="Questions">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-base font-extrabold">Questions <span className="text-sm font-medium text-slate-400">({list.length})</span></h2>
            <select className="input w-auto" value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="Course"><option value="">All courses</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select className="input w-auto" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source"><option value="all">All sources</option><option value="seed">Built-in</option><option value="ai">AI generated</option><option value="admin">Admin added</option></select>
            <input className="input w-48" placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
          </div>
          <ul className="mt-4 divide-y divide-slate-200">
            {loading && <li className="py-8 text-center text-sm text-slate-500">Loading...</li>}
            {list.map((x) => (
              <li key={x.id} className="flex items-start gap-3 py-3" data-testid="bank-row">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{x.text}</p>
                  {x.options && <p className="mt-1 text-xs text-slate-500">Answer: <span className="font-semibold text-emerald-700">{x.options[x.answer]}</span></p>}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="indigo">{name(x.courseId)}</Badge><Badge>{x.topic}</Badge><Badge tone={difficultyTone[x.difficulty]} className="capitalize">{x.difficulty}</Badge>
                    <Badge tone={SRC[x.source][1]}>{x.source === 'ai' && <Sparkles size={11} />}{SRC[x.source][0]}</Badge>
                    <Badge tone={x.published ? 'emerald' : 'amber'}>{x.published ? 'Live for students' : 'Display only'}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {x.options && <button onClick={() => toggle(x)} aria-label={x.published ? 'Hide from students' : 'Publish to students'} title={x.published ? 'Hide from students' : 'Publish to students'} className={cn('rounded-lg p-2 hover:bg-white', x.published ? 'text-emerald-600' : 'text-slate-400')}>{x.published ? <Eye size={16} /> : <EyeOff size={16} />}</button>}
                  {x.source !== 'seed' && <button onClick={() => remove(x)} aria-label="Delete question" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>}
                </div>
              </li>
            ))}
            {!loading && !list.length && <li className="py-10 text-center text-sm text-slate-500">No questions match these filters.</li>}
          </ul>
        </section>
        <ManualQuestionForm />
      </div>
    </PageShell>
  );
}
