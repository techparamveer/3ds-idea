import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {poseNativeLayout}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/sound/contents/0000-0000000b/lyt-Parakeet-arc-LZ.json',import.meta.url)));

test('published Sound Wait loop has one visible pose across its 60 playable frames',()=>{
  const name='ParakeetA_U_Wait',clip=pack.animations[name],layout=pack.layouts.ParakeetA_U;
  assert.equal(pack.titleId,'0004001000022500');
  assert.equal(pack.resourceSources.animations[name].sha256,'4bfb3266826c859eb318f31fb0f1aeed1cb4bdd71920e4db8f08c4dafb66c07f');
  assert.equal(clip.loop,true);assert.equal(clip.frames,60);
  const pose=frame=>poseNativeLayout(layout,pack.animations,[{name,frame}]);
  const initial=JSON.stringify(pose(0));
  for(let frame=1;frame<60;frame++)assert.equal(JSON.stringify(pose(frame)),initial,`frame ${frame}`);
  // The archive carries an endpoint key, but the loop sampler wraps before it.
  const pattern=clip.tracks.find(track=>track.property==='texture.pattern');
  assert.deepEqual(pattern.keys.map(key=>[key.frame,key.value]),[[0,0],[60,1]]);
  assert.equal(JSON.stringify(pose(60)),initial);
});
