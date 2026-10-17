import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Clock, Info, LogOut, Sparkles } from 'lucide-react';
import { useApp, useQuestions } from '../context/AppContext';
import { Badge, Logo, Skeleton } from '../components/ui';
import Modal from '../components/Modal';
import { QuestionBody, QuestionMeta } from '../components/QuestionView';
import { computeResult, pickNext, targetLabel, TEST_LENGTH, TEST_SECONDS } from '../utils/scoring';
import { clamp, cn, fmtClock } from '../utils/format';

const LETTERS = ['A', 'B', 'C', 'D'];
const storeKey = (uid, cid) => `aptilearn:test:${uid}:${cid}`;

export default function Diagnostic() {
  const { user, isStudent, booting, courses, submitDiagnostic, toast, selectedCourseId } = useApp();
  const [params] = useSearchParams();
  const course = courses.find((c) => c.id === (params.get('course') || selectedCourseId));
  const { list: pool, loading } = useQuestions(course?.id);
  if (booting) return null;
  if (!user) return <Navigate to="/courses" replace />;
  if (!isStudent) return <Navigate to="/admin" replace />;
  if (!course) return <Navigate to="/courses" replace />;
  if (loading) return <div className="grid min-h-screen place-items-center"><Skeleton className="h-40 w-96" /></div>;
  if (pool.length < 5) return <div className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-2xl font-extrabold">Diagnostic coming soon</h1><p className="muted mt-2">{course.name} doesn't have enough questions yet.</p><a href="/courses" className="btn btn-primary mt-5">Back to courses</a></div></div>;
  return <Test key={course.id} course={course} pool={pool} user={user} submitDiagnostic={submitDiagnostic} toast={toast} />;
}

