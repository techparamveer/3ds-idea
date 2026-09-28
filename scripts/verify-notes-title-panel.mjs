import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,join,dirname,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import ts from 'typescript';
const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module'].map(k=>[k,{type:'string'}]))});
for(const k of ['artifact-dir','asset-root','canvas-module'])assert.ok(isAbsolute(values[k]??''),k);
const root=values['asset-root'],out=values['artifact-dir'],repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');mkdirSync(out,{recursive:true});
const compiled=mkdtempSync(join(out,'compiled-'));
for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets']){
 const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
 writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,p)=>`from '${p}.mjs'`));
}
const [{createCanvas,loadImage},{BitmapFont,nativeCenteredGlyphQuads},{loadNativeTitleAssets},{decodeNativePng},{rasterNativePicture,poseNativeLayout}]=await Promise.all([import(pathToFileURL(values['canvas-module'])),...['bitmap-font','native-title-assets','native-png','native-layout'].map(n=>import(pathToFileURL(join(compiled,n+'.mjs'))))]);
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://notes.invalid');const p=resolve(root,u.pathname.slice(1));assert.ok(p.startsWith(root+'/'));return new Response(readFileSync(p));};
const manifest=JSON.parse(readFileSync(join(root,'manifest.json'))),fontPath=join(root,manifest.fonts.shared),fontData=JSON.parse(readFileSync(fontPath));
const font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(n=>loadImage(join(dirname(fontPath),n)))));
const prefix='packs/game-notes/',clips=['ImageScreenUp_TextPanelInOut','ImageScreenUp_TextPanelStay'];
const assets=await loadNativeTitleAssets('https://notes.invalid/manifest.json','0004003000009c02',[
 {url:prefix+'memo-ImageScreenUp-arc-l.json',alias:'image',layouts:['ImageScreenUp'],animations:clips},
 {url:prefix+'memo-Bg_U_00-arc-l.json',alias:'bg',layouts:['Bg_U_00'],animations:[]},
],new Map([['cbf_std.bcfnt',font]]));
try{
 const pack=assets.renderer.packs.image,layout=pack.layouts.ImageScreenUp,before=JSON.stringify(pack);
 const flatten=items=>items.flatMap(p=>[p,...flatten(p.children)]),panes=flatten(layout.roots),titlePane=panes.find(p=>p.name==='T_TextTitle'),iconPane=panes.find(p=>p.name==='P_Icon_00');
 assert.deepEqual(iconPane.size,[48,48]);assert.deepEqual(iconPane.picture.uvSets[0],[0,0,.75,0,0,.75,.75,.75]);
 const tex=new Map(await Promise.all(Object.entries(pack.textures).map(async([name,t])=>[name,await decodeNativePng(new Uint8Array(readFileSync(join(root,t.url))),t)])));
 const titles=Object.entries(manifest.titles).filter(([,t])=>t.notesIcon&&t.longDescription&&t.longDescription!=='???'),reports=[],fit=[];
 const hidden=Object.fromEntries(panes.filter(p=>!['RootPane','W_TextPanel',...flatten(panes.find(p=>p.name==='W_TextPanel').children).map(p=>p.name)].includes(p.name)).map(p=>[p.name,{visible:false}]));
 // Root pane names vary; hide only known sibling trees, preserving title ancestors.
 for(const p of layout.roots)delete hidden[p.name];
 const sample=async(tid,t)=>decodeNativePng(new Uint8Array(readFileSync(join(root,t.notesIcon))),{width:64,height:64});
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 function render(tid,t,icon,phase,frame,mode='double'){
  const canvas=createCanvas(400,240),ctx=canvas.getContext('2d');assets.renderer.draw(ctx,'bg','Bg_U_00');
  const overrides={...hidden,T_TextTitle:{text:t.longDescription},P_Icon_00:{textureBindings:{0:'notes-icon'}},P_ObjIcnUp00:{visible:mode!=='down'},P_ObjIcnDown00:{visible:mode!=='up'}};
  const binding={name:phase==='stay'?clips[1]:clips[0],frame,groups:['G_Panel_01']};
  assert.equal(assets.renderer.draw(ctx,'image','ImageScreenUp',{bindings:[binding],textures:{'notes-icon':icon},overrides}),true);
  const id=tid+'-'+mode+'-'+phase+'-'+frame,bytes=ctx.getImageData(0,0,400,240).data;
  writeFileSync(join(out,id+'.png'),canvas.toBuffer('image/png'));reports.push({id,sha256:hash(bytes)});return hash(bytes);
 }
 for(const[tid,t]of titles){
  // Every supplied stock title is a single line within the source 246×36 pane.
  // This deliberately does not invent a general native wrapping/truncation implementation.
  assert.ok(!t.longDescription.includes('\n'));
  const quads=nativeCenteredGlyphQuads(fontData,t.longDescription,...titlePane.size,titlePane.text.size);
  const bounds={left:Math.min(...quads.map(q=>q.x)),top:Math.min(...quads.map(q=>q.y)),right:Math.max(...quads.map(q=>q.x+q.width)),bottom:Math.max(...quads.map(q=>q.y+q.height))};
  assert.ok(bounds.left>=0&&bounds.top>=0&&bounds.right<=246&&bounds.bottom<=36,JSON.stringify({tid,bounds}));fit.push({tid,text:t.longDescription,bounds});
  const icon=await sample(tid,t),a=new Map(tex);a.set('IconDmy.bclim',icon);
  // Poison every texel that the native expansion never initialized. Prove its
  // value cannot affect this source pane at native and doubled raster density.
  const poisoned={...icon,data:new Uint8ClampedArray(icon.data)};
  for(let i=0;i<icon.data.length;i+=4)if(icon.data[i+3]===0)poisoned.data.set([255,0,255,255],i);
  const b=new Map(tex);b.set('IconDmy.bclim',poisoned);
  const premult=pixels=>Array.from(pixels.data,(v,i)=>i%4===3?v:v*pixels.data[i-i%4+3]);
  for(const scale of [1,2])assert.deepEqual(premult(rasterNativePicture(layout,iconPane.picture,48*scale,48*scale,a)),premult(rasterNativePicture(layout,iconPane.picture,48*scale,48*scale,b)),'unused scratch cannot affect composited icon');
  render(tid,t,icon,'stay',10);
 }
 const [tid,t]=titles.find(([id])=>id==='0004001000022300'),icon=await sample(tid,t);
 for(const mode of ['double','up','down']){
  const hashes={};for(const[phase,frame]of [['in',0],['in',10],['in',20],['stay',80],['out',30],['out',20],['out',10],['out',0]])hashes[phase+frame]=render(tid,t,icon,phase,frame,mode);
  assert.equal(hashes.in0,hashes.out0);assert.equal(hashes.in20,hashes.out30);assert.equal(hashes.in20,hashes.out20);assert.equal(hashes.in10,hashes.out10);assert.notEqual(hashes.in10,hashes.in20);
 }
 for(const name of clips){
  const posed=poseNativeLayout(layout,pack.animations,[{name,frame:10,groups:['G_Panel_01']}]);
  for(const p of flatten(posed.roots).filter(p=>p.name.startsWith('P_Screen')))assert.deepEqual(p,panes.find(x=>x.name===p.name),'title clip must not alter capture panes');
 }
 assert.equal(JSON.stringify(pack),before);assert.deepEqual(assets.diagnostics,[]);
 writeFileSync(join(out,'verification.json'),JSON.stringify({passed:true,fit,reports,diagnostics:assets.diagnostics,limits:['Source component specimens only; live Notes title/HUD scheduling is not enabled.','Native LCD comparison and overflow text wrapping/truncation remain unverified.','Undefined native scratch is transparent and proven irrelevant to the original icon pane at tested raster densities.']},null,2)+'\n');
 console.log(`Notes title panel: ${reports.length} source specimens, ${fit.length} real title fits, original icon-material sampling and group isolation passed.`);
}finally{assets.dispose();font.dispose();}
