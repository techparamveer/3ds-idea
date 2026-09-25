import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const layout=url(compile('stock-screen-layout').replace("'./camera-browse.ts'",JSON.stringify(new URL('../src/os/camera-browse.ts',import.meta.url).href)));
const source=compile('stock-native-sound').replace("'./stock-screen-layout'",JSON.stringify(layout)).replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))).replace("'./stock-sound-record'",JSON.stringify(url(compile('stock-sound-record'))));
const {drawNativeSoundFrame,soundEntryBlue,soundGuideLowerPanel,soundScreenPacks}=await import(url(source));
const {stockScreenActionAt:hit}=await import(layout);
const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const packs=Object.fromEntries(soundScreenPacks.map(p=>[p.alias,JSON.parse(readFileSync(new URL(p.url,firmware)))]));
const entry={appId:'sound',screen:'main',heading:'Nintendo 3DS Sound',rows:[],selection:0,footer:{},data:{tracks:[]}};

test('native entry uses source chrome and complete source-bound labels without changing source packs',()=>{
 const before=JSON.stringify(packs),calls=[],top={},bottom={};
 const drawLayout=(ctx,pack,layout,posed,options)=>{calls.push({screen:ctx===top?'top':'bottom',pack,layout,posed,options});return true;};
 const draw=(ctx,pack,layout,options)=>{calls.push({screen:ctx===top?'top':'bottom',pack,layout,options});return true;};
 assert.equal(drawNativeSoundFrame({packs,drawLayout,draw},top,bottom,entry,{date:new Date(2026,8,24,10,52)}),true);
 const names=calls.map(c=>c.layout);
 assert.deepEqual(calls.slice(0,4).map(c=>[c.screen,c.layout]),[['top','S_BG'],['bottom','S_BG'],['top','S_BG-Record'],['bottom','S_BG-Record']]);
 assert.equal(names.filter(n=>n==='S_BG-Record').length,2);
 for(const layout of ['S_Common-BrwCursor','S_Common-IconList','S_Common-Text','S_BG_D-Ctr','C_SldH_L','S_Common-OpLBtn','S_Common-OpRBtn','S_Common-OpenBtn','S_Common-SetBtn','S_Common-BackBtn','S_Inf_U-UnderBar','S_Inf_U-Hour','S_Inf_U-PlayTime'])assert.ok(names.includes(layout),layout);
 assert.equal(names.filter(n=>n==='ParakeetA_U').length,2);assert.equal(names.filter(n=>n==='ParakeetA_D').length,1);
 assert.deepEqual(calls.filter(c=>c.layout==='ParakeetA_U').map(c=>c.options.center),[[35,192],[94,192]]);
 assert.deepEqual(calls.filter(c=>c.layout==='ParakeetA_D').map(c=>c.options.center),[[21,123]]);
 const options=n=>calls.find(c=>c.layout===n).options;
 assert.equal(options('S_Common-OpenBtn').overrides.TxtC.text,'Open');
 assert.equal(options('S_Common-Text').overrides.Null.text,'Record & Edit Sounds');
 assert.deepEqual(['S_Common-BrwCursor','S_Common-IconList','S_Common-Text'].map(layout=>options(layout).center),[[160,118],[43,47],[55,46]]);
 const cursor=calls.find(c=>c.layout==='S_Common-BrwCursor').posed;
 assert.equal(cursor.textures[cursor.materials.find(m=>m.name==='IconCurBarO_R').textureMaps[0].texture],'V3_BarCursorIcon09.bclim');
 const cursorClip=packs['sound-common'].animations['S_Common-BrwCursor_Default'];
 assert.equal(cursorClip.textures[cursorClip.tracks.find(t=>t.target==='IconCurBarO_R'&&t.property==='texture.pattern').keys.findLast(k=>k.frame<=18).value],'V3_BarCursorIcon09.bclim');
 assert.equal(options('S_Common-OpLBtn').overrides.TxtC.text,'StreetPass');
 assert.equal(options('S_Common-SetBtn').overrides.TxtMiniT_W_P0.text,'Settings');
 assert.equal(options('S_Inf_U-Hour').overrides.TextBox_00.text,'10 52');
 for(const [layout,pane,label] of [['S_Common-OpLBtn','TxtC','C_B_04'],['S_Common-SetBtn','TxtMiniT_W_P0','C_B_03']]){
  const bank=packs['sound-messages'].messages.S,message=bank.messages[bank.labels[label]],tokens=message.tokens;
  assert.deepEqual(tokens.filter(t=>t.control).map(t=>[t.group,t.type,t.arguments]),[[1,0,'5000'],[1,0,'6400']]);
  const original=packs['sound-messages'].styles[bank.styleTable].styles[message.styleIndex];
  assert.deepEqual(options(layout).overrides[pane].messageStyle.fontScale,original.fontScale.map(v=>v*.8));
 }
 assert.equal(JSON.stringify(packs),before);
});

