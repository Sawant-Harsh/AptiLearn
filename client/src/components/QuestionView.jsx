import { Badge, difficultyTone } from './ui';
import { cn } from '../utils/format';

/** Shared question body: lead text, table, code block. */
export function QuestionBody({ q }) {
  return (
    <>
      {q.lead && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{q.lead}</p>}
      {q.code && (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 text-[13px] leading-relaxed text-slate-100"><code>{q.code}</code></pre>
      )}
      {q.table && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row">
            <table className="w-full text-left text-sm sm:w-auto sm:min-w-[320px]">
              <thead>
                <tr className="text-xs text-slate-500">{q.table.headers.map((h) => <th key={h} className="px-4 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {q.table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-200">{r.map((c, j) => <td key={j} className={cn('px-4 py-1.5', j === 0 && 'font-semibold')}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {q.table.note && <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:ml-auto sm:max-w-[240px] sm:border-l sm:border-t-0">{q.table.note}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export function QuestionMeta({ q }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="indigo">{q.topic}</Badge>
      <Badge tone={difficultyTone[q.difficulty]} className="capitalize">{q.difficulty}</Badge>
    </div>
  );
}
