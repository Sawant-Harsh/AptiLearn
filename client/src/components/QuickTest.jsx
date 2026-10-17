import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Sparkles, XCircle, Zap } from 'lucide-react';
import { useApp, useQuestions } from '../context/AppContext';
import { Bar, Segmented } from './ui';
import { QuestionBody, QuestionMeta } from './QuestionView';
import { generatePractice } from '../utils/practice';
import { cn } from '../utils/format';

const LETTERS = ['A', 'B', 'C', 'D'];

/** "Take a quick test": quiz with chosen topics + difficulty, results feed rankings and mastery. */
export default function QuickTest({ course, id = 'quick-test' }) {
  const { submitQuiz, topicMastery, toast } = useApp();
  const { list: pool, loading } = useQuestions(course.id);
  const [topics, setTopics] = useState([]); // empty = all
  const [difficulty, setDifficulty] = useState('mixed');
  const [count, setCount] = useState(10);
  const [step, setStep] = useState('setup');
  const [set, setSet] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [saving, setSaving] = useState(false);

  const mastery = useMemo(() => Object.fromEntries(topicMastery(course.id).map((m) => [m.topic, m.mastery])), [topicMastery, course.id]);
  const toggle = (t) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const start = () => {
    const chosen = topics.length ? topics : course.topics;
    const qs = generatePractice({ courseId: course.id, topics: chosen, count, mode: difficulty, masteryByTopic: mastery, pool });
    if (!qs.length) return toast('No questions are available for this selection yet.', 'error');
    setSet(qs); setIdx(0); setPicked(null); setAnswers([]); setStep('quiz');
  };

  const q = set[idx];
  const choose = (i) => { if (picked == null) { setPicked(i); setAnswers((a) => [...a, { topic: q.topic, correct: i === q.answer }]); } };
  const next = async () => {
    if (idx + 1 < set.length) { setIdx(idx + 1); setPicked(null); return; }
    setSaving(true);
    try { await submitQuiz(course.id, answers); } catch (e) { toast(e.message, 'error'); }
    setSaving(false); setStep('summary');
  };

  const score = answers.filter((a) => a.correct).length;
  const byTopic = Object.values(answers.reduce((acc, a) => { acc[a.topic] ||= { topic: a.topic, correct: 0, total: 0 }; acc[a.topic].total += 1; acc[a.topic].correct += a.correct ? 1 : 0; return acc; }, {}));

  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6" aria-label="Take a quick test">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Zap size={20} className="text-brand-600" /> Take a quick test</h2>
          <p className="muted mt-0.5">{course.name}: pick your topics and difficulty. Every correct answer earns XP and lifts your rank.</p>
        </div>
      </div>

      {step === 'setup' && (
        <div className="mt-5">
          <p className="label">Topics</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTopics([])} aria-pressed={!topics.length} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', !topics.length ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400')}>All topics</button>
            {course.topics.map((t) => {
              const on = topics.includes(t);
              return <button key={t} onClick={() => toggle(t)} aria-pressed={on} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400')}>{t}</button>;
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-6">
            <div><p className="label">Difficulty</p><Segmented label="Difficulty" value={difficulty} onChange={setDifficulty} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }, { value: 'mixed', label: 'Mixed' }, { value: 'adaptive', label: 'Adaptive' }]} /></div>
            <div><p className="label">Questions</p><Segmented label="Question count" value={count} onChange={setCount} options={[5, 10, 15].map((n) => ({ value: n, label: String(n) }))} /></div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" onClick={start} disabled={loading || !pool.length}><Sparkles size={16} /> {loading ? 'Loading questions...' : 'Start quick test'}</button>
            {!loading && !pool.length && <p className="text-xs text-slate-500">Questions for this course are being prepared. Check back soon.</p>}
            {difficulty === 'adaptive' && <p className="text-xs text-slate-500">Adaptive starts easier on topics where your mastery is low.</p>}
          </div>
        </div>
      )}

      {step === 'quiz' && q && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500"><span>Question {idx + 1} of {set.length}</span><span>{score} correct</span></div>
          <Bar value={(idx / set.length) * 100} className="mt-2" />
          <div className="mt-5"><QuestionMeta q={q} /></div>
          <p className="mt-3 text-lg font-bold leading-snug">{q.text}</p>
          <QuestionBody q={q} />
          <div className="mt-5 space-y-2.5">
            {q.options.map((o, i) => {
              const isAns = i === q.answer; const isPick = i === picked; const reveal = picked != null;
              return (
                <button key={i} onClick={() => choose(i)} disabled={reveal} className={cn('flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm transition',
                  !reveal && 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/50', reveal && isAns && 'border-emerald-400 bg-emerald-50',
                  reveal && isPick && !isAns && 'border-red-300 bg-red-50', reveal && !isAns && !isPick && 'border-slate-200 opacity-60')}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">{LETTERS[i]}</span>
                  <span className="flex-1">{o}</span>
                  {reveal && isAns && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {reveal && isPick && !isAns && <XCircle size={18} className="text-red-500" />}
                </button>
              );
            })}
          </div>
          {picked != null && (
            <div className="pop-in mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <p className="font-semibold">{picked === q.answer ? 'Correct.' : `Not quite. The answer is ${LETTERS[q.answer]}.`}</p>
              <p className="mt-1 text-slate-600">{q.explanation}</p>
            </div>
          )}
          <div className="mt-5 flex justify-end"><button className="btn btn-primary" disabled={picked == null || saving} onClick={next}>{idx + 1 >= set.length ? (saving ? 'Saving...' : 'Finish test') : 'Next question'}</button></div>
        </div>
      )}

      {step === 'summary' && (
        <div className="mt-5">
          <p className="text-4xl font-extrabold">{score}<span className="text-xl text-slate-400"> / {set.length}</span></p>
          <p className="muted mt-1">{score / set.length >= 0.8 ? 'Excellent. These topics are getting stronger.' : score / set.length >= 0.5 ? 'Good progress. One more round will lock it in.' : 'A tough set, and that is useful. Review the lessons, then try again.'} You earned {score * 2} XP.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {byTopic.map((t) => (
              <div key={t.topic} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{t.topic}</span><span className="text-slate-500">{t.correct}/{t.total}</span></div>
                <Bar value={(t.correct / t.total) * 100} color={t.correct / t.total >= 0.7 ? 'bg-emerald-500' : t.correct / t.total >= 0.4 ? 'bg-amber-400' : 'bg-red-500'} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2"><button className="btn btn-primary" onClick={() => setStep('setup')}><RotateCcw size={15} /> Take another test</button></div>
        </div>
      )}
    </section>
  );
}