test('entry theme changes only source cyan theme slots and leaves shared layouts untouched',()=>{
 const original=packs['sound-bg'].layouts['S_BG_D-Ctr'],before=JSON.stringify(original),posed=soundEntryBlue(original);
 assert.equal(JSON.stringify(original),before);
 for(let i=0;i<original.materials.length;i++){
  const old=original.materials[i],next=posed.materials[i];
  if(old.constantColors[5]?.join(',')==='57,170,213,255')assert.deepEqual(next.constantColors[5],[42,113,235,255]);
  else assert.deepEqual(next,old);
 }
});

test('entry device controls and disabled Back have no touch targets',()=>{
 for(const [x,y] of [[160,49],[160,159],[45,193],[275,193],[160,208],[45,225],[275,225]])assert.equal(hit(entry,x,y),null);
});

test('three Sound welcome pages bind the published guide art and S_tips messages',()=>{
 const bank=packs['sound-messages'].messages.S_tips;
 for(const label of ['D_001_0','D_001_1','D_001_2','Guide_D_N_Btn0','Guide_D_BN_Btn0','Guide_D_BN_Btn1','Guide_D_BO_Btn1'])assert.ok(label in bank.labels,label);
 assert.ok(packs['sound-guide-upper'].layouts.S_Guid03_U);
 for(let page=0;page<3;page++){
  const calls=[],top={},bottom={save(){this.savedSmoothing=this.imageSmoothingEnabled;},restore(){this.imageSmoothingEnabled=this.savedSmoothing;},imageSmoothingEnabled:true};
  const draw=(ctx,pack,layout,options)=>{calls.push({screen:ctx===top?'top':'bottom',pack,layout,options,smoothing:ctx.imageSmoothingEnabled});return true;};
  const drawLayout=(ctx,pack,layout,posed,options)=>draw(ctx,pack,layout,options);
  const guide={...entry,screen:'guide',data:{tracks:[],guidePage:page}};
  assert.equal(drawNativeSoundFrame({packs,draw,drawLayout},top,bottom,guide,{date:new Date(2026,8,24,10,52)}),true);
  const panel=calls.findLast(call=>call.layout=== (page===0?'C_DlgGuid1BtnW':'C_DlgGuid2Btn'));
  assert.equal(panel.options.overrides.TxtDlg.text,bank.messages[bank.labels[`D_001_${page}`]].text);
  assert.equal(panel.options.overrides.TxtNumber0.text,`${page+1} / `);
  assert.deepEqual(panel.options.overrides.TxtNumber0.translation,[107,-92,0]);
  assert.deepEqual(panel.options.overrides.TxtNumber0.size,[35,24]);
  assert.deepEqual(panel.options.overrides.TxtNumber1.translation,[147,-92,0]);
  assert.deepEqual(panel.options.overrides.TxtNumber1.size,[20,24]);
  assert.equal(calls.some(call=>call.layout==='S_Guid03_U'),page===2);
  assert.deepEqual(calls.findLast(call=>call.layout==='ParakeetA_D').options.center,[36,203]);
  assert.equal(calls.findLast(call=>call.layout==='ParakeetA_D').options.scale,1.75);
  assert.equal(calls.findLast(call=>call.layout==='ParakeetA_D').smoothing,false);
  assert.equal(bottom.imageSmoothingEnabled,true);
 }
});

test('lower welcome panel reuses native 320px dialog geometry with the published green guide material',()=>{
 const dialog=packs['sound-dialog'].layouts.C_Dlg,guide=packs['sound-dialog'].layouts.C_DlgGuid_U;
 const before=JSON.stringify(dialog),panel=soundGuideLowerPanel(dialog,guide);
 assert.equal(JSON.stringify(dialog),before);
 assert.deepEqual(panel.roots,dialog.roots);
 assert.deepEqual(panel.materials,guide.materials);
 assert.deepEqual(panel.textures,guide.textures);
});
