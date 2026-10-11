import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import {loadBitmapFont} from '../src/os/bitmap-font.ts';
import {createNativeTransportCanvas as canvas} from './helpers/native-canvas-transport.mjs';
const module=(name,folder='os',overrides={})=>{
 const file=new URL('../src/'+folder+'/'+name+'.ts',import.meta.url);
 return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+(overrides[n]??new URL(n.endsWith('.ts')?n:n+'.ts',file).href)+s)).toString('base64');
};
const {loadNativeTitleAssets}=await import(module('native-title-assets','os',{'./native-renderer':module('native-renderer')}));
const camera=await import(module('stock-native-camera'));
const {createLiveLcdRecorder}=await import(module('live-lcd-recorder','scene',{'./lcd-capture':module('lcd-capture','scene')}));
const base=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),href='https://fixture.invalid/native/';

test('600-frame diagnostic export losslessly restores every same-paint trace below the unchanged API cap',async t=>{
 const globals=['fetch','document','window','Image'],saved=new Map(globals.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)])),nativeFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>String(url).startsWith('blob:')?nativeFetch(url,options):new Response(readFileSync(new URL(String(url).slice(href.length),base)));
 globalThis.document={createElement:canvas};globalThis.window={location:{href}};
 globalThis.Image=class{async decode(){const response=await nativeFetch(this.src),{data,info}=await sharp(Buffer.from(await response.arrayBuffer())).ensureAlpha().raw().toBuffer({resolveWithObject:true});this.data=new Uint8ClampedArray(data);this.width=this.naturalWidth=info.width;this.height=this.naturalHeight=info.height;}};
 let font,assets,recorder;
 try{
  font=await loadBitmapFont(href+'fonts/shared/font.json');assets=await loadNativeTitleAssets(href+'manifest.json','0004001000022400',camera.cameraScreenPacks,new Map([['cbf_std.bcfnt',font]]));
  const top=canvas(),bottom=canvas();top.width=400;top.height=240;bottom.width=320;bottom.height=240;
  const view={appId:'camera',screen:'main',rows:[],selection:0,data:{},footer:{}};
  assets.renderer.beginTextDiagnostic();assert.equal(camera.drawNativeCameraFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{}),true,assets.renderer.diagnostics.join('\n'));
  const trace=assets.renderer.endTextDiagnostic();assert.ok(trace.draws.length>=5);assert.ok(trace.hashCount>=10);
  const pair={owner:'camera:1',generation:1,pairId:1,source:trace},sample={stock:{pair,use:'cached-pair',destination:{}},coveredByResume:false};
  const expected=[];let id=0,posts=0,max=0,failOnce=true;
  recorder=createLiveLcdRecorder({cameraTextProbe:true,now:()=>0,uuid:()=>`00000000-0000-4000-8000-${String(++id).padStart(12,'0')}`,
   readPair:()=>({top:'data:image/png;base64,AA==',bottom:'data:image/png;base64,AA==',dimensions:{top:{width:400,height:240},bottom:{width:320,height:240}}}),
   post:async body=>{
    const value=JSON.parse(body),record=value.recording;max=Math.max(max,Buffer.byteLength(body));
    assert.equal(record.cameraTextTraceEncoding,'camera-text-table-v1');assert.equal(record.cameraTextTraces.length,2);
    for(const entry of record.sequence){const recovered=structuredClone(entry.receipt),ref=recovered.paint.cameraText?.traceRef;
     if(ref!==undefined){assert.ok(Number.isInteger(ref)&&ref>=0&&ref<record.cameraTextTraces.length);recovered.paint.cameraText=record.cameraTextTraces[ref];}
     assert.deepEqual(recovered,expected[entry.sequence-1]);}
    assert.deepEqual(value.receipt,expected[value.sequence-1]);assert.deepEqual(value.paint,value.receipt.paint);
    // Conservative native-size RGBA PNG/base64 envelope; no full-LCD readback added.
    assert.ok(Buffer.byteLength(body)+1024*1024<8*1024*1024);
    if(failOnce){failOnce=false;throw new Error('retry transport');}posts++;return {directory:'/private/'+value.sequence};
   }});
  recorder.start();
  for(let frame=1;frame<=600;frame++){
   const paint={at:frame,...(frame===300?{cameraText:null}:frame===301?{}:{cameraText:frame===1?{...sample,coveredByResume:true}:sample})};
   const receipt={at:frame,frame,validPublication:true,paint};expected.push(structuredClone(receipt));recorder.observe(JSON.stringify(receipt),JSON.stringify(paint));
  }
  assert.equal(recorder.summary().frames,600);assert.equal(recorder.summary().reason,'frame-limit');await recorder.save();assert.equal(recorder.summary().failures.length,1);await recorder.save();
  assert.equal(posts,600);assert.equal(recorder.summary().saved.length,600);t.diagnostic(JSON.stringify({traceBytes:Buffer.byteLength(JSON.stringify(trace)),maxBodyBytes:max,posts,hashBytes:trace.hashBytes,hashMs:trace.hashMs,metadataMs:trace.metadataMs}));
 }finally{recorder?.dispose();assets?.dispose();font?.dispose();for(const[name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
});
