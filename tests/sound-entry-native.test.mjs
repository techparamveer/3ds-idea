import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const layout=url(compile('stock-screen-layout')
 .replace("'./camera-browse.ts'",JSON.stringify(new URL('../src/os/camera-browse.ts',import.meta.url).href))
 .replace("'./stock-manual-index.ts'",JSON.stringify(url('export const manualPageZeroAvailable=()=>false;'))));
const source=compile('stock-native-sound').replace("'./stock-screen-layout'",JSON.stringify(layout)).replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))).replace("'./stock-sound-record'",JSON.stringify(url(compile('stock-sound-record'))));
const {drawNativeSoundFrame,soundEntryBlue,soundGuideMessageColor,soundHudBatteryPatternFrame,soundHudTimeAlternatives,soundHudTimeOverride,soundHudTimeKey,soundScreenPacks}=await import(url(source));
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
 assert.deepEqual(options('S_Inf_U-Hour').overrides.TextBox_00.fixedWidthSpans,[{start:0,end:2,width:12},{start:2,end:3,width:10},{start:3,end:5,width:12}]);
 assert.equal(options('S_Inf_U-Hour').overrides.TextBox_00.fontSize,undefined);
 assert.equal(options('S_Inf_U-Hour').overrides.TextBox_00.translation,undefined);
 assert.deepEqual(options('S_Inf_U-Hour').overrides.TextBox_00.size,[72,30]);
 assert.equal(options('S_Inf_U-Hour').overrides.TextBox_00.messageStyle.fontScale[0],Math.fround(.68));
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

test('captured title blue is confined to entry title theme materials and preserves public resources',()=>{
 const before=JSON.stringify(packs),calls=[];
 const drawLayout=(ctx,pack,layout,posed)=>{calls.push({pack,layout,posed});return true;};
 const draw=()=>true;
 assert.equal(drawNativeSoundFrame({packs,drawLayout,draw},{},{},entry,{}),true);
 const title=calls.find(c=>c.layout==='S_Inf_U-TitleBar').posed;
 const original=packs['sound-info'].layouts['S_Inf_U-TitleBar'];
 for(let i=0;i<original.materials.length;i++){
  const old=original.materials[i],next=title.materials[i];
  if(['TitBar','TitBarBvlL','TitBarBvlC'].includes(old.name)){
   assert.deepEqual(next.constantColors[5],[41,113,238,255]);
   assert.deepEqual(next.constantColors.slice(0,5),old.constantColors.slice(0,5));
  }else assert.deepEqual(next,old);
 }
 for(const call of calls.filter(c=>c.layout!=='S_Inf_U-TitleBar')){
  assert.equal(call.posed.materials.some(m=>m.constantColors.some(c=>c.join(',')==='41,113,238,255')),false,call.layout);
 }
 assert.equal(JSON.stringify(packs),before);
 // Supplied-song views retain their existing source title rendering path.
 const sourceCalls=[];
 const supplied={...entry,data:{tracks:[{title:'Owner supplied song'}]}};
 assert.equal(drawNativeSoundFrame({packs,drawLayout,draw:(ctx,pack,layout)=>{sourceCalls.push(layout);return true;}},{},{},supplied,{}),true);
 assert.ok(sourceCalls.includes('S_Inf_U-TitleBar'));
});

test('entry device controls and disabled Back have no touch targets',()=>{
 for(const [x,y] of [[160,49],[160,159],[45,193],[275,193],[160,208],[45,225],[275,225]])assert.equal(hit(entry,x,y),null);
});

