import { useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { cn } from '../utils/format';

const FAQS = [
  ['What is AptiLearn?', 'AptiLearn is an adaptive learning platform. You take a short diagnostic, we find your strengths and gaps, and then build a learning path with video lessons, notes, quick tests and an AI study assistant around you.'],
  ['How does the diagnostic assessment work?', 'It is a timed test of about 15 questions. The difficulty adapts to your answers, and the results show your mastery for every topic. It is a baseline, not a grade, and it never affects your academic marks.'],
  ['How are rankings calculated?', 'Rankings use XP. You earn XP from your diagnostic score, completing lessons (+20 each), reading lesson notes (+5), and every correct answer in a quick test (+2). Your rank updates in real time as you learn.'],
  ['Is my progress saved if I log out?', 'Yes. Everything is saved to your account: enrolled courses, completed lessons, test results, streak and XP. Sign in again with the same email and password and you continue exactly where you stopped.'],
  ['How does the learning streak work?', 'Your streak counts consecutive days you visit AptiLearn. It starts at 1 on your first day and grows by one each day you come back. Miss a day and it restarts at 1.'],
  ['Can I study more than one course at the same time?', 'Absolutely. Enrol in as many courses as you like from the Courses page. Each keeps its own diagnostic, progress and weak-topic suggestions.'],
  ['What can the AI assistant help with?', 'AptiBot can answer questions on any subject, not just your course: explain a concept, walk through a problem, review code, or summarise your current lesson. Always double-check critical details.'],
  ['What should I do if a video does not load?', 'Use the "Open on YouTube" or "More videos" links under the player. If the problem continues, contact support@aptilearn.com and we will fix it.'],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24" aria-label="Frequently asked questions">
      <h2 className="section-title">Frequently asked questions</h2>
      <p className="muted mt-1">Everything you need to know about learning on AptiLearn.</p>
      <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-[#F4F6FB] shadow-card">
        {FAQS.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/60">
              <span className="text-sm font-bold sm:text-base">{q}</span>
              <ChevronDown size={18} className={cn('shrink-0 text-slate-500 transition-transform', open === i && 'rotate-180')} />
            </button>
            {open === i && <p className="pop-in px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

const REVIEWS = [
  { name: 'Priya Nair', place: 'B.Tech CSE, Bengaluru', stars: 5, text: 'The diagnostic showed me my weak spot in DBMS normalization within minutes. The suggested videos and the quick tests fixed it, and watching my rank climb kept me motivated every day.' },
  { name: 'Rohan Mehta', place: 'MCA student, Pune', stars: 5, text: 'AptiBot is a lifesaver. I ask it anything, from Java threads to aptitude shortcuts, and get clear explanations at midnight. The streak tracker makes studying a habit.' },
  { name: 'Ananya Iyer', place: 'Final-year IT, Chennai', stars: 4, text: 'Clean lessons and lots of practice questions for placements. I would love even more advanced problems, but the progress page tells me exactly what to revise next.' },
];

export function Reviews() {
  return (
    <section aria-label="Student reviews">
      <h2 className="section-title">Loved by learners</h2>
      <p className="muted mt-1">Sample stories from students using AptiLearn.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <figure key={r.name} className="card flex flex-col p-5">
            <div className="flex items-center gap-1" aria-label={`${r.stars} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={17} className={s <= r.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />)}
              <span className="ml-1.5 text-xs font-semibold text-slate-500">{r.stars}.0</span>
            </div>
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{r.text}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.name)}&backgroundColor=c7d2fe`} alt="" className="h-11 w-11 rounded-full bg-brand-100" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
              <div><p className="text-sm font-bold">{r.name}</p><p className="text-xs text-slate-500">{r.place}</p></div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
