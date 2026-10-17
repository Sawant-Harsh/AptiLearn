import { ArrowRight, BookOpen, Download, Lightbulb, ListChecks, PlayCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ScoreWheel from '../components/ScoreWheel';
import { Badge, Bar } from '../components/ui';
import { useApp } from '../context/AppContext';
import { lessonForTopic } from '../utils/courseUtils';
import { masteryLevel, scoreLabel } from '../utils/scoring';
import { buildPdf } from '../utils/pdf';
import { downloadBlob, firstName, fmtDuration } from '../utils/format';

export default function Results() {
  const { user, isStudent, booting, courses, me, selectedCourseId, topicMastery, selectCourse } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const course = courses.find((c) => c.id === (params.get('course') || selectedCourseId));
  if (booting) return null;
  if (!user) return <Navigate to="/courses" replace />;
  if (!isStudent) return <Navigate to="/admin" replace />;
  const result = course && me?.enrollments?.[course.id]?.diagnostic;

  if (!course || !result) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ListChecks size={26} /></span>
          <h1 className="mt-5 text-2xl font-extrabold">No diagnostic results yet</h1>
          <p className="muted mt-2">Take the short diagnostic and your topic-by-topic learning map will appear here.</p>
          <Link to="/courses" className="btn btn-primary mt-6">Choose a course</Link>
        </div>
      </PageShell>
    );
  }

  const mastery = topicMastery(course.id);
  const ranked = mastery.filter((m) => m.mastery != null).sort((a, b) => a.mastery - b.mastery);
  const weakest = ranked[0];
  const second = ranked[1];
  const watch = weakest && lessonForTopic(course, weakest.topic);
  const review = second && lessonForTopic(course, second.topic);
  const goLesson = async (l) => { await selectCourse(course.id); navigate(l ? `/dashboard?lesson=${l.id}` : '/dashboard'); };

  const report = () => {
    const lines = ['# Diagnostic report', course.name, `Student: ${user.name}`, `Completed: ${new Date(result.completedAt).toLocaleString()}`, '', '## Summary',
      `- Accuracy: ${Math.round(result.accuracy)}% (${result.correct} of ${result.total} correct)`, `- Answered: ${result.answered}, skipped: ${result.skipped}, not reached: ${result.unseen}`, `- Time taken: ${fmtDuration(result.timeSec)}`, '',
      '## Topic mastery', ...mastery.map((m) => `- ${m.topic}: ${m.mastery == null ? 'not assessed' : `${m.mastery}% (${masteryLevel(m.mastery).label})`}`)];
    downloadBlob(buildPdf('Diagnostic report', lines), `aptilearn-${course.id}-report.pdf`);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-600">Diagnostic complete &middot; {course.name}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Great start, {firstName(user.name)}. Here's your learning map.</h1>
            <p className="muted mt-1">Your strengths are clear. Now let's turn the knowledge gaps into your next breakthroughs.</p>
          </div>
          <button onClick={report} className="btn btn-secondary"><Download size={16} /> Download report</button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
          <section className="card flex flex-col items-center p-6" aria-label="Diagnostic accuracy">
            <h2 className="self-start text-sm font-bold">Diagnostic accuracy</h2>
            <div className="mt-4"><ScoreWheel value={result.accuracy} caption={`${result.correct} of ${result.total} correct`} /></div>
            <Badge tone="emerald" className="mt-4">{scoreLabel(result.accuracy)}</Badge>
            <dl className="mt-5 grid w-full grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-center">
              <div><dt className="text-[11px] text-slate-500">Time taken</dt><dd className="text-sm font-bold">{fmtDuration(result.timeSec)}</dd></div>
              <div><dt className="text-[11px] text-slate-500">Class average</dt><dd className="text-sm font-bold">{course.stats?.avgScore ?? 0}%</dd></div>
            </dl>
          </section>

          <section className="card p-6" aria-label="Topic mastery">
            <h2 className="text-sm font-bold">Your topic-by-topic mastery</h2>
            <ul className="mt-5 space-y-4">
              {mastery.map((m) => {
                const lv = masteryLevel(m.mastery);
                return (
                  <li key={m.topic} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 sm:grid-cols-[150px_1fr_auto_100px]">
                    <span className={`text-sm ${lv.key === 'focus' ? 'font-bold' : 'font-medium'}`}>{m.topic}</span>
                    <Bar value={m.mastery ?? 0} color={lv.bar} height="h-2.5" />
                    <span className="w-9 text-right text-sm font-bold tabular-nums">{m.mastery == null ? '-' : `${m.mastery}%`}</span>
                    <span className={`hidden whitespace-nowrap rounded-md px-2 py-0.5 text-center text-xs font-semibold sm:block ${lv.chip}`}>{lv.label}</span>
                  </li>
                );
              })}
            </ul>
            {weakest && <p className="mt-6 flex gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-brand-800"><Lightbulb size={15} className="mt-px shrink-0" />{weakest.topic} is your biggest opportunity ({weakest.mastery}% mastery). A focused session here will move your overall score the most.</p>}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6" aria-label="AI recommendations">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-extrabold"><Sparkles size={18} className="text-brand-600" /> Your next steps, tailored by AI</h2><span className="text-xs text-slate-500">Based on your diagnostic</span></div>
          <p className="muted mt-1">Less repetition when you're strong. More support where it matters.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button onClick={() => goLesson(watch)} className="card flex items-start gap-3 bg-white p-4 text-left transition hover:border-brand-400"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><PlayCircle size={18} /></span><span><span className="block text-sm font-bold">Watch: {watch?.title || 'Start learning'}</span><span className="text-xs text-slate-500">{weakest ? `${weakest.topic} - ${watch?.minutes} minute lesson` : 'Pick up where you left off'}</span></span></button>
            <button onClick={async () => { await selectCourse(course.id); navigate('/dashboard#quick-test'); }} className="card flex items-start gap-3 bg-white p-4 text-left transition hover:border-brand-400"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><ListChecks size={18} /></span><span><span className="block text-sm font-bold">Practice: {weakest?.topic || 'Mixed set'}</span><span className="text-xs text-slate-500">Take a quick test on your weak topics</span></span></button>
            <button onClick={() => goLesson(review)} className="card flex items-start gap-3 bg-white p-4 text-left transition hover:border-brand-400"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><RefreshCw size={18} /></span><span><span className="block text-sm font-bold">Reinforce: {second?.topic || 'Review'}</span><span className="text-xs text-slate-500">Quick review lesson</span></span></button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-1.5 text-xs text-slate-500"><BookOpen size={14} /> Your personalized plan is saved and ready to go.</p><button onClick={async () => { await selectCourse(course.id); navigate('/dashboard'); }} className="btn btn-primary">Proceed to Dashboard <ArrowRight size={16} /></button></div>
        </section>
      </div>
    </PageShell>
  );
}
