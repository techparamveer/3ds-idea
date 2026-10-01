// Minimal Chrome DevTools Protocol client for the performance benchmark.
// Uses only Node built-ins (spawn, fetch, WebSocket) so it adds no dependency.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// CHROMIUM_WINDOW=x,y,width,height places headed windows, for example on a
// second display such as an iPad in Sidecar mode.
const [windowX, windowY, windowWidth, windowHeight] = (process.env.CHROMIUM_WINDOW ?? '0,0,1440,1000').split(',').map(Number);

export async function launchChromium(executable, extraArgs = [], { headless = true } = {}) {
  const profile = await mkdtemp(join(tmpdir(), '3ds-perf-profile-'));
  const args = [
    ...(headless ? ['--headless=new'] : [`--window-size=${windowWidth},${windowHeight}`, `--window-position=${windowX},${windowY}`]), '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--enable-precise-memory-info',
    '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=metal',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--autoplay-policy=no-user-gesture-required',
    '--mute-audio', ...extraArgs, 'about:blank',
  ];
  const child = spawn(executable, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  child.stderr.on('data', () => {});
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; } catch {}
  }
  if (!port) { child.kill(); throw new Error('Chromium did not expose a DevTools port'); }
  return {
    port: Number(port), profile, pid: child.pid,
    async close() { child.kill(); await sleep(300); await rm(profile, { recursive: true, force: true }); },
  };
}

export class CdpSession {
  static async openPage(port) {
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    return new CdpSession(socket, port, target.id);
  }
  constructor(socket, port, targetId) {
    this.socket = socket; this.port = port; this.targetId = targetId; this.id = 0;
    this.pending = new Map(); this.listeners = new Map();
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id); this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message} ${message.error.data ?? ''}`)); else resolve(message.result);
      } else if (message.method) for (const listener of this.listeners.get(message.method) ?? []) listener(message.params);
    };
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP ${method} timed out`)); }, timeoutMs);
      this.pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, listener) { const list = this.listeners.get(method) ?? []; list.push(listener); this.listeners.set(method, list); }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
  async waitFor(expression, timeoutMs = 60000, intervalMs = 50) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (await this.evaluate(expression)) return Date.now() - started;
      await sleep(intervalMs);
    }
    throw new Error(`Timed out waiting for ${expression}`);
  }
  async close() {
    try { await fetch(`http://127.0.0.1:${this.port}/json/close/${this.targetId}`); } catch {}
    this.socket.close();
  }
}

export { sleep };
