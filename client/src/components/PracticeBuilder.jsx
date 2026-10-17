import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import Modal from './Modal';
import { Bar, Segmented } from './ui';
import { QuestionBody, QuestionMeta } from './QuestionView';
import { useApp } from '../context/AppContext';
import { generatePractice } from '../utils/practice';
import { cn } from '../utils/format';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function PracticeBuilder({ open, onClose }) {
  const { course, topicMastery, customQuestions, recordPractice, toast } = useApp();
  const mastery = useMemo(() => topicMastery(course.id), [topicMastery, course.id, open]); // eslint-disable-line react-hooks/exhaustive-deps
  const weakest = useMemo(
    () => [...mastery].sort((a, b) => (a.mastery ?? 50) - (b.mastery ?? 50)).slice(0, 2).map((m) => m.topic),
    [mastery],
  );

  const [step, setStep] = useState('setup');
  const [topics, setTopics] = useState(null);
  const [count, setCount] = useState(8);
  const [mode, setMode] = useState('adaptive');
  const [set, setSet] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);

  const chosen = topics ?? weakest;
  const masteryByTopic = Object.fromEntries(mastery.map((m) => [m.topic, m.mastery]));

  const toggleTopic = (t) => setTopics((cur) => {
    const base = cur ?? weakest;
    return base.includes(t) ? base.filter((x) => x !== t) : [...base, t];
  });

  const generate = () => {
    if (!chosen.length) return toast('Pick at least one topic.', 'error');
    const qs = generatePractice({ courseId: course.id, topics: chosen, count, mode, masteryByTopic, customQuestions });
    if (!qs.length) return toast('No questions available for that selection.', 'error');
    setSet(qs); setIdx(0); setPicked(null); setAnswers([]); setStep('quiz');
  };

  const q = set[idx];
  const choose = (i) => {
    if (picked != null) return;
    setPicked(i);
    setAnswers((a) => [...a, { topic: q.topic, correct: i === q.answer }]);
  };
  const next = () => {
    if (idx + 1 >= set.length) {
      recordPractice(course.id, answers);
      setStep('summary');
    } else { setIdx(idx + 1); setPicked(null); }
  };

  const close = () => { setStep('setup'); setTopics(null); onClose(); };
  const score = answers.filter((a) => a.correct).length;
  const byTopic = Object.values(answers.reduce((acc, a) => {
    acc[a.topic] ||= { topic: a.topic, correct: 0, total: 0 };
    acc[a.topic].total += 1; acc[a.topic].correct += a.correct ? 1 : 0;
    return acc;
  }, {}));

  return (
    <Modal open={open} onClose={close} width="max-w-2xl" labelledBy="practice-title">
      {step === 'setup' && (
        <div className="px-6 pb-6 pt-6">
          <h2 id="practice-title" className="flex items-center gap-2 text-lg font-bold"><Sparkles size={18} className="text-brand-600" /> Adaptive practice builder</h2>
          <p className="muted mt-1">Build a set from your performance history in {course.name}. Weak topics are pre-selected.</p>

          <p className="label mt-5">Topics</p>
          <div className="flex flex-wrap gap-2">
            {mastery.map((m) => {
              const on = chosen.includes(m.topic);
              return (
                <button key={m.topic} onClick={() => toggleTopic(m.topic)} aria-pressed={on} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300')}>
                  {m.topic}{m.mastery != null && <span className={cn('ml-1.5', on ? 'text-brand-100' : 'text-slate-400')}>{m.mastery}%</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><p className="label">Questions</p><Segmented label="Question count" value={count} onChange={setCount} options={[5, 8, 10, 15].map((n) => ({ value: n, label: String(n) }))} /></div>
            <div><p className="label">Difficulty</p><Segmented label="Difficulty" value={mode} onChange={setMode} options={[{ value: 'adaptive', label: 'Adaptive' }, { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} /></div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Adaptive starts easier on topics under 50% mastery and ramps up as you improve.</p>

          <div className="mt-6 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={close}>Cancel</button>
            <button className="btn btn-primary" onClick={generate}><Sparkles size={16} /> Generate practice set</button>
          </div>
        </div>
      )}

      {step === 'quiz' && q && (
        <div className="px-6 pb-6 pt-6">
          <h2 id="practice-title" className="sr-only">Practice question {idx + 1}</h2>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500"><span>Question {idx + 1} of {set.length}</span><span>{score} correct so far</span></div>
          <Bar value={(idx / set.length) * 100} className="mt-2" />
          <div className="mt-5"><QuestionMeta q={q} /></div>
          <p className="mt-3 text-lg font-bold leading-snug">{q.text}</p>
          <QuestionBody q={q} />
          <div className="mt-5 space-y-2.5">
            {q.options.map((o, i) => {
              const isAns = i === q.answer; const isPick = i === picked; const reveal = picked != null;
              return (
                <button key={i} onClick={() => choose(i)} disabled={reveal} className={cn('flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition',
                  !reveal && 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/50',
                  reveal && isAns && 'border-emerald-400 bg-emerald-50',
                  reveal && isPick && !isAns && 'border-red-300 bg-red-50',
                  reveal && !isAns && !isPick && 'border-slate-200 opacity-60')}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">{LETTERS[i]}</span>
                  <span className="flex-1">{o}</span>
                  {reveal && isAns && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {reveal && isPick && !isAns && <XCircle size={18} className="text-red-500" />}
                </button>
              );
            })}
          </div>
          {picked != null && (
            <div className="pop-in mt-4 rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold">{picked === q.answer ? 'Correct.' : `Not quite. The answer is ${LETTERS[q.answer]}.`}</p>
              <p className="mt-1 text-slate-600">{q.explanation}</p>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button className="btn btn-primary" disabled={picked == null} onClick={next}>{idx + 1 >= set.length ? 'Finish practice' : 'Next question'}</button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div className="px-6 pb-6 pt-6">
          <h2 id="practice-title" className="text-lg font-bold">Practice complete</h2>
          <p className="mt-1 text-3xl font-extrabold">{score}<span className="text-lg text-slate-400"> / {set.length}</span></p>
          <p className="muted mt-1">{score / set.length >= 0.8 ? 'Excellent. These topics are getting stronger.' : score / set.length >= 0.5 ? 'Good progress. One more round will lock it in.' : 'A tough set, and that is useful. Review the lessons, then try again.'}</p>
          <div className="mt-5 space-y-3">
            {byTopic.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex justify-between text-xs"><span className="font-semibold">{t.topic}</span><span className="text-slate-500">{t.correct}/{t.total}</span></div>
                <Bar value={(t.correct / t.total) * 100} color={t.correct / t.total >= 0.7 ? 'bg-emerald-500' : t.correct / t.total >= 0.4 ? 'bg-amber-400' : 'bg-red-500'} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">Saved. Your topic mastery on the progress page now includes this practice.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={() => setStep('setup')}><RotateCcw size={15} /> Practice again</button>
            <button className="btn btn-primary" onClick={close}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
