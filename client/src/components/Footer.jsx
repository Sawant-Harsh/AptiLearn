import { Link, useNavigate } from 'react-router-dom';
import { Award, BarChart3, Bot, Github, Linkedin, Mail, ShieldCheck, Twitter, Youtube } from 'lucide-react';
import { Logo } from './ui';
import { useApp } from '../context/AppContext';

const POINTS = [
  { icon: Bot, title: 'AI study assistant', text: 'Ask AptiBot anything, any time' },
  { icon: BarChart3, title: 'Adaptive diagnostics', text: 'Tests that adjust to your level' },
  { icon: Award, title: 'Live rankings', text: 'See your rank update as you learn' },
  { icon: ShieldCheck, title: 'Your progress, saved', text: 'Pick up exactly where you left off' },
];

export default function Footer() {
  const { user, isAdmin } = useApp();
  const navigate = useNavigate();
  const go = (hash) => (e) => { e.preventDefault(); navigate('/'); setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80); };
  return (
    <footer className="mt-16 border-t border-slate-200 bg-navy text-slate-300">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300"><Icon size={20} /></span>
              <div><p className="text-sm font-bold text-white">{title}</p><p className="text-xs text-slate-400">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">Adaptive learning and diagnostics that find your gaps, build your plan, and keep you moving until it clicks.</p>
          <div className="mt-5 flex gap-2">
            {[Twitter, Linkedin, Youtube, Github].map((Icon, i) => (
              <a key={i} href="#" onClick={(e) => e.preventDefault()} aria-label="Social link" className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-brand-600 hover:text-white"><Icon size={16} /></a>
            ))}
          </div>
        </div>
        <nav aria-label="Platform">
          <h3 className="text-sm font-bold text-white">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {isAdmin ? (
              <>
                <li><Link className="hover:text-white" to="/admin">Overview</Link></li>
                <li><Link className="hover:text-white" to="/admin/students">Students</Link></li>
                <li><Link className="hover:text-white" to="/admin/bank">Question bank</Link></li>
                <li><Link className="hover:text-white" to="/admin/reports">Reports</Link></li>
              </>
            ) : (
              <>
                <li><Link className="hover:text-white" to="/courses">All courses</Link></li>
                <li><Link className="hover:text-white" to={user ? '/progress' : '/'}>My progress</Link></li>
                <li><Link className="hover:text-white" to={user ? '/rankings' : '/'}>Rankings</Link></li>
                <li><Link className="hover:text-white" to={user ? '/dashboard' : '/'}>Learning hub</Link></li>
              </>
            )}
          </ul>
        </nav>
        <nav aria-label="Learn">
          <h3 className="text-sm font-bold text-white">Popular courses</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {['Python Programming', 'Java Programming', 'MERN Stack Development', 'Data Structures & Algorithms', 'Database Management Systems'].map((c) => <li key={c}><Link className="hover:text-white" to="/courses">{c}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Company">
          <h3 className="text-sm font-bold text-white">Support</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="hover:text-white" href="#faq" onClick={go('faq')}>FAQ</a></li>
            <li><a className="hover:text-white" href="#how" onClick={go('how')}>How it works</a></li>
            <li><a className="inline-flex items-center gap-1.5 hover:text-white" href="mailto:support@aptilearn.com"><Mail size={14} /> support@aptilearn.com</a></li>
            <li><span className="text-slate-400">Privacy policy</span></li>
            <li><span className="text-slate-400">Terms of service</span></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} AptiLearn. All rights reserved.</p>
          <p>Made for learners across India and beyond.</p>
        </div>
      </div>
    </footer>
  );
}
