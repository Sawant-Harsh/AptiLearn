import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const uid = () => randomUUID();
const clone = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const matches = (doc, filter) => Object.entries(filter).every(([k, v]) => doc[k] === v);

/** Zero-setup JSON-file store with the same async interface as the MongoDB adapter. */
class FileDB {
  constructor(file) {
    this.file = file;
    this.data = { users: [], courses: [], questions: [], videos: [] };
    if (file && fs.existsSync(file)) {
      try { this.data = { ...this.data, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { /* start fresh */ }
    }
    this.timer = null;
  }
  persist() {
    if (!this.file) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data));
      fs.renameSync(tmp, this.file);
    }, 120);
  }
  async flush() { clearTimeout(this.timer); if (this.file) { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(this.data)); } }
  async find(col, filter = {}) { return this.data[col].filter((d) => matches(d, filter)).map(clone); }
  async findOne(col, filter) { return clone(this.data[col].find((d) => matches(d, filter)) || null); }
  async insert(col, doc) { const d = { id: uid(), ...clone(doc) }; this.data[col].push(d); this.persist(); return clone(d); }
  async insertMany(col, docs) { for (const d of docs) this.data[col].push({ id: uid(), ...clone(d) }); this.persist(); }
  async replace(col, doc) { const i = this.data[col].findIndex((d) => d.id === doc.id); if (i < 0) return null; this.data[col][i] = clone(doc); this.persist(); return clone(doc); }
  async remove(col, id) { const n = this.data[col].length; this.data[col] = this.data[col].filter((d) => d.id !== id); this.persist(); return this.data[col].length < n; }
  async count(col, filter = {}) { return this.data[col].filter((d) => matches(d, filter)).length; }
}

class MongoDB {
  constructor(db) { this.db = db; }
  c(col) { return this.db.collection(col); }
  async find(col, filter = {}) { return this.c(col).find(filter, { projection: { _id: 0 } }).toArray(); }
  async findOne(col, filter) { return this.c(col).findOne(filter, { projection: { _id: 0 } }); }
  async insert(col, doc) { const d = { id: uid(), ...doc }; await this.c(col).insertOne({ ...d }); return d; }
  async insertMany(col, docs) { if (docs.length) await this.c(col).insertMany(docs.map((d) => ({ id: uid(), ...d }))); }
  async replace(col, doc) { await this.c(col).replaceOne({ id: doc.id }, { ...doc }); return doc; }
  async remove(col, id) { const r = await this.c(col).deleteOne({ id }); return r.deletedCount > 0; }
  async count(col, filter = {}) { return this.c(col).countDocuments(filter); }
  async flush() {}
}

export async function connectDb({ uri, dbName, file } = {}) {
  if (uri) {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName || 'aptilearn');
    for (const [col, key] of [['users', 'email'], ['users', 'id'], ['courses', 'id'], ['questions', 'id']]) {
      await db.collection(col).createIndex({ [key]: 1 }, { unique: key === 'id' || (col === 'users' && key === 'email') }).catch(() => {});
    }
    return { db: new MongoDB(db), kind: 'mongodb' };
  }
  return { db: new FileDB(file), kind: 'file' };
}
