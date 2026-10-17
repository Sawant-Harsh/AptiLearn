import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, Segmented } from './ui';

export default function AIQuestionBuilder({ defaultCourseId }) {
  const { courses, api, toast, config } = useApp();
  const [courseId, setCourseId] = useState(defaultCourseId || courses[0]?.id || '');
  const course = courses.find((c) => c.id === courseId);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  useEffect(() => { if (defaultCourseId) setCourseId(defaultCourseId); }, [defaultCourseId]);
  useEffect(() => { if (course && !course.topics.includes(topic)) setTopic(course.topics[0]); }, [course, topic]);

  const generate = async () => {
    setBusy(true); setLast(null);
    try {
      const d = await api('/api/admin/ai/generate', { method: 'POST', body: { courseId, topic, count, difficulty } });
      setLast(d);
      toast(`AI generated ${d.added} question${d.added > 1 ? 's' : ''} and added them to the question bank.`);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <section className="card p-5" aria-label="AI based question builder">
      <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-base font-extrabold"><Sparkles size={17} className="text-brand-600" /> AI based question builder</h2><Badge tone={config.aiEnabled ? 'emerald' : 'amber'}>{config.aiEnabled ? 'AI ready' : 'AI key needed'}</Badge></div>
      <p className="muted mt-1">Generate real multiple-choice questions with AI. They appear in the question bank instantly.</p>
      <div className="mt-4 space-y-3">
        <div><label className="label" htmlFor="ai-course">Course / subject</label><select id="ai-course" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="ai-topic">Topic</label><select id="ai-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>{course?.topics.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label" htmlFor="ai-count">Number of questions (1-10)</label><input id="ai-count" type="number" min={1} max={10} className="input" value={count} onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} /></div>
        <div><p className="label">Difficulty</p><Segmented label="Difficulty" value={difficulty} onChange={setDifficulty} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} /></div>
        <button className="btn btn-primary w-full" onClick={generate} disabled={busy || !course}>{busy ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate questions</>}</button>
      </div>
      {last && (
        <div className="pop-in mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-bold">Added {last.added} of {last.requested} to the question bank:</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">{last.questions.slice(0, 5).map((q, i) => <li key={i} className="line-clamp-2">{q.text}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
