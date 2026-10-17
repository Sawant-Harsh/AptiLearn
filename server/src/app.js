import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { HttpError, TUTOR_SYSTEM, aiConfigured, claude, generateQuestions, searchYoutube, CURATED_VIDEOS } from './ai.js';
import { lessonsOf, metrics, newEnrollment, progressPct, publicUser, rankings, rowFor, touchStreak, xpOf } from './logic.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
const EMAIL = /^\S+@\S+\.\S+$/;

export function createApp({ db, rt, env = process.env }) {
  const app = express();
  const SECRET = env.JWT_SECRET || 'dev-secret-change-me';
  const adminEmail = (env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
  app.use(cors({ origin: env.CLIENT_ORIGIN ? env.CLIENT_ORIGIN.split(',') : true }));
  app.use(express.json({ limit: '1mb' }));

  const sign = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: '30d' });

  const auth = (role) => wrap(async (req, _res, next) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    let payload;
    try { payload = jwt.verify(token, SECRET); } catch { throw new HttpError(401, 'Please sign in again.'); }
    const user = await db.findOne('users', { id: payload.id });
    if (!user) throw new HttpError(401, 'Your account no longer exists.');
    if (role && user.role !== role) throw new HttpError(403, 'You do not have access to this area.');
    req.user = user;
    next();
  });
  const student = auth('student');
  const admin = auth('admin');
  const anyUser = auth();

  const students = () => db.find('users', { role: 'student' });
  const save = (u) => db.replace('users', u);

  async function mePayload(u) {
    const all = await students();
    const rk = rankings(all);
    const mine = rk.find((r) => r.id === u.id);
    return { user: publicUser(u), streak: u.streak, selectedCourseId: u.selectedCourseId || null, enrollments: u.enrollments || {}, notifications: (u.notifications || []).slice(0, 50), xp: xpOf(u), rank: mine?.rank || null, rankTotal: rk.length };
  }
  const changed = (u, { notify = true } = {}) => {
    rt.toUser(u.id, 'me:update');
    rt.toAll('rankings:update');
    rt.toAdmins('admin:update');
    return notify;
  };
  async function notify(userId, n) {
    const u = await db.findOne('users', { id: userId });
    if (!u) return;
    const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, read: false, at: new Date().toISOString(), ...n };
    u.notifications = [item, ...(u.notifications || [])].slice(0, 100);
    await save(u);
    rt.toUser(u.id, 'notification', item);
  }

  /* ---------------- public ---------------- */
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/config', (_req, res) => res.json({ googleClientId: env.GOOGLE_CLIENT_ID || null, aiEnabled: aiConfigured(), youtubeEnabled: !!env.YOUTUBE_API_KEY }));

  async function coursesPayload() {
    const [courses, all, qs] = await Promise.all([db.find('courses'), students(), db.find('questions', { published: true })]);
    return courses.map((c) => {
      const rows = all.map((u) => rowFor(u, c)).filter(Boolean);
      const m = metrics(rows);
      return { ...c, stats: { enrolled: m.total, avgScore: m.average }, questionCount: qs.filter((q) => q.courseId === c.id && q.options?.length === 4).length };
    });
  }
  app.get('/api/courses', wrap(async (_req, res) => res.json(await coursesPayload())));

  /* ---------------- auth ---------------- */
  app.post('/api/auth/register', wrap(async (req, res) => {
    const { name, email, password } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    if (!String(name || '').trim()) throw new HttpError(400, 'Enter your full name.');
    if (!EMAIL.test(e)) throw new HttpError(400, 'Enter a valid email address.');
    if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
    if (e === adminEmail) throw new HttpError(400, 'This email is reserved.');
    if (await db.findOne('users', { email: e })) throw new HttpError(409, 'An account with this email already exists. Please sign in.');
    const count = await db.count('users', { role: 'student' });
    const u = await db.insert('users', {
      role: 'student', name: name.trim(), email: e, passwordHash: await bcrypt.hash(password, 10),
      profile: { roll: `STU-${String(2001 + count)}`, program: '', university: '', phone: '', city: '', bio: '' },
      streak: { count: 1, lastDate: new Date().toLocaleDateString('en-CA') }, selectedCourseId: null, enrollments: {}, notifications: [], createdAt: new Date().toISOString(),
    });
    changed(u);
    res.status(201).json({ token: sign(u), user: publicUser(u) });
  }));

  app.post('/api/auth/login', wrap(async (req, res) => {
    const { email, password, role } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    if (!EMAIL.test(e)) throw new HttpError(400, 'Enter a valid email address.');
    if (!password) throw new HttpError(400, 'Enter your password.');
    const u = await db.findOne('users', { email: e });
    if (role === 'admin') {
      if (!u || u.role !== 'admin' || !(await bcrypt.compare(password, u.passwordHash))) throw new HttpError(401, 'Invalid admin credentials.');
    } else {
      if (!u || u.role !== 'student') throw new HttpError(404, 'No student account found with this email. Create an account to continue.');
      if (!u.passwordHash) throw new HttpError(401, 'This account uses Google sign-in. Please continue with Google.');
      if (!(await bcrypt.compare(password, u.passwordHash))) throw new HttpError(401, 'Incorrect password. Please try again.');
    }
    if (u.role === 'student' && touchStreak(u)) await save(u);
    if (u.role === 'student') changed(u);
    res.json({ token: sign(u), user: publicUser(u) });
  }));

  app.post('/api/auth/google', wrap(async (req, res) => {
    const clientId = env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new HttpError(503, 'Google sign-in is not configured on the server (GOOGLE_CLIENT_ID).');
    let payload;
    try {
      const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken: req.body?.credential, audience: clientId });
      payload = ticket.getPayload();
    } catch { throw new HttpError(401, 'Google could not verify this sign-in. Please try again.'); }
    if (!payload?.email || payload.email_verified === false) throw new HttpError(401, 'Your Google email is not verified.');
    const e = payload.email.toLowerCase();
    let u = await db.findOne('users', { email: e });
    if (u && u.role !== 'student') throw new HttpError(403, 'This email cannot sign in with Google.');
    if (!u) {
      const count = await db.count('users', { role: 'student' });
      u = await db.insert('users', {
        role: 'student', name: payload.name || e.split('@')[0], email: e, passwordHash: null, googleId: payload.sub, picture: payload.picture || null,
        profile: { roll: `STU-${String(2001 + count)}`, program: '', university: '', phone: '', city: '', bio: '' },
        streak: { count: 1, lastDate: new Date().toLocaleDateString('en-CA') }, selectedCourseId: null, enrollments: {}, notifications: [], createdAt: new Date().toISOString(),
      });
    } else {
      if (payload.picture && !u.picture) u.picture = payload.picture;
      touchStreak(u);
      await save(u);
    }
    changed(u);
    res.json({ token: sign(u), user: publicUser(u) });
  }));

  /* ---------------- account (any signed-in user) ---------------- */
  app.get('/api/me', anyUser, wrap(async (req, res) => {
    const u = req.user;
    if (u.role === 'admin') return res.json({ user: publicUser(u) });
    if (touchStreak(u)) { await save(u); }
    res.json(await mePayload(u));
  }));

  const PROFILE_FIELDS = { student: ['roll', 'program', 'university', 'phone', 'city', 'bio'], admin: ['designation', 'organization', 'phone', 'city', 'bio'] };
  app.patch('/api/me/profile', anyUser, wrap(async (req, res) => {
    const u = req.user;
    const b = req.body || {};
    if (b.name !== undefined) {
      if (!String(b.name).trim()) throw new HttpError(400, 'Name cannot be empty.');
      u.name = String(b.name).trim().slice(0, 80);
    }
    u.profile = { ...(u.profile || {}) };
    for (const f of PROFILE_FIELDS[u.role]) if (b[f] !== undefined) u.profile[f] = String(b[f]).trim().slice(0, 300);
    await save(u);
    if (u.role === 'student') changed(u);
    res.json(u.role === 'student' ? await mePayload(u) : { user: publicUser(u) });
  }));

  app.post('/api/me/password', anyUser, wrap(async (req, res) => {
    const { current, next } = req.body || {};
    if (!next || next.length < 6) throw new HttpError(400, 'New password must be at least 6 characters.');
    if (req.user.passwordHash && !(await bcrypt.compare(current || '', req.user.passwordHash))) throw new HttpError(401, 'Current password is incorrect.');
    req.user.passwordHash = await bcrypt.hash(next, 10);
    await save(req.user);
    res.json({ ok: true });
  }));

  app.delete('/api/me', student, wrap(async (req, res) => {
    await db.remove('users', req.user.id);
    rt.toAll('rankings:update');
    rt.toAdmins('admin:update');
    res.json({ ok: true });
  }));

  /* ---------------- student learning ---------------- */
  const getCourse = async (id) => {
    const c = await db.findOne('courses', { id });
    if (!c) throw new HttpError(404, 'Course not found.');
    return c;
  };
  const enrol = (u, courseId) => { u.enrollments = u.enrollments || {}; if (!u.enrollments[courseId]) u.enrollments[courseId] = newEnrollment(); };

  app.post('/api/me/enroll', student, wrap(async (req, res) => {
    const c = await getCourse(req.body?.courseId);
    enrol(req.user, c.id);
    req.user.selectedCourseId = c.id;
    await save(req.user);
    changed(req.user);
    res.json(await mePayload(req.user));
  }));

  app.post('/api/me/select', student, wrap(async (req, res) => {
    const id = req.body?.courseId;
    if (!req.user.enrollments?.[id]) throw new HttpError(400, 'You are not enrolled in this course yet.');
    req.user.selectedCourseId = id;
    await save(req.user);
    res.json(await mePayload(req.user));
  }));

  app.post('/api/me/diagnostic', student, wrap(async (req, res) => {
    const { courseId, result } = req.body || {};
    const c = await getCourse(courseId);
    if (!result || typeof result.accuracy !== 'number' || !Array.isArray(result.topics)) throw new HttpError(400, 'Invalid result.');
    enrol(req.user, c.id);
    req.user.enrollments[c.id].diagnostic = { ...result, courseId: c.id };
    req.user.selectedCourseId = c.id;
    await save(req.user);
    changed(req.user);
    res.json(await mePayload(req.user));
  }));

  app.post('/api/me/lesson', student, wrap(async (req, res) => {
    const { courseId, lessonId, action } = req.body || {};
    const c = await getCourse(courseId);
    if (!lessonsOf(c).some((l) => l.id === lessonId)) throw new HttpError(404, 'Lesson not found.');
    enrol(req.user, c.id);
    const e = req.user.enrollments[c.id];
    const list = action === 'notes' ? e.notesRead : e.completedLessons;
    if (!list.includes(lessonId)) list.push(lessonId);
    req.user.selectedCourseId = c.id;
    await save(req.user);
    changed(req.user);
    res.json(await mePayload(req.user));
  }));

  app.post('/api/me/quiz', student, wrap(async (req, res) => {
    const { courseId, answers } = req.body || {};
    const c = await getCourse(courseId);
    if (!Array.isArray(answers) || !answers.length) throw new HttpError(400, 'No answers submitted.');
    enrol(req.user, c.id);
    const e = req.user.enrollments[c.id];
    for (const a of answers.slice(0, 50)) {
      const t = e.practice[a.topic] || { correct: 0, total: 0 };
      e.practice[a.topic] = { correct: t.correct + (a.correct ? 1 : 0), total: t.total + 1 };
    }
    e.quiz = { correct: e.quiz.correct + answers.filter((a) => a.correct).length, total: e.quiz.total + answers.length, sets: e.quiz.sets + 1 };
    await save(req.user);
    changed(req.user);
    res.json(await mePayload(req.user));
  }));

  app.post('/api/me/notifications/read', student, wrap(async (req, res) => {
    req.user.notifications = (req.user.notifications || []).map((n) => ({ ...n, read: true }));
    await save(req.user);
    res.json(await mePayload(req.user));
  }));

  app.get('/api/rankings', anyUser, wrap(async (req, res) => {
    const list = rankings(await students());
    res.json({ total: list.length, list: list.slice(0, 100), me: list.find((r) => r.id === req.user.id) || null });
  }));

  app.get('/api/courses/:id/questions', anyUser, wrap(async (req, res) => {
    const qs = await db.find('questions', { courseId: req.params.id, published: true });
    res.json(qs.filter((q) => q.options?.length === 4));
  }));

  app.get('/api/videos', anyUser, wrap(async (req, res) => {
    const { courseId, lessonId } = req.query;
    const c = await getCourse(courseId);
    const lesson = lessonsOf(c).find((l) => l.id === lessonId);
    if (!lesson) throw new HttpError(404, 'Lesson not found.');
    const key = `${c.id}:${lesson.id}`;
    const cached = await db.findOne('videos', { key });
    if (cached) return res.json(cached);
    const query = `${c.name} ${lesson.title} tutorial`;
    let found = null;
    try { found = await searchYoutube(query); } catch (err) { console.warn('YouTube lookup failed:', err.message); }
    const source = found ? 'youtube-api' : CURATED_VIDEOS[c.id] ? 'curated' : 'none';
    found = found || CURATED_VIDEOS[c.id] || null;
    const doc = { key, query, videoId: found?.videoId || null, title: found?.title || null, channel: found?.channel || null, source };
    if (found) await db.insert('videos', doc); // only cache real hits so a later API key is picked up
    res.json(doc);
  }));

  app.post('/api/ai/chat', anyUser, wrap(async (req, res) => {
    const { messages, context } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) throw new HttpError(400, 'Send at least one message.');
    const clean = messages.slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    while (clean.length && clean[0].role !== 'user') clean.shift();
    const ctx = context?.course ? `\nThe student is currently studying "${context.course}"${context.lesson ? `, lesson "${context.lesson}"` : ''}. Use this only as helpful context; answer whatever they ask.` : '';
    const reply = await claude({ system: TUTOR_SYSTEM + ctx, messages: clean, maxTokens: 900 });
    res.json({ reply });
  }));

  /* ---------------- admin ---------------- */
  app.get('/api/admin/overview', admin, wrap(async (_req, res) => {
    const [courses, all] = await Promise.all([coursesPayload(), students()]);
    const rows = courses.flatMap((c) => all.map((u) => rowFor(u, c)).filter(Boolean));
    res.json({ courses: courses.map((c) => {
      const m = metrics(all.map((u) => rowFor(u, c)).filter(Boolean));
      return { ...c, metrics: m };
    }), totals: { students: all.length, enrollments: rows.length, atRisk: rows.filter((r) => r.atRisk).length } });
  }));

  app.get('/api/admin/gradebook', admin, wrap(async (req, res) => {
    const [courses, all] = await Promise.all([db.find('courses'), students()]);
    const only = req.query.courseId;
    const rows = courses.filter((c) => !only || c.id === only).flatMap((c) => all.map((u) => rowFor(u, c)).filter(Boolean));
    res.json({ course: only ? courses.find((c) => c.id === only) || null : null, metrics: metrics(rows), rows });
  }));

  app.get('/api/admin/reports', admin, wrap(async (req, res) => {
    const [courses, all] = await Promise.all([db.find('courses'), students()]);
    const only = req.query.courseId || courses[0]?.id;
    const course = courses.find((c) => c.id === only);
    if (!course) throw new HttpError(404, 'Course not found.');
    const rows = all.map((u) => rowFor(u, course)).filter(Boolean);
    const topics = course.topics.map((t) => {
      const vals = rows.flatMap((r) => r.topics.filter((x) => x.topic === t).map((x) => x.value));
      return { topic: t, value: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null };
    });
    const buckets = [0, 20, 40, 60, 80].map((lo) => ({ lo, hi: lo === 80 ? 100 : lo + 19, n: rows.filter((r) => r.score != null && r.score >= lo && r.score < (lo === 80 ? 101 : lo + 20)).length }));
    res.json({ course: { id: course.id, name: course.name }, metrics: metrics(rows), topics, buckets, atRisk: rows.filter((r) => r.atRisk) });
  }));

  app.post('/api/admin/support', admin, wrap(async (req, res) => {
    const { studentId, message, courseName } = req.body || {};
    if (!String(message || '').trim()) throw new HttpError(400, 'Write a message first.');
    const u = await db.findOne('users', { id: studentId, role: 'student' });
    if (!u) throw new HttpError(404, 'Student not found.');
    await notify(u.id, { type: 'support', title: courseName ? `Message from your instructor - ${courseName}` : 'Message from your instructor', body: String(message).trim().slice(0, 1000) });
    res.json({ ok: true, delivered: !u.seed });
  }));

  app.post('/api/admin/courses', admin, wrap(async (req, res) => {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const topics = (Array.isArray(b.topics) ? b.topics : String(b.topics || '').split(/\n|,/)).map((t) => t.trim()).filter(Boolean).slice(0, 12);
    if (name.length < 3) throw new HttpError(400, 'Course name must be at least 3 characters.');
    if (topics.length < 2) throw new HttpError(400, 'Add at least two topics (one per line).');
    const id = `${slug(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const modules = topics.map((t, i) => ({
      id: `${id}-m${i + 1}`, title: t,
      lessons: [`${t}: introduction`, `${t}: core concepts`, `${t}: practice and review`].map((lt, j) => ({
        id: `${id}-m${i + 1}-l${j + 1}`, title: lt, minutes: 8 + ((i + j) % 5) * 2,
        points: [`What "${t}" covers`, 'Key ideas and terms', 'A worked example and common mistakes'],
      })),
    }));
    const hues = [['#7C3AED', '#0F172A'], ['#0891B2', '#1E3A8A'], ['#DB2777', '#4C1D95'], ['#16A34A', '#064E3B'], ['#EA580C', '#7C2D12']];
    const [from, to] = hues[Math.floor(Math.random() * hues.length)];
    const course = await db.insert('courses', {
      ...{ id }, name, category: String(b.category || 'General').trim() || 'General', level: ['Beginner', 'Intermediate', 'Advanced'].includes(b.level) ? b.level : 'Beginner',
      hours: Number(b.hours) > 0 ? Number(b.hours) : 10, description: String(b.description || '').trim() || `Learn ${name} step by step.`,
      topics, modules, image: { from, to, logos: [], icon: 'book', url: /^https?:\/\//.test(b.imageUrl || '') ? b.imageUrl : undefined }, custom: true, createdBy: req.user.id, createdAt: new Date().toISOString(),
    });
    let aiNote = null;
    if (b.generateQuestions) {
      if (!aiConfigured()) aiNote = 'Course created. AI is not configured, so no starter questions were generated.';
      else {
        const results = await Promise.allSettled(topics.slice(0, 6).map((t, i) => generateQuestions({ course, topic: t, difficulty: i % 2 ? 'medium' : 'easy', count: 3 })));
        const qs = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
        if (qs.length) await db.insertMany('questions', qs.map((q) => ({ ...q, source: 'ai', published: true, createdAt: new Date().toISOString() })));
        aiNote = `Generated ${qs.length} starter questions with AI.`;
      }
    }
    for (const s of (await students()).filter((x) => !x.seed)) await notify(s.id, { type: 'course', title: 'New course available', body: `"${name}" has just been added. Open Courses to explore it.` });
    rt.toAll('courses:update');
    rt.toAll('questions:update');
    rt.toAdmins('admin:update');
    res.status(201).json({ course, aiNote });
  }));

  app.delete('/api/admin/courses/:id', admin, wrap(async (req, res) => {
    const c = await getCourse(req.params.id);
    if (!c.custom) throw new HttpError(400, 'Built-in courses cannot be deleted.');
    await db.remove('courses', c.id);
    for (const q of await db.find('questions', { courseId: c.id })) await db.remove('questions', q.id);
    for (const u of await students()) {
      if (u.enrollments?.[c.id]) { delete u.enrollments[c.id]; if (u.selectedCourseId === c.id) u.selectedCourseId = Object.keys(u.enrollments)[0] || null; await save(u); rt.toUser(u.id, 'me:update'); }
    }
    rt.toAll('courses:update'); rt.toAll('rankings:update'); rt.toAdmins('admin:update');
    res.json({ ok: true });
  }));

  app.get('/api/admin/questions', admin, wrap(async (req, res) => {
    const f = req.query.courseId ? { courseId: req.query.courseId } : {};
    const qs = await db.find('questions', f);
    res.json(qs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  }));

  app.post('/api/admin/questions', admin, wrap(async (req, res) => {
    const b = req.body || {};
    const course = await getCourse(b.courseId);
    if (!course.topics.includes(b.topic)) throw new HttpError(400, 'Choose a valid topic.');
    if (!['easy', 'medium', 'hard'].includes(b.difficulty)) throw new HttpError(400, 'Choose a difficulty.');
    const text = String(b.text || '').trim();
    if (text.length < 8) throw new HttpError(400, 'Write the question (at least 8 characters).');
    const q = await db.insert('questions', { courseId: course.id, topic: b.topic, difficulty: b.difficulty, text, explanation: 'Added by admin.', source: 'admin', published: false, createdAt: new Date().toISOString() });
    rt.toAdmins('admin:update'); rt.toAll('questions:update');
    res.status(201).json(q);
  }));

  app.patch('/api/admin/questions/:id', admin, wrap(async (req, res) => {
    const q = await db.findOne('questions', { id: req.params.id });
    if (!q) throw new HttpError(404, 'Question not found.');
    if (req.body?.published !== undefined) {
      if (req.body.published && q.options?.length !== 4) throw new HttpError(400, 'Only questions with four answer options can go live for students.');
      q.published = !!req.body.published;
    }
    await db.replace('questions', q);
    rt.toAdmins('admin:update'); rt.toAll('questions:update');
    res.json(q);
  }));

  app.delete('/api/admin/questions/:id', admin, wrap(async (req, res) => {
    await db.remove('questions', req.params.id);
    rt.toAdmins('admin:update'); rt.toAll('questions:update');
    res.json({ ok: true });
  }));

  app.post('/api/admin/ai/generate', admin, wrap(async (req, res) => {
    const { courseId, topic, difficulty } = req.body || {};
    const count = Math.max(1, Math.min(10, parseInt(req.body?.count, 10) || 5));
    const course = await getCourse(courseId);
    if (!course.topics.includes(topic)) throw new HttpError(400, 'Choose a valid topic.');
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new HttpError(400, 'Choose a difficulty.');
    const qs = await generateQuestions({ course, topic, difficulty, count });
    if (!qs.length) throw new HttpError(502, 'The AI did not return usable questions. Please try again.');
    const stamped = qs.map((q) => ({ ...q, source: 'ai', published: true, createdAt: new Date().toISOString() }));
    await db.insertMany('questions', stamped);
    rt.toAdmins('admin:update'); rt.toAll('questions:update');
    res.status(201).json({ added: stamped.length, requested: count, questions: stamped });
  }));

  /* ---------------- errors ---------------- */
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));
  app.use((err, _req, res, _next) => {
    if (!err.status) console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server.' });
  });
  return app;
}
