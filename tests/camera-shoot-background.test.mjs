import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import * as THREE from 'three';
const cache=new Map();function moduleUrl(path){if(cache.has(path))return cache.get(path);let s=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;s=s.replace(/from (['"])([^'"]+)\1/g,(_,q,v)=>'from '+JSON.stringify(v.startsWith('.')?moduleUrl(resolve(dirname(path),v.endsWith('.ts')?v:v+'.ts')):import.meta.resolve(v)));const u='data:text/javascript;base64,'+Buffer.from(s).toString('base64');cache.set(path,u);return u;}
const {createCameraShootBackground,cameraShootCamera,CAMERA_SHOOT_MODEL}=await import(moduleUrl(fileURLToPath(new URL('../src/scene/camera-shoot-background.ts',import.meta.url))));
const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),root=new URL('models/camera-shoot-background/',firmware),data=JSON.parse(readFileSync(new URL('model.json',root)));
const asset=()=>({data:structuredClone(data),images:new Map(data.textures.map(t=>[t.name,{width:t.width,height:t.height,data:new Uint8Array(t.width*t.height*4)}]))});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(t){
 const original=globalThis.document,puts=[];globalThis.document={createElement(){return{width:0,height:0,getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)};},putImageData(image){puts.push(image.data);}};}};}};t.after(()=>{globalThis.document=original;});
 const initial={target:{old:true},color:new THREE.Color(.2,.4,.6),alpha:.3,viewport:new THREE.Vector4(1,2,3,4),scissor:new THREE.Vector4(5,6,7,8),scissorTest:true};let current={...initial},renders=0,readbacks=0,fail=false,nativeViewportSets=0;const renderCalls=[];
 const renderer={toneMapping:THREE.ACESFilmicToneMapping,autoClear:true,getRenderTarget:()=>current.target,setRenderTarget:x=>current.target=x,getClearColor:x=>x.copy(current.color),getClearAlpha:()=>current.alpha,setClearColor:(x,a)=>{current.color=new THREE.Color(x);current.alpha=a;},getViewport:x=>x.copy(current.viewport),setViewport:(...v)=>{if(current.target?.width===320)nativeViewportSets++;current.viewport=v.length===1?v[0].clone():new THREE.Vector4(...v);},getScissor:x=>x.copy(current.scissor),setScissor:v=>current.scissor=v.clone(),getScissorTest:()=>current.scissorTest,setScissorTest:v=>current.scissorTest=v,clear(){},render(scene,camera){renders++;renderCalls.push({scene,camera,color:current.color.clone(),alpha:current.alpha});if(fail)throw Error('GPU failed');},readRenderTargetPixels(t,x,y,w,h,pixels){readbacks++;pixels.fill(0);pixels[0]=72;pixels[(h-1)*w*4]=93;}};
 return {renderer,puts,renderCalls,initial,current:()=>current,counts:()=>[renders,readbacks],nativeViewportSets:()=>nativeViewportSets,fail:()=>{fail=true;}};
}
test('Camera adaptation retains source camera pose and delivered mesh/material bytes',()=>{
 const manifest=JSON.parse(readFileSync(new URL('manifest.json',firmware)));assert.equal('/os/firmware/10.7.0-32E/'+manifest.models.cameraShootBackground,CAMERA_SHOOT_MODEL);
 const a=asset(),before=JSON.stringify(a.data),camera=cameraShootCamera(a);
 assert.deepEqual(camera.position.toArray(),[0,680,661.113]);assert.equal(camera.aspect,4/3);assert.ok(Math.abs(camera.fov*Math.PI/180-.660595)<1e-12);assert.equal(JSON.stringify(a.data),before);
 a.images.delete('grid');assert.throws(()=>cameraShootCamera(a),/Incomplete/);
});
test('Camera owner drops late completions, draws a cached lower LCD, and restores renderer after failure',async t=>{
 const f=setup(t),pending=[];let changes=0;const background=createCameraShootBackground(f.renderer,()=>new Promise(resolve=>pending.push(resolve))),changed=()=>changes++;
 background.prepare('camera:1',changed);background.prepare(null,changed);pending[0](asset());await flush();assert.equal(changes,0);assert.equal(background.draw({drawImage(){}}),false);
 background.prepare('camera:2',changed);pending[1](asset());await flush();assert.equal(background.prepare('camera:2',changed).status,'ready');
 background.draw({drawImage(){}});background.draw({drawImage(){}});assert.deepEqual(f.counts(),[1,1]);assert.equal(f.nativeViewportSets(),0);assert.deepEqual(f.current(),f.initial);
 assert.deepEqual(f.renderCalls[0].color.toArray(),[233/255,224/255,208/255]);assert.equal(f.renderCalls[0].alpha,1);
 assert.equal(f.puts[0].length,320*240*4);assert.equal(f.puts[0][0],93);assert.equal(f.puts[0][239*320*4],72);
 const group=f.renderCalls[0].scene.children[0];assert.equal(group.children.length,4);assert.deepEqual(group.children.map(child=>child.visible),[true,false,false,false]);assert.deepEqual(group.position.toArray(),[0,0,0]);assert.deepEqual(group.scale.toArray(),[1,1,1]);
 background.prepare('camera:3',changed);pending[2](asset());await flush();f.fail();assert.throws(()=>background.draw({drawImage(){}}),/GPU failed/);assert.deepEqual(f.current(),f.initial);
 assert.deepEqual(f.renderCalls[0].color.toArray(),[233/255,224/255,208/255]);assert.equal(f.renderCalls[0].alpha,1);
 background.dispose();assert.equal(background.prepare('camera:4',changed).status,'inactive');
});
test('Camera invalid resources fail readiness explicitly',async t=>{
 const f=setup(t),background=createCameraShootBackground(f.renderer,async()=>{const a=asset();a.data.models[0].name='Wrong';return a;});background.prepare('camera:1',()=>{});await flush();assert.equal(background.prepare('camera:1',()=>{}).status,'error');background.dispose();
});
test('Camera guide draws source model before dialog and propagates an unavailable draw',async()=>{
 const {drawNativeCameraGuide}=await import(moduleUrl(fileURLToPath(new URL('../src/os/stock-native-camera.ts',import.meta.url))));
 const packs={'camera-finder':JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json',firmware))),'camera-shoot':JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json',firmware))),'camera-messages':JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json',firmware))),'camera-dialog':JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-C-Dlg.json',firmware)))};
 const sequence=[],top={fillRect(){}},bottom={fillRect(){if(this.globalAlpha===128/255)sequence.push('modal128');},save(){},restore(){}},renderer={packs,draw(ctx,pack,layout){sequence.push(layout);return true;},drawLayout(ctx,pack,layout){sequence.push(layout);return true;}};
 const view={appId:'camera',screen:'guide',heading:'',rows:[],selection:0,footer:{},data:{guidePage:0}};
 assert.equal(drawNativeCameraGuide(renderer,top,bottom,view,{cameraShoot:{draw(ctx){assert.equal(ctx,bottom);sequence.push('CGFX');return true;}}}),true);
 assert.ok(sequence.indexOf('CGFX')<sequence.indexOf('P_Shoot_D'));
 assert.ok(sequence.indexOf('P_Shoot_D')<sequence.indexOf('C_DlgChA'));
 assert.equal(drawNativeCameraGuide(renderer,top,bottom,view,{cameraShoot:{draw(){return false;}}}),false);
 const stateful={fillRect(){},filter:'none',save(){this.saved=this.filter;},restore(){this.filter=this.saved;}};
 const throwing={...renderer,drawLayout(ctx,pack,layout){if(layout==='P_Shoot_D'){assert.equal(ctx.filter,'none');throw new Error('source draw failed');}return true;}};
 assert.throws(()=>drawNativeCameraGuide(throwing,top,stateful,view),/source draw failed/);
 assert.equal(stateful.filter,'none');
 assert.equal(drawNativeCameraGuide({...renderer,packs:{...packs,'camera-shoot':undefined}},top,bottom,view),false);

});

