import { DIFF } from './scoring.js';

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const uniq = (arr) => [...new Set(arr)];

/** Build 4 unique numeric options around `correct`, shuffle, and return { options, answer }. */
function opts(correct, candidates, fmt = String, step = 1) {
  const list = [correct];
  for (const c of candidates) if (Number.isFinite(c) && c > 0 && !list.includes(c) && list.length < 4) list.push(c);
  let k = 1;
  while (list.length < 4) {
    for (const c of [correct + step * k, correct - step * k]) if (c > 0 && !list.includes(c) && list.length < 4) list.push(c);
    k++;
  }
  const sh = shuffle(list);
  return { options: sh.map(fmt), answer: sh.indexOf(correct) };
}

const mk = (courseId, topic, difficulty, text, o, explanation, extra = {}) => ({ courseId, topic, difficulty, text, ...o, explanation, generated: true, ...extra });

/* ---------- Operating Systems ---------- */
function genPages() {
  const addr = pick([24, 28, 30, 32]);
  const kb = pick([1, 2, 4, 8, 16]);
  const off = 10 + Math.log2(kb);
  const n = addr - off;
  return mk('os', 'Memory Management', 'easy',
    `A system uses ${addr}-bit logical addresses and a page size of ${kb} KB. How many pages does the logical address space contain?`,
    opts(n, [n - 1, n + 1, n - 2, n + 2, addr], (x) => `2^${x}`),
    `${kb} KB = 2^${off} bytes, so the offset takes ${off} bits and ${addr} - ${off} = ${n} bits remain for the page number: 2^${n} pages.`);
}
function genTranslate() {
  const size = pick([512, 1024, 2048]);
  const frames = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const p = rnd(0, 3);
  const off = rnd(1, size / 4 - 1) * 4;
  const la = p * size + off;
  const f = frames[p];
  const pa = f * size + off;
  return mk('os', 'Memory Management', 'medium',
    `The page size is ${size} bytes. Using the page table below, which physical address does logical address ${la} map to?`,
    opts(pa, [la, f * size, (f + 1) * size + off, (f - 1) * size + off], String, 4),
    `${la} = page ${p} x ${size} + offset ${off}. Page ${p} is in frame ${f}, so the physical address is ${f} x ${size} + ${off} = ${pa}.`,
    { table: { headers: ['Page', 'Frame'], rows: frames.map((fr, i) => [String(i), String(fr)]) } });
}
function genFcfs() {
  const b = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const avg = Number(((2 * b[0] + b[1]) / 3).toFixed(2));
  const rev = Number(((2 * b[2] + b[1]) / 3).toFixed(2));
  const tat = Number(((b[0] + (b[0] + b[1]) + (b[0] + b[1] + b[2])) / 3).toFixed(2));
  return mk('os', 'Process Scheduling', 'easy',
    'P1, P2, and P3 arrive at time 0 and run under FCFS in that order. What is the average waiting time?',
    opts(avg, [rev, tat, Number(((b[0] + b[1]) / 3).toFixed(2))], (x) => `${x} ms`, 0.5),
    `Waiting times are 0, ${b[0]}, and ${b[0] + b[1]}. The average is (0 + ${b[0]} + ${b[0] + b[1]}) / 3 = ${avg} ms.`,
    { table: { headers: ['Process', 'CPU burst'], rows: b.map((x, i) => [`P${i + 1}`, `${x} ms`]) } });
}
function genRr() {
  const b = shuffle([3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const qn = pick([2, 3]);
  const rem = [...b];
  const queue = [0, 1, 2];
  const fin = [];
  let t = 0;
  while (queue.length) {
    const i = queue.shift();
    const run = Math.min(qn, rem[i]);
    t += run;
    rem[i] -= run;
    if (rem[i] > 0) queue.push(i);
    else fin[i] = t;
  }
  const k = rnd(0, 2);
  const others = fin.filter((_, i) => i !== k);
  return mk('os', 'Process Scheduling', 'medium',
    `Under Round Robin with a ${qn} ms quantum, when does P${k + 1} finish? (All arrive at time 0 in the order P1, P2, P3.)`,
    opts(fin[k], [...others, fin[k] + 1, fin[k] - 1, b.reduce((s, x) => s + x, 0)], (x) => `${x} ms`),
    `Simulating the queue with a ${qn} ms quantum gives completion times ${fin.map((x, i) => `P${i + 1}=${x}`).join(', ')}.`,
    { table: { headers: ['Process', 'CPU burst'], rows: b.map((x, i) => [`P${i + 1}`, `${x} ms`]), note: `Round Robin, quantum = ${qn} ms` } });
}
function genDisk() {
  const head = rnd(20, 90);
  const reqs = uniq(Array.from({ length: 12 }, () => rnd(5, 195))).filter((x) => x !== head).slice(0, 5);
  let total = 0;
  let cur = head;
  const parts = [];
  reqs.forEach((r) => {
    parts.push(Math.abs(r - cur));
    total += Math.abs(r - cur);
    cur = r;
  });
  const sorted = [...reqs].sort((a, b) => a - b);
  const sweep = Math.abs(head - sorted[0]) + (sorted[sorted.length - 1] - sorted[0]);
  return mk('os', 'I/O Systems', 'medium',
    `The disk head is at cylinder ${head}. Requests arrive in this order: ${reqs.join(', ')}. What is the total head movement under FCFS?`,
    opts(total, [sweep, total + 10, total - 14, total + 26], (x) => `${x} cylinders`, 6),
    `${parts.join(' + ')} = ${total} cylinders.`);
}

/* ---------- Quantitative Aptitude ---------- */
function genPercent() {
  const x = pick([10, 20, 25, 30, 40, 50]);
  const y = pick([10, 20, 25, 40, 50]);
  const net = Math.round(((1 + x / 100) * (1 - y / 100) - 1) * 1000) / 10;
  const fmt = (v) => `${v > 0 ? '+' : ''}${v}%`;
  return mk('qa', 'Percentages', 'medium',
    `A price rises by ${x}% and then falls by ${y}%. What is the net change?`,
    opts(net + 1000, [x - y + 1000, x + y + 1000, net + 1005, net + 995], (v) => fmt(v - 1000), 2.5),
    `(1 + ${x / 100}) x (1 - ${y / 100}) = ${(1 + x / 100) * (1 - y / 100)}, a net change of ${fmt(net)}.`);
}
function genRatio() {
  const [a, b] = pick([[2, 3], [3, 5], [4, 5], [3, 7], [5, 7], [2, 5]]);
  const k = rnd(4, 15);
  const total = (a + b) * k;
  const big = Math.max(a, b) * k;
  return mk('qa', 'Ratio & Proportion', 'easy',
    `Divide ${total} in the ratio ${a}:${b}. What is the larger share?`,
    opts(big, [Math.min(a, b) * k, big + k, big - k, total / 2], String, k),
    `Each part is ${total} / ${a + b} = ${k}, so the larger share is ${Math.max(a, b)} x ${k} = ${big}.`);
}
function genWork() {
  const [a, b] = pick([[12, 6], [20, 30], [15, 10], [12, 24], [30, 20], [18, 9], [40, 10]]);
  const t = (a * b) / (a + b);
  return mk('qa', 'Time & Work', 'medium',
    `A can finish a job in ${a} days and B in ${b} days. Working together, how many days do they need?`,
    opts(t, [(a + b) / 2, Math.abs(a - b), a + b, t + 2], (x) => `${x} days`, 1),
    `Rates add: 1/${a} + 1/${b} = ${a + b}/${a * b}, so together they need ${a * b}/${a + b} = ${t} days.`);
}
function genTrain() {
  const v = pick([10, 15, 20, 25]);
  const t = pick([20, 24, 30]);
  const total = v * t;
  const L = pick([100, 150, 200].filter((x) => x < total - 50));
  const P = total - L;
  return mk('qa', 'Speed & Distance', 'hard',
    `A ${L} m train crosses a ${P} m platform in ${t} s. What is its speed?`,
    opts(v * 3.6, [v * 3.6 + 18, v * 3.6 - 9, v * 3.6 + 9, v], (x) => `${Math.round(x * 10) / 10} km/h`, 6),
    `Distance covered = ${L} + ${P} = ${total} m in ${t} s = ${v} m/s = ${v * 3.6} km/h.`);
}
function genSeries() {
  const s = rnd(1, 9);
  const d = rnd(1, 4);
  const k = rnd(1, 3);
  const terms = [s];
  for (let i = 0; i < 5; i++) terms.push(terms[i] + d + k * i);
  const next = terms[5];
  const prev = terms[4];
  return mk('qa', 'Number Series', 'medium',
    `Find the next term: ${terms.slice(0, 5).join(', ')}, ?`,
    opts(next, [prev + d + k * 3, prev + d + k * 5, prev + k, prev + d], String, k),
    `Differences are ${[0, 1, 2, 3].map((i) => d + k * i).join(', ')}, rising by ${k} each time, so the next difference is ${d + k * 4}.`);
}

/* ---------- Computer Networks ---------- */
function genSubnet() {
  const p = rnd(24, 30);
  const h = 2 ** (32 - p) - 2;
  return mk('cn', 'Addressing & Subnetting', 'medium',
    `How many usable host addresses does a /${p} IPv4 subnet provide?`,
    opts(h, [h + 2, h * 2 + 2, Math.max(1, (h + 2) / 4 - 2), h * 2]),
    `${32 - p} host bits give 2^${32 - p} = ${h + 2} addresses. Subtract the network and broadcast addresses to get ${h}.`);
}

/* ---------- Data Structures & Algorithms ---------- */
function genBinSearch() {
  const k = rnd(5, 10);
  const n = 2 ** k - 1;
  return mk('dsa', 'Sorting & Searching', 'medium',
    `Binary search runs on a sorted array of ${n} elements. How many comparisons are needed in the worst case?`,
    opts(k, [k - 1, k + 1, Math.ceil(n / 2), k + 2], (x) => `${x} comparisons`),
    `Each comparison halves the range. ${n} = 2^${k} - 1, so at most ${k} comparisons are needed.`);
}
function genStairs() {
  const n = rnd(5, 9);
  const w = [1, 1];
  for (let i = 2; i <= n + 1; i++) w[i] = w[i - 1] + w[i - 2];
  const ways = w[n + 1];
  return mk('dsa', 'Dynamic Programming', 'medium',
    `In how many distinct ways can you climb ${n} stairs taking 1 or 2 steps at a time?`,
    opts(ways, [n, w[n], w[n + 2], 2 ** (n - 1)]),
    `ways(n) = ways(n-1) + ways(n-2) with ways(1)=1 and ways(2)=2, which gives ${ways} for n = ${n}.`);
}

const GENERATORS = {
  os: { 'Memory Management': [genPages, genTranslate], 'Process Scheduling': [genFcfs, genRr], 'I/O Systems': [genDisk] },
  qa: { Percentages: [genPercent], 'Ratio & Proportion': [genRatio], 'Time & Work': [genWork], 'Speed & Distance': [genTrain], 'Number Series': [genSeries] },
  cn: { 'Addressing & Subnetting': [genSubnet] },
  dsa: { 'Sorting & Searching': [genBinSearch], 'Dynamic Programming': [genStairs] },
};

let uid = 0;

/**
 * Build a personalised practice set from performance history.
 * mode: 'adaptive' (uses mastery per topic) | 'easy' | 'medium' | 'hard'
 */
export function generatePractice({ courseId, topics, count, mode, masteryByTopic = {}, pool = [] }) {
  const gens = GENERATORS[courseId] || {};
  let candidates = pool.filter((q) => topics.includes(q.topic));

  const made = [];
  topics.forEach((t) => (gens[t] || []).forEach((g) => { for (let i = 0; i < 3; i++) made.push(g()); }));
  const seen = new Set();
  made.forEach((q) => {
    if (!seen.has(q.text)) {
      seen.add(q.text);
      candidates.push({ ...q, id: `gen-${++uid}` });
    }
  });
  if (candidates.length < count) {
    const have = new Set(candidates.map((c) => c.id));
    candidates = candidates.concat(shuffle(pool.filter((q) => !have.has(q.id))));
  }

  const targetFor = (topic) => {
    if (mode === 'mixed') return null;
    if (mode !== 'adaptive') return DIFF[mode];
    const m = masteryByTopic[topic];
    return m == null ? 2 : m < 50 ? 1 : m < 80 ? 2 : 3;
  };

  const chosen = [];
  const perTopic = {};
  const perKind = {};
  const kindOf = (q) => (q.generated ? q.text.slice(0, 22) : q.id);
  const left = [...candidates];
  while (chosen.length < count && left.length) {
    let bi = 0;
    let bs = Infinity;
    left.forEach((q, i) => {
      const tg = targetFor(q.topic);
      const s = (tg == null ? 0 : Math.abs(DIFF[q.difficulty] - tg)) + (perTopic[q.topic] || 0) * 0.4 + (perKind[kindOf(q)] || 0) * 0.9 + Math.random() * 0.5;
      if (s < bs) { bs = s; bi = i; }
    });
    const [q] = left.splice(bi, 1);
    perTopic[q.topic] = (perTopic[q.topic] || 0) + 1;
    perKind[kindOf(q)] = (perKind[kindOf(q)] || 0) + 1;
    chosen.push(q);
  }
  return mode === 'mixed' ? chosen.sort(() => Math.random() - 0.5) : chosen.sort((a, b) => DIFF[a.difficulty] - DIFF[b.difficulty]);
}
