import { BookOpen, Calculator, Code2, Coffee, Cpu, Database, GitBranch, Globe, Layers, Network } from 'lucide-react';
import { cn, initials } from '../utils/format';

/** Wordmark logo: no symbol, just a confident typographic mark. */
export function Logo({ light = false, size = 'text-[22px]', className = '' }) {
  return (
    <span className={cn('inline-flex select-none items-baseline font-black tracking-tight', size, className)} aria-label="AptiLearn">
      <span className={light ? 'text-white' : 'text-navy'}>Apti</span>
      <span className="bg-gradient-to-r from-brand-500 via-violet-500 to-brand-700 bg-clip-text text-transparent">Learn</span>
      <span className="ml-0.5 inline-block h-[7px] w-[7px] rounded-full bg-emerald-500" aria-hidden="true" />
    </span>
  );
}

const ICONS = { cpu: Cpu, tree: GitBranch, calc: Calculator, network: Network, code: Code2, coffee: Coffee, layers: Layers, database: Database, globe: Globe, book: BookOpen };
const DEVICON = (n) => `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.15.1/icons/${n}/${n}-original.svg`;

/** Coursera-style course artwork: gradient + technology logos (falls back to an icon). */
export function CourseBanner({ course, className = '', compact = false }) {
  const img = course.image || {};
  const Icon = ICONS[img.icon] || BookOpen;
  const logos = img.logos || [];
  return (
    <div className={cn('relative overflow-hidden', compact ? 'h-24' : 'h-36', className)} style={{ background: `linear-gradient(135deg, ${img.from || '#4F46E5'}, ${img.to || '#0F172A'})` }} aria-hidden="true">
      {img.url && <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative flex h-full items-center justify-center gap-3 px-4">
        {logos.length ? logos.map((l) => (
          <span key={l} className={cn('grid place-items-center rounded-xl bg-white/95 shadow-lg', compact ? 'h-11 w-11 p-2' : 'h-14 w-14 p-2.5')}>
            <img src={DEVICON(l)} alt="" className="h-full w-full object-contain" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </span>
        )) : (
          <span className={cn('grid place-items-center rounded-2xl bg-white/95 text-navy shadow-lg', compact ? 'h-12 w-12' : 'h-16 w-16')}><Icon size={compact ? 24 : 32} /></span>
        )}
      </div>
    </div>
  );
}

export function CourseIcon({ name, size = 20, className = '' }) {
  const Icon = ICONS[name] || BookOpen;
  return <Icon size={size} className={className} aria-hidden="true" />;
}

const TONES = {
  indigo: 'bg-brand-50 text-brand-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700', slate: 'bg-slate-200/70 text-slate-700', navy: 'bg-navy text-white', white: 'bg-white text-navy',
};
export function Badge({ tone = 'slate', className = '', children }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold', TONES[tone], className)}>{children}</span>;
}
export const difficultyTone = { easy: 'emerald', medium: 'amber', hard: 'red' };

export function Bar({ value = 0, color = 'bg-brand-600', track = 'bg-slate-200', height = 'h-2', className = '' }) {
  return (
    <div className={cn('w-full overflow-hidden rounded-full', track, height, className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, picture, size = 'h-8 w-8', className = '' }) {
  if (picture) return <img src={picture} alt="" referrerPolicy="no-referrer" className={cn('shrink-0 rounded-full object-cover', size, className)} />;
  return <span className={cn('grid shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700', size, className)} aria-hidden="true">{initials(name)}</span>;
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5">
      {options.map((o) => {
        const val = o.value ?? o;
        const active = val === value;
        return (
          <button key={val} type="button" role="radio" aria-checked={active} onClick={() => onChange(val)}
            className={cn('rounded-md px-3 py-1.5 text-xs font-semibold transition', active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-navy')}>
            {o.label ?? o}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={cn('flex flex-wrap gap-6 border-b border-slate-200', className)}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={t.value === value} onClick={() => onChange(t.value)}
          className={cn('-mb-px border-b-2 pb-2.5 text-sm font-semibold transition', t.value === value ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-navy')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const Skeleton = ({ className = '' }) => <div className={cn('skeleton rounded-xl', className)} />;
