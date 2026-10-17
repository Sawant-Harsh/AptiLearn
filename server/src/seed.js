import bcrypt from 'bcryptjs';
import { COURSES } from './data/courses.js';
import { QUESTIONS } from './data/questions.js';
import { lessonsOf, newEnrollment, localDate } from './logic.js';

function rng(seed) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karthik', 'Siddharth', 'Rahul', 'Nikhil', 'Harsh', 'Ishaan', 'Kabir', 'Ankit', 'Varun', 'Manish', 'Priya', 'Ananya', 'Diya', 'Neha', 'Sneha', 'Kavya', 'Isha', 'Meera', 'Pooja', 'Riya', 'Shreya', 'Aishwarya', 'Divya', 'Lakshmi', 'Nandini', 'Tanvi', 'Swati', 'Aditi', 'Pallavi', 'Sanjana', 'Rakesh', 'Suresh', 'Vikram', 'Deepak', 'Gaurav'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Iyer', 'Nair', 'Reddy', 'Patel', 'Mehta', 'Joshi', 'Kulkarni', 'Singh', 'Yadav', 'Das', 'Bose', 'Chatterjee', 'Menon', 'Pillai', 'Rao', 'Naidu', 'Desai', 'Shah', 'Kapoor', 'Malhotra', 'Banerjee', 'Agarwal', 'Jain', 'Thakur', 'Mishra', 'Pandey', 'Choudhury'];
const CITIES = ['Mumbai', 'Pune', 'Bengaluru', 'Hyderabad', 'Chennai', 'Delhi', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Indore', 'Nagpur', 'Chandigarh', 'Bhopal'];

export async function seedAll(db, { adminEmail, adminPassword }) {
  // single admin account (always ensured)
  const admin = await db.findOne('users', { role: 'admin' });
  const hash = await bcrypt.hash(adminPassword, 10);
  if (!admin) {
    await db.insert('users', { role: 'admin', name: 'Admin', email: adminEmail.toLowerCase(), passwordHash: hash, profile: { designation: 'Platform Administrator', organization: 'AptiLearn' }, createdAt: new Date().toISOString() });
  } else if (admin.email !== adminEmail.toLowerCase() || !(await bcrypt.compare(adminPassword, admin.passwordHash))) {
    await db.replace('users', { ...admin, email: adminEmail.toLowerCase(), passwordHash: hash });
  }

  if ((await db.count('courses')) === 0) await db.insertMany('courses', COURSES.map((c) => ({ ...c, createdAt: new Date().toISOString() })));
  if ((await db.count('questions')) === 0) {
    await db.insertMany('questions', QUESTIONS.map(({ id, ...q }) => ({ ...q, id, source: 'seed', published: true, createdAt: new Date().toISOString() })));
  }

  if ((await db.count('users', { seed: true })) > 0) return;
  const r = rng(20261015);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const used = new Set();
  const courses = COURSES;
  const weights = [4, 3, 2, 3, 5, 4, 5, 3, 4]; // popularity per course
  const bag = courses.flatMap((c, i) => Array(weights[i]).fill(c));
  const docs = [];
  for (let n = 0; n < 72; n++) {
    let name;
    do name = `${pick(FIRST)} ${pick(LAST)}`; while (used.has(name));
    used.add(name);
    const enrolled = new Set();
    const k = 1 + Math.floor(r() * 3);
    while (enrolled.size < k) enrolled.add(pick(bag));
    const enrollments = {};
    for (const c of enrolled) {
      const e = newEnrollment();
      e.enrolledAt = new Date(Date.now() - Math.floor(r() * 40) * 86400000).toISOString();
      const lessons = lessonsOf(c);
      const doneN = Math.floor(r() * (lessons.length * 0.9));
      e.completedLessons = lessons.slice(0, doneN).map((l) => l.id);
      e.notesRead = e.completedLessons.filter(() => r() < 0.5);
      const sets = Math.floor(r() * 4);
      e.quiz = { correct: sets * Math.floor(3 + r() * 5), total: sets * 8, sets };
      if (r() < 0.88) {
        const base = r() < 0.14 ? 30 + r() * 22 : 58 + r() * 40;
        const total = 15;
        const correct = Math.max(1, Math.min(total, Math.round((base / 100) * total)));
        const topics = c.topics.map((t) => ({ topic: t, asked: 2, correct: 1, mastery: Math.max(10, Math.min(100, Math.round(base + (r() - 0.5) * 50))) }));
        e.diagnostic = { courseId: c.id, total, correct, answered: total, skipped: 0, unseen: 0, accuracy: Math.round((correct / total) * 1000) / 10, timeSec: 400 + Math.floor(r() * 700), topics, completedAt: e.enrolledAt };
      }
      enrollments[c.id] = e;
    }
    const first = name.split(' ')[0].toLowerCase();
    docs.push({
      role: 'student', seed: true, name, email: `${first}.${n}@seed.aptilearn.local`, passwordHash: null,
      profile: { roll: `STU-${String(1001 + n)}`, city: pick(CITIES), program: 'B.Tech', university: 'Demo University' },
      streak: { count: 1 + Math.floor(r() * 14), lastDate: localDate(-Math.floor(r() * 3)) },
      selectedCourseId: Object.keys(enrollments)[0], enrollments, notifications: [], createdAt: new Date().toISOString(),
    });
  }
  await db.insertMany('users', docs);
}
