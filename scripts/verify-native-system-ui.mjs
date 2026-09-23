import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,join,dirname,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [out,canvasModule]=process.argv.slice(2);
assert.ok(isAbsolute(out??'')&&isAbsolute(canvasModule??''),'Supply absolute SSD output and Canvas module paths');
mkdirSync(out,{recursive:true});
const compiled=mkdtempSync(join(out,'compiled-'));
for(const name of ['bitmap-font','native-layout','native-png','native-renderer','system-transitions','native-system-fade','native-system-presentation']){
 const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
 writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,path)=>`from '${path}.mjs'`));
}
const [{createCanvas,loadImage},{BitmapFont},{NativeLayoutRenderer},{decodeNativePng},{nativeTextureSamplePixels},{drawNativeSystemOverlay}]=await Promise.all([
 import(pathToFileURL(canvasModule).href),...['bitmap-font','native-renderer','native-png','native-layout','native-system-presentation'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs')).href)),
]);
globalThis.document={createElement:()=>createCanvas(1,1)};
const root=join(repo,'public/os/firmware/10.7.0-32E'),json=path=>JSON.parse(readFileSync(path,'utf8'));
const manifest=json(join(root,'fonts/shared/font.json'));
const sheets=await Promise.all(manifest.sheets.map(sheet=>loadImage(join(root,'fonts/shared',typeof sheet==='string'?sheet:sheet.url))));
const font=new BitmapFont(manifest,sheets),packs={},textures={};
for(const name of ['common','sleep','messages','launch']){
 const pack=json(name==='launch'?join(root,'packs/launch/logo.json'):join(root,'packs/home',name==='messages'?'messages-and-loose.json':name+'.json'));packs[name]=pack;textures[name]=new Map();
 const layouts=name==='launch'?['NintendoLogo_U_00','NintendoLogo_D_00']:name==='common'?['CmnFadeNinLogo_U_00','CmnFadeNinLogo_D_00']:name==='sleep'?['Slp_U_00','Slp_D_00']:[];
 for(const key of new Set(layouts.flatMap(layout=>pack.layouts[layout].textures))){
  const record=pack.textures[key],pixels=await decodeNativePng(new Uint8Array(readFileSync(join(root,record.url))),record);
  textures[name].set(key,nativeTextureSamplePixels(pixels,record.picaFormat));
 }
}
const renderer=new NativeLayoutRenderer(packs,textures,new Map([['cbf_std.bcfnt',font]]));
const {drawNativeSystemFade}=await import(pathToFileURL(join(compiled,'native-system-fade.mjs')));
const fadeChecks=[];
for(const suffix of ['U','D'])for(const direction of ['SceneIn','SceneOut'])for(let frame=0;frame<=20;frame++){
 const name=`CmnFadeNinLogo_${suffix}_00`,clip=`${name}_${direction}`,width=suffix==='U'?400:320;
 const reference=createCanvas(width,240),fast=createCanvas(width,240),r=reference.getContext('2d'),f=fast.getContext('2d');
 for(const ctx of [r,f]){ctx.fillStyle='#e75b91';ctx.fillRect(0,0,width,240);ctx.fillStyle='#317fc2';ctx.fillRect(7,11,133,87);}
 let start=performance.now();assert.equal(renderer.draw(r,'common',name,{bindings:[{name:clip,frame}]}),true);const referenceMs=performance.now()-start;
 start=performance.now();assert.equal(drawNativeSystemFade(f,packs.common,name,clip,frame),true);const fastMs=performance.now()-start;
 assert.deepEqual(f.getImageData(0,0,width,240).data,r.getImageData(0,0,width,240).data,`${name} ${direction} frame ${frame}`);
 fadeChecks.push({suffix,direction,frame,referenceMs,fastMs});
}
for(const scale of [1,2])for(const opacity of [.4,1]){
 const r=createCanvas(400*scale,240*scale).getContext('2d'),f=createCanvas(400*scale,240*scale).getContext('2d');
 for(const ctx of [r,f]){ctx.fillStyle='#42b891';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.scale(scale,scale);ctx.globalAlpha=opacity;}
 renderer.draw(r,'common','CmnFadeNinLogo_U_00',{bindings:[{name:'CmnFadeNinLogo_U_00_SceneOut',frame:9}]});
 if(opacity!==1){assert.equal(drawNativeSystemFade(f,packs.common,'CmnFadeNinLogo_U_00','CmnFadeNinLogo_U_00_SceneOut',9),false);continue;}
 assert.equal(drawNativeSystemFade(f,packs.common,'CmnFadeNinLogo_U_00','CmnFadeNinLogo_U_00_SceneOut',9),true);
 assert.equal(Buffer.compare(Buffer.from(f.getImageData(0,0,f.canvas.width,f.canvas.height).data),Buffer.from(r.getImageData(0,0,r.canvas.width,r.canvas.height).data)),0,`scaled LCD ${scale}, opacity ${opacity}`);
}
// Fractional edges require raster coverage: the fast path must decline them.
const fractional=createCanvas(400,240).getContext('2d');fractional.translate(.5,0);
assert.equal(drawNativeSystemFade(fractional,packs.common,'CmnFadeNinLogo_U_00','CmnFadeNinLogo_U_00_SceneOut',10),false);
const modified=structuredClone(packs.common);modified.layouts.CmnFadeNinLogo_U_00.roots[0].children[0].scale[0]=.5;
assert.equal(drawNativeSystemFade(createCanvas(400,240).getContext('2d'),modified,'CmnFadeNinLogo_U_00','CmnFadeNinLogo_U_00_SceneOut',10),false);
writeFileSync(join(out,'fade-differential.json'),JSON.stringify({passed:true,frames:fadeChecks.length,fadeChecks},null,2)+'\n');
const assets={renderer},results=[];
for(const [phase,elapsed,fromApp]of [['power',0,false],['power',350,false],['power',550,true],['shutdown',250,true],['shutdown',550,true],['boot',0,false],['boot',2990,false],['launch',350,false],['launch',800,false],['launch',1400,false],['launch',1950,false],['launch',2099,false]]){
 const top=createCanvas(400,240),bottom=createCanvas(320,240),t=top.getContext('2d'),b=bottom.getContext('2d');
 t.fillStyle=b.fillStyle='#dde5ed';t.fillRect(0,0,400,240);b.fillRect(0,0,320,240);
 const state={system:{phase,since:0,sleeping:false,returnPhase:fromApp?'app':'home'}};
 const before=performance.now();assert.equal(drawNativeSystemOverlay(t,b,state,elapsed,false,assets),true);const paintMs=performance.now()-before;
 const id=`${phase}-${elapsed}-${fromApp?'app':'home'}`;
 writeFileSync(join(out,id+'-upper.png'),top.toBuffer('image/png'));writeFileSync(join(out,id+'-lower.png'),bottom.toBuffer('image/png'));
 results.push({id,paintMs});
 if((phase==='boot'&&elapsed===0)||(phase==='launch'&&elapsed===2099)||(phase==='shutdown'&&elapsed===550)){
  for(const c of [top,bottom]){const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;assert.ok(data.every((v,i)=>i%4===3?v===255:v===0),id+' ends opaque black');}
 }
}
assert.deepEqual(renderer.diagnostics,[]);
writeFileSync(join(out,'verification.json'),JSON.stringify({passed:true,results,limitations:['Browser cadence; not measured hardware latency','Native LCD comparison pending']},null,2)+'\n');
renderer.dispose();font.dispose();console.log(JSON.stringify({passed:true,renders:results.length*2}));
