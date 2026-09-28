/** Read-only comparison of original decoded cursor resources with the pack.
 * This checks bindings/poses with the existing sampler, not native GPU pixels.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {poseNativeLayout,boundAnimationTracks} from '../../src/os/native-layout.ts';

const [decodedPath,packPath,outputPath]=process.argv.slice(2);
if(!decodedPath||!packPath||!outputPath)throw Error('Usage: node home_toolbar_cursor_resources.mjs DECODED_JSON PACK_JSON OUTPUT_JSON');
const raw=readFileSync(decodedPath),decoded=JSON.parse(raw),pack=JSON.parse(readFileSync(packPath));
const sha=value=>createHash('sha256').update(value).digest('hex');
for(const kind of ['layouts','animations'])for(const [name,value] of Object.entries(decoded[kind])){
 assert.deepEqual(pack[kind][name],value,`${kind}/${name} differs from original-resource decode`);
}
const walk=items=>items.flatMap(p=>[p,...walk(p.children)]),samples={};
for(const name of ['LncCsr_00','LncCsrEfct_00']){
 const layout=pack.layouts[name],rows=[];
 for(const scaleFrame of [0,1,2,3,4,5,9.999,10,10.999,11,11.999,12]){
  const bindings=[{name:name+'_Scale',frame:scaleFrame},...(name==='LncCsr_00'
   ?[{name:name+'_Select',frame:0},{name:name+'_Loop',frame:17.25}]
   :[{name:name+'_DisAppear',frame:0}])];
  const posed=poseNativeLayout(layout,pack.animations,bindings);
  rows.push({scaleFrame,panes:walk(posed.roots).filter(p=>p.kind==='wnd1').map(({name,translation,scale,size,alpha})=>({name,translation,scale,size,alpha}))});
 }
 samples[name]=rows;
}
for(const [scaleFrame,expected] of [[10,[[78,72],[69,64]]],[11,[[78,75],[69,66]]],[12,[[68,68],[66,66]]]]){
 assert.deepEqual(samples.LncCsr_00.find(s=>s.scaleFrame===scaleFrame).panes.map(p=>p.size),expected);
}
const primary=decoded.layouts.LncCsr_00,effect=decoded.layouts.LncCsrEfct_00;
const select=boundAnimationTracks(primary,decoded.animations.LncCsr_00_Select);
assert.deepEqual(select.map(t=>[t.target,t.property]),[['N_Scene_00','translation.y']]);
assert.ok(boundAnimationTracks(primary,decoded.animations.LncCsr_00_Scale).every(t=>t.target!=='N_Scene_00'));
const disappear=boundAnimationTracks(effect,decoded.animations.LncCsrEfct_00_DisAppear);
assert.deepEqual(disappear.map(t=>[t.target,t.property]),[['W_CsrEfct_00','alpha']]);
assert.deepEqual(disappear[0].keys.map(k=>[k.frame,k.value]),[[0,120],[20,0]]);
const result={passed:true,scope:'Original decoded resources equal the existing pack. Poses use the current browser sampler; no native raster comparison.',
 fixtureSHA256:sha(readFileSync(new URL(import.meta.url))),decodedResourcesSHA256:sha(raw),samples,select,disappear};
writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,layouts:Object.keys(decoded.layouts).length,animations:Object.keys(decoded.animations).length,
 poses:24,fixtureSHA256:result.fixtureSHA256,resultSHA256:sha(readFileSync(outputPath))},null,2));
