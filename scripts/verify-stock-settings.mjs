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
const [{BitmapFont},{loadNativeTitleAssets},{settingsScreenPacks,drawNativeSettingsMain,settingsSceneVariant},{poseNativeLayout}]=await Promise.all(['bitmap-font','native-title-assets','stock-native-settings','native-layout'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs')))));
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://helper.invalid/manifest.json'}};globalThis.Image=Image;
const bytesForBlob=new WeakMap();URL.createObjectURL=blob=>'data:image/png;base64,'+bytesForBlob.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
globalThis.fetch=async value=>{const url=new URL(value);assert.equal(url.origin,'https://helper.invalid');const file=resolve(assetRoot,url.pathname.slice(1));assert.ok(file.startsWith(assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);bytesForBlob.set(blob,bytes);return blob;};return response;};
const fontPath=values['font-manifest'],manifest=JSON.parse(readFileSync(fontPath,'utf8'));
const font=new BitmapFont(manifest,await Promise.all(manifest.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
// Source mset texts, per docs/settings-data-lists-source-audit.md.
const dataLists={
 software:{title:'Software Management',instruction:'Manage Nintendo 3DS download\nsoftware, including save data.',page:'Software',empty:'There is no accessible\nsoftware data.'},
 'extra-data':{title:'Extra Data Management',instruction:'Manage extra data for\nNintendo 3DS software.',page:'Extra Data',empty:'There is no extra data.'},
};
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
  ['parental',5,['next','back']],['parental-explain',5,['next','back']],['parental-pin-notice',5,['back']],['restrictions',5,['rating','browser','shopping','3d']],
  ['profile',1,['nickname','birthday','region','ds-profile']],['clock',1,['date','time']],
  ['other',1,['profile','clock','touch']],
 ];
 const subpages=cases.map(([screen,variant,ids])=>({...view,screen,variant,rows:ids.map(id=>({id,label:id}))}));
 for(const [field,parent,variant]of [['sound','other',1],['language','other',1],['date','clock',1],['time','clock',1],['birthday','profile',1],['nickname','profile',1],['ds-profile','profile',2],['software','data-3ds',4],['extra-data','data-3ds',4]])subpages.push({...view,screen:'detail',variant,rows:[],data:{field,parent},heading:field,text:[]});
 // Explicit renderer specimens, never production preference defaults.
 for(const [field,value]of [['date','2024-02-29'],['time','23:07'],['birthday','02-29']])subpages.push({...view,screen:'detail',variant:1,rows:[],data:{field,parent:field==='birthday'?'profile':'clock',settings:{[field]:value}},verificationId:'supplied-'+field,heading:field,text:[]});
 subpages.push({...view,screen:'detail',variant:1,rows:[],data:{field:'language',parent:'other',settings:{language:'English'}},verificationId:'supplied-language',heading:'language',text:[]});
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
   const text=calls.find(c=>c.layout===(['nickname','birthday'].includes(subpage.data.field)?'UserInfo_U_00':dataLists[subpage.data.field]?'SMng_U_01':'TextBG_U_00'));
   assert.ok(text.options.overrides.TextBox_00.messageStyle,'identified detail keeps source instruction style');
  }
  const list=subpage.screen==='detail'&&dataLists[subpage.data.field];
  if(list){
   assert.equal(title.options.overrides.TextBoxTitle_00.text,list.title);
   const upper=calls.find(c=>c.layout==='SMng_U_01'),lower=calls.find(c=>c.layout==='SMngCTRData_D_00'),footer=calls.find(c=>c.layout==='Base_D_00');
   assert.ok(upper);assert.ok(lower);assert.ok(footer);
   assert.equal(calls.some(c=>c.layout==='TextBG_U_00'),false,'source scenes name no TextBG_U_00');
   assert.deepEqual(upper.options.bindings,[{name:'SMng_U_01_NonSD',frame:1}],'accessible SD selects the final NonSD frame');
   assert.equal(upper.options.overrides.TextBox_00.text,list.instruction);
   assert.equal(upper.options.overrides.TextBox_03.text,'SD Card');assert.equal(upper.options.overrides.TextBox_04.text,'Open Blocks');
   assert.equal(upper.options.overrides.TextBox_05.text,'','free-block count is never invented');
   assert.deepEqual(lower.options.bindings,[{name:'SMngCTRData_D_00_SceneIn_00',frame:20},{name:'SMngCTRData_D_00_BtnIn',frame:20,groups:['Group_05']},{name:'SMngCTRData_D_00_TextIn',frame:20,groups:['Group_03']}]);
   const o=lower.options.overrides;
   assert.equal(o.TextBoxTitle_00.text,list.empty);assert.equal(o.TextBoxTitle_00.visible,true);
   assert.equal(o.TextPageBox.text,list.page);assert.equal(o.TextBoxTitle_01.text,'Software title list');
   for(const name of ['TextPageNow','TextPageBar','TextPageAll','Window_00'])assert.equal(o[name].visible,false);
   for(const name of ['TextBoxTitle_00','TextPageBox','TextBoxTitle_01',...['TextBox_00','TextBox_03','TextBox_04'].map(n=>'upper:'+n)]){
    const override=name.startsWith('upper:')?upper.options.overrides[name.slice(6)]:o[name];
    assert.ok(override.messageStyle,name+' keeps its English source style');assert.equal(override.fontSize,undefined);
   }
   assert.equal(lower.options.attachments,undefined,'empty list attaches no icon buttons, half tabs, arrows or wait icon');
   assert.equal(footer.options.overrides.TextBox_00.text,'Back');
   assert.equal(calls.some(c=>c.layout==='Base_D_01'),false,'footer index 1 is the Back-only Base_D_00');
  }
  if(subpage.screen==='parental-explain'||subpage.screen==='parental-pin-notice'){
   const body=calls.find(c=>c.layout==='StartChild_D_00'),footer=calls.find(c=>c.layout==='Base_D_01');assert.ok(body);assert.ok(footer);
   assert.equal(body.options.overrides.TextBoxTitle_00.text,'If a child will be using this\nsystem, please set it up\nfor them.');
   assert.ok(body.options.overrides.TextBoxTitle_00.messageStyle);
   assert.equal(footer.options.overrides.TextBox_00.text,'Back');assert.equal(footer.options.overrides.TextBox_01.text,'Next');
  }
  if(subpage.screen==='parental-pin-notice'){
   const dialog=calls.find(c=>c.layout==='Dialog_D_01'),mask=calls.find(c=>c.layout==='DlgMask_D_00');assert.ok(dialog);assert.ok(mask);
   assert.ok(calls.indexOf(mask)>calls.findIndex(c=>c.layout==='Base_D_01'),'mask covers underlying footer');
   assert.ok(calls.indexOf(dialog)>calls.indexOf(mask),'dialog stays above source mask');
   assert.deepEqual(dialog.options.bindings,[{name:'Dialog_D_02_FadeIn',frame:20},{name:'Dialog_D_02_Select',frame:1,groups:['Group_00']}]);
   for(const name of ['TextBoxDialog_00','TextBox_00','TextBoxShdw_00']){
    assert.ok(dialog.options.overrides[name].messageStyle);assert.equal(dialog.options.overrides[name].fontSize,undefined);
   }
   assert.equal(dialog.options.overrides.TextBox_00.text,'OK');
   assert.equal(calls.some(c=>c.layout==='DlgMask_U_00'),false,'normal upper mask remains unproven');
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
  if(subpage.screen==='detail'&&subpage.data.field==='language'){
   const lower=calls.find(c=>c.layout==='Country_D_00'),bar=calls.find(c=>c.layout==='R_SlideBar'),footer=calls.find(c=>c.layout==='Base_D_01'),rows=calls.filter(c=>c.layout==='T_SB');
   assert.ok(lower);assert.ok(bar);assert.ok(footer);
   assert.deepEqual(lower.options.bindings,[{name:'Country_D_00_SceneIn_00',frame:20}]);
   assert.deepEqual(Object.keys(lower.options.attachments),['N_T_SB_02','N_T_SB_03','N_T_SB_04','N_T_SB_05','N_T_SB_06','N_T_SB_07','R_SlideBar'],'slots 0-1 have no row at top 0');
   assert.deepEqual(rows.map(c=>c.options.overrides.TextBox_00.text),['English','Français','Deutsch','Español','Italiano','Nederlands']);
   for(const row of rows){assert.ok(row.options.overrides.TextBox_00.messageStyle);assert.equal(row.options.overrides.TextBox_00.fontSize,undefined);}
   const english=subpage.data.settings?.language==='English';
   assert.deepEqual(rows.map(c=>c.options.bindings),[english?[{name:'T_SB_Decide_DirectSettings',frame:11}]:[],[],[],[],[],[]],'only configured English is decided');
   for(const name of ['SBBtnShdw','SBBtn','SBBtnFrame'])assert.deepEqual(bar.options.overrides[name].size,[22,104]);
   assert.deepEqual(bar.options.bindings??[],[],'no slide-bar clip or setPos before input');
   assert.equal(footer.options.overrides.TextBox_00.text,'Back');assert.equal(footer.options.overrides.TextBox_01.text,'OK');
   assert.equal(calls.some(c=>c.layout==='Base_D_00'),false,'footer index 2 is Base_D_01');
   const upper=calls.filter(c=>c.layout==='TextBG_U_00');assert.equal(upper.length,1,'no adapted lower text card');
   assert.equal(upper[0].options.overrides.TextBox_00.text,'Select the language to use.');
   assert.equal(title.options.overrides.TextBoxTitle_00.text,'Language');
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
 // The constructor does not choose the entry clip; both settle identically.
 const delivered=JSON.parse(readFileSync(join(assetRoot,'packs/settings/contents/0000-0000003d/layout.json'),'utf8'));
 const settled=name=>JSON.stringify(poseNativeLayout(delivered.layouts.SMngCTRData_D_00,delivered.animations,[{name,frame:20}]).roots);
 assert.equal(settled('SMngCTRData_D_00_SceneIn_00'),settled('SMngCTRData_D_00_SceneIn_01'),'both source entry clips settle to the same pose');
 const country=name=>JSON.stringify(poseNativeLayout(delivered.layouts.Country_D_00,delivered.animations,[{name,frame:20}]).roots);
 assert.equal(country('Country_D_00_SceneIn_00'),country('Country_D_00_SceneIn_01'),'both Language list entry clips settle to the same pose');
 assert.equal(reports.find(r=>r.id==='supplied-language-top').sha256,reports.find(r=>r.id==='detail-language-top').sha256,'decided row changes only the lower LCD');
 assert.notEqual(reports.find(r=>r.id==='supplied-language-bottom').sha256,reports.find(r=>r.id==='detail-language-bottom').sha256,'configured English marks its row');
 // UpLineWide_03's signed -330 width: the reflected override must draw the rule behind "SD Card".
 const ruleCoverage=overrides=>{const canvas=createCanvas(400,240),ctx=canvas.getContext('2d');assert.equal(originalDraw(ctx,'up','SMng_U_01',{bindings:[{name:'SMng_U_01_NonSD',frame:1}],overrides:{TextBox_03:{text:''},...overrides}}),true);const row=ctx.getImageData(60,86,320,1).data;let n=0;for(let i=3;i<row.length;i+=4)if(row[i])n++;return n;};
 assert.equal(ruleCoverage({}),0,'unmirrored signed size leaves the rule undrawn');
 assert.ok(ruleCoverage({UpLineWide_03:{size:[330,32],scale:[-1,1]}})>=300,'mirrored rule spans the upper panel');
 for(const lcd of ['top','bottom'])assert.notEqual(reports.find(r=>r.id==='detail-software-'+lcd).sha256,reports.find(r=>r.id==='detail-extra-data-'+lcd).sha256,'the two leaves differ on '+lcd);
 assert.equal(JSON.stringify(sourcePacks),before,'source packs remain immutable');
 assert.equal(reports.find(r=>r.id==='parental-pin-notice-top').sha256,reports.find(r=>r.id==='parental-explain-top').sha256,'notice preserves explanation upper LCD');
 assert.notEqual(reports.find(r=>r.id==='parental-pin-notice-bottom').sha256,reports.find(r=>r.id==='parental-explain-bottom').sha256,'notice changes lower LCD');
 assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')),[]);
 writeFileSync(join(out,'verification.json'),JSON.stringify({passed:true,reports,diagnostics:assets.diagnostics,limits:['Static main-screen assembly; native LCD and browser comparison remain separate.','Adapted detail cards inherit parent palette. DS Profile has no supplied saved data or editing flow.','Data Management Software/Extra Data present SD state 2 with no titles; Open Blocks is blank and arrow/wait-icon settled states are unattached.']},null,2)+'\n');
 console.log('Settings: five main and twenty-four subpage paired renders, scene variants, English styles, immutable packs and diagnostics passed.');
}finally{assets.dispose();font.dispose();}
