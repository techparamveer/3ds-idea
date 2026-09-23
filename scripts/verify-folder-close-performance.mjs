#!/usr/bin/env node
// Start with an open folder in the diagnostics browser session. Uses a real
// accessible Back keypress; no state injection, screenshots or profiling during
// the measured interval. All output is written beneath the supplied directory.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (index % 2 === 0) pairs.push([value, all[index + 1]]);
  return pairs;
}, []));
const directory = args['--artifact-dir'], name = args['--name'] ?? 'folder-close';
if (!directory || !isAbsolute(directory) || !/^[a-z0-9-]+$/.test(name)) {
  throw new Error('Supply --artifact-dir /absolute/SSD/path and an optional simple --name');
}
const binary = args['--browser-bin'] ?? 'agent-browser', session = args['--session'] ?? 'firmware-native-check';
function browser(command, input) {
  const result = spawnSync(binary, ['--session', session, ...command], { input, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr ?? result.stdout);
  return result.stdout.trim();
}
const evaluate = code => JSON.parse(browser(['eval', '--stdin'], code));
const back = browser(['snapshot', '-i']).match(/button "B: Back" \[ref=(e\d+)\]/)?.[1];
if (!back) throw new Error('Accessible Back control is missing');
browser(['focus', `@${back}`]);
const initial = evaluate(`(()=>{
  const host=document.querySelector('[role=application]');
  if(!host||host.dataset.ready!=='true'||host.dataset.menu!=='folder'||!host.dataset.homeUpdates)throw new Error('Ready open-folder diagnostics required');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)throw new Error('Use normal motion for this performance capture');
  window.__folderClosePerformance?.stop?.();
  const started=performance.now(), result={started,initial:{selected:host.dataset.selected,rows:host.dataset.rows,quality:host.dataset.quality,updates:Number(host.dataset.homeUpdates),banner:JSON.parse(host.dataset.folderBanner)},inputAt:null,frames:[],longTasks:[],done:false};
  let request,finished=false;
  const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())result.longTasks.push({start:entry.startTime,duration:entry.duration});});
  observer.observe({type:'longtask'});
  const key=event=>{if(event.key==='Enter'&&result.inputAt===null)result.inputAt=performance.now();};
  document.addEventListener('keydown',key,true);
  const stop=()=>{finished=true;cancelAnimationFrame(request);observer.disconnect();document.removeEventListener('keydown',key,true);result.done=true;};
  const frame=now=>{if(finished)return;result.frames.push({now,updates:Number(host.dataset.homeUpdates),close:JSON.parse(host.dataset.folderClose||'null')});if(now-started>6000){stop();return;}request=requestAnimationFrame(frame);};
  window.__folderClosePerformance={result,stop};request=requestAnimationFrame(frame);
  return {selected:host.dataset.selected,rows:host.dataset.rows,quality:host.dataset.quality};
})()`);
browser(['press', 'Enter']);
await new Promise(resolve => setTimeout(resolve, 6500));
const result = evaluate('(()=>{const record=window.__folderClosePerformance;record.stop();return record.result;})()');
const closing = result.frames.filter(frame => frame.close?.controller.phase === 'closing' && frame.now >= result.inputAt);
const record = closing[0]?.close ?? result.frames.find(frame => frame.close?.startedAtUpdate >= result.initial.updates)?.close;
const gaps = result.frames.slice(1).map((frame, i) => frame.now - result.frames[i].now).sort((a, b) => a - b);
const latest = result.frames.at(-1)?.close;
const summary = { ...initial, inputAt: result.inputAt, rafSamples: result.frames.length,
  rafGapP50: gaps[Math.floor(gaps.length * .5)] ?? null, rafGapP95: gaps[Math.floor(gaps.length * .95)] ?? null,
  rafGapMax: gaps.at(-1) ?? null, longTaskCount: result.longTasks.length,
  longestTaskMs: Math.max(0, ...result.longTasks.map(task => task.duration)),
  closingFramesObserved: [...new Set(closing.map(frame => frame.close.controller.folder.appliedFrame))],
  startedAtUpdate: record?.startedAtUpdate ?? null, restoredAtUpdate: latest?.restoredAtUpdate ?? null,
  selectionReadyAtUpdate: latest?.selectionReadyAtUpdate ?? null, finalPhase: latest?.controller.phase ?? null,
};
mkdirSync(directory, { recursive: true });
writeFileSync(join(directory, `${name}.json`), JSON.stringify({ summary, ...result }, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!record || latest?.controller.phase !== 'complete' || latest.startedAtUpdate < result.initial.updates) throw new Error('No newly completed folder close observed; prepare an open folder and retry');
