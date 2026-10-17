// End-to-end API self-test: node src/selftest.js  (uses a temporary database file)
import os from 'os';
import path from 'path';
import assert from 'assert';
import { io as ioc } from 'socket.io-client';
import { start } from './index.js';

process.env.GOOGLE_CLIENT_ID = '';
process.env.ANTHROPIC_API_KEY = '';
const file = path.join(os.tmpdir(), `aptilearn-test-${Date.now()}.json`);
const s = await start({ port: 0, dbFile: file, quiet: true });
const base = `http://localhost:${s.server.address().port}`;
const call = async (method, url, body, token) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
let n = 0;
const ok = (name) => console.log(`  ok ${++n}. ${name}`);

// courses
let r = await call('GET', '/api/courses');
assert.equal(r.data.length, 9); assert.ok(r.data.every((c) => c.questionCount >= 10));
ok('9 courses with question counts');

// auth validation
r = await call('POST', '/api/auth/login', { email: 'nobody@x.com', password: 'abc123', role: 'student' });
assert.equal(r.status, 404); ok('unknown student rejected');
r = await call('POST', '/api/auth/register', { name: 'Asha Verma', email: 'asha@example.com', password: 'secret1' });
assert.equal(r.status, 201); const tok = r.data.token; ok('register');
r = await call('POST', '/api/auth/register', { name: 'Dup', email: 'asha@example.com', password: 'secret1' });
assert.equal(r.status, 409); ok('duplicate email rejected');
r = await call('POST', '/api/auth/login', { email: 'asha@example.com', password: 'wrong', role: 'student' });
assert.equal(r.status, 401); ok('wrong password rejected');
r = await call('POST', '/api/auth/login', { email: 'admin@gmail.com', password: 'admin123', role: 'student' });
assert.equal(r.status, 404); ok('admin cannot use student tab');
r = await call('POST', '/api/auth/login', { email: 'asha@example.com', password: 'secret1', role: 'admin' });
assert.equal(r.status, 401); ok('student cannot use admin tab');
r = await call('POST', '/api/auth/login', { email: 'other@gmail.com', password: 'admin123', role: 'admin' });
assert.equal(r.status, 401); ok('only the one admin email works');
r = await call('POST', '/api/auth/login', { email: 'admin@gmail.com', password: 'admin123', role: 'admin' });
assert.equal(r.status, 200); const adm = r.data.token; ok('admin login');
r = await call('POST', '/api/auth/register', { name: 'x', email: 'admin@gmail.com', password: 'secret1' });
assert.equal(r.status, 400); ok('admin email cannot be registered');
r = await call('POST', '/api/auth/google', { credential: 'x' });
assert.equal(r.status, 503); ok('google reports not configured');

// new student starts at zero
r = await call('GET', '/api/me', null, tok);
assert.equal(r.data.streak.count, 1); assert.equal(Object.keys(r.data.enrollments).length, 0); assert.equal(r.data.xp, 0);
ok('new student: streak 1, no enrollments, 0 xp');

// realtime
const sock = ioc(base, { auth: { token: tok } });
const events = [];
sock.on('notification', (n2) => events.push(['notification', n2]));
sock.on('rankings:update', () => events.push(['rankings']));
await new Promise((res) => sock.on('connect', res));

// enroll + learn
r = await call('POST', '/api/me/enroll', { courseId: 'py' }, tok);
assert.ok(r.data.enrollments.py); ok('enroll');
r = await call('POST', '/api/me/diagnostic', { courseId: 'py', result: { accuracy: 40, total: 15, correct: 6, answered: 15, skipped: 0, unseen: 0, timeSec: 300, completedAt: new Date().toISOString(), topics: [{ topic: 'Python Basics', asked: 2, correct: 1, mastery: 40 }] } }, tok);
assert.equal(r.data.enrollments.py.diagnostic.accuracy, 40); ok('diagnostic stored');
r = await call('POST', '/api/me/lesson', { courseId: 'py', lessonId: 'py-m1-l1', action: 'complete' }, tok);
assert.equal(r.data.enrollments.py.completedLessons.length, 1); assert.equal(r.data.xp, 40 + 20); ok('lesson complete -> xp 60');
r = await call('POST', '/api/me/lesson', { courseId: 'py', lessonId: 'py-m1-l1', action: 'notes' }, tok);
assert.equal(r.data.xp, 65); ok('notes read -> xp 65');
r = await call('POST', '/api/me/quiz', { courseId: 'py', answers: [{ topic: 'Python Basics', correct: true }, { topic: 'Python Basics', correct: false }] }, tok);
assert.equal(r.data.xp, 67); ok('quiz -> xp 67');
r = await call('GET', '/api/rankings', null, tok);
assert.ok(r.data.total > 70 && r.data.me.rank >= 1 && r.data.list[0].xp >= r.data.list[1].xp); ok(`rankings (you are #${r.data.me.rank} of ${r.data.total})`);

