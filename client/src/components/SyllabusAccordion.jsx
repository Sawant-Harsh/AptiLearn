import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Circle, PlayCircle } from 'lucide-react';
import { cn } from '../utils/format';

export default function SyllabusAccordion({ modules, completed, currentId, onSelect }) {
  const currentModule = modules.find((m) => m.lessons.some((l) => l.id === currentId))?.id;
  const [open, setOpen] = useState(() => new Set(currentModule ? [currentModule] : []));
  useEffect(() => { if (currentModule) setOpen((o) => new Set(o).add(currentModule)); }, [currentModule]);

  const total = modules.reduce((s, m) => s + m.lessons.length, 0);
  const done = modules.reduce((s, m) => s + m.lessons.filter((l) => completed.includes(l.id)).length, 0);

  const toggle = (id) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold">Course syllabus</h3>
        <span className="text-xs font-medium text-slate-500">{done} / {total} lessons</span>
      </div>
      <ul>
        {modules.map((m, i) => {
          const isOpen = open.has(m.id);
          const md = m.lessons.filter((l) => completed.includes(l.id)).length;
          return (
            <li key={m.id} className="border-b border-slate-100 last:border-0">
              <button onClick={() => toggle(m.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600">{i + 1}</span>
                <span className="flex-1 text-sm font-semibold">{m.title}</span>
                <span className="text-xs text-slate-400">{md}/{m.lessons.length}</span>
                <ChevronDown size={16} className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <ul className="pb-2">
                  {m.lessons.map((l) => {
                    const isCur = l.id === currentId;
                    const isDone = completed.includes(l.id);
                    return (
                      <li key={l.id}>
                        <button onClick={() => onSelect(l.id)} aria-current={isCur ? 'true' : undefined} className={cn('flex w-full items-center gap-2.5 px-4 py-2 pl-5 text-left text-[13px] transition', isCur ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-50')}>
                          {isCur ? <PlayCircle size={16} className="shrink-0 text-brand-600" /> : isDone ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : <Circle size={16} className="shrink-0 text-slate-300" />}
                          <span className="flex-1">{l.title}</span>
                          <span className="text-xs text-slate-400">{l.minutes} min</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
