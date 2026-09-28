#!/usr/bin/env node
// node scripts/perf/compare.mjs BEFORE/summary.json AFTER/summary.json > comparison.md
// Median-of-runs before/after table. Change is (after - before) / before.
import { readFileSync } from 'node:fs';
import { SEGMENTS, metricLabels } from './metrics.mjs';

const [before, after] = process.argv.slice(2).map(path => JSON.parse(readFileSync(path, 'utf8')));
const fmt = value => value === null || value === undefined ? 'n/a' : Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2);
function change(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return 'n/a';
  if (a === 0) return b === 0 ? '0%' : 'new';
  const pct = (b - a) / Math.abs(a) * 100;
  return `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`;
}
const row = (label, a, b) => `| ${label} | ${fmt(a)} | ${fmt(b)} | ${change(a, b)} |\n`;

let text = `# Before/after — median of ${before.runs} runs each\n\nBefore: ${before.url} · After: ${after.url}\n`;
for (const profile of Object.keys(before.profiles)) {
  const a = before.profiles[profile].median, b = after.profiles[profile]?.median;
  if (!b) continue;
  text += `\n## ${profile} (tier ${a.quality} → ${b.quality})\n\n| Startup and memory | Before | After | Change |\n|---|---:|---:|---:|\n`;
  text += row('Scene ready (ms)', a.startup.readyMs, b.startup.readyMs);
  text += row('Opening finished (ms)', a.startup.introEndMs, b.startup.introEndMs);
  text += row('Startup long-frame blocking (ms)', a.startup.totalLongFrameBlockingMs, b.startup.totalLongFrameBlockingMs);
  text += row('JS heap at end (MB)', a.memory.jsHeapMB, b.memory.jsHeapMB);
  text += row('Renderer footprint (MB)', a.memory.renderer, b.memory.renderer);
  text += row('GPU process footprint (MB)', a.memory.gpu, b.memory.gpu);
  text += row('System GPU memory in use (MB)', a.memory.gpuInUseMB, b.memory.gpuInUseMB);
  text += row('System GPU utilization, blank page (%)', a.idleSystemGpuPct, b.idleSystemGpuPct);
  for (const segment of SEGMENTS) {
    text += `\n### ${segment}\n\n| Metric | Before | After | Change |\n|---|---:|---:|---:|\n`;
    for (const [key, label] of metricLabels) text += row(label, a.segments[segment][key], b.segments[segment][key]);
  }
}
process.stdout.write(text);
