import { Navigate } from 'react-router-dom';
import { Medal, Trophy } from 'lucide-react';
import PageShell from '../components/PageShell';
import { Avatar } from '../components/ui';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/format';

export default function Rankings() {
  const { user, isStudent, booting, rankings, rank, xp } = useApp();
  if (booting) return null;
  if (!user) return <Navigate to="/courses" replace />;
  if (!isStudent) return <Navigate to="/admin" replace />;
  const { list, me, total } = rankings;
  const inTop = list.some((r) => r.id === user.id);
  const podium = list.slice(0, 3);
  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Rankings</h1><p className="muted mt-1">Overall leaderboard across all courses. Earn XP by completing lessons, reading notes and acing quick tests.</p></div>
        <div className="card flex items-center gap-4 px-5 py-3" data-testid="my-rank"><Trophy className="text-amber-500" /><div><p className="text-lg font-extrabold">You are #{rank || '-'} <span className="text-sm font-semibold text-slate-400">of {total}</span></p><p className="text-xs text-slate-500">{xp} XP &middot; live</p></div></div>
      </div>

      {podium.length === 3 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {podium.map((r, i) => (
            <div key={r.id} className={cn('card flex items-center gap-4 p-5', i === 0 && 'border-amber-300 bg-amber-50')}>
              <span className={cn('grid h-12 w-12 place-items-center rounded-2xl', ['bg-amber-400 text-white', 'bg-slate-300 text-slate-700', 'bg-orange-300 text-orange-900'][i])}><Medal size={24} /></span>
              <div className="min-w-0"><p className="truncate font-bold">{r.name}{r.id === user.id && ' (You)'}</p><p className="text-xs text-slate-500">{r.city || 'India'} &middot; {r.xp} XP</p></div>
              <span className="ml-auto text-2xl font-black text-slate-400">#{r.rank}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-white text-xs text-slate-500"><tr><th className="px-5 py-3 font-semibold">Rank</th><th className="px-3 py-3 font-semibold">Student</th><th className="hidden px-3 py-3 font-semibold sm:table-cell">City</th><th className="hidden px-3 py-3 text-right font-semibold sm:table-cell">Courses</th><th className="px-5 py-3 text-right font-semibold">XP</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className={cn('border-b border-slate-200 last:border-0', r.id === user.id ? 'bg-brand-100/70 font-bold' : 'bg-white/50')} data-me={r.id === user.id}>
                <td className="px-5 py-3 tabular-nums">#{r.rank}</td>
                <td className="px-3 py-3"><div className="flex items-center gap-2.5"><Avatar name={r.name} picture={r.picture} size="h-8 w-8" />{r.name}{r.id === user.id && <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">YOU</span>}</div></td>
                <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">{r.city || '-'}</td>
                <td className="hidden px-3 py-3 text-right text-slate-500 sm:table-cell">{r.courses}</td>
                <td className="px-5 py-3 text-right tabular-nums">{r.xp}</td>
              </tr>
            ))}
            {!inTop && me && <tr className="bg-brand-100/70 font-bold"><td className="px-5 py-3">#{me.rank}</td><td className="px-3 py-3">{me.name} <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">YOU</span></td><td className="hidden px-3 py-3 sm:table-cell">{me.city || '-'}</td><td className="hidden px-3 py-3 text-right sm:table-cell">{me.courses}</td><td className="px-5 py-3 text-right">{me.xp}</td></tr>}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
