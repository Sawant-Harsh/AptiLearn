import { AlertTriangle, BarChart3, Users, Video } from 'lucide-react';

function Metric({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}><Icon size={16} /></span></div>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function AdminMetrics({ m }) {
  const x = m || { total: 0, completed: 0, average: 0, atRisk: 0, video: 0 };
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric icon={Users} label="Total students" value={x.total} sub={`${x.completed} diagnostics completed`} tone="bg-brand-100 text-brand-600" />
      <Metric icon={BarChart3} label="Class diagnostic average" value={`${x.average}%`} sub="Across completed diagnostics" tone="bg-emerald-100 text-emerald-600" />
      <Metric icon={AlertTriangle} label="At-risk students" value={x.atRisk} sub="Scoring below 55%" tone="bg-red-100 text-red-600" />
      <Metric icon={Video} label="Video completion rate" value={`${x.video}%`} sub="Average lessons completed" tone="bg-amber-100 text-amber-600" />
    </div>
  );
}