test('three Sound welcome pages bind the published guide art and S_tips messages',()=>{
 const bank=packs['sound-messages'].messages.S_tips;
 const styles=packs['sound-messages'].styles[bank.styleTable].styles;
 const body=bank.messages[bank.labels.D_001_0],next=bank.messages[bank.labels.Guide_D_N_Btn0];
 assert.deepEqual(soundGuideMessageColor({messageStyle:styles[body.styleIndex]}),[69,64,57,255]);
 assert.deepEqual(soundGuideMessageColor({messageStyle:styles[next.styleIndex]}),[69,64,57,255]);
 for(const label of ['D_001_0','D_001_1','D_001_2','Guide_D_00_00','Guide_D_00_01','Guide_D_N_Btn0','Guide_D_BN_Btn0','Guide_D_BN_Btn1','Guide_D_BO_Btn1'])assert.ok(label in bank.labels,label);
 assert.ok(packs['sound-guide-upper'].layouts.S_Guid03_U);
 for(let page=0;page<3;page++){
  const calls=[],top={},bottom={};
  const draw=(ctx,pack,layout,options)=>{calls.push({screen:ctx===top?'top':'bottom',pack,layout,options});return true;};
  const drawLayout=(ctx,pack,layout,posed,options)=>{calls.push({screen:ctx===top?'top':'bottom',pack,layout,posed,options});return true;};
  const guide={...entry,screen:'guide',data:{tracks:[],guidePage:page}};
  assert.equal(drawNativeSoundFrame({packs,draw,drawLayout},top,bottom,guide,{date:new Date(2026,8,24,10,52)}),true);
  const panel=calls.findLast(call=>call.layout=== (page===0?'C_DlgGuid1BtnW':'C_DlgGuid2Btn'));
  assert.equal(panel.options.overrides.TxtDlg.text,bank.messages[bank.labels[`D_001_${page}`]].text);
  if(page===0){
   const pane=(nodes,name)=>{for(const node of nodes){if(node.name===name)return node;const found=pane(node.children,name);if(found)return found;}return null;};
   assert.deepEqual(pane(panel.posed.roots,'TxtDlg')?.text.topColor,[69,64,57,255]);
   assert.deepEqual(pane(panel.posed.roots,'Guid1TxtW')?.text.topColor,[69,64,57,255]);
  }
  assert.equal(panel.options.overrides.TxtNumber0.text,'/ 3');
  assert.equal(panel.options.overrides.TxtNumber1.text,`${page+1} `);
  assert.deepEqual(panel.options.overrides.TxtNumber0.size,[48,24]);
  assert.deepEqual(panel.options.overrides.TxtNumber1.size,[48,24]);
  assert.deepEqual(panel.options.overrides.TxtNumber0.messageStyle,styles[bank.messages[bank.labels.Guide_D_00_00].styleIndex]);
  assert.deepEqual(panel.options.overrides.TxtNumber1.messageStyle,styles[bank.messages[bank.labels.Guide_D_00_01].styleIndex]);
  assert.deepEqual(panel.posed.roots[0].children.filter(p=>p.name.startsWith('TxtNumber')).map(p=>p.translation),[[116,-92,0],[116,-92,0]]);
  assert.equal(calls.some(call=>call.layout==='S_Guid03_U'),page===2);
  const frame=calls.findLast(call=>call.layout==='C_DlgChA');
  assert.equal(frame.screen,'bottom');
  assert.equal(calls.indexOf(frame)<calls.indexOf(panel),true);
  assert.equal(calls.filter(call=>call.layout==='ParakeetA_D').length,1);
 }
});

test('empty-entry clock selects one S/HudTime separator by seconds parity and keeps the 12/10 pitch tags',()=>{
 const hour=packs['sound-info'].layouts['S_Inf_U-Hour'];
 const pane=hour.roots[0].children.find(p=>p.name==='TextBox_00');
 assert.deepEqual(pane.translation,[-36,-112,0]);
 assert.deepEqual(pane.size,[48,30]);
 assert.deepEqual(pane.text.size,[25,30]);
 const bank=packs['sound-messages'].messages.S,tokens=bank.messages[bank.labels.HudTime].tokens;
 assert.deepEqual(tokens.map(t=>[t.group,t.type,t.arguments]),[[5,0,'00004041'],[3,3,''],[5,0,'00002041'],[3,47,'02003a0002002000'],[5,1,''],[5,0,'00004041'],[3,4,'']]);
 // Type 47 holds two alternatives, never one concatenated ": " string.
 assert.deepEqual(soundHudTimeAlternatives(tokens[3].arguments),[':',' ']);
 const spans=[{start:0,end:2,width:12},{start:2,end:3,width:10},{start:3,end:5,width:12}];
 // Native stills: 22:31:31.595 shows "22:31"; 22:27:14.541 shows "22 27".
 for(const [date,text] of [[new Date(2026,8,25,22,31,31,595),'22:31'],[new Date(2026,8,25,22,27,14,541),'22 27'],[new Date(2026,8,24,10,52,0),'10 52'],[new Date(2026,8,24,9,5,59),'09:05']]){
  const override=soundHudTimeOverride(packs['sound-messages'],date);
  assert.equal(override.text,text);
  assert.equal(override.text.length,5);
  assert.ok(!override.text.includes(': '),'old concatenated separator');
  assert.deepEqual(override.fixedWidthSpans,spans);
  assert.deepEqual(override.size,[72,30]);
  assert.equal(override.fontSize,undefined);
  assert.equal(override.translation,undefined);
  assert.equal(override.messageStyle.fontScale[0],Math.fround(.68));
  assert.equal(override.messageStyle.unresolvedWords['0'],72);
 }
 const calls=[];
 const drawLayout=(ctx,pack,layout,posed,options)=>{calls.push({layout,posed,options});return true;};
 assert.equal(drawNativeSoundFrame({packs,drawLayout,draw:()=>true},{},{},entry,{date:new Date(2026,8,24,9,5,1)}),true);
 const drawn=calls.find(c=>c.layout==='S_Inf_U-Hour');
 const find=(nodes,name)=>{for(const node of nodes){if(node.name===name)return node;const found=find(node.children,name);if(found)return found;}return null;};
 const posed=find(drawn.posed.roots,'TextBox_00');
 assert.equal(posed.text.value,'09:05');
 assert.deepEqual(posed.text.fixedWidthSpans,spans);
 assert.deepEqual(posed.translation,[-36,-112,0]);
 assert.deepEqual(posed.size,[72,30]);
 assert.deepEqual(posed.text.size,[25,30]);
 assert.equal(posed.text.messageStyle.fontScale[0],Math.fround(.68));
 const mutated=structuredClone(packs['sound-messages']);
 mutated.messages.S.messages[mutated.messages.S.labels.HudTime].tokens[3].arguments='02003a00';
 assert.throws(()=>soundHudTimeOverride(mutated,new Date(2026,8,24,10,52)),/Unsupported Sound HudTime separator/);
 const unknown=structuredClone(packs['sound-messages']);
 unknown.messages.S.messages[unknown.messages.S.labels.HudTime].tokens[4].type=2;
 assert.throws(()=>soundHudTimeOverride(unknown,new Date(2026,8,24,10,52)),/Unsupported Sound HudTime message control/);
});

