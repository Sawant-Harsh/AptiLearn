// Learning points used for rankings. Shared by client and server so both agree.
export function computeXp(s = {}) {
  const done = new Set(s.completedLessons || []);
  let xp = done.size * 20;
  Object.entries(s.lessonProgress || {}).forEach(([id, p]) => { if (!done.has(id)) xp += Math.round(Math.min(99, p?.pct || 0) / 10); });
  xp += new Set(s.notesRead || []).size * 5;
  Object.values(s.results || {}).forEach((r) => { xp += Math.round((r?.accuracy || 0) * 2); });
  Object.values(s.practice || {}).forEach((c) => Object.values(c).forEach((t) => { xp += (t.correct || 0) * 3; }));
  xp += (s.streak?.count || 0) * 5;
  return xp;
}
