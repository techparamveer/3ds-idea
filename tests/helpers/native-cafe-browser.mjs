// Local diagnostic only: renders supported portal parts with the unresolved
// update-button instance hidden. This is not a complete initial-screen fixture.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import ts from 'typescript';
const repo=resolve(new URL('../..',import.meta.url).pathname),converted=process.env.FIRMWARE_AMIIBO_CONVERTED,output=process.env.FIRMWARE_AMIIBO_BROWSER_OUTPUT;
if(!converted||!output)throw new Error('Set the converted fixture and private browser-output directories');
await mkdir(output,{recursive:true});
const html=`<!doctype html><meta charset="utf-8"><title>amiibo part diagnostic</title><style>body{background:#333;color:white;font:14px sans-serif}canvas{width:640px;height:480px;image-rendering:pixelated}</style><p id="status">Loading supported parts…</p><canvas id="screen" width="320" height="240"></canvas><script type="module">
import {NativeLayoutRenderer} from '/native-renderer.js';
import {loadBitmapFont} from '/bitmap-font.js';
import {decodeNativePng} from '/native-png.js';
import {nativeTextureSamplePixels} from '/native-layout.js';
try{
 const names={portal:'layout-Body-Portal-PortalSceneCTR-arc-cmp',button:'layout-Parts-Portal-PortalBtn-arc-cmp',sub:'layout-Parts-Portal-PortalBtnSub-arc-cmp',footer:'layout-Parts-Common-BtnBtm_03-BtnBtm_03-arc-cmp',bg:'layout-Body-Common-CommonBg-CommonBg-arc-cmp',messages:'messages-and-loose'};
 const packs={},images={};
 for(const [key,name] of Object.entries(names)){
  packs[key]=await (await fetch('/converted/packs/amiibo-settings/'+name+'.json')).json();images[key]=new Map();
  for(const [name,meta] of Object.entries(packs[key].textures)){
   const bytes=new Uint8Array(await (await fetch('/converted/'+meta.url)).arrayBuffer());
   images[key].set(name,nativeTextureSamplePixels(await decodeNativePng(bytes,meta),meta.picaFormat));
  }
 }
 const font=await loadBitmapFont('/firmware/fonts/shared/font.json'),renderer=new NativeLayoutRenderer(packs,images,new Map([['cbf_std.bffnt',font]]));
 const bank=packs.messages.messages.cabinet,textByCallName=Object.fromEntries(Object.entries(bank.labels).map(([label,index])=>[label,bank.messages[index].text]));
 const context=document.querySelector('canvas').getContext('2d');context.fillStyle='white';context.fillRect(0,0,320,240);
 const parts={PortalBtn:{pack:'button',layout:'PortalBtn'},PortalBtnSub:{pack:'sub',layout:'PortalBtnSub'},BtnBtm_03:{pack:'footer',layout:'BtnBtm_03'}};
 const footerClip=packs.footer.animations.BtnBtm_03_SceneIn;
 const result=[renderer.draw(context,'bg','CommonBg'),renderer.draw(context,'portal','PortalSceneCTR',{parts,textByCallName,overrides:{L_UpdateBtn:{visible:false}},partBindings:{L_EditBtn:{bindings:[{name:'PortalBtn_Select',frame:0}]},L_DeleteBtn:{bindings:[{name:'PortalBtn_Select',frame:0}]},L_InitializeBtn:{bindings:[{name:'PortalBtn_Select',frame:0}]},L_StopBtn:{bindings:[{name:'BtnBtm_03_SceneIn',frame:footerClip.frames}]}}})];
 const report={result,diagnostics:renderer.diagnostics,scope:'Supported parts only; unresolved update-button hidden, no native-fidelity claim'};
 await fetch('/report',{method:'POST',body:JSON.stringify(report)});
 await fetch('/capture',{method:'POST',body:await new Promise(resolve=>document.querySelector('canvas').toBlob(resolve))});
 document.querySelector('#status').textContent=JSON.stringify(report);renderer.dispose();font.dispose();
}catch(error){document.querySelector('#status').textContent=error.stack;await fetch('/report',{method:'POST',body:JSON.stringify({error:error.stack})});}
</script>`;
const modules=new Set(['native-layout','native-renderer','bitmap-font','native-png']);
const server=createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'&&(path==='/report'||path==='/capture')){
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024)throw new Error('Capture too large');chunks.push(chunk);}
  await writeFile(resolve(output,path==='/report'?'report.json':'parts.png'),Buffer.concat(chunks));res.end('ok');return;
 }
 if(path==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 const name=path.slice(1,-3);
 if(path.endsWith('.js')&&modules.has(name)){
  const source=await readFile(resolve(repo,'src/os',name+'.ts'),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll("'./native-layout'","'./native-layout.js'");
  res.setHeader('Content-Type','text/javascript');res.end(js);return;
 }
 const prefix=path.startsWith('/converted/')?'/converted/':path.startsWith('/firmware/')?'/firmware/':null;
 if(!prefix)throw new Error('Unknown path');
 const root=resolve(prefix==='/converted/'?converted:resolve(repo,'public/os/firmware/10.7.0-32E')),file=resolve(root,path.slice(prefix.length));
 if(!file.startsWith(root+sep)||!['.json','.png'].includes(extname(file)))throw new Error('Outside converted resource scope');
 res.setHeader('Content-Type',extname(file)==='.png'?'image/png':'application/json');res.end(await readFile(file));
 }catch(error){res.statusCode=404;res.end(String(error));}});
server.listen(0,'127.0.0.1',()=>console.log('http://127.0.0.1:'+server.address().port));