test('Sound paint identity carries HudTime seconds parity only on the empty-entry path',()=>{
 const even=new Date(2026,8,25,22,27,14),odd=new Date(2026,8,25,22,27,15);
 for(const screen of ['main','guide']){
  const view={...entry,screen};
  assert.deepEqual(soundHudTimeKey(view,even),[22,27,0]);
  assert.deepEqual(soundHudTimeKey(view,odd),[22,27,1]);
  assert.deepEqual(soundHudTimeKey({...view,data:{}},odd),[22,27,1],'absent track list is the empty entry');
 }
 const library={...entry,data:{tracks:[{title:'Song'}]}};
 assert.equal(soundHudTimeKey(library,odd),null,'supplied-song library main draws no HudTime');
 assert.equal(soundHudTimeKey({...library,screen:'guide'},odd),null);
 assert.equal(soundHudTimeKey({...entry,screen:'playback',data:{tracks:[],track:{title:'Song'}}},odd),null);
 assert.equal(soundHudTimeKey({...entry,appId:'system-settings'},odd),null);
 const presentation=readFileSync(new URL('../src/os/stock-screen-presentation.ts',import.meta.url),'utf8');
 assert.match(presentation,/const soundClockKey=soundHudTimeKey\(view,date\);/);
 assert.match(presentation,/JSON\.stringify\(\[[^\]]*soundClockKey[^\]]*\]\)/,'the paint key includes the Sound clock identity');
});

test('empty-entry battery Pattern follows source seconds parity and leaves volume on unsupplied CFG frame 0',()=>{
 const clip=packs['sound-hud'].animations.C_HudBut_B_Pattern;
 assert.equal(clip.frames,7);
 assert.deepEqual(clip.textures,['HudBat_00.bclim','HudBat_01.bclim','HudBatLgt_00.bclim','HudBatPlg.bclim']);
 const plug=clip.tracks.find(t=>t.property==='texture.pattern'&&t.index===2);
 assert.deepEqual(plug.keys.map(k=>[k.frame,k.value]),[[0,2],[5,3]]);
 const even=new Date(2026,8,25,22,27,14,541),odd=new Date(2026,8,25,22,31,31,595);
 assert.equal(soundHudBatteryPatternFrame(even),4);
 assert.equal(soundHudBatteryPatternFrame(odd),5);
 assert.equal(soundHudBatteryPatternFrame(new Date(2026,8,24,10,52,0)),4);
 const posedTexture=(date,layout)=>{
  const calls=[];
  assert.equal(drawNativeSoundFrame({packs,drawLayout:(ctx,pack,name,posed)=>{calls.push({layout:name,posed});return true;},draw:()=>true},{},{},entry,{date}),true);
  const call=calls.find(c=>c.layout===layout);
  const battery=layout==='C_HudBut_B';
  const material=call.posed.materials.find(m=>m.name===(battery?'ButF_B':'-H-SndB'));
  return call.posed.textures[material.textureMaps[battery?2:0].texture];
 };
 assert.equal(posedTexture(even,'C_HudBut_B'),'HudBatLgt_00.bclim');
 assert.equal(posedTexture(odd,'C_HudBut_B'),'HudBatPlg.bclim');
 for(const date of [even,odd])assert.equal(posedTexture(date,'C_HudSndB'),'HudSnd_B_00.bclim');
});

test('lower welcome frame includes source window and bird at the guide mount',()=>{
 const frame=packs['sound-dialog'].layouts.C_DlgChA;
 assert.deepEqual(frame.canvas,{width:320,height:240,origin:1});
 assert.deepEqual(frame.roots[0].children.map(pane=>[pane.name,pane.translation,pane.size]),[
  ['ChAWdwL',[-10,0,0],[288,230]],['ChAWdwR',[144,0,0],[20,230]],['Bird',[-130,-89,0],[44,52]],
 ]);
 assert.deepEqual(frame.textures,['C_DlgChBase.bclim','C_DlgChBirdA.bclim','C_DlgChBirdAlph.bclim','C_DlgChLay6.bclim']);
 assert.equal(packs['sound-dialog'].resourceSources.layouts.C_DlgChA.path,'lyt/C.LZ/Dlg/blyt/C_DlgChA.bclyt');
});
