import { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, Segmented } from './ui';
import { getCourse } from '../data/courses';
import { cn } from '../utils/format';

const DRAFT_KEY = 'aptilearn:qdraft';
const blank = (courseId = 'os') => ({ courseId, topic: getCourse(courseId).topics[1] || getCourse(courseId).topics[0], text: '', code: '', options: ['', '', '', ''], answer: 0, explanation: '', difficulty: 'medium' });

export default function QuestionBuilder() {
  const { courses, config, saveConfig, addCustomQuestion, toast } = useApp();
  const [f, setF] = useState(() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || blank(); } catch { return blank(); } });
  const [cfg, setCfg] = useState(config);
  const [errors, setErrors] = useState({});
  const topics = getCourse(f.courseId).topics;

  useEffect(() => setCfg(config), [config]);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setOpt = (i, v) => setF((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? v : o)) }));
  const total = cfg.weights.easy + cfg.weights.medium + cfg.weights.hard;

  const validate = () => {
    const e = {};
    if (f.text.trim().length < 10) e.text = 'Write the full question (at least 10 characters).';
    const filled = f.options.map((o) => o.trim());
    if (filled.some((o) => !o)) e.options = 'Fill in all four answer options.';
    else if (new Set(filled.map((o) => o.toLowerCase())).size < 4) e.options = 'Answer options must be different from each other.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const add = () => {
    if (!validate()) return toast('Fix the highlighted fields first.', 'error');
    addCustomQuestion({ courseId: f.courseId, topic: f.topic, difficulty: f.difficulty, text: f.text.trim(), code: f.code.trim() || undefined, options: f.options.map((o) => o.trim()), answer: f.answer, explanation: f.explanation.trim() || 'Added by your teacher.' });
    localStorage.removeItem(DRAFT_KEY);
    setF(blank(f.courseId));
    toast('Question added to the bank.');
  };
  const draft = () => { localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); toast('Draft saved on this device.'); };

  const applyCfg = () => {
    if (total !== 100) return toast(`Difficulty mix must total 100% (now ${total}%).`, 'error');
    if (cfg.mastered <= cfg.developing) return toast('The mastered cutoff must be above the developing cutoff.', 'error');
    saveConfig(cfg);
    toast('Weights and thresholds applied to new diagnostics.');
  };
  const num = (v) => Math.max(0, Math.min(100, Number(v) || 0));

  return (
    <section className="card p-5" aria-label="Custom diagnostic question builder">
      <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Custom question builder</h2><Badge>Draft</Badge></div>

      <div className="mt-4 grid gap-3">
        <div><label className="label" htmlFor="qb-course">Subject</label>
          <select id="qb-course" className="input" value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value, topic: getCourse(e.target.value).topics[0] })}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="qb-topic">Topic</label>
          <select id="qb-topic" className="input" value={f.topic} onChange={(e) => set('topic', e.target.value)}>{topics.map((t) => <option key={t}>{t}</option>)}</select></div>
      </div>

      <div className="mt-3">
        <label className="label" htmlFor="qb-text">Question text</label>
        <textarea id="qb-text" rows={3} className={cn('input', errors.text && 'border-red-400')} placeholder="Which page replacement algorithm can exhibit Belady's anomaly?" value={f.text} onChange={(e) => set('text', e.target.value)} />
        {errors.text && <p className="mt-1 text-xs text-red-600">{errors.text}</p>}
      </div>
      <div className="mt-3">
        <label className="label" htmlFor="qb-code">Code snippet (optional)</label>
        <textarea id="qb-code" rows={2} className="input font-mono text-xs" value={f.code} onChange={(e) => set('code', e.target.value)} />
      </div>

      <fieldset className="mt-3">
        <legend className="label">Answer options and correct answer</legend>
        <div className="space-y-2">
          {f.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={f.answer === i} onChange={() => set('answer', i)} aria-label={`Mark option ${'ABCD'[i]} as correct`} className="h-4 w-4 accent-emerald-500" />
              <span className="w-4 text-xs font-bold text-slate-500">{'ABCD'[i]}</span>
              <input className={cn('input py-2', errors.options && !o.trim() && 'border-red-400')} value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${'ABCD'[i]}`} aria-label={`Option ${'ABCD'[i]}`} />
            </div>
          ))}
        </div>
        {errors.options && <p className="mt-1 text-xs text-red-600">{errors.options}</p>}
      </fieldset>

      <div className="mt-3">
        <label className="label" htmlFor="qb-exp">Explanation shown after practice (optional)</label>
        <input id="qb-exp" className="input" value={f.explanation} onChange={(e) => set('explanation', e.target.value)} />
      </div>

      <div className="mt-4"><p className="label">Difficulty</p>
        <Segmented label="Difficulty" value={f.difficulty} onChange={(v) => set('difficulty', v)} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} /></div>

      <div className="mt-4 flex gap-2">
        <button className="btn btn-secondary flex-1" onClick={draft}><Save size={15} /> Save draft</button>
        <button className="btn btn-primary flex-1" onClick={add}><Plus size={15} /> Add to question bank</button>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-bold">Adaptive weighting and cutoffs</h3>
        <p className="mt-0.5 text-xs text-slate-500">Share of each difficulty in a diagnostic, and the mastery bands students see.</p>
        <div className="mt-3 space-y-2.5">
          {['easy', 'medium', 'hard'].map((d) => (
            <div key={d} className="grid grid-cols-[56px_1fr_52px] items-center gap-3 text-xs">
              <span className="font-semibold capitalize">{d}</span>
              <input type="range" min={0} max={100} step={5} value={cfg.weights[d]} onChange={(e) => setCfg({ ...cfg, weights: { ...cfg.weights, [d]: num(e.target.value) } })} aria-label={`${d} share`} className="accent-brand-600" />
              <span className="text-right font-bold tabular-nums">{cfg.weights[d]}%</span>
            </div>
          ))}
          <p className={cn('text-right text-xs font-semibold', total === 100 ? 'text-emerald-600' : 'text-red-600')}>Total {total}%</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="qb-m">Mastered at or above (%)</label><input id="qb-m" type="number" min={1} max={100} className="input" value={cfg.mastered} onChange={(e) => setCfg({ ...cfg, mastered: num(e.target.value) })} /></div>
          <div><label className="label" htmlFor="qb-d">Developing at or above (%)</label><input id="qb-d" type="number" min={0} max={99} className="input" value={cfg.developing} onChange={(e) => setCfg({ ...cfg, developing: num(e.target.value) })} /></div>
        </div>
        <button className="btn btn-secondary mt-3 w-full" onClick={applyCfg}>Apply to new diagnostics</button>
      </div>
    </section>
  );
}
