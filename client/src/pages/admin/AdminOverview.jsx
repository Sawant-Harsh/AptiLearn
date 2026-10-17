import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Clock, PlusCircle, Users } from 'lucide-react';
import PageShell from '../../components/PageShell';
import CreateCourseModal from '../../components/CreateCourseModal';
import { Badge, CourseBanner, Skeleton } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { useAdminData } from '../../lib/useAdminData';

export default function AdminOverview() {
  const { user, isAdmin, booting } = useApp();
  const { data, loading, error } = useAdminData('/api/admin/overview');
  const [open, setOpen] = useState(false);
  if (booting) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/courses" replace />;
  const courses = data?.courses || [];
  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Every learner, in focus.</h1><p className="muted mt-1">Choose a course to see its students, diagnostics and at-risk learners. Everything updates in real time.</p></div>
        <button onClick={() => setOpen(true)} className="btn btn-primary" data-testid="create-course"><PlusCircle size={16} /> Create New Course</button>
      </div>
      {data && (
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Badge tone="indigo" className="px-3 py-1.5"><Users size={13} /> {data.totals.students} students</Badge>
          <Badge tone="emerald" className="px-3 py-1.5">{data.totals.enrollments} enrolments</Badge>
          <Badge tone="red" className="px-3 py-1.5"><AlertTriangle size={13} /> {data.totals.atRisk} at-risk</Badge>
        </div>
      )}
      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64" />)}
        {courses.map((c) => (
          <Link key={c.id} to={`/admin/course/${c.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop" data-testid={`course-card-${c.id}`}>
            <CourseBanner course={c} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex flex-wrap gap-1.5"><Badge tone="indigo">{c.category}</Badge>{c.custom && <Badge tone="emerald">Custom</Badge>}</div>
              <h2 className="mt-2.5 font-bold">{c.name}</h2>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200"><dt className="text-[10px] text-slate-500">Students</dt><dd className="text-base font-extrabold">{c.metrics.total}</dd></div>
                <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200"><dt className="text-[10px] text-slate-500">Avg score</dt><dd className="text-base font-extrabold">{c.metrics.average}%</dd></div>
                <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200"><dt className="text-[10px] text-slate-500">At-risk</dt><dd className="text-base font-extrabold text-red-600">{c.metrics.atRisk}</dd></div>
              </dl>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600">View course analytics <ArrowRight size={15} className="transition group-hover:translate-x-0.5" /></span>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Clock size={12} /> Analytics update in real time</p>
      <CreateCourseModal open={open} onClose={() => setOpen(false)} />
    </PageShell>
  );
}