test('Camera capacity applies original style width and signed source cursor advances around substitution',async()=>{
 const {cameraCapacityOverride}=await import(moduleUrl(fileURLToPath(new URL('../src/os/stock-native-camera.ts',import.meta.url))));
 const {poseNativeLayout}=await import(moduleUrl(fileURLToPath(new URL('../src/os/native-layout.ts',import.meta.url))));
 const pack=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json',firmware)));
 const finder=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json',firmware)));
 const override=cameraCapacityOverride(pack,16,'3000');
 assert.deepEqual(override.size,[176,16]);assert.equal(override.text,'\ue01e3000');
 assert.deepEqual(override.cursorAdvances,[{index:1,advance:2},{index:5,advance:2}]);
 const posed=poseNativeLayout(finder.layouts.P_Finder_U,{},[],{ShootCapa_Pho:override});
 const walk=panes=>panes.flatMap(p=>[p,...walk(p.children)]);
 const pane=walk(posed.roots).find(p=>p.name==='ShootCapa_Pho');
 assert.deepEqual(pane.size,[176,16]);assert.deepEqual(pane.text.cursorAdvances,override.cursorAdvances);
 const short=cameraCapacityOverride(pack,16,'42');assert.deepEqual(short.cursorAdvances,[{index:1,advance:2},{index:3,advance:2}]);
 const changed=structuredClone(pack),message=changed.messages.P.messages[changed.messages.P.labels.Finder_Pho_00_00];
 message.tokens[1].arguments='feff';assert.equal(cameraCapacityOverride(changed,16,'3000').cursorAdvances[0].advance,-2);
 message.tokens[1].type=9;assert.throws(()=>cameraCapacityOverride(changed,16,'3000'),/Unsupported Camera capacity/);
});
