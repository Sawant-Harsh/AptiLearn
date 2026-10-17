import { CheckCircle2, Clock, HelpCircle, Layers } from 'lucide-react';
import { Badge, Bar, CourseBanner } from './ui';
import { cn } from '../utils/format';

export default function CourseCard({ course, active, progress, onSelect }) {
  return (
    <button role="radio" aria-checked={active} onClick={() => onSelect(course.id)}
      className={cn('card group relative flex flex-col overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-pop', active && 'border-brand-600 ring-2 ring-brand-600/25')}>
      <CourseBanner course={course} />
      {active && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white text-brand-600 shadow"><CheckCircle2 size={18} /></span>}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1.5"><Badge tone="indigo">{course.category}</Badge><Badge>{course.level}</Badge>{course.custom && <Badge tone="emerald">New</Badge>}</div>
        <h3 className="mt-3 text-base font-bold leading-snug">{course.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{course.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><Layers size={13} /> {course.topics.length} topics</span>
          <span className="inline-flex items-center gap-1"><Clock size={13} /> {course.hours}h</span>
          <span className="inline-flex items-center gap-1"><HelpCircle size={13} /> {course.questionCount ?? 0} questions</span>
        </div>
        {progress && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="mb-1 flex justify-between text-[11px] font-semibold"><span className="text-emerald-700">Enrolled</span><span>{progress.pct}% complete</span></div>
            <Bar value={progress.pct} color="bg-emerald-500" height="h-1.5" />
          </div>
        )}
      </div>
    </button>
  );
}
