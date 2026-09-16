/** Real browser inputs; no synthetic OS state setters. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const binary=process.env.AGENT_BROWSER||'agent-browser',session=process.env.BROWSER_SESSION||'uifix-check',out='docs/validation/uifix-apps';
mkdirSync(out,{recursive:true});
const run=(...args)=>execFileSync(binary,['--session',session,...args],{encoding:'utf8',timeout:60000}).trim();
const evaluate=js=>JSON.parse(run('eval',js));
const state=()=>evaluate('({...document.querySelector(".console-stage").dataset})');
const key=k=>run('press',k);
const tick=ms=>new Promise(r=>setTimeout(r,ms));
const wait=selector=>run('wait',selector);
const home=()=>wait('.console-stage[data-menu="home"]');
async function capture(name,console=true){
 const data=evaluate('Object.fromEntries(Object.entries(document.querySelector(".console-stage").screenCanvases).map(([k,c])=>[k,c.toDataURL()]))');
 for(const [kind,url]of Object.entries(data))await sharp(Buffer.from(url.split(',')[1],'base64')).resize(kind==='top'?400:320,240,{fit:'fill',kernel:'nearest'}).png().toFile(`${out}/${name}-${kind}.png`);
 if(console)run('screenshot',`${out}/${name}-console.png`);
}
function point(target){return evaluate(`JSON.parse(document.querySelector('.console-stage').dataset.targets)[${JSON.stringify(target)}]`);}
function click(target){const [x,y]=point(target);run('mouse','move',String(Math.round(x)),String(Math.round(y)));run('mouse','down');run('mouse','up');}
run('set','viewport','1280','800');run('set','media','light');run('open',process.env.UI_URL||'http://localhost:3000');
evaluate('localStorage.removeItem("paramveer-3ds-v1")');run('reload');home();wait('.console-stage[data-targets]');
assert.equal(state().app,'');assert.equal(state().selected,'0');await capture('home');
assert.equal(evaluate('Array.from(document.fonts).some(f=>f.family.includes("HOME Menu")&&f.status==="loaded")'),true);
const names=['work','projects','hobbies','life','hackuk','nvidia','about','contact'];
for(let i=0;i<names.length;i++){
 if(i){key('h');home();key('Escape');key('Enter');home();if(i%2)key('ArrowDown');else{key('ArrowUp');key('ArrowRight');}}
 if(i===0)click('Button_A');else key('Enter');
 wait('.console-stage[data-menu="app"]');assert.equal(state().app,names[i]);
 await capture(names[i]);key('Enter');assert.equal(state().detail,'true');await capture(`${names[i]}-detail`,false);
 if(i===0){key('h');assert.equal(state().menu,'home');key('h');assert.equal(state().menu,'app');assert.equal(state().detail,'true');}
 if(i===2){key('ArrowRight');assert.equal(state().photo,'1');key('ArrowRight');assert.equal(state().photo,'2');await capture('gallery');key('ArrowDown');assert.equal(state().page,'1');}
 key('Escape');assert.equal(state().detail,'false');
}
key('h');home();key('ArrowLeft');key('Enter');assert.equal(state().dialog,'switch');await capture('switch');key('Escape');assert.equal(state().app,'contact');
key('p');assert.equal(state().menu,'power');await capture('power');key('Escape');assert.equal(state().menu,'home');key('p');key('Enter');assert.equal(state().powered,'false');await capture('off');key('ArrowRight');assert.equal(state().powered,'false');key('p');await capture('boot',false);home();
// Original WAVs must actually decode and play after a real gesture.
key('ArrowLeft');await tick(500);key('ArrowRight');const audio=JSON.parse(state().audio);assert.equal(audio.state,'running');assert.equal(audio.decoded,8);assert.equal(audio.lastPlayed,'select');
// Sleep gates inputs and restores the running app.
key('Enter');wait('.console-stage[data-menu="app"]');key('Space');assert.equal(state().sleeping,'true');key('Enter');key('Space');await tick(1500);assert.equal(state().sleeping,'false');assert.equal(state().menu,'app');key('h');home();
click('Touch_20_16');assert.equal(state().menu,'settings');await capture('settings');
// Accessible control shares the same reducer as physical and touch input.
evaluate('document.querySelectorAll(".sr-only button")[8].click()');assert.equal(state().preferences,'true');await capture('sound');key('m');assert.equal(state().muted,'true');key('Escape');key('Escape');
run('reload');home();assert.equal(state().muted,'true');assert.equal(state().app,'');
run('set','media','light','reduced-motion');await tick(300);
const frozen=evaluate('document.querySelector(".console-stage").screenCanvases.top.toDataURL()');await tick(200);assert.equal(evaluate('document.querySelector(".console-stage").screenCanvases.top.toDataURL()'),frozen);
run('set','viewport','390','844');await tick(2000);await capture('mobile');const bounds=evaluate('({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,vw:innerWidth,vh:innerHeight})');assert.equal(bounds.w,bounds.vw);assert.equal(bounds.h,bounds.vh);
run('mouse','move','195','420');run('mouse','wheel','-800');await tick(500);assert.ok(Number(state().zoom)>1.5);await capture('mobile-zoom');run('mouse','wheel','800');await tick(500);
run('set','viewport','1280','800');await tick(1500);await capture('final');
const errors=run('errors');assert.equal(errors,'');
writeFileSync(`${out}/browser-checks.json`,JSON.stringify({passed:true,apps:names,checks:['physical A','keyboard and touch','app details','gallery and pagination','HOME suspend/resume','switch confirmation','power confirmation and boot','sleep and wake','original audio decoded and played','mute persistence','reduced motion','mobile bounds','screen zoom','font loaded'],audio,bounds,state:state(),errors},null,2)+'\n');
console.log('Portfolio browser checks passed.');
