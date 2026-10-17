import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { Logo, Segmented } from './ui';

export default function LoginModal() {
  const { login, closeLogin, signIn, register, googleLogin, enroll, guestCourseId, setGuestCourseId, config, toast } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (login.open) { setRole(login.tab); setMode('signin'); setName(''); setEmail(''); setPassword(''); setError(''); setShow(false); }
  }, [login.open, login.tab]);

  const isAdmin = role === 'admin';
  const switchRole = (r) => { setRole(r); setMode('signin'); setError(''); setEmail(''); setPassword(''); setName(''); };

  const afterLogin = async (full) => {
    const redirect = login.redirectTo;
    closeLogin();
    if (full.user.role === 'admin') { toast('Welcome back, Admin.'); return navigate('/admin'); }
    toast(`Welcome${mode === 'signup' ? '' : ' back'}, ${full.user.name.split(' ')[0]}.`);
    const had = Object.keys(full.enrollments || {}).length > 0;
    try {
      if (redirect) {
        const id = new URLSearchParams(redirect.split('?')[1] || '').get('course');
        if (id) await enroll(id);
        return navigate(redirect);
      }
      if (guestCourseId) { await enroll(guestCourseId); setGuestCourseId(null); return navigate('/dashboard'); }
    } catch { /* fall through */ }
    navigate(had ? '/dashboard' : '/courses');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !name.trim()) return setError('Enter your full name.');
    if (!email.trim()) return setError('Enter your email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try {
      const full = mode === 'signup' ? await register({ name, email, password }) : await signIn({ email, password, role });
      await afterLogin(full);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const onGoogle = async (cred) => {
    setError(''); setBusy(true);
    try { await afterLogin(await googleLogin(cred.credential)); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={login.open} onClose={closeLogin} width="max-w-md" labelledBy="login-title">
      <form onSubmit={submit} className="px-7 pb-7 pt-8" noValidate autoComplete="off">
        <div className="flex flex-col items-center text-center">
          <Logo size="text-3xl" />
          <h2 id="login-title" className="mt-5 text-2xl font-extrabold">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
          <p className="muted mt-1">{isAdmin ? 'Sign in to the AptiLearn admin portal.' : mode === 'signup' ? 'Start learning in under a minute.' : 'Your next breakthrough starts here.'}</p>
        </div>

        <div className="mt-6 flex justify-center">
          <Segmented label="Portal" value={role} onChange={switchRole} options={[{ value: 'student', label: 'Student portal' }, { value: 'admin', label: 'Admin portal' }]} />
        </div>

        <div className="mt-5 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label" htmlFor="login-name">Full name</label>
              <div className="relative"><User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="login-name" className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="off" /></div>
            </div>
          )}
          <div>
            <label className="label" htmlFor="login-email">{isAdmin ? 'Admin email' : 'Email'}</label>
            <div className="relative"><Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="login-email" type="email" className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="off" /></div>
          </div>
          <div>
            <label className="label" htmlFor="login-pass">Password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="login-pass" type={show ? 'text' : 'password'} className="input px-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'} autoComplete="new-password" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy && <Loader2 size={16} className="animate-spin" />}{mode === 'signup' ? 'Create account' : isAdmin ? 'Sign in as admin' : 'Sign in to AptiLearn'}</button>
        </div>

        {!isAdmin && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or continue with<span className="h-px flex-1 bg-slate-200" /></div>
            <div className="flex justify-center" data-testid="google-slot">
              {config.googleClientId ? (
                <GoogleOAuthProvider clientId={config.googleClientId}>
                  <GoogleLogin onSuccess={onGoogle} onError={() => setError('Google sign-in was cancelled or failed. Please try again.')} width="340" text="continue_with" shape="rectangular" theme="outline" size="large" />
                </GoogleOAuthProvider>
              ) : (
                <button type="button" className="btn btn-secondary w-full" onClick={() => setError('Google sign-in is not set up yet. Add GOOGLE_CLIENT_ID to server/.env (see README).')}>Continue with Google</button>
              )}
            </div>
            <p className="mt-5 text-center text-sm text-slate-600">
              {mode === 'signup' ? 'Already have an account?' : 'New to AptiLearn?'}{' '}
              <button type="button" className="font-semibold text-brand-600 hover:underline" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button>
            </p>
          </>
        )}
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={14} className="text-emerald-500" /> Secure access. Your progress is saved to your account.</p>
      </form>
    </Modal>
  );
}
