/** End-to-end browser checks using actual keys and projected touchscreen hits. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const binary = process.env.AGENT_BROWSER || 'agent-browser';
const session = process.env.BROWSER_SESSION || 'uifix';
const out = 'docs/validation/uifix';
mkdirSync(out, { recursive: true });
const run = (...args) => execFileSync(binary, ['--session', session, ...args], { encoding: 'utf8', timeout: 60000 }).trim();
const evaluate = js => JSON.parse(run('eval', js));
const state = () => evaluate('({...document.querySelector(".console-stage").dataset})');
const tick = ms => new Promise(resolve => setTimeout(resolve, ms));
const key = value => run('press', value);
function click(target) {
 const [x,y] = evaluate(`JSON.parse(document.querySelector('.console-stage').dataset.targets)[${JSON.stringify(target)}]`);
 run('mouse', 'move', String(Math.round(x)), String(Math.round(y))); run('mouse', 'down'); run('mouse', 'up');
}
async function capture(name) {
 const images=evaluate('Object.fromEntries(Object.entries(document.querySelector(".console-stage").screenCanvases).map(([k,c])=>[k,c.toDataURL()]))');
 for(const [k,v]of Object.entries(images)){
  const buffer=Buffer.from(v.split(',')[1], 'base64');
  await sharp(buffer).resize(k==='top'?400:320,240,{fit:'fill'}).png().toFile(`${out}/${name}-${k}.png`);
 }
 run('screenshot', `${out}/${name}-console.png`);
}
run('set','media','light');run('set','viewport','1280','720');run('open',process.env.UI_URL||'http://localhost:3000');
run('wait','.console-stage[data-ready="true"][data-intro="false"]');
await tick(2200); // Projection targets are refreshed every 120 animation frames.
assert.equal(state().vgpu,'ready');
assert.equal(evaluate('Array.from(document.fonts).some(f=>f.family.includes("HOME Menu")&&f.status==="loaded")'),true);
const moving=evaluate('document.querySelector(".console-stage").screenCanvases.top.toDataURL()');await tick(180);
assert.ok(evaluate('document.querySelector(".console-stage").screenCanvases.top.toDataURL()')!==moving,'Top-screen animation must advance');
run('set','media','light','reduced-motion');await tick(150);
const still=evaluate('document.querySelector(".console-stage").screenCanvases.top.toDataURL()');await tick(180);
assert.ok(evaluate('document.querySelector(".console-stage").screenCanvases.top.toDataURL()')===still,'Reduced motion must freeze the artwork');
await capture('home');
key('ArrowRight');assert.equal(state().selected,'2');
click('Button_A');assert.equal(state().menu,'folder');await capture('folder');
click('Button_B');assert.equal(state().menu,'home');assert.equal(state().selected,'2');
click('Touch_307_16');assert.equal(state().rows,'3');await capture('three-rows');
click('Touch_277_16');assert.equal(state().rows,'2');
click('Touch_20_16');assert.equal(state().menu,'settings');await capture('settings');
click('Touch_150_65');assert.equal(state().menu,'themes');await capture('themes');
click('Touch_100_150');assert.equal(state().theme,'blue');assert.equal(state().menu,'settings');
key('Escape');assert.equal(state().menu,'home');await capture('blue-theme');
click('Touch_20_16');click('Touch_150_65');for(let i=0;i<6;i++)key('ArrowDown');key('Enter');key('Escape');assert.equal(state().theme,'white');
click('Touch_50_226');assert.equal(state().menu,'folder-settings');click('Touch_100_90');assert.equal(state().menu,'rename');
key('T');key('e');key('s');key('t');await capture('rename');key('Escape');
click('Touch_70_16');assert.equal(state().menu,'notes');key('h');assert.equal(state().menu,'home');
click('Button_POWER');assert.equal(state().powered,'false');key('ArrowRight');assert.equal(state().selected,'2');click('Button_POWER');assert.equal(state().powered,'true');
run('set','viewport','390','844');await tick(2500);await capture('mobile');
const bounds=evaluate('({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,vw:innerWidth,vh:innerHeight})');assert.equal(bounds.w,bounds.vw);assert.equal(bounds.h,bounds.vh);
run('set','viewport','1280','720');await tick(2200);key('ArrowLeft');await capture('final');
const errors=run('errors');assert.equal(errors,'');
writeFileSync(`${out}/browser-checks.json`,JSON.stringify({passed:true,checks:['font loaded','continuous animation','reduced motion freezes animation','D-pad selection','physical A/B','independent folder navigation','touch density controls','settings','theme changes','rename cancel','toolbar return','physical power','mobile viewport'],state:state(),errors},null,2)+'\n');
console.log('All HOME Menu browser checks passed.');
