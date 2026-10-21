import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getToken, setUnauthorizedHandler, TOKEN_KEY } from '../lib/api';
import { lessonsOf } from '../utils/courseUtils';

const GUEST_KEY = 'aptilearn:guestCourse';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [me, setMe] = useState(null); // student learning state
  const [courses, setCourses] = useState([]);
  const [rankings, setRankings] = useState({ list: [], me: null, total: 0 });
  const [config, setConfig] = useState({ googleClientId: null, aiEnabled: false, youtubeEnabled: false });
  const [login, setLogin] = useState({ open: false, tab: 'student', redirectTo: null });
  const [toasts, setToasts] = useState([]);
  const [qVersion, setQVersion] = useState(0);
  const [adminVersion, setAdminVersion] = useState(0);
  const [chatContext, setChatContext] = useState(null);
  const [guestCourseId, setGuestCourseIdState] = useState(() => localStorage.getItem(GUEST_KEY));
  const toastId = useRef(0);
  const socketRef = useRef(null);

  const toast = useCallback((message, tone = 'success') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const setGuestCourseId = useCallback((id) => {
    setGuestCourseIdState(id);
    if (id) localStorage.setItem(GUEST_KEY, id); else localStorage.removeItem(GUEST_KEY);
  }, []);

  /* ---------- data loaders ---------- */
  const refreshCourses = useCallback(async () => { try { setCourses(await api('/api/courses')); } catch { /* offline */ } }, []);
  const refreshMe = useCallback(async () => {
    if (!getToken()) return null;
    const d = await api('/api/me');
    setUser(d.user);
    setMe(d.user.role === 'student' ? d : null);
    return d;
  }, []);
  const refreshRankings = useCallback(async () => { try { if (getToken()) setRankings(await api('/api/rankings')); } catch { /* ignore */ } }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    socketRef.current?.close();
    socketRef.current = null;
    setUser(null); setMe(null); setRankings({ list: [], me: null, total: 0 });
  }, []);
  useEffect(() => { setUnauthorizedHandler(() => { logout(); toast('Your session has ended. Please sign in again.', 'error'); }); }, [logout, toast]);

  useEffect(() => {
    (async () => {
      try { setConfig(await api('/api/config')); } catch { /* server offline */ }
      await refreshCourses();
      try { await refreshMe(); } catch { localStorage.removeItem(TOKEN_KEY); }
      setBooting(false);
    })();
  }, [refreshCourses, refreshMe]);

  /* ---------- realtime ---------- */
  const role = user?.role;
  useEffect(() => {
    if (!user) return undefined;
    
    // Connect to live Render backend via environment variable, falling back to window origin locally
    const s = io(import.meta.env.VITE_API_URL || undefined, {
      auth: { token: getToken() },
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = s;
    s.on('notification', (n) => { toast(n.title ? `${n.title}: ${n.body}` : n.body); refreshMe().catch(() => {}); });
    s.on('me:update', () => refreshMe().catch(() => {}));
    s.on('rankings:update', () => { refreshRankings(); if (role === 'student') refreshMe().catch(() => {}); });
    s.on('courses:update', () => refreshCourses());
    s.on('questions:update', () => { setQVersion((v) => v + 1); refreshCourses(); });
    s.on('admin:update', () => setAdminVersion((v) => v + 1));
    refreshRankings();
    return () => { s.close(); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- auth ---------- */
  const finishAuth = useCallback(async (d) => {
    localStorage.setItem(TOKEN_KEY, d.token);
    const full = await api('/api/me');
    setUser(full.user);
    setMe(full.user.role === 'student' ? full : null);
    return full;
  }, []);
  const signIn = useCallback(async (body) => finishAuth(await api('/api/auth/login', { method: 'POST', body })), [finishAuth]);
  const register = useCallback(async (body) => finishAuth(await api('/api/auth/register', { method: 'POST', body })), [finishAuth]);
  const googleLogin = useCallback(async (credential) => finishAuth(await api('/api/auth/google', { method: 'POST', body: { credential } })), [finishAuth]);

  const openLogin = useCallback((o = {}) => setLogin({ open: true, tab: o.tab || 'student', redirectTo: o.redirectTo || null }), []);
  const closeLogin = useCallback(() => setLogin((l) => ({ ...l, open: false })), []);

  /* ---------- student actions (each returns fresh state) ---------- */
  const act = useCallback(async (path, body) => { const d = await api(path, { method: 'POST', body }); setMe(d); setUser(d.user); return d; }, []);
  const enroll = useCallback((courseId) => act('/api/me/enroll', { courseId }), [act]);
  const selectCourse = useCallback((courseId) => act('/api/me/select', { courseId }), [act]);
  const submitDiagnostic = useCallback((courseId, result) => act('/api/me/diagnostic', { courseId, result }), [act]);
  const lessonAction = useCallback((courseId, lessonId, action) => act('/api/me/lesson', { courseId, lessonId, action }), [act]);
  const submitQuiz = useCallback((courseId, answers) => act('/api/me/quiz', { courseId, answers }), [act]);
  const markNotificationsRead = useCallback(() => act('/api/me/notifications/read', {}), [act]);
  const updateProfile = useCallback(async (body) => {
    const d = await api('/api/me/profile', { method: 'PATCH', body });
    if (d.enrollments) setMe(d);
    setUser(d.user);
    return d;
  }, []);
  const deleteAccount = useCallback(async () => { await api('/api/me', { method: 'DELETE' }); logout(); }, [logout]);

  /* ---------- derived ---------- */
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';
  const enrolledIds = useMemo(() => Object.keys(me?.enrollments || {}).filter((id) => courses.some((c) => c.id === id)), [me, courses]);
  const selectedCourseId = enrolledIds.includes(me?.selectedCourseId) ? me.selectedCourseId : enrolledIds[0] || null;
  const course = courses.find((c) => c.id === selectedCourseId) || null;
  const enrollment = me?.enrollments?.[selectedCourseId] || null;

  const courseProgress = useCallback((courseId) => {
    const c = courses.find((x) => x.id === courseId);
    const e = me?.enrollments?.[courseId];
    if (!c || !e) return { pct: 0, done: 0, total: 0 };
    const ids = new Set(lessonsOf(c).map((l) => l.id));
    const done = e.completedLessons.filter((id) => ids.has(id)).length;
    return { pct: ids.size ? Math.round((done / ids.size) * 100) : 0, done, total: ids.size };
  }, [courses, me]);

  /** Per-topic mastery blending diagnostic (60%) with practice/quiz accuracy (40%). */
  const topicMastery = useCallback((courseId) => {
    const c = courses.find((x) => x.id === courseId);
    const e = me?.enrollments?.[courseId];
    if (!c) return [];
    return c.topics.map((topic) => {
      const diag = e?.diagnostic?.topics?.find((t) => t.topic === topic)?.mastery ?? null;
      const p = e?.practice?.[topic] || { correct: 0, total: 0 };
      const pAcc = p.total ? Math.round((p.correct / p.total) * 100) : null;
      let mastery = diag;
      if (diag != null && pAcc != null) mastery = Math.round(0.6 * diag + 0.4 * pAcc);
      else if (diag == null && pAcc != null) mastery = pAcc;
      return { topic, diag, practice: p, mastery };
    });
  }, [courses, me]);

  const value = {
    booting, user, me, isStudent, isAdmin, config, courses, rankings, login, toasts, qVersion, adminVersion,
    guestCourseId, setGuestCourseId, chatContext, setChatContext, toast, dismissToast,
    signIn, register, googleLogin, logout, openLogin, closeLogin,
    refreshMe, refreshCourses, refreshRankings,
    enroll, selectCourse, submitDiagnostic, lessonAction, submitQuiz, markNotificationsRead, updateProfile, deleteAccount,
    enrolledIds, selectedCourseId, course, enrollment, courseProgress, topicMastery,
    streak: me?.streak?.count || 0, xp: me?.xp || 0, rank: me?.rank || null, rankTotal: me?.rankTotal || 0, notifications: me?.notifications || [],
    api,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Fetch published questions for a course; refreshes when admins change the bank. */
export function useQuestions(courseId) {
  const { qVersion } = useApp();
  const [state, setState] = useState({ list: [], loading: !!courseId });
  useEffect(() => {
    if (!courseId) { setState({ list: [], loading: false }); return undefined; }
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    api(`/api/courses/${courseId}/questions`).then((list) => live && setState({ list, loading: false })).catch(() => live && setState({ list: [], loading: false }));
    return () => { live = false; };
  }, [courseId, qVersion]);
  return state;
}