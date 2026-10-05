import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const slidebar=JSON.parse(readFileSync(new URL('packs/notifications/slidebar.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const compiled=ts.transpileModule(painter, {compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022}}).outputText
  .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
  .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href))
  .replaceAll("'./device-status-profile'", JSON.stringify(new URL('../src/os/device-status-profile.ts', import.meta.url).href));
const {notificationSlideBarPose}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const f32=Math.fround;

test('idle travel is 0x13aa9c with ratio 0; traced count 0 is not the still', ()=>{
  const bar=Object.fromEntries(flatten(slidebar.layouts.SlideBar.roots).map(pane=>[pane.name, pane]));
  const names=slidebar.layouts.SlideBar.textures;
  const tex=name=>slidebar.textures[names[name]];
  assert.deepEqual(bar.B_Groove_00.translation, [0, 0, 0]);
  assert.equal(tex(4).width, 11);
  assert.equal(tex(4).height, 11);
  assert.equal(tex(5).width, 11);
  assert.equal(tex(1).height, 16);
  assert.match(painter, /pictureSampling:'lcd',bindings:\[\{name:'SlideBar_Select',frame:0\}\],overrides:notificationSlideBarOverrides\(start,view\.rows\.length\)/,
    'fractional thumb samples the traced material once; view.rows.length stays the unbound extra-6 profile');
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  const materials=Object.fromEntries(slidebar.layouts.SlideBar.materials.map(material=>[material.name, material]));
  assert.deepEqual(materials.SBBtnEmb.textureMaps, [{magFilter:1, minFilter:1, texture:1, wrapS:2, wrapT:0}]);
  assert.deepEqual(materials.SBBtnEmb.tevStages, []);
  assert.deepEqual(bar.SBBtnEmb.picture.uvSets, [[0, 0, 2, 0, 0, 1, 2, 1]]);
  for(const name of ['SBBtnLT', 'SBBtnRT', 'SBBtnLB', 'SBBtnRB']){
    assert.deepEqual(materials[name].tevStages, [], name);
    assert.equal(materials[name].textureMaps[0].wrapS, 0, name);
    assert.equal(materials[name].textureMaps[0].wrapT, 0, name);
    assert.equal(materials[name].textureMaps[0].magFilter, 1, name);
    assert.equal(materials[name].textureMaps[0].minFilter, 1, name);
  }
  const idle=notificationSlideBarPose(0, 9);
  const tracedInitial=notificationSlideBarPose(0, 0);
  const literalCount=notificationSlideBarPose(0, 1);
  assert.equal(idle.extra, 6);
  assert.equal(tracedInitial.extra, 0);
  assert.equal(literalCount.extra, 0);
  assert.equal(idle.thumbHeight, f32(f32(f32(184)*f32(0.95))-f32(f32(f32(184)*f32(0.05))*f32(6))));
  assert.equal(idle.thumbY, f32(f32(204-idle.thumbHeight)*f32(0.5)));
  assert.equal(tracedInitial.thumbHeight, f32(f32(184)*f32(0.95)));
  assert.notEqual(tracedInitial.thumbHeight, idle.thumbHeight);
  const top=f32(106-idle.thumbY-idle.thumbHeight/2);
  const frameEnd=top+(idle.thumbHeight-11);
  assert.equal(top, 4);
  assert.ok(frameEnd>112&&frameEnd<113, `right-frame end ${frameEnd} is the y=112 row`);
});

test('frozen recapture scrollbar is the 34-pixel grip shoulders and frame end', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const native=`${root}/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`;
  const lower=`${root}/home-fidelity-20261001/notifications-list-17-scissor-recapture-20261005/browser/lower.png`;
  const code=`${root}/assets/stock-ui/extracted/notifications/exefs/code.bin`;
  if(![native, lower].every(existsSync))return t.skip('private Notifications recapture is absent');
  assert.equal(sha(native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(lower), 'b65e668da346a0a63c0e3ae252b6f4f28f2ccbf816c429cbebbe89a582d1e7bf');
  if(existsSync(code))assert.equal(sha(code), 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228');
  const sharp=require('sharp');
  const nativeLower=await sharp(native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browserLower=await sharp(lower).ensureAlpha().raw().toBuffer();
  const rows=new Map();
  let n=0;
  for(let y=0;y<210;y++)for(let x=291;x<320;x++){
    const i=(y*320+x)*4;
    const e=Math.max(
      Math.abs(nativeLower[i]-browserLower[i]),
      Math.abs(nativeLower[i+1]-browserLower[i+1]),
      Math.abs(nativeLower[i+2]-browserLower[i+2]),
    );
    if(e>2){
      n++;
      const row=rows.get(y)??{n:0, max:0, x0:x, x1:x};
      row.n++; row.max=Math.max(row.max, e); row.x0=Math.min(row.x0, x); row.x1=Math.max(row.x1, x);
      rows.set(y, row);
    }
  }
  assert.equal(n, 34);
  assert.deepEqual([...rows.keys()], [62, 68, 112]);
  assert.equal(rows.get(62).n, 12);
  assert.equal(rows.get(68).n, 12);
  assert.equal(rows.get(112).n, 10);
  assert.deepEqual([rows.get(62).x0, rows.get(62).x1], [295, 306]);
  assert.deepEqual([rows.get(112).x0, rows.get(112).x1], [301, 310]);
  assert.equal(rows.get(112).max, 39);
  const at=(buf,x,y)=>buf[(y*320+x)*4];
  assert.equal(at(nativeLower, 300, 61), 142);
  assert.equal(at(browserLower, 300, 61), 142);
  assert.equal(at(nativeLower, 300, 67), 142);
  assert.equal(at(browserLower, 300, 67), 142);
});
