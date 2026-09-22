import { artifactPath } from './artifact-path.mjs';
/** Focused native touch/pointer verification against the existing QA browser. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const out=artifactPath('portfolio');
const binary=process.env.AGENT_BROWSER||'agent-browser',session=process.env.BROWSER_SESSION||'uifix-check';
const run=(...args)=>execFileSync(binary,['--session',session,...args],{encoding:'utf8',timeout:60000}).trim();
const evaluate=js=>JSON.parse(run('eval',js));
const state=()=>evaluate('({...document.querySelector(".console-stage").dataset})');
const tick=ms=>new Promise(r=>setTimeout(r,ms));
const key=k=>run('press',k);
const browserURL=run('get','cdp-url');
const tabs=await (await fetch(new URL('/json',browserURL.replace('ws:','http:')))).json();
const tab=tabs.find(t=>t.type==='page'&&t.url.startsWith('http://localhost:'));assert.ok(tab);
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let serial=0;const pending=new Map();
ws.onmessage=e=>{const v=JSON.parse(e.data),p=pending.get(v.id);if(p){clearTimeout(p.timeout);pending.delete(v.id);v.error?p.reject(Error(JSON.stringify(v.error))):p.resolve(v.result);}};
function call(method,params){return new Promise((resolve,reject)=>{const id=++serial,timeout=setTimeout(()=>reject(Error(method)),10000);pending.set(id,{resolve,reject,timeout});ws.send(JSON.stringify({id,method,params}));});}
try{
 run('set','viewport','390','844');await tick(1000);
 const points=(a,b)=>[{id:1,x:a,y:410},{id:2,x:b,y:410}];
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(145,235)});
 await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(95,285)});
 await tick(500);await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok(Number(state().zoom)>1.7);assert.equal(state().menu,'home');
 run('screenshot',`${out}/mobile-pinch-console.png`);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(95,285)});
 await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(145,235)});
 await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tick(500);assert.equal(state().zoom,'1.00');
 run('set','viewport','1280','800');await tick(3000);
 const targets=evaluate('JSON.parse(document.querySelector(".console-stage").dataset.targets)');
 const a=targets.Touch_52_76,b=targets.Touch_136_76;
 run('mouse','move',String(Math.round(a[0])),String(Math.round(a[1])));run('mouse','down');await tick(600);run('mouse','move',String(Math.round(b[0])),String(Math.round(b[1])));run('mouse','up');
 const layout=()=>evaluate('JSON.parse(localStorage.getItem("paramveer-3ds-v1")).layout');
 assert.equal(layout()[2],'work');assert.equal(layout()[0],'hobbies');
 run('reload');run('wait','.console-stage[data-menu="home"]');assert.equal(layout()[2],'work');
 evaluate('document.querySelectorAll(".sr-only button")[8].click()');key('ArrowDown');key('ArrowDown');key('Enter');key('Escape');assert.equal(layout()[0],'work');
 writeFileSync(`${out}/gesture-checks.json`,JSON.stringify({passed:true,checks:['native two-finger pinch','pinch does not launch apps','pinch return to full console','hold and drag swaps icons','layout survives reload','physical preferences reset layout']},null,2)+'\n');
 console.log('Pinch, reorder, persistence and reset passed.');
}finally{ws.close();}
