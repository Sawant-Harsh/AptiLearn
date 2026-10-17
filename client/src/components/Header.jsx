import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, ChevronDown, GraduationCap, LogIn, LogOut, Menu, Megaphone, Trophy, User, X, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, Logo } from './ui';
import AdminProfileDrawer from './AdminProfileDrawer';
import { cn } from '../utils/format';

const navCls = ({ isActive }) => cn('rounded-md px-1 py-1 text-sm font-semibold transition', isActive ? 'text-brand-700' : 'text-slate-600 hover:text-navy');
const timeAgo = (iso) => {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
};

export default function Header() {
  const { user, isStudent, isAdmin, logout, openLogin, toast, notifications, markNotificationsRead, rank, xp } = useApp();
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const menuRef = useRef(null);
  const bellRef = useRef(null);
  const loc = useLocation();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => { setMobile(false); setMenu(false); setBell(false); }, [loc.pathname, loc.search]);
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBell(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const goHash = (hash) => (e) => {
    e.preventDefault();
    if (loc.pathname !== '/') navigate('/');
    setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const studentNav = [['Learning hub', '/dashboard'], ['Courses', '/courses'], ['My progress', '/progress'], ['Rankings', '/rankings']];
  const adminNav = [['Overview', '/admin', true], ['Students', '/admin/students'], ['Question bank', '/admin/bank'], ['Reports', '/admin/reports']];

  const openBell = () => {
    const next = !bell;
    setBell(next); setMenu(false);
    if (next && unread) markNotificationsRead().catch(() => {});
  };
  const doLogout = () => { logout(); navigate('/'); toast('You have been signed out.'); };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to={isAdmin ? '/admin' : '/'} aria-label="AptiLearn home"><Logo /></Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {!user && (
            <>
              <a href="#courses" onClick={goHash('courses')} className="text-sm font-semibold text-slate-600 hover:text-navy">Courses</a>
              <a href="#how" onClick={goHash('how')} className="text-sm font-semibold text-slate-600 hover:text-navy">How it works</a>
              <a href="#faq" onClick={goHash('faq')} className="text-sm font-semibold text-slate-600 hover:text-navy">FAQ</a>
            </>
          )}
          {isStudent && studentNav.map(([l, to]) => <NavLink key={to} to={to} className={navCls}>{l}</NavLink>)}
          {isAdmin && adminNav.map(([l, to, end]) => <NavLink key={to} to={to} end={!!end} className={({ isActive }) => navCls({ isActive: isActive || (to === '/admin' && loc.pathname.startsWith('/admin/course')) })}>{l}</NavLink>)}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!user && <button onClick={() => openLogin()} className="btn btn-primary" data-testid="header-signin"><LogIn size={16} /> Sign in</button>}

          {isStudent && (
            <>
              <Link to="/rankings" className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 sm:inline-flex" title="Your overall rank and XP">
                <Trophy size={14} /> {rank ? `#${rank}` : '-'} <span className="font-medium text-amber-600/80">&middot; {xp} XP</span>
              </Link>
              <div className="relative" ref={bellRef}>
                <button onClick={openBell} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={bell} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                  <Bell size={19} />
                  {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" data-testid="unread">{unread}</span>}
                </button>
                {bell && (
                  <div className="pop-in absolute right-0 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
                    <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Notifications</div>
                    <ul className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</li>}
                      {notifications.map((n) => (
                        <li key={n.id} className={cn('flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0', !n.read && 'bg-brand-50/50')}>
                          <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', n.type === 'support' ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700')}>{n.type === 'support' ? <Megaphone size={15} /> : <BookOpen size={15} />}</span>
                          <div className="min-w-0"><p className="text-[13px] font-semibold">{n.title}</p><p className="mt-0.5 text-xs leading-relaxed text-slate-600">{n.body}</p><p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.at)}</p></div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {isStudent && (
            <div className="relative" ref={menuRef}>
              <button onClick={() => { setMenu((m) => !m); setBell(false); }} aria-haspopup="menu" aria-expanded={menu} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100" data-testid="account-menu">
                <Avatar name={user.name} picture={user.picture} />
                <span className="hidden text-left leading-tight sm:block"><span className="block max-w-[140px] truncate text-sm font-semibold">{user.name}</span><span className="block text-xs text-slate-500">Student</span></span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {menu && (
                <div role="menu" className="pop-in absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
                  <div className="px-3 py-2"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
                  <div className="my-1 h-px bg-slate-100" />
                  {[['My progress', '/progress', TrendingUp], ['My profile', '/profile', User], ['Rankings', '/rankings', Trophy], ['Learning hub', '/dashboard', GraduationCap]].map(([l, to, Icon]) => (
                    <Link key={to} role="menuitem" to={to} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50"><Icon size={16} className="text-slate-500" /> {l}</Link>
                  ))}
                  <div className="my-1 h-px bg-slate-100" />
                  <button role="menuitem" onClick={doLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={16} /> Log out</button>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <button onClick={() => setDrawer(true)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100" data-testid="admin-menu" aria-label="Open admin profile">
              <Avatar name={user.name} />
              <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-semibold">{user.name}</span><span className="block text-xs text-slate-500">Admin</span></span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          )}

          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setMobile((m) => !m)} aria-label="Toggle menu" aria-expanded={mobile}>{mobile ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>

      {mobile && (
        <nav className="border-t border-slate-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {!user && [['Courses', 'courses'], ['How it works', 'how'], ['FAQ', 'faq']].map(([l, h]) => <a key={h} href={`#${h}`} onClick={goHash(h)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50">{l}</a>)}
            {isStudent && studentNav.map(([l, to]) => <Link key={to} to={to} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50">{l}</Link>)}
            {isAdmin && adminNav.map(([l, to]) => <Link key={to} to={to} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50">{l}</Link>)}
          </div>
        </nav>
      )}
      {isAdmin && <AdminProfileDrawer open={drawer} onClose={() => setDrawer(false)} />}
    </header>
  );
}
