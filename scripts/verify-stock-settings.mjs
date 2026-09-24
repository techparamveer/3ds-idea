import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import ts from 'typescript';
const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module','font-manifest'].map(key=>[key,{type:'string'}]))});
for(const key of ['artifact-dir','asset-root','canvas-module','font-manifest'])assert.ok(values[key]?.startsWith('/'),'Expected absolute '+key);
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),assetRoot=values['asset-root'],out=values['artifact-dir'];mkdirSync(out,{recursive:true});
const {createCanvas,loadImage,Image}=await import(pathToFileURL(values['canvas-module']));
const compiled=mkdtempSync(join(out,'compiled-'));
for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','stock-native-settings']){
 const text=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
 writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
}
const [{BitmapFont},{loadNativeTitleAssets},{settingsScreenPacks,drawNativeSettingsMain,settingsSceneVariant}]=await Promise.all(['bitmap-font','native-title-assets','stock-native-settings'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs')))));
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://helper.invalid/manifest.json'}};globalThis.Image=Image;
const bytesForBlob=new WeakMap();URL.createObjectURL=blob=>'data:image/png;base64,'+bytesForBlob.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
globalThis.fetch=async value=>{const url=new URL(value);assert.equal(url.origin,'https://helper.invalid');const file=resolve(assetRoot,url.pathname.slice(1));assert.ok(file.startsWith(assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);bytesForBlob.set(blob,bytes);return blob;};return response;};
const fontPath=values['font-manifest'],manifest=JSON.parse(readFileSync(fontPath,'utf8'));
const font=new BitmapFont(manifest,await Promise.all(manifest.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
const view={appId:'system-settings',screen:'main',heading:'System Settings',rows:['internet','parental','data','other','nnid'].map(id=>({id,label:id})),selection:0,footer:{left:{action:'back',label:'Back'}}};
const assets=await loadNativeTitleAssets('https://helper.invalid/manifest.json','0004001000022000',settingsScreenPacks,new Map([['cbf_std.bcfnt',font]]));
const renderer=assets.renderer,originalDraw=renderer.draw.bind(renderer),sourcePacks=Object.values(renderer.packs),before=JSON.stringify(sourcePacks),reports=[];
try{
 const focusHashes=[];
 for(let selection=0;selection<5;selection++){
  const top=createCanvas(400,240),bottom=createCanvas(320,240),calls=[];
  renderer.draw=(ctx,pack,layout,options)=>{calls.push({pack,layout,options});return originalDraw(ctx,pack,layout,options);};
  assert.equal(drawNativeSettingsMain(renderer,top.getContext('2d'),bottom.getContext('2d'),{...view,selection}),true);
  for(const name of ['Bg_U_00','Bg_D_00']){
   const call=calls.find(c=>c.layout===name);assert.ok(call);
   assert.equal(call.options?.bindings?.length??0,0,'main keeps the source default background');
   const source=renderer.packs.base.layouts[name];
   const flat=panes=>panes.flatMap(p=>[p,...flat(p.children)]),panes=flat(source.roots);
   assert.equal(panes.find(p=>p.name==='P_BG_Legacy').flags&1,0);
   assert.equal(panes.find(p=>p.name==='P_BG_White').flags&1,1);
  }
  const title=calls.find(c=>c.layout==='TopText_U_00');assert.equal(title.options.overrides.TextBoxTitle_00.text,'System Settings');
  assert.ok(title.options.overrides.TextBoxTitle_00.messageStyle,'title keeps the English source style');
  assert.equal(title.options.overrides.TextBoxTitle_00.fontSize,undefined,'no guessed title font override');
  const parent=calls.find(c=>c.layout==='Top_D_02');assert.equal(Object.keys(parent.options.attachments).length,5);
  for(const [name,canvas]of [['top',top],['bottom',bottom]]){
   const id='main-'+selection+'-'+name,rgba=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   const sha256=createHash('sha256').update(rgba).digest('hex');reports.push({id,sha256});if(name==='bottom')focusHashes.push(sha256);
   writeFileSync(join(out,id+'.png'),canvas.toBuffer('image/png'));
  }
  // Compare an unobstructed upper pixel against a separately rendered source BG.
  const source=createCanvas(400,240);originalDraw(source.getContext('2d'),'base','Bg_U_00');
  assert.deepEqual(top.getContext('2d').getImageData(2,2,1,1).data,source.getContext('2d').getImageData(2,2,1,1).data);
 }
 assert.equal(new Set(focusHashes).size,5,'five distinct source selection states');
 const cases=[
  ['internet',3,['connections','spotpass','ds-connections','internet-info']],
  ['connections',3,['connection-1','connection-2','connection-3','new-connection']],
  ['data',4,['data-3ds','data-dsi','streetpass','blocked-users']],
  ['data-3ds',4,['software','extra-data','add-on-content','backup']],
  ['parental',5,['next','back']],['parental-explain',5,['next','back']],['restrictions',5,['rating','browser','shopping','3d']],
  ['profile',1,['nickname','birthday','region','ds-profile']],['clock',1,['date','time']],
  ['other',1,['profile','clock','touch']],
 ];
 const subpages=cases.map(([screen,variant,ids])=>({...view,screen,variant,rows:ids.map(id=>({id,label:id}))}));
 for(const [field,parent,variant]of [['sound','other',1],['language','other',1],['date','clock',1],['time','clock',1],['birthday','profile',1],['nickname','profile',1],['ds-profile','profile',2]])subpages.push({...view,screen:'detail',variant,rows:[],data:{field,parent},heading:field,text:[]});
 // Explicit renderer specimens, never production preference defaults.
 for(const [field,value]of [['date','2024-02-29'],['time','23:07'],['birthday','02-29']])subpages.push({...view,screen:'detail',variant:1,rows:[],data:{field,parent:field==='birthday'?'profile':'clock',settings:{[field]:value}},verificationId:'supplied-'+field,heading:field,text:[]});
 for(const subpage of subpages){
  const top=createCanvas(400,240),bottom=createCanvas(320,240),calls=[];
  renderer.draw=(ctx,pack,layout,options)=>{calls.push({pack,layout,options});return originalDraw(ctx,pack,layout,options);};
  assert.equal(settingsSceneVariant(subpage),subpage.variant);
  assert.equal(drawNativeSettingsMain(renderer,top.getContext('2d'),bottom.getContext('2d'),subpage),true);
  for(const name of ['Bg_U_00','Bg_D_00']){
   const call=calls.find(c=>c.layout===name);assert.ok(call);
   assert.deepEqual(call.options?.bindings??[],subpage.variant===2?[{name:name+'_SceneIn_Legacy',frame:40}]:[]);
  }
  const title=calls.find(c=>c.layout==='CommonBG_U_00');
  if(subpage.variant===2){
   assert.equal(title,undefined,'DS Profile does not use modern title chrome');
   const legacy=calls.find(c=>c.layout==='LsCommonBG_U_00'),menu=calls.find(c=>c.layout==='LsMenu_D_00'),footer=calls.find(c=>c.layout==='LsBase_D_00');
   assert.ok(legacy);assert.ok(menu);assert.ok(footer);
   for(const name of ['TextBox_00','TextBox_01','TextBox_03'])assert.equal(legacy.options.overrides[name].text,'','no fabricated DS profile data');
   assert.deepEqual(Object.keys(menu.options.attachments),['N_B_LsMenu_00','N_B_LsMenu_01']);
   assert.equal(footer.options.overrides.TextBox_00.text,'Back');assert.equal(footer.options.overrides.TextBox_02.text,'Nintendo DS Profile');
   assert.equal(calls.some(c=>c.layout==='TextBG_U_00'),false);
  }else assert.equal(title.options.bindings[0].name,'CommonBG_U_00_SceneIn_0'+subpage.variant);
  if(subpage.screen==='detail'&&subpage.variant!==2){
   assert.ok(title.options.overrides.TextBoxTitle_00.messageStyle,'identified detail keeps native title style');
   const text=calls.find(c=>c.layout===(['nickname','birthday'].includes(subpage.data.field)?'UserInfo_U_00':'TextBG_U_00'));
   assert.ok(text.options.overrides.TextBox_00.messageStyle,'identified detail keeps source instruction style');
  }
  if(subpage.screen==='parental-explain'){
   const body=calls.find(c=>c.layout==='StartChild_D_00'),footer=calls.find(c=>c.layout==='Base_D_01');assert.ok(body);assert.ok(footer);
   assert.equal(body.options.overrides.TextBoxTitle_00.text,'If a child will be using this\nsystem, please set it up\nfor them.');
   assert.ok(body.options.overrides.TextBoxTitle_00.messageStyle);
   assert.equal(footer.options.overrides.TextBox_00.text,'Back');assert.equal(footer.options.overrides.TextBox_01.text,'Next');
  }
  if(subpage.screen==='parental'){
   const body=calls.find(c=>c.layout==='MessageOnly_D_00'),footer=calls.find(c=>c.layout==='Base_D_01');
   assert.ok(body);assert.ok(footer);
   assert.equal(body.options.overrides.TextBoxTitle_00.text.startsWith('You may limit access'),true);
   assert.ok(body.options.overrides.TextBoxTitle_00.messageStyle);
   assert.equal(body.options.overrides.TextBoxTitle_00.fontSize,undefined);
   assert.equal(footer.options.overrides.TextBox_00.text,'Back');assert.equal(footer.options.overrides.TextBox_01.text,'Set');
   assert.equal(calls.some(c=>c.layout==='Btn2Text_D_00'),false);
  }
  if(subpage.screen==='detail'&&['date','time','birthday'].includes(subpage.data.field)){
   const field=subpage.data.field,layout=field==='date'?'DateTime_D_00':field==='time'?'DateTime_D_01':'Birthday_D_00';
   const lower=calls.find(c=>c.layout===layout),footer=calls.find(c=>c.layout==='Base_D_01');assert.ok(lower);assert.ok(footer);
   assert.equal(Object.keys(lower.options.attachments).length,field==='date'?6:4,'all source arrows stay visible');
   assert.equal(footer.options.overrides.TextBox_00.text,'Cancel');assert.equal(footer.options.overrides.TextBox_01.text,'OK');
   assert.equal(calls.some(c=>c.layout.endsWith('_ReadOnly')),false);
   const indices=field==='date'?[0,1,2,3,5,6,8,9]:[0,1,3,4];
   const expected=subpage.data.settings?.[field]?.replace(/[-:]/g,'');
   indices.forEach((index,i)=>{
    const override=lower.options.overrides['Picture_'+String(index).padStart(2,'0')];
    if(expected)assert.equal(override.textureBindings[0],'Number'+expected[i]+'.bclim');else assert.equal(override.visible,false,'absent values never expose source sample digits');
   });
   for(const name of field==='date'?['TextBox_00','TextBox_01','TextBox_02']:['TextBox_01','TextBox_02']){
    assert.ok(lower.options.overrides[name].messageStyle);assert.equal(lower.options.overrides[name].fontSize,undefined);
   }
   if(field==='date')assert.deepEqual(['TextBox_00','TextBox_01','TextBox_02'].map(name=>lower.options.overrides[name].translation[0]),[84,-27,-111]);
   if(field!=='time')for(const name of field==='date'?['Picture_04','Picture_07']:['Picture_02'])assert.equal(lower.options.overrides[name].textureBindings[0],'sign_01.bclim');
   if(field==='birthday')assert.deepEqual(['TextBox_01','TextBox_02'].map(name=>lower.options.overrides[name].translation[0]),[43,-43]);
  }
  if(subpage.screen==='clock'){
   const lower=calls.find(c=>c.layout==='NetType2_D_00');assert.ok(lower);
   assert.deepEqual(Object.keys(lower.options.attachments),['N_B_L_00','N_B_L_01']);
   assert.equal(calls.some(c=>c.layout==='Btn2Text_D_00'),false);
  }
  if(subpage.screen==='connections'){
   const upper=calls.find(c=>c.layout==='Connect_U_00');assert.ok(upper);
   for(let i=0;i<3;i++){
    assert.equal(upper.options.overrides['TextBox_0'+(i*2+1)].text,'Connection '+(i+1));
    assert.equal(upper.options.overrides['TextBox_0'+(i*2+2)].text,'None');
    assert.equal(upper.options.overrides['NetKeyL_0'+i].visible,false);
   }
   assert.equal(calls.some(c=>c.layout==='TextBG_U_00'),false);
  }
  for(const [name,canvas]of [['top',top],['bottom',bottom]]){
   const id=(subpage.verificationId??subpage.screen+(subpage.data?.field?'-'+subpage.data.field:''))+'-'+name;
   writeFileSync(join(out,id+'.png'),canvas.toBuffer('image/png'));
   reports.push({id,variant:subpage.variant,sha256:createHash('sha256').update(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data).digest('hex')});
  }
 }
 assert.equal(JSON.stringify(sourcePacks),before,'source packs remain immutable');
 assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')),[]);
 writeFileSync(join(out,'verification.json'),JSON.stringify({passed:true,reports,diagnostics:assets.diagnostics,limits:['Static main-screen assembly; native LCD and browser comparison remain separate.','Adapted detail cards inherit parent palette. DS Profile has no supplied saved data or editing flow.']},null,2)+'\n');
 console.log('Settings: five main and twenty subpage paired renders, scene variants, English styles, immutable packs and diagnostics passed.');
}finally{assets.dispose();font.dispose();}
