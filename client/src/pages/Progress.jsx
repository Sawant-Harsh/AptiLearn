import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, ExternalLink, Flame, ListChecks, PlayCircle, Search, Trophy } from 'lucide-react';
import PageShell from '../components/PageShell';
import QuickTest from '../components/QuickTest';
import ScoreWheel from '../components/ScoreWheel';
import { Badge, Bar, CourseBanner } from '../components/ui';
import { useApp } from '../context/AppContext';
import { lessonForTopic, ytSearchUrl } from '../utils/courseUtils';
import { masteryLevel } from '../utils/scoring';
import { cn } from '../utils/format';

export default function Progress() {
  const { user, isStudent, booting, courses, enrolledIds, me, selectedCourseId, selectCourse, courseProgress, topicMastery, streak, xp, rank, rankTotal, setChatContext } = useApp();
  const navigate = useNavigate();
  const [id, setId] = useState(null);
  const courseId = enrolledIds.includes(id) ? id : selectedCourseId;
  const course = courses.find((c) => c.id === courseId);
  useEffect(() => { if (course) setChatContext({ course: course.name }); return () => setChatContext(null); }, [course?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (booting) return null;
  if (!user) return <Navigate to="/courses" replace />;
  if (!isStudent) return <Navigate to="/admin" replace />;

  if (!course) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><BookOpen size={26} /></span>
          <h1 className="mt-5 text-2xl font-extrabold">You haven't enrolled in a course yet</h1>
          <p className="muted mt-2">Pick a course, take the diagnostic, and your progress will appear here in real time.</p>
          <Link to="/courses" className="btn btn-primary mt-6">Browse courses</Link>
        </div>
      </PageShell>
    );
  }

  const e = me.enrollments[course.id];
  const prog = courseProgress(course.id);
  const mastery = topicMastery(course.id);
  const assessed = mastery.filter((m) => m.mastery != null);
  const weak = assessed.filter((m) => m.mastery < 80).sort((a, b) => a.mastery - b.mastery);
  const strong = assessed.filter((m) => m.mastery >= 80).sort((a, b) => b.mastery - a.mastery);
  const quizAcc = e.quiz.total ? Math.round((e.quiz.correct / e.quiz.total) * 100) : null;

  const study = async (lesson) => { await selectCourse(course.id); navigate(`/dashboard?lesson=${lesson.id}`); };

  return (
    <PageShell>
      <h1 className="text-3xl font-extrabold tracking-tight">My progress</h1>
      <p className="muted mt-1">Everything you have learned, updating in real time.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-500"><Flame size={22} /></span><div><p className="text-lg font-extrabold">{streak}-Day Streak</p><p className="text-xs text-slate-500">Keep it going</p></div></div>
        <Link to="/rankings" className="card flex items-center gap-4 p-4 hover:border-brand-300"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600"><Trophy size={22} /></span><div><p className="text-lg font-extrabold">Rank #{rank || '-'} / {rankTotal}</p><p className="text-xs text-slate-500">Overall ranking</p></div></Link>
        <div className="card flex items-center gap-4 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-600"><Award size={22} /></span><div><p className="text-lg font-extrabold">{xp} XP</p><p className="text-xs text-slate-500">Across {enrolledIds.length} course{enrolledIds.length > 1 ? 's' : ''}</p></div></div>
        <div className="card flex items-center gap-4 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><ListChecks size={22} /></span><div><p className="text-lg font-extrabold">{e.quiz.sets} quick tests</p><p className="text-xs text-slate-500">{quizAcc == null ? 'None taken yet' : `${quizAcc}% accuracy`}</p></div></div>
      </div>

      <h2 className="mt-10 text-lg font-extrabold">Your courses</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrolledIds.map((cid) => {
          const c = courses.find((x) => x.id === cid); const p = courseProgress(cid); const diag = me.enrollments[cid].diagnostic; const on = cid === course.id;
          return (
            <button key={cid} onClick={() => setId(cid)} aria-pressed={on} className={cn('card flex overflow-hidden text-left transition hover:shadow-pop', on && 'border-brand-600 ring-2 ring-brand-600/25')}>
              <CourseBanner course={c} compact className="w-24 shrink-0" />
              <div className="min-w-0 flex-1 p-4"><p className="truncate text-sm font-bold">{c.name}</p><p className="mt-0.5 text-xs text-slate-500">{diag ? `Diagnostic ${Math.round(diag.accuracy)}%` : 'Diagnostic pending'}</p><Bar value={p.pct} color="bg-emerald-500" height="h-1.5" className="mt-2" /><p className="mt-1 text-xs font-bold">{p.pct}% complete &middot; {p.done}/{p.total} lessons</p></div>
            </button>
          );
        })}
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]" aria-label={`${course.name} progress`}>
        <div className="card flex flex-col items-center p-6">
          <h2 className="self-start text-sm font-bold">{course.name}</h2>
          {e.diagnostic ? (
            <>
              <div className="mt-4"><ScoreWheel value={e.diagnostic.accuracy} caption="Diagnostic accuracy" /></div>
              <Link to={`/results?course=${course.id}`} className="mt-4 text-xs font-bold text-brand-600 hover:underline">View full diagnostic results</Link>
            </>
          ) : (
            <div className="mt-6 text-center"><p className="text-sm text-slate-600">You haven't taken the diagnostic for this course.</p><Link to={`/diagnostic?course=${course.id}`} className="btn btn-primary mt-4">Take diagnostic</Link></div>
          )}
          <dl className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-center">
            <div><dt className="text-[11px] text-slate-500">Completion</dt><dd className="text-sm font-bold">{prog.pct}%</dd></div>
            <div><dt className="text-[11px] text-slate-500">Lessons</dt><dd className="text-sm font-bold">{prog.done}/{prog.total}</dd></div>
            <div><dt className="text-[11px] text-slate-500">Notes read</dt><dd className="text-sm font-bold">{e.notesRead.length}</dd></div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-bold">Topic mastery</h2>
          {assessed.length === 0 ? <p className="mt-4 text-sm text-slate-500">Take the diagnostic or a quick test to see your strong and weak topics.</p> : (
            <ul className="mt-5 space-y-4">
              {mastery.map((m) => { const lv = masteryLevel(m.mastery); return (
                <li key={m.topic} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 sm:grid-cols-[160px_1fr_auto_100px]">
                  <span className="text-sm font-medium">{m.topic}</span><Bar value={m.mastery ?? 0} color={lv.bar} height="h-2.5" />
                  <span className="w-9 text-right text-sm font-bold">{m.mastery == null ? '-' : `${m.mastery}%`}</span>
                  <span className={`hidden whitespace-nowrap rounded-md px-2 py-0.5 text-center text-xs font-semibold sm:block ${lv.chip}`}>{lv.label}</span>
                </li>); })}
            </ul>
          )}
          {strong.length > 0 && <p className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-emerald-500" /> Strong: {strong.map((s) => <Badge key={s.topic} tone="emerald">{s.topic}</Badge>)}</p>}
        </div>
      </section>

      <section className="mt-8" aria-label="Recommended learning">
        <h2 className="text-lg font-extrabold">Recommended for your weak topics</h2>
        <p className="muted mt-1">Lessons and videos picked from your lowest-scoring topics.</p>
        {weak.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{assessed.length ? 'No weak topics right now. Great work! Keep practising to stay sharp.' : 'Complete the diagnostic or a quick test to unlock personalised recommendations.'}</p> : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {weak.slice(0, 6).map((w) => {
              const l = lessonForTopic(course, w.topic);
              const lv = masteryLevel(w.mastery);
              return (
                <div key={w.topic} className="card flex flex-col p-5">
                  <div className="flex items-center justify-between"><Badge tone={lv.key === 'focus' ? 'red' : 'amber'}>{lv.label}</Badge><span className="text-sm font-extrabold">{w.mastery}%</span></div>
                  <h3 className="mt-3 font-bold">{w.topic}</h3>
                  <p className="mt-1 flex-1 text-xs text-slate-600">{l ? `Start with "${l.title}" (${l.minutes} min), then test yourself.` : 'Review this topic and practise.'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {l && <button onClick={() => study(l)} className="btn btn-primary btn-sm"><PlayCircle size={14} /> Watch lesson</button>}
                    <a href={ytSearchUrl(`${course.name} ${w.topic} tutorial`)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><Search size={13} /> More videos <ExternalLink size={11} /></a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-10"><QuickTest course={course} id="progress-quick-test" /></div>
    </PageShell>
  );
}
