import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import AdminMetrics from '../../components/AdminMetrics';
import Gradebook from '../../components/Gradebook';
import { useApp } from '../../context/AppContext';
import { useAdminData } from '../../lib/useAdminData';

export default function AdminStudents() {
  const { user, isAdmin, booting, courses } = useApp();
  const [courseId, setCourseId] = useState('');
  const { data, loading } = useAdminData(`/api/admin/gradebook${courseId ? `?courseId=${courseId}` : ''}`);
  if (booting) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/courses" replace />;
  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Students</h1><p className="muted mt-1">Every enrolled learner across courses. Send a support message and it reaches their notifications instantly.</p></div>
        <div><label className="label" htmlFor="st-course">Course</label><select id="st-course" className="input w-64" value={courseId} onChange={(e) => setCourseId(e.target.value)}><option value="">All courses</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <AdminMetrics m={data?.metrics} />
      <div className="mt-6"><Gradebook rows={data?.rows} loading={loading} pageSize={10} showCourse title="Student gradebook" /></div>
    </PageShell>
  );
}