function Test({ course, pool, user, submitDiagnostic, toast }) {
  const navigate = useNavigate();
  const total = Math.min(TEST_LENGTH, pool.length);
  const byId = useMemo(() => Object.fromEntries(pool.map((q) => [q.id, q])), [pool]);
  const key = storeKey(user.id, course.id);

  const [session, setSession] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (saved && byId[saved.currentId]) return saved;
    } catch { /* ignore */ }
    const first = pickNext({ pool, history: [], target: 2, total });
    return { startedAt: Date.now(), history: [], currentId: first.id, target: 2, shownAt: Date.now() };
  });
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [exitOpen, setExitOpen] = useState(false);
  const finished = useRef(false);

  useEffect(() => { sessionStorage.setItem(key, JSON.stringify(session)); }, [session, key]);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const remaining = Math.max(0, TEST_SECONDS - Math.floor((now - session.startedAt) / 1000));
  const current = byId[session.currentId];
  const { history } = session;
  const answeredN = history.filter((h) => h.status === 'answered').length;
  const correctN = history.filter((h) => h.correct).length;

  const finish = useCallback(async (hist) => {
    if (finished.current) return;
    finished.current = true;
    const timeSec = Math.min(TEST_SECONDS, Math.floor((Date.now() - session.startedAt) / 1000));
    try {
      await submitDiagnostic(course.id, computeResult({ course, history: hist, total, timeSec }));
      sessionStorage.removeItem(key);
      navigate(`/results?course=${course.id}`, { replace: true });
    } catch (e) { finished.current = false; toast(`Could not save your result: ${e.message}`, 'error'); }
  }, [course, key, navigate, session.startedAt, submitDiagnostic, toast, total]);

  useEffect(() => { if (remaining === 0 && !finished.current) { toast("Time's up. Saving your results."); finish(history); } }, [remaining, finish, history, toast]);

  const advance = (status) => {
    const spent = Math.round((Date.now() - (session.shownAt || Date.now())) / 1000);
    const correct = status === 'answered' && selected === current.answer;
    const entry = { qid: current.id, topic: current.topic, difficulty: current.difficulty, status, selected: status === 'answered' ? selected : null, correct, spent };
    const hist = [...history, entry];
    const target = clamp(session.target + (status === 'skipped' ? 0 : correct ? 0.6 : -0.6), 1, 3);
    setSelected(null);
    if (hist.length >= total) return finish(hist);
    const nextQ = pickNext({ pool, history: hist, target, total });
    if (!nextQ) return finish(hist);
    setSession({ ...session, history: hist, target, currentId: nextQ.id, shownAt: Date.now() });
    return undefined;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (exitOpen || !current || e.target instanceof HTMLInputElement) return;
      const idx = 'abcd'.indexOf(e.key.toLowerCase());
      if (idx >= 0 && idx < current.options.length) setSelected(idx);
      if (e.key === 'Enter' && selected != null && e.target.tagName !== 'BUTTON') advance('answered');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const exit = () => { sessionStorage.removeItem(key); finished.current = true; navigate('/courses'); };
  if (!current) return <Navigate to="/courses" replace />;

  const qNo = history.length + 1;
  const progress = Math.round((history.length / total) * 100);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <span className="hidden h-6 w-px bg-slate-200 sm:block" />
          <div className="hidden items-center gap-2 text-sm sm:flex"><Badge tone="indigo">{course.name}</Badge><span className="text-slate-500">Diagnostic assessment</span></div>
          <div className="ml-auto flex items-center gap-3">
            <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold tabular-nums', remaining <= 120 ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-300 text-navy')} role="timer" aria-label="Time remaining"><Clock size={16} /> {fmtClock(remaining)} <span className="hidden text-xs font-normal opacity-70 sm:inline">remaining</span></div>
            <button onClick={() => setExitOpen(true)} className="btn btn-secondary btn-sm"><LogOut size={14} /> Exit test</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between text-sm"><p className="font-semibold">Question {qNo} of {total}</p><p className="text-xs text-slate-500">{progress}% through your assessment</p></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} /></div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="card p-5 sm:p-7" aria-labelledby="q-text">
            <div className="flex items-center justify-between gap-3"><QuestionMeta q={current} /><span className="text-xs text-slate-400">Single correct answer</span></div>
            <h1 id="q-text" className="mt-4 text-2xl font-extrabold leading-snug">{current.text}</h1>
            <QuestionBody q={current} />
            <div className="mt-6 space-y-3" role="radiogroup" aria-labelledby="q-text">
              {current.options.map((o, i) => {
                const on = selected === i;
                return (
                  <button key={i} role="radio" aria-checked={on} onClick={() => setSelected(i)} className={cn('flex w-full items-center gap-4 rounded-xl border-2 bg-white px-4 py-3.5 text-left text-sm font-medium transition', on ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300')}>
                    <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold', on ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>{LETTERS[i]}</span>
                    <span className="flex-1">{o}</span>{on && <Check size={18} className="text-brand-600" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <button onClick={() => advance('skipped')} className="btn btn-secondary">Skip question</button>
              <div className="flex items-center gap-4">
                <span className="hidden text-xs text-slate-400 sm:block">{selected != null ? 'Answer selected' : 'Select an answer (or press A-D)'}</span>
                <button onClick={() => advance('answered')} disabled={selected == null} className="btn btn-primary">{qNo >= total ? 'Submit & finish' : 'Submit Answer'}</button>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="card p-5">
              <h2 className="text-sm font-bold">Your progress</h2>
              <p className="mt-1 text-xs text-slate-500">{answeredN} answered &middot; 1 current &middot; {Math.max(0, total - history.length - 1)} remaining</p>
              <ol className="mt-4 grid grid-cols-5 gap-2" aria-label="Question navigator">
                {Array.from({ length: total }, (_, i) => {
                  const h = history[i]; const isCur = i === history.length;
                  return <li key={i} aria-current={isCur ? 'step' : undefined} className={cn('grid h-9 place-items-center rounded-lg text-xs font-semibold', isCur ? 'bg-brand-600 text-white' : h?.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : h?.status === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-400 ring-1 ring-slate-200')}>{i + 1}</li>;
                })}
              </ol>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />Answered</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" />Skipped</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-brand-600" />Current</span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-slate-200"><span className="text-slate-500">Score so far</span><span className="font-bold" data-testid="live-score">{correctN} / {answeredN} correct{answeredN > 0 && ` (${Math.round((correctN / answeredN) * 100)}%)`}</span></div>
            </div>
            <div className="card border-brand-200 bg-brand-50 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold"><Sparkles size={16} className="text-brand-600" /> Adapting to you</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">Each answer helps us choose your next question. Take your time and answer independently.</p>
              <div className="mt-3 flex items-center gap-2 text-xs"><span className="text-slate-500">Current level</span><Badge tone="indigo">{targetLabel(session.target)}</Badge></div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500"><Info size={12} /> Progress is saved automatically.</p>
            </div>
          </aside>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">This is a diagnostic, not a competition. Every answer helps us understand how you learn.</p>
      </main>

      <Modal open={exitOpen} onClose={() => setExitOpen(false)} title="Exit this test?" labelledBy="exit-title">
        <div className="px-6 pb-6 pt-2"><p className="muted">Your answers so far will be discarded and you will need to start again.</p>
          <div className="mt-5 flex justify-end gap-2"><button className="btn btn-secondary" onClick={() => setExitOpen(false)}>Keep going</button><button className="btn btn-danger" onClick={exit}>Exit test</button></div></div>
      </Modal>
    </div>
  );
}
