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
 const original=JSON.stringify(footer),renderer={packs:{'manual-footer-close':footer}},alias=prepareManualFooterFeedback(renderer),p=renderer.packs[alias],textures=new Map();
 for(const[name,t]of Object.entries(footer.textures)){const{data,info}=await sharp(readFileSync(new URL(t.url,base))).ensureAlpha().raw().toBuffer({resolveWithObject:true});textures.set(name,nativeTextureSamplePixels({width:info.width,height:info.height,data:new Uint8ClampedArray(data),picaFormat:t.picaFormat}));}
 const raster=frame=>{const q=poseNativeLayout(p.layouts.BtnCloseLng00,p.animations,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Decide',frame}]),pane=nativePaneParentPath(q,'P_Btn_01').at(-1);return rasterNativePicture(q,pane.picture,160,28,textures).data;};
 assert.notDeepEqual(raster(4),raster(5));assert.equal(JSON.stringify(footer),original);
});
test('Manual feedback uses the delivered Decide4/5 and common HOME cover, not Notes/Notifications footer graphics',()=>{
 validateManualFooterFeedbackAssets(footer);validateManualFooterCoverAssets(common);
 assert.equal(footer.resourceSources.animations.BtnCloseLng00_Decide.sha256,'901424e341042a399695d295b0052de535159f64ac55603a4acd5da9a1259edf');
 const original=structuredClone(footer),renderer={packs:{'manual-footer-close':footer}},alias=prepareManualFooterFeedback(renderer),prepared=renderer.packs[alias];
 for(const frame of[0,1]){assert.equal(manualFooterFeedbackFrame(frame),frame+4);const posed=poseNativeLayout(prepared.layouts.BtnCloseLng00,prepared.animations,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Decide',frame:frame+4}]);const pane=nativePaneParentPath(posed,'P_Btn_01').at(-1);assert.deepEqual(posed.materials[pane.picture.material].constantColors[0].slice(0,3),frame?[255,255,250]:[150,150,140]);}
 assert.deepEqual(footer,original);assert.equal(prepared.animations,footer.animations);assert.equal(prepared.textures,footer.textures);assert.equal(prepareManualFooterFeedback(renderer),alias);
 for(const frame of[-1,2,.5,NaN])assert.throws(()=>manualFooterFeedbackFrame(frame),/Invalid/);
 for(const mutate of[p=>delete p.animations.BtnCloseLng00_Decide,p=>p.animations.BtnCloseLng00_Decide.unsupported.push('unknown'),p=>p.layouts.BtnCloseLng00.groups[0].children.find(g=>g.name==='G_Btn_01').panes.push('unexpected')]){const broken=structuredClone(footer);mutate(broken);assert.throws(()=>validateManualFooterFeedbackAssets(broken),/Unsupported/);}
 for(const kind of['out','in'])for(const frame of[0,20]){const bindings=manualFooterCoverBindings(kind,frame),posed=poseNativeLayout(common.layouts.CmnFade_D_00,common.animations,bindings.lower);assert.equal(nativePaneParentPath(posed,'P_Bg_D_00').at(-1).alpha,kind==='out'?frame?255:0:frame?0:255);}
});

const source=new URL('../src/os/stock-native-helpers.ts',import.meta.url),data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const compiled=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+(n==='./stock-native-amiibo'?data('export const amiiboScreenPacks=[];export const drawNativeAmiibo=()=>false;'):new URL(n.endsWith('.ts')?n:n+'.ts',source).href)+s);
const helpers=await import(data(compiled));
test('actual Manual Contents painter requests and draws Decide over the unchanged source pair',()=>{
 const view={appId:'manual',screen:'main',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:{manualTitleId:'0004001000022400'}},requests=helpers.nativeHelperView(view).packs,calls=[];
 assert.deepEqual(requests.find(p=>p.alias==='manual-footer-close').animations,['BtnCloseLng00_SceneIn','BtnCloseLng00_Decide']);
 const renderer={packs:Object.fromEntries(requests.map(p=>[p.alias,read(p.url)])),getFontManifest:()=>read('fonts/shared/font.json'),draw(ctx,alias,name,options={}){calls.push({ctx,alias,name,options});return true;}},ctx={fillRect(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const image={width:48,height:48,data:new Uint8ClampedArray(48*48*4)},options={nativeImage:()=>image};
 assert.equal(helpers.drawNativeHelperFrame(renderer,ctx,ctx,view,options),true);const normal=calls.splice(0);
 assert.equal(helpers.drawNativeHelperFrame(renderer,ctx,ctx,view,{...options,manualFooterClose:{frame:1}}),true);
 const retained=rows=>rows.filter(r=>!r.alias.startsWith('manual-footer-close')&&r.alias!=='manual-footer-feedback');assert.deepEqual(retained(calls),retained(normal));
 assert.deepEqual(calls.find(r=>r.alias==='manual-footer-feedback').options.bindings,[{name:'BtnCloseLng00_SceneIn',frame:20},{name:'BtnCloseLng00_Decide',frame:5}]);
 assert.equal(createHash('sha256').update(readFileSync(new URL('packs/manual/layout-BtnCloseLng00.json',base))).digest('hex').length,64);
});
