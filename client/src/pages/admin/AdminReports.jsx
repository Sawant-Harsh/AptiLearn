import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import PageShell from '../../components/PageShell';
import AdminMetrics from '../../components/AdminMetrics';
import { Bar } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { useAdminData } from '../../lib/useAdminData';
import { masteryLevel } from '../../utils/scoring';

export default function AdminReports() {
  const { user, isAdmin, booting, courses } = useApp();
  const [courseId, setCourseId] = useState('');
  const { data } = useAdminData(`/api/admin/reports${courseId ? `?courseId=${courseId}` : ''}`);
  if (booting) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/courses" replace />;
  const max = Math.max(1, ...(data?.buckets || []).map((b) => b.n));
  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Reports</h1><p className="muted mt-1">Class-level insight for {data?.course?.name || 'your course'}.</p></div>
        <div><label className="label" htmlFor="rp-course">Course</label><select id="rp-course" className="input w-64" value={courseId || data?.course?.id || ''} onChange={(e) => setCourseId(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <AdminMetrics m={data?.metrics} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="flex items-center gap-2 text-base font-extrabold"><TrendingUp size={18} className="text-brand-600" /> Class mastery by topic</h2>
          <ul className="mt-4 space-y-3.5">{(data?.topics || []).map((t) => <li key={t.topic} className="grid grid-cols-[150px_1fr_44px] items-center gap-3 text-sm"><span className="truncate font-medium">{t.topic}</span><Bar value={t.value ?? 0} color={masteryLevel(t.value).bar} height="h-2.5" /><span className="text-right font-bold">{t.value == null ? '-' : `${t.value}%`}</span></li>)}</ul></section>
        <section className="card p-5"><h2 className="text-base font-extrabold">Score distribution</h2>
          <div className="mt-5 flex h-44 items-end gap-2">{(data?.buckets || []).map((b) => <div key={b.lo} className="flex flex-1 flex-col items-center gap-1.5"><span className="text-xs font-bold">{b.n}</span><div className={`w-full rounded-t-md ${b.lo < 40 ? 'bg-red-400' : b.lo < 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ height: `${(b.n / max) * 100}%`, minHeight: 4 }} /><span className="text-[11px] text-slate-500">{b.lo}-{b.hi}</span></div>)}</div></section>
        <section className="card p-5 lg:col-span-2"><h2 className="text-base font-extrabold">At-risk students ({data?.atRisk?.length || 0})</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(data?.atRisk || []).map((s) => <li key={s.studentId} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm"><span className="font-semibold">{s.name}</span><span className="font-bold text-red-600">{s.score}%</span></li>)}</ul></section>
      </div>
    </PageShell>
  );
}
