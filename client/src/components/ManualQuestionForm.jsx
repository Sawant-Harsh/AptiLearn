import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, Segmented } from './ui';

export default function ManualQuestionForm() {
  const { courses, api, toast } = useApp();
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const course = courses.find((c) => c.id === courseId);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (course && !course.topics.includes(topic)) setTopic(course.topics[0]); }, [course, topic]);

  const add = async (e) => {
    e.preventDefault();
    if (text.trim().length < 8) return toast('Write the question first (at least 8 characters).', 'error');
    setBusy(true);
    try { await api('/api/admin/questions', { method: 'POST', body: { courseId, topic, difficulty, text } }); setText(''); toast('Question added to the bank (display only, not shown to students).'); } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={add} className="card p-5" aria-label="Add a question to the bank">
      <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Add to question bank</h2><Badge>Display only</Badge></div>
      <p className="muted mt-1">Save a question for reference. It stays in the bank and is not shown to students.</p>
      <div className="mt-4 space-y-3">
        <div><label className="label" htmlFor="mq-text">Question</label><textarea id="mq-text" rows={4} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type the question from your question bank..." /></div>
        <div><label className="label" htmlFor="mq-course">Course</label><select id="mq-course" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="mq-topic">Topic</label><select id="mq-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>{course?.topics.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label" htmlFor="mq-diff">Difficulty</label><select id="mq-diff" className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
        <button className="btn btn-primary w-full" disabled={busy}><Plus size={16} /> Add question</button>
      </div>
    </form>
  );
}
