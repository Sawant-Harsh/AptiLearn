import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { connectDb } from './db.js';
import { seedAll } from './seed.js';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;

export async function start({ port = PORT, dbFile = process.env.DB_FILE || path.join(__dirname, '../data/db.json'), quiet = false } = {}) {
  const { db, kind } = await connectDb({ uri: process.env.MONGODB_URI, dbName: process.env.MONGODB_DB, file: dbFile });
  await seedAll(db, { adminEmail: process.env.ADMIN_EMAIL || 'admin@gmail.com', adminPassword: process.env.ADMIN_PASSWORD || 'admin123' });

  const server = http.createServer();
  const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true } });
  io.use((socket, next) => {
    try {
      const p = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET || 'dev-secret-change-me');
      socket.data = { id: p.id, role: p.role };
      next();
    } catch { next(new Error('unauthorized')); }
  });
  io.on('connection', (s) => { s.join(`user:${s.data.id}`); s.join(s.data.role === 'admin' ? 'admins' : 'students'); });
  const rt = {
    toUser: (id, evt, data) => io.to(`user:${id}`).emit(evt, data),
    toAll: (evt, data) => io.emit(evt, data),
    toAdmins: (evt, data) => io.to('admins').emit(evt, data),
  };

  const app = createApp({ db, rt });
  const dist = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  server.on('request', (req, res) => { if (!req.url.startsWith('/socket.io')) app(req, res); });
  await new Promise((r) => server.listen(port, r));
  if (!quiet) {
    console.log(`\nAptiLearn API running on http://localhost:${server.address().port}  (database: ${kind})`);
    console.log(`  AI: ${process.env.ANTHROPIC_API_KEY ? 'enabled' : 'NOT configured (set ANTHROPIC_API_KEY)'} | Google: ${process.env.GOOGLE_CLIENT_ID ? 'enabled' : 'NOT configured'} | YouTube API: ${process.env.YOUTUBE_API_KEY ? 'enabled' : 'NOT configured'}`);
    if (fs.existsSync(dist)) console.log('  Serving built client from client/dist');
  }
  return { server, io, db, close: async () => { io.close(); await new Promise((r) => server.close(r)); await db.flush(); } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) start().catch((e) => { console.error(e); process.exit(1); });
