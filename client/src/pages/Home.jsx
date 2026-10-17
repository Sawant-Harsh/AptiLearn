import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Clock, Lightbulb, ListChecks, Search, ShieldCheck, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react';
import PageShell from '../components/PageShell';
import CourseCard from '../components/CourseCard';
import { Faq, Reviews } from '../components/FaqReviews';
import { Badge, Bar, CourseBanner, Skeleton } from '../components/ui';
import { useApp } from '../context/AppContext';
import { cn, firstName } from '../utils/format';

const STEPS = [
  { icon: Target, title: 'Diagnose', text: 'A short adaptive test finds what you know and what you do not.' },
  { icon: Sparkles, title: 'Personalize', text: 'We build a learning path around your gaps, not a generic syllabus.' },
  { icon: TrendingUp, title: 'Master', text: 'Video lessons, quick tests and AI help keep you moving until it clicks.' },
];
const MIN_QUESTIONS = 5;

export default function Home() {
  const { user, isStudent, isAdmin, courses, booting, me, enrolledIds, selectedCourseId, courseProgress, selectCourse, enroll, openLogin, guestCourseId, setGuestCourseId, toast, rank, xp } = useApp();
  const navigate = useNavigate();
  const [pickedId, setPickedId] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  const picked = courses.find((c) => c.id === (pickedId || (isStudent ? selectedCourseId : guestCourseId))) || courses[0];
  useEffect(() => { if (isAdmin) navigate('/admin', { replace: true }); }, [isAdmin, navigate]);

  const cats = useMemo(() => ['All', ...new Set(courses.map((c) => c.category))], [courses]);
  const shown = courses.filter((c) => (cat === 'All' || c.category === cat) && `${c.name} ${c.description} ${c.topics.join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  const enrolledCourses = enrolledIds.map((id) => courses.find((c) => c.id === id)).filter(Boolean);
  const isEnrolled = !!picked && enrolledIds.includes(picked.id);
  const hasDiag = isEnrolled && !!me.enrollments[picked.id].diagnostic;
  const ready = picked && (picked.questionCount ?? 0) >= MIN_QUESTIONS;

  const choose = (id) => { setPickedId(id); if (!user) setGuestCourseId(id); };

  const begin = async () => {
    if (!picked) return;
    if (!user) return openLogin({ tab: 'student', redirectTo: `/diagnostic?course=${picked.id}` });
    try { if (!isEnrolled) await enroll(picked.id); navigate(`/diagnostic?course=${picked.id}`); } catch (e) { toast(e.message, 'error'); }
  };
  const open = async () => { try { await selectCourse(picked.id); navigate('/dashboard'); } catch (e) { toast(e.message, 'error'); } };

  return (
    <PageShell>
      <p className="text-xs font-semibold text-brand-700">{isStudent ? `Welcome back, ${firstName(user.name)}. Pick up a course or start a new one.` : 'Your personalized learning journey'}</p>

      <section id="how" className="mt-3 scroll-mt-24 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-emerald-50 p-6 sm:p-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Badge tone="indigo" className="py-1">Less guesswork. More growth.</Badge>
            <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl">A learning path as <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">unique as you.</span></h1>
            <p className="mt-4 text-lg text-slate-600">Start with a short AI-driven assessment. We uncover your strengths, find the gaps, and build a plan that adapts as you improve.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary px-6 py-3">Explore courses <ArrowRight size={16} /></button>
              {!user && <button onClick={() => openLogin()} className="btn btn-secondary px-6 py-3">Sign in</button>}
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[[courses.length || 9, 'courses'], [`${courses.reduce((a, c) => a + (c.questionCount || 0), 0)}+`, 'practice questions'], ['24/7', 'AI study help']].map(([v, l]) => (
                <div key={l}><dt className="sr-only">{l}</dt><dd><span className="text-2xl font-extrabold text-navy">{v}</span> <span className="text-slate-500">{l}</span></dd></div>
              ))}
            </dl>
          </div>
          <ol className="grid grid-cols-3 gap-3 sm:gap-5">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="w-28 text-center sm:w-40">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-brand-100 bg-white text-brand-600 shadow-card"><Icon size={26} /></span>
                <p className="mt-3 text-sm font-bold">{title}</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {isStudent && enrolledCourses.length > 0 && (
        <section className="mt-10" aria-label="Your courses">
          <div className="flex items-end justify-between"><div><h2 className="section-title">Your enrolled courses</h2><p className="muted mt-1">Your progress is saved and updates as you learn.</p></div><span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 sm:inline-flex"><Trophy size={14} /> Rank #{rank || '-'} &middot; {xp} XP</span></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map((c) => {
              const p = courseProgress(c.id);
              const e = me.enrollments[c.id];
              return (
                <div key={c.id} className="card flex overflow-hidden">
                  <CourseBanner course={c} compact className="w-28 shrink-0" />
                  <div className="min-w-0 flex-1 p-4">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{e.diagnostic ? `Diagnostic ${Math.round(e.diagnostic.accuracy)}%` : 'Diagnostic pending'} &middot; {p.done}/{p.total} lessons</p>
                    <Bar value={p.pct} color="bg-emerald-500" height="h-1.5" className="mt-2" />
                    <div className="mt-2 flex items-center justify-between"><span className="text-xs font-bold">{p.pct}% complete</span><button className="text-xs font-bold text-brand-600 hover:underline" onClick={async () => { await selectCourse(c.id); navigate('/dashboard'); }}>Continue</button></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section id="courses" className="mt-12 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="section-title">What would you like to master?</h2><p className="muted mt-1">Choose a subject to begin. You can explore the others any time.</p></div>
          <div className="relative w-full sm:w-72"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search courses or topics" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search courses" /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {cats.map((c) => <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={cn('rounded-full border px-4 py-1.5 text-xs font-semibold transition', cat === c ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-navy')}>{c}</button>)}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Courses">
            {booting && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-72" />)}
            {shown.map((c) => <CourseCard key={c.id} course={c} active={picked?.id === c.id} progress={enrolledIds.includes(c.id) ? courseProgress(c.id) : null} onSelect={choose} />)}
            {!booting && !shown.length && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No courses match your search. Try a different keyword or category.</p>}
          </div>

          {picked && (
            <aside className="card h-fit overflow-hidden lg:sticky lg:top-24" aria-live="polite">
              <CourseBanner course={picked} compact />
              <div className="p-6">
                <Badge tone="indigo">{isEnrolled ? 'You are enrolled' : 'Your selected subject'}</Badge>
                <h3 className="mt-3 text-xl font-extrabold">{picked.name}</h3>
                <p className="muted mt-1">{picked.description}</p>
                <ul className="mt-5 space-y-3.5 text-sm">
                  <li className="flex gap-3"><ListChecks size={18} className="mt-0.5 shrink-0 text-brand-600" /><div><p className="font-semibold">{Math.min(15, picked.questionCount || 0)} questions</p><p className="text-xs text-slate-500">Difficulty adapts to your answers</p></div></li>
                  <li className="flex gap-3"><Clock size={18} className="mt-0.5 shrink-0 text-brand-600" /><div><p className="font-semibold">About 20 minutes</p><p className="text-xs text-slate-500">Complete in one focused session</p></div></li>
                  <li className="flex gap-3"><Lightbulb size={18} className="mt-0.5 shrink-0 text-brand-600" /><div><p className="font-semibold">Your personal learning plan</p><p className="text-xs text-slate-500">{picked.modules.length} modules, topic-level insights</p></div></li>
                </ul>
                <p className="label mt-5">What you will cover</p>
                <div className="flex flex-wrap gap-1.5">{picked.topics.map((t) => <span key={t} className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">{t}</span>)}</div>
                {isEnrolled && <div className="mt-5"><div className="mb-1 flex justify-between text-xs font-semibold"><span>Your progress</span><span>{courseProgress(picked.id).pct}%</span></div><Bar value={courseProgress(picked.id).pct} color="bg-emerald-500" /></div>}
                {isEnrolled && <button onClick={open} className="btn btn-primary mt-5 w-full">Continue learning</button>}
                <button onClick={begin} disabled={!ready} className={cn('btn mt-3 w-full', isEnrolled ? 'btn-secondary' : 'btn-primary')}>{!ready ? 'Diagnostic coming soon' : hasDiag ? 'Retake diagnostic' : 'Begin Diagnostic Assessment'}</button>
                <p className="mt-3 text-center text-xs text-slate-400">No preparation needed. Just bring your curiosity.</p>
              </div>
            </aside>
          )}
        </div>
      </section>

      <div className="mt-10 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><ShieldCheck size={18} className="shrink-0" /><p>A safe space to learn. Your diagnostic helps you grow. It doesn't affect your academic grades.</p></div>

      {!user && (
        <section className="mt-12 grid items-center gap-6 rounded-3xl bg-navy p-8 text-white md:grid-cols-[1fr_auto]">
          <div><h2 className="text-2xl font-extrabold">Learn with an AI tutor that never sleeps</h2><p className="mt-2 max-w-xl text-slate-300">Create a free account to save your progress, climb the rankings, and chat with AptiBot about anything you are studying.</p></div>
          <button onClick={() => openLogin()} className="btn bg-white px-6 py-3 text-navy hover:bg-slate-100"><Bot size={16} /> Get started free</button>
        </section>
      )}
      <div className="mt-14"><Faq /></div>
    </PageShell>
  );
}
