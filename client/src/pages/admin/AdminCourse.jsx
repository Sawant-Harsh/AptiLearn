import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import AdminMetrics from '../../components/AdminMetrics';
import Gradebook from '../../components/Gradebook';
import AIQuestionBuilder from '../../components/AIQuestionBuilder';
import CreateCourseModal from '../../components/CreateCourseModal';
import Modal from '../../components/Modal';
import { Badge } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { useAdminData } from '../../lib/useAdminData';

export default function AdminCourse() {
  const { courseId } = useParams();
  const { user, isAdmin, booting, courses, api, toast } = useApp();
  const { data, loading } = useAdminData(`/api/admin/gradebook?courseId=${courseId}`);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState(false);
  const navigate = useNavigate();
  if (booting) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/courses" replace />;
  const course = courses.find((c) => c.id === courseId);
  if (!course) return <Navigate to="/admin" replace />;

  const remove = async () => { try { await api(`/api/admin/courses/${course.id}`, { method: 'DELETE' }); toast('Course deleted.'); navigate('/admin'); } catch (e) { toast(e.message, 'error'); } };

  return (
    <PageShell>
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"><ArrowLeft size={15} /> All courses</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-extrabold tracking-tight">{course.name}</h1><Badge tone="indigo">{course.category}</Badge></div><p className="muted mt-1">Analytics for students enrolled in this course.</p></div>
        <div className="flex gap-2">
          {course.custom && <button onClick={() => setDel(true)} className="btn btn-secondary !text-red-600"><Trash2 size={15} /> Delete course</button>}
          <button onClick={() => setOpen(true)} className="btn btn-primary"><PlusCircle size={16} /> Create New Course</button>
        </div>
      </div>
      <AdminMetrics m={data?.metrics} />
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_400px]">
        <Gradebook rows={data?.rows} loading={loading} pageSize={6} />
        <AIQuestionBuilder defaultCourseId={course.id} />
      </div>
      <CreateCourseModal open={open} onClose={() => setOpen(false)} />
      <Modal open={del} onClose={() => setDel(false)} title="Delete this course?" labelledBy="dc-title"><div className="px-6 pb-6 pt-2"><p className="muted">This removes the course, its questions and every student's enrolment in it.</p><div className="mt-5 flex justify-end gap-2"><button className="btn btn-secondary" onClick={() => setDel(false)}>Cancel</button><button className="btn btn-danger" onClick={remove}>Delete</button></div></div></Modal>
    </PageShell>
  );
}
