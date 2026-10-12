import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import sharp from 'sharp';
import {nativePaneParentPath,poseNativeLayout,rasterNativePicture,nativeTextureSamplePixels} from '../src/os/native-layout.ts';
import {manualFooterFeedbackFrame,validateManualFooterFeedbackAssets,manualFooterCoverBindings,validateManualFooterCoverAssets,prepareManualFooterFeedback} from '../src/os/manual-footer-close-assets.ts';
const base=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),read=n=>JSON.parse(readFileSync(new URL(n,base)));
const footer=read('packs/manual/layout-BtnCloseLng00.json'),common=read('packs/home/common.json');
test('the actual decoded feedback changes painted button pixels without changing source layouts or textures',async()=>{
 const original=JSON.stringify(footer),renderer={packs:{'manual-footer-close':footer}},layout=prepareManualFooterFeedback(renderer),textures=new Map();
 for(const[name,t]of Object.entries(footer.textures)){const{data,info}=await sharp(readFileSync(new URL(t.url,base))).ensureAlpha().raw().toBuffer({resolveWithObject:true});textures.set(name,nativeTextureSamplePixels({width:info.width,height:info.height,data:new Uint8ClampedArray(data),picaFormat:t.picaFormat}));}
 const raster=(name,frame)=>{const q=poseNativeLayout(layout,footer.animations,[{name:'BtnCloseLng00_SceneIn',frame:20},{name,frame}]),pane=nativePaneParentPath(q,'P_Btn_01').at(-1);return rasterNativePicture(q,pane.picture,160,28,textures).data;};
 assert.notDeepEqual(raster('BtnCloseLng00_Decide',4),raster('BtnCloseLng00_Decide',5));
 assert.notDeepEqual(raster('BtnCloseLng00_Select',0),raster('BtnCloseLng00_Select',1));assert.equal(JSON.stringify(footer),original);
});
test('Manual feedback uses the delivered Decide4/5 and common HOME cover, not Notes/Notifications footer graphics',()=>{
 validateManualFooterFeedbackAssets(footer);validateManualFooterCoverAssets(common);
 assert.equal(footer.resourceSources.animations.BtnCloseLng00_Decide.sha256,'901424e341042a399695d295b0052de535159f64ac55603a4acd5da9a1259edf');
 const original=structuredClone(footer),renderer={packs:{'manual-footer-close':footer}},prepared=prepareManualFooterFeedback(renderer);
 for(const frame of[0,1]){assert.equal(manualFooterFeedbackFrame(frame),frame+4);const posed=poseNativeLayout(prepared,footer.animations,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Decide',frame:frame+4}]);const pane=nativePaneParentPath(posed,'P_Btn_01').at(-1);assert.deepEqual(posed.materials[pane.picture.material].constantColors[0].slice(0,3),frame?[255,255,250]:[150,150,140]);}
 assert.deepEqual(footer,original);assert.deepEqual(Object.keys(renderer.packs),['manual-footer-close']);assert.equal(prepareManualFooterFeedback(renderer),prepared);
 for(const frame of[-1,2,.5,NaN])assert.throws(()=>manualFooterFeedbackFrame(frame),/Invalid/);
 for(const mutate of[p=>delete p.animations.BtnCloseLng00_Decide,p=>p.animations.BtnCloseLng00_Decide.unsupported.push('unknown'),p=>p.layouts.BtnCloseLng00.groups[0].children.find(g=>g.name==='G_Btn_01').panes.push('unexpected')]){const broken=structuredClone(footer);mutate(broken);assert.throws(()=>validateManualFooterFeedbackAssets(broken),/Unsupported/);}
 for(const kind of['out','in'])for(const frame of[0,20]){const bindings=manualFooterCoverBindings(kind,frame),posed=poseNativeLayout(common.layouts.CmnFade_D_00,common.animations,bindings.lower);assert.equal(nativePaneParentPath(posed,'P_Bg_D_00').at(-1).alpha,kind==='out'?frame?255:0:frame?0:255);}
});

test('held Select uses the source final pose and rejects missing or unsupported selected resources',()=>{
 assert.equal(footer.resourceSources.animations.BtnCloseLng00_Select.sha256,'6f2c11ed9412c874f12cba5f3232ce2690f1756a592acf58c5533ba571af0d21');
 const layout=prepareManualFooterFeedback({packs:{'manual-footer-close':footer}});
 const held=poseNativeLayout(layout,footer.animations,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Select',frame:1}]);
 const button=nativePaneParentPath(held,'P_Btn_01').at(-1),text=nativePaneParentPath(held,'T_BtnB_01').at(-1);
 assert.equal(button.translation[1],-121);assert.equal(text.translation[1],23.5);
 assert.deepEqual(held.materials[button.picture.material].constantColors[0].slice(0,3),[150,150,140]);
 for(const mutate of [
  p=>delete p.animations.BtnCloseLng00_Select,
  p=>p.animations.BtnCloseLng00_Select.unsupported.push('unknown'),
  p=>p.animations.BtnCloseLng00_Select.frames=3,
  p=>p.animations.BtnCloseLng00_Select.loop=true,
  p=>p.animations.BtnCloseLng00_Select.childBinding=false,
  p=>p.animations.BtnCloseLng00_Select.groups=['other'],
  p=>p.animations.BtnCloseLng00_Select.tracks=p.animations.BtnCloseLng00_Select.tracks.filter(t=>t.target!=='P_Btn_01'),
 ]){const broken=structuredClone(footer);mutate(broken);assert.throws(()=>prepareManualFooterFeedback({packs:{'manual-footer-close':broken}}),/Unsupported Manual footer feedback/);}
});

const source=new URL('../src/os/stock-native-helpers.ts',import.meta.url),data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const compiled=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+(n==='./stock-native-amiibo'?data('export const amiiboScreenPacks=[];export const drawNativeAmiibo=()=>false;'):new URL(n.endsWith('.ts')?n:n+'.ts',source).href)+s);
const helpers=await import(data(compiled));
test('actual Manual Contents painter requests and draws Decide over the unchanged source pair',()=>{
 const view={appId:'manual',screen:'main',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:{manualTitleId:'0004001000022400'}},requests=helpers.nativeHelperView(view).packs,calls=[];
 assert.deepEqual(requests.find(p=>p.alias==='manual-footer-close').animations,['BtnCloseLng00_SceneIn','BtnCloseLng00_Select','BtnCloseLng00_Decide']);
 const renderer={packs:Object.fromEntries(requests.map(p=>[p.alias,read(p.url)])),getFontManifest:()=>read('fonts/shared/font.json'),draw(ctx,alias,name,options={}){calls.push({ctx,alias,name,options});return true;},drawLayout(ctx,alias,name,layout,options){calls.push({ctx,alias,name,layout,options});return true;}},ctx={fillRect(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const image={width:48,height:48,data:new Uint8ClampedArray(48*48*4)},options={nativeImage:()=>image};
 assert.equal(helpers.drawNativeHelperFrame(renderer,ctx,ctx,view,options),true);const normal=calls.splice(0);
 assert.equal(helpers.drawNativeHelperFrame(renderer,ctx,ctx,view,{...options,manualFooterClose:{frame:1}}),true);
 const retained=rows=>rows.filter(r=>!r.alias.startsWith('manual-footer-close')&&r.alias!=='manual-footer-feedback');assert.deepEqual(retained(calls),retained(normal));
 const feedback=calls.find(r=>r.alias==='manual-footer-close');assert.equal(feedback.layout,prepareManualFooterFeedback(renderer));assert.deepEqual(feedback.options.bindings,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Decide',frame:5}]);
 assert.equal(createHash('sha256').update(readFileSync(new URL('packs/manual/layout-BtnCloseLng00.json',base))).digest('hex').length,64);
 calls.length=0;
 const held={...view,data:{...view.data,manualClosePress:true}};
 assert.equal(helpers.drawNativeHelperFrame(renderer,ctx,ctx,held,options),true);
 assert.deepEqual(retained(calls),retained(normal),'held painting changes only the footer draw');
 const selected=calls.find(r=>r.alias==='manual-footer-close');
 assert.equal(selected.layout,feedback.layout);
 assert.deepEqual(selected.options.bindings,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Select',frame:1}]);
 calls.length=0;
 assert.equal(helpers.drawNativeHelperFrame(renderer,ctx,ctx,held,{...options,manualFooterClose:{frame:0}}),true);
 assert.deepEqual(calls.find(r=>r.alias==='manual-footer-close').options.bindings,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Decide',frame:4}],'released controller feedback takes priority');
});
