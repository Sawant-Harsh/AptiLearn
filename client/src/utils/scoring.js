export const DIFF = { easy: 1, medium: 2, hard: 3 };
const WEIGHT = { easy: 1, medium: 1.5, hard: 2 };

export const DEFAULT_CONFIG = { weights: { easy: 30, medium: 50, hard: 20 }, mastered: 80, developing: 50 };
export const TEST_LENGTH = 15;
export const TEST_SECONDS = 20 * 60;

export function masteryLevel(value, config = DEFAULT_CONFIG) {
  if (value == null) return { key: 'none', label: 'Not assessed', bar: 'bg-slate-300', chip: 'bg-slate-100 text-slate-600' };
  if (value >= config.mastered) return { key: 'mastered', label: 'Mastered', bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' };
  if (value >= config.developing) return { key: 'developing', label: 'Developing', bar: 'bg-amber-400', chip: 'bg-amber-50 text-amber-700' };
  return { key: 'focus', label: 'Needs focus', bar: 'bg-red-500', chip: 'bg-red-50 text-red-700' };
}

export function scoreLabel(accuracy) {
  if (accuracy >= 70) return 'Strong foundation';
  if (accuracy >= 50) return 'Solid start';
  return 'Room to grow';
}

/** Adaptive selection: closest difficulty to the target, spread across topics, softly honouring the teacher's difficulty mix. */
export function pickNext({ pool, history, target, config = DEFAULT_CONFIG, total }) {
  const used = new Set(history.map((h) => h.qid));
  const topicCount = {};
  const diffCount = { easy: 0, medium: 0, hard: 0 };
  history.forEach((h) => {
    topicCount[h.topic] = (topicCount[h.topic] || 0) + 1;
    diffCount[h.difficulty] += 1;
  });
  let best = null;
  let bestScore = Infinity;
  for (const q of pool) {
    if (used.has(q.id)) continue;
    const over = Math.max(0, (diffCount[q.difficulty] + 1) / total - config.weights[q.difficulty] / 100);
    const score = Math.abs(DIFF[q.difficulty] - target) + (topicCount[q.topic] || 0) * 0.45 + over * 3;
    if (score < bestScore) {
      best = q;
      bestScore = score;
    }
  }
  return best;
}

export function targetLabel(target) {
  return target < 1.5 ? 'Easy' : target < 2.5 ? 'Medium' : 'Hard';
}

export function computeResult({ course, history, total, timeSec }) {
  const correct = history.filter((h) => h.correct).length;
  const topics = course.topics.map((topic) => {
    const hs = history.filter((h) => h.topic === topic);
    if (!hs.length) return { topic, asked: 0, correct: 0, mastery: null };
    const tot = hs.reduce((s, h) => s + WEIGHT[h.difficulty], 0);
    const got = hs.reduce((s, h) => s + (h.correct ? WEIGHT[h.difficulty] : 0), 0);
    return { topic, asked: hs.length, correct: hs.filter((h) => h.correct).length, mastery: Math.round((got / tot) * 100) };
  });
  return {
    courseId: course.id,
    total,
    correct,
    answered: history.filter((h) => h.status === 'answered').length,
    skipped: history.filter((h) => h.status === 'skipped').length,
    unseen: Math.max(0, total - history.length),
    accuracy: Math.round((correct / total) * 1000) / 10,
    timeSec,
    topics,
    completedAt: new Date().toISOString(),
  };
}
