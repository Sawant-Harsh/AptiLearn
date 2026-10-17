export const AT_RISK_BELOW = 55;
export const localDate = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };

export const lessonsOf = (course) => course.modules.flatMap((m) => m.lessons);

export function newEnrollment() {
  return { enrolledAt: new Date().toISOString(), diagnostic: null, completedLessons: [], notesRead: [], practice: {}, quiz: { correct: 0, total: 0, sets: 0 } };
}

/** XP is derived from learning data, so rankings can never drift out of sync. */
export function xpOf(u) {
  let x = 0;
  for (const e of Object.values(u.enrollments || {})) {
    x += e.diagnostic ? Math.round(e.diagnostic.accuracy) : 0;
    x += (e.completedLessons?.length || 0) * 20;
    x += (e.notesRead?.length || 0) * 5;
    x += (e.quiz?.correct || 0) * 2;
  }
  return x;
}

export function touchStreak(u) {
  const today = localDate(0);
  const s = u.streak || { count: 0, lastDate: null };
  if (s.lastDate === today) return false;
  u.streak = { count: s.lastDate === localDate(-1) ? s.count + 1 : 1, lastDate: today };
  return true;
}

export const publicUser = (u) => ({ id: u.id, role: u.role, name: u.name, email: u.email, profile: u.profile || {}, picture: u.picture || null, createdAt: u.createdAt });

export function rankings(students) {
  const list = students
    .map((u) => ({ id: u.id, name: u.name, xp: xpOf(u), city: u.profile?.city || '', courses: Object.keys(u.enrollments || {}).length, picture: u.picture || null }))
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return list;
}

export function progressPct(course, enrollment) {
  const ids = new Set(lessonsOf(course).map((l) => l.id));
  if (!ids.size) return 0;
  return Math.round((enrollment.completedLessons.filter((id) => ids.has(id)).length / ids.size) * 100);
}

export function rowFor(user, course) {
  const e = user.enrollments?.[course.id];
  if (!e) return null;
  const ids = new Set(lessonsOf(course).map((l) => l.id));
  const done = e.completedLessons.filter((id) => ids.has(id)).length;
  const score = e.diagnostic ? e.diagnostic.accuracy : null;
  return {
    studentId: user.id, name: user.name, roll: user.profile?.roll || '', city: user.profile?.city || '',
    courseId: course.id, courseName: course.name, score, mastery: score == null ? null : Math.round(score),
    status: e.diagnostic ? 'completed' : done > 0 || e.notesRead.length ? 'progress' : 'not-started',
    videoPct: ids.size ? Math.round((done / ids.size) * 100) : 0,
    atRisk: score != null && score < AT_RISK_BELOW,
    lessonsDone: done, lessonsTotal: ids.size,
    topics: (e.diagnostic?.topics || []).filter((t) => t.mastery != null).map((t) => ({ topic: t.topic, value: t.mastery })),
    enrolledAt: e.enrolledAt, seed: !!user.seed,
  };
}

export function metrics(rows) {
  const done = rows.filter((r) => r.score != null);
  const avg = done.length ? done.reduce((a, r) => a + r.score, 0) / done.length : 0;
  return {
    total: rows.length, completed: done.length, average: Math.round(avg * 10) / 10,
    atRisk: rows.filter((r) => r.atRisk).length,
    video: rows.length ? Math.round(rows.reduce((a, r) => a + r.videoPct, 0) / rows.length) : 0,
  };
}
