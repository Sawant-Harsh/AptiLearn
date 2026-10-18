// Runs the API (port 5000, auto-restart) and the Vite client (port 3000) together.
import { spawn } from 'child_process';

const run = (name, args) => {
  const p = spawn('npm', args, { stdio: 'inherit', shell: true });
  p.on('exit', (code) => { console.log(`[${name}] exited (${code})`); process.exit(code ?? 0); });
  return p;
};
const procs = [run('server', ['--prefix', 'server', 'run', 'dev']), run('client', ['--prefix', 'client', 'start'])];
const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