// persistence across login
r = await call('POST', '/api/auth/login', { email: 'asha@example.com', password: 'secret1', role: 'student' });
const tok2 = r.data.token;
r = await call('GET', '/api/me', null, tok2);
assert.equal(r.data.enrollments.py.completedLessons.length, 1); assert.equal(r.data.xp, 67); ok('progress persists after re-login');

// admin sees the student in realtime data
r = await call('GET', '/api/admin/gradebook?courseId=py', null, adm);
const row = r.data.rows.find((x) => x.name === 'Asha Verma');
assert.ok(row && row.score === 40 && row.atRisk && row.lessonsDone === 1); ok('admin gradebook shows the new student (at-risk, 1 lesson)');
r = await call('GET', '/api/admin/overview', null, adm);
assert.equal(r.data.courses.length, 9); ok('admin overview');
r = await call('GET', '/api/admin/reports?courseId=py', null, adm);
assert.ok(r.data.topics.length === 6 && r.data.buckets.length === 5); ok('admin reports');
r = await call('GET', '/api/admin/gradebook', null, tok);
assert.equal(r.status, 403); ok('student blocked from admin API');

// support message -> notification (realtime)
r = await call('POST', '/api/admin/support', { studentId: row.studentId, message: 'Let us review Python basics together.', courseName: 'Python' }, adm);
assert.equal(r.status, 200);
await new Promise((res) => setTimeout(res, 300));
assert.ok(events.some(([t, p]) => t === 'notification' && /review Python/.test(p.body))); ok('support message delivered via socket');
r = await call('GET', '/api/me', null, tok);
assert.equal(r.data.notifications.length, 1); ok('notification stored on student');

// questions: AI not configured -> clear error; manual add is display-only
r = await call('POST', '/api/admin/ai/generate', { courseId: 'py', topic: 'Functions', difficulty: 'easy', count: 3 }, adm);
assert.equal(r.status, 503); assert.match(r.data.error, /ANTHROPIC_API_KEY/); ok('AI generation errors clearly without key');
r = await call('POST', '/api/ai/chat', { messages: [{ role: 'user', content: 'hi' }] }, tok);
assert.equal(r.status, 503); ok('AI chat errors clearly without key');
r = await call('POST', '/api/admin/questions', { courseId: 'py', topic: 'Functions', difficulty: 'easy', text: 'What is a decorator in Python?' }, adm);
assert.equal(r.status, 201); const mq = r.data;
r = await call('GET', '/api/courses/py/questions', null, tok);
assert.ok(!r.data.some((q) => q.id === mq.id)); ok('manual question is display-only (not served to students)');
r = await call('PATCH', `/api/admin/questions/${mq.id}`, { published: true }, adm);
assert.equal(r.status, 400); ok('cannot publish a question without options');

// create course -> students notified + visible
r = await call('POST', '/api/admin/courses', { name: 'Cloud Computing Basics', category: 'Cloud', level: 'Beginner', description: 'AWS fundamentals', topics: 'IaaS PaaS SaaS\nVirtualization\nStorage' }, adm);
assert.equal(r.status, 201); const cid = r.data.course.id;
r = await call('GET', '/api/courses', null, null);
assert.equal(r.data.length, 10);
r = await call('GET', '/api/me', null, tok);
assert.ok(r.data.notifications.some((x) => x.type === 'course')); ok('new course visible + students notified');
r = await call('DELETE', `/api/admin/courses/${cid}`, null, adm);
assert.equal(r.status, 200); ok('custom course deletable');
r = await call('DELETE', '/api/admin/courses/os', null, adm);
assert.equal(r.status, 400); ok('built-in course protected');

// video lookup falls back cleanly
r = await call('GET', '/api/videos?courseId=py&lessonId=py-m1-l1', null, tok);
assert.equal(r.data.videoId, 'rfscVS0vtbw'); ok('curated python video fallback');
r = await call('GET', '/api/videos?courseId=os&lessonId=os-m1-l1', null, tok);
assert.equal(r.data.videoId, null); ok('no-video case handled');

// profile edit + delete details
r = await call('PATCH', '/api/me/profile', { city: 'Pune', phone: '9876543210', name: 'Asha V' }, tok);
assert.equal(r.data.user.profile.city, 'Pune');
r = await call('PATCH', '/api/me/profile', { phone: '' }, tok);
assert.equal(r.data.user.profile.phone, ''); ok('profile edit and clear');
r = await call('PATCH', '/api/me/profile', { designation: 'Head', city: 'Delhi' }, adm);
assert.equal(r.data.user.profile.designation, 'Head'); ok('admin profile edit');

sock.close();
await s.close();
console.log(`\nAll ${n} checks passed.`);
process.exit(0);
