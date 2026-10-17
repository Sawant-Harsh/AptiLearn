import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, Flame, Sparkles, Trophy } from 'lucide-react';
import PageShell from '../components/PageShell';
import VideoPlayer from '../components/VideoPlayer';
import SyllabusAccordion from '../components/SyllabusAccordion';
import QuickTest from '../components/QuickTest';
import { Faq, Reviews } from '../components/FaqReviews';
import { Avatar, Badge, Bar } from '../components/ui';
import { useApp } from '../context/AppContext';
import { lessonsOf, notesFor } from '../utils/courseUtils';
import { buildPdf } from '../utils/pdf';
import { downloadBlob, firstName } from '../utils/format';

export default function Dashboard() {
  const { user, isStudent, booting, course, courses, enrolledIds, enrollment, selectCourse, lessonAction, courseProgress, topicMastery, streak, rank, rankTotal, xp, setChatContext, toast } = useApp();
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const [lessonId, setLessonId] = useState(null);

  const lessons = useMemo(() => (course ? lessonsOf(course) : []), [course]);
  useEffect(() => {
    if (!course) return;
    const wanted = params.get('lesson');
    const saved = localStorage.getItem(`aptilearn:lesson:${user?.id}:${course.id}`);
    const firstOpen = lessons.find((l) => !enrollment?.completedLessons.includes(l.id));
    const pick = [wanted, saved, firstOpen?.id, lessons[0]?.id].find((id) => id && lessons.some((l) => l.id === id));
    setLessonId(pick);
  }, [course?.id, params.get('lesson')]); // eslint-disable-line react-hooks/exhaustive-deps

  const lesson = lessons.find((l) => l.id === lessonId) || lessons[0];
  useEffect(() => { if (course && lesson) { setChatContext({ course: course.name, lesson: lesson.title }); localStorage.setItem(`aptilearn:lesson:${user.id}:${course.id}`, lesson.id); } return () => setChatContext(null); }, [course?.id, lesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 300); }, [hash, course?.id]);

  if (booting) return null;
  if (!user) return <Navigate to="/courses" replace />;
  if (!isStudent) return <Navigate to="/admin" replace />;
  if (!course || !lesson) return <Navigate to="/courses" replace />;

  const prog = courseProgress(course.id);
  const done = enrollment.completedLessons;
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const mastery = topicMastery(course.id).filter((m) => m.mastery != null).sort((a, b) => a.mastery - b.mastery);
  const weak = mastery[0];
  const fields = [user.name, user.profile?.roll, user.profile?.program, user.profile?.university, user.profile?.phone, user.profile?.city];
  const profilePct = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const complete = async () => {
    if (done.includes(lesson.id)) return;
    try { await lessonAction(course.id, lesson.id, 'complete'); toast('Lesson complete. +20 XP'); const next = lessons[idx + 1]; if (next) setLessonId(next.id); } catch (e) { toast(e.message, 'error'); }
  };
  const notes = async () => {
    downloadBlob(buildPdf(lesson.title, notesFor(course, lesson)), `${lesson.id}-notes.pdf`);
    if (!enrollment.notesRead.includes(lesson.id)) { try { await lessonAction(course.id, lesson.id, 'notes'); toast('Notes saved. +5 XP'); } catch { /* ignore */ } }
  };

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Keep your momentum, {firstName(user.name)}.</h1>
          <p className="muted mt-1">Today's focus: {weak && weak.mastery < 80 ? `build confidence in ${weak.topic}.` : `continue with ${lesson.title}.`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="indigo" className="py-1.5"><Sparkles size={12} /> Your AI learning plan</Badge>
          {enrolledIds.length > 1 && (
            <select className="input !w-auto !py-1.5 text-xs font-semibold" aria-label="Switch course" value={course.id} onChange={(e) => selectCourse(e.target.value)}>
              {enrolledIds.map((id) => <option key={id} value={id}>{courses.find((c) => c.id === id)?.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-4" data-testid="streak-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-500"><Flame size={22} /></span><div><p className="text-lg font-extrabold">{streak}-Day Streak</p><p className="text-xs text-slate-500">A little learning, every day.</p></div></div>
        <Link to="/rankings" className="card flex items-center gap-4 p-4 transition hover:border-brand-300" data-testid="rank-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600"><Trophy size={22} /></span><div><p className="text-lg font-extrabold">Rank #{rank || '-'} <span className="text-sm font-semibold text-slate-400">/ {rankTotal}</span></p><p className="text-xs text-slate-500">{xp} XP &middot; updates live</p></div></Link>
        <div className="card flex items-center gap-4 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 size={22} /></span><div className="min-w-0 flex-1"><p className="text-lg font-extrabold">{prog.pct}% complete</p><Bar value={prog.pct} color="bg-emerald-500" height="h-1.5" className="mt-1.5" /><p className="mt-1 text-[11px] text-slate-500">{prog.done} of {prog.total} lessons</p></div></div>
        <Link to="/profile" className="card flex items-center gap-4 p-4 transition hover:border-brand-300"><Avatar name={user.name} picture={user.picture} size="h-11 w-11 text-sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user.name}</p><div className="mt-1.5 flex items-center gap-2"><Bar value={profilePct} color="bg-brand-600" height="h-1.5" /><span className="text-[11px] text-slate-500">{profilePct}%</span></div><p className="mt-1 text-[11px] text-slate-500">Profile {profilePct === 100 ? 'complete' : 'in progress'}</p></div></Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <VideoPlayer key={lesson.id} course={course} lesson={lesson} lessonNumber={lessons.filter((l) => l.moduleId === lesson.moduleId).findIndex((l) => l.id === lesson.id) + 1} onEnded={complete} />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-xl font-extrabold">{lesson.title}</h2><p className="muted">{course.name} &middot; {lesson.moduleTitle} &middot; {lesson.minutes} min</p></div>
            <div className="flex gap-2">
              <button onClick={notes} className="btn btn-secondary btn-sm"><Download size={14} /> PDF notes</button>
              {done.includes(lesson.id) ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} /> Completed</span> : <button onClick={complete} className="btn btn-primary btn-sm">Mark complete</button>}
            </div>
          </div>
          <ul className="card grid gap-2 p-4 text-sm sm:grid-cols-3">{lesson.points.map((p) => <li key={p} className="flex gap-2 text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />{p}</li>)}</ul>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SyllabusAccordion modules={course.modules} completed={done} currentId={lesson.id} onSelect={setLessonId} />
        </aside>
      </div>

      <div className="mt-10"><QuickTest course={course} /></div>
      <div className="mt-14"><Faq /></div>
      <div className="mt-14"><Reviews /></div>
    </PageShell>
  );
}
