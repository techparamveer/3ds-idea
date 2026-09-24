import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
import {rotateCaptureForNativeUV,createSuspendedApplicationCapture} from '../src/os/notes-suspended-capture.ts';
import {createPortfolioState,tickSystem,reduceSystem,launch,invokeSystemApplet,setSystemSleeping} from '../src/os/system.ts';
const layoutSource=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const {poseNativeLayout,rasterNativePicture}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(layoutSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const resourceRoot=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E');
const packPath=resolve(resourceRoot,'packs/game-notes/memo-ImageScreenUp-arc-l.json');
// Every (x,y) has distinct RGB; the seed distinguishes successive frames.
const frame=(width,height,seed=0)=>{
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set([x&255,y,(x>>8)|seed<<1,255],(y*width+x)*4);
 return {width,height,data};
};
const same=(a,b)=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).equals(Buffer.from(b.buffer,b.byteOffset,b.byteLength));
const near=(a,b)=>Math.abs(a-b)<1e-6;

test('suspended LCD storage is the clockwise 90 degree rotation of an upright row-major capture',()=>{
 const rgba=Uint8ClampedArray.from({length:32},(_,i)=>i),rotated=rotateCaptureForNativeUV(4,2,rgba);
 assert.deepEqual([rotated.width,rotated.height],[2,4]);
 // Source pixel indices, row-major in the 2x4 store: (x*H + H-1-y).
 assert.deepEqual(Array.from({length:8},(_,i)=>rotated.data[i*4]/4),[4,0,5,1,6,2,7,3]);
 assert.deepEqual(Array.from(rgba),Array.from({length:32},(_,i)=>i),'input is not mutated');
 for(const [w,h,length] of [[0,2,0],[4,2,31],[4.5,2,36]])assert.throws(()=>rotateCaptureForNativeUV(w,h,new Uint8ClampedArray(length)),/Invalid LCD capture/);
});

test('source ImageScreenUp slots display a bound capture pixel-exactly through their native UVs',{skip:!existsSync(packPath)},()=>{
 const pack=JSON.parse(readFileSync(packPath,'utf8')),layout=pack.layouts.ImageScreenUp,before=JSON.stringify(layout);
 for(const name of ['imgUp400x240L_8x8.bclim','imgDown320x240_8x8.bclim'])assert.deepEqual([pack.textures[name].width,pack.textures[name].height],[8,8],'source slots are placeholders');
 const upper=frame(400,240),lower=frame(320,240);
 const textures=new Map([['capture-upper',rotateCaptureForNativeUV(400,240,upper.data)],['capture-lower',rotateCaptureForNativeUV(320,240,lower.data)]]);
 const posed=poseNativeLayout(layout,pack.animations,[{name:'ImageScreenUp_SwitchDouble',frame:25}],{
  P_ScreenUpL:{textureBindings:{0:'capture-upper'}},P_ScreenDown:{textureBindings:{0:'capture-lower'}},P_ScreenUpR:{visible:false},
 });
 const panes=new Map(),visit=p=>{panes.set(p.name,p);p.children.forEach(visit);};posed.roots.forEach(visit);
 const up=panes.get('P_ScreenUpL'),down=panes.get('P_ScreenDown');
 // Settled SwitchDouble endpoint (G_Panel_00), top-centre origin.
 assert.ok(up.flags&1);assert.ok(down.flags&1);assert.equal(panes.get('P_ScreenUpR').flags&1,0);
 assert.equal(up.origin,1);assert.ok(near(up.size[0],190)&&near(up.size[1],114)&&near(up.translation[1],115));
 assert.equal(down.origin,1);assert.ok(near(down.size[0],152)&&near(down.size[1],114)&&near(down.translation[1],-1));
 for(const [pane,source] of [[up,upper],[down,lower]]){
  assert.deepEqual(pane.picture.uvSets[0],[1,0,1,1,0,0,0,1]);
  const raster=rasterNativePicture(posed,pane.picture,source.width,source.height,textures);
  assert.deepEqual([raster.width,raster.height],[source.width,source.height]);
  assert.ok(same(raster.data,source.data),'native-size raster reproduces every upright capture byte');
 }
 assert.equal(JSON.stringify(layout),before,'bindings clone materials; the shared source pack is unchanged');
});

function fakeSurfaces(){
 const made=[];
 const createSurface=(width,height)=>{
  const surface={width,height,data:new Uint8ClampedArray(width*height*4)};
  const ctx={globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},resetTransform(){},
   drawImage(source,x,y){assert.equal(ctx.globalCompositeOperation,'copy');assert.deepEqual([x,y,source.width,source.height],[0,0,surface.width,surface.height]);surface.data.set(source.data);},
   getImageData(x,y,w,h){surface.reads=(surface.reads??0)+1;assert.deepEqual([x,y,w,h],[0,0,surface.width,surface.height]);return {data:surface.data.slice()};}};
  surface.getContext=()=>ctx;made.push(surface);return surface;
 };
 return {made,createSurface};
}
const appFrame=seed=>({upper:frame(400,240,seed),lower:frame(320,240,seed)});
const record=(capture,s,owner,pair)=>capture.record(s.system.runtime,owner,pair.upper,pair.lower);
const openHealth=(s,now)=>tickSystem(launch(s,'health-safety',now),now+2200);

test('capture ownership follows the application instance through HOME, applets, resume, sleep and close',()=>{
 const surfaces=fakeSurfaces(),capture=createSuspendedApplicationCapture({createSurface:surfaces.createSurface});
 let s=tickSystem(createPortfolioState(),3001);
 assert.deepEqual(capture.read(s.system.runtime),{status:'none'});
 s=openHealth(s,4000);assert.equal(s.system.phase,'app');
 const health=s.system.runtime.active;assert.equal(s.system.runtime.application,health);
 const first=appFrame(1);
 assert.equal(record(capture,s,'health-safety:999',first),false,'another owner cannot record');
 assert.equal(capture.record(s.system.runtime,health,frame(399,240),first.lower),false,'partial or resized surfaces are rejected');
 assert.equal(record(capture,s,health,first),true);
 assert.deepEqual(capture.read(s.system.runtime),{status:'none'},'a foreground application is not suspended');
 s=reduceSystem(s,'home',6300);assert.equal(s.system.phase,'home');
 assert.equal(record(capture,s,health,appFrame(2)),false,'HOME cannot overwrite the frozen frame');
 s=invokeSystemApplet(s,'game-notes',6400);const notes=s.system.runtime.active;
 assert.notEqual(notes,health);assert.equal(s.system.runtime.application,health);
 assert.equal(record(capture,s,notes,appFrame(3)),false,'a system applet cannot become the suspended capture');
 const ready=capture.read(s.system.runtime);
 assert.equal(ready.status,'ready');assert.equal(ready.owner,health);
 assert.deepEqual([ready.upper.width,ready.upper.height,ready.lower.width,ready.lower.height],[240,400,240,320]);
 assert.ok(same(ready.upper.data,rotateCaptureForNativeUV(400,240,first.upper.data).data));
 assert.ok(same(ready.lower.data,rotateCaptureForNativeUV(320,240,first.lower.data).data));
 assert.equal(capture.read(s.system.runtime).upper,ready.upper,'one readback per frozen frame');
 assert.deepEqual(surfaces.made.map(surface=>surface.reads),[1,1]);
 s=setSystemSleeping(s,true,6500);assert.equal(capture.read(s.system.runtime).generation,ready.generation,'sleep retains the suspended frame');
 assert.equal(record(capture,s,health,appFrame(4)),false);
 s=reduceSystem(setSystemSleeping(s,false,6600),'power',6700);
 assert.equal(s.system.runtime.application,null);
 assert.deepEqual(capture.read(s.system.runtime),{status:'none'},'closing the application releases its pixels');
 assert.ok(surfaces.made.every(surface=>surface.width===0&&surface.height===0));
 capture.dispose();
});

test('a resumed application replaces its frame, and a new instance never sees an old one',()=>{
 const surfaces=fakeSurfaces(),capture=createSuspendedApplicationCapture({createSurface:surfaces.createSurface});
 let s=openHealth(tickSystem(createPortfolioState(),3001),4000);const health=s.system.runtime.active;
 record(capture,s,health,appFrame(1));
 s=reduceSystem(s,'home',6300);const first=capture.read(s.system.runtime);
 s=reduceSystem(s,'home',6400);assert.equal(s.system.phase,'app');assert.equal(s.system.runtime.active,health);
 const second=appFrame(2);assert.equal(record(capture,s,health,second),true);
 s=reduceSystem(s,'home',6500);const resumed=capture.read(s.system.runtime);
 assert.equal(resumed.status,'ready');assert.ok(resumed.generation>first.generation);assert.notEqual(resumed.upper,first.upper);
 assert.ok(same(resumed.upper.data,rotateCaptureForNativeUV(400,240,second.upper.data).data));
 // Close from HOME, relaunch: the new instance has no complete frame yet.
 s=reduceSystem(reduceSystem(s,'back',6600),'open',6700);assert.equal(s.system.runtime.application,null);
 s=openHealth(s,7000);const relaunched=s.system.runtime.active;assert.notEqual(relaunched,health);
 s=reduceSystem(s,'home',9300);
 assert.deepEqual(capture.read(s.system.runtime),{status:'missing',owner:relaunched},'missing pixels are distinct from no suspended software');
 capture.dispose();assert.deepEqual(capture.read(s.system.runtime),{status:'none'});
 assert.equal(record(capture,openHealth(tickSystem(createPortfolioState(),3001),4000),'health-safety:1',appFrame(5)),false,'a disposed capture never records');
});
