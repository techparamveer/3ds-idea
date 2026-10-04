import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const fontSource=readFileSync(new URL('../src/os/bitmap-font.ts',import.meta.url),'utf8');
const fontCompiled=ts.transpileModule(fontSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {nativeCenteredGlyphQuads}=await import(`data:text/javascript;base64,${Buffer.from(fontCompiled).toString('base64')}`);

const settingsUrl=new URL('../src/os/stock-native-settings.ts',import.meta.url);
const href=name=>JSON.stringify(new URL(`../src/os/${name}`,import.meta.url).href);
const settingsCompiled=ts.transpileModule(readFileSync(settingsUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replace(/['"]\.\/stock-settings-navigation(?:\.ts)?['"]/g,href('stock-settings-navigation.ts'))
  .replace(/['"]\.\/native-layout(?:\.ts)?['"]/g,href('native-layout.ts'))
  .replace(/['"]\.\/device-status-profile(?:\.ts)?['"]/g,href('device-status-profile.ts'));
const {drawNativeSettingsMain}=await import('data:text/javascript;base64,'+Buffer.from(settingsCompiled).toString('base64'));

const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('fonts/shared/font.json',firmware),'utf8'));
const packRoot=new URL('packs/settings/contents/0000-0000003d/',firmware);
const pack=name=>JSON.parse(readFileSync(new URL(name+'.json',packRoot),'utf8'));
const messages=pack('message_EU');
const buttonPack=pack('button');
const layoutPack=pack('layout');
const upPack=pack('up');
const bank=messages.messages.mset;
const mset=label=>bank.messages[bank.labels[label]];
const styleOf=message=>messages.styles[bank.styleTable].styles[message.styleIndex];
const flatten=panes=>panes.flatMap(pane=>[pane,...flatten(pane.children??[])]);
const pane=(layout,name)=>flatten(layout.roots).find(item=>item.name===name);
const ownsLocal=(quad,localX,localY)=>{
  const first=Math.floor(quad.x-.5)+1;
  const lastExclusive=Math.floor(quad.right-.5)+1;
  const firstY=Math.ceil(quad.y-.5);
  const lastY=Math.ceil(quad.bottom-.5);
  return localX>=first&&localX<lastExclusive&&localY>=firstY&&localY<lastY;
};
const ownsFit=(quad,localX,localY)=>{
  const edge=value=>Math.round(value*16)/16;
  const first=Math.floor(edge(quad.x)-.5)+1;
  const lastExclusive=Math.floor(edge(quad.right)-.5)+1;
  const firstY=Math.ceil(quad.y-.5);
  const lastY=Math.ceil(quad.bottom-.5);
  return localX>=first&&localX<lastExclusive&&localY>=firstY&&localY<lastY;
};
const rows=[[160,76],[160,124],[160,172]];
const describe=(layoutName,label,row)=>{
  const layout=buttonPack.layouts[layoutName];
  const text=pane(layout,'TextBox_00');
  const msg=mset(label);
  const style=styleOf(msg);
  const size=[(manifest.width??manifest.height)*style.fontScale[0],manifest.height*style.fontScale[1]];
  const quads=nativeCenteredGlyphQuads(manifest,msg.text,text.size[0],text.size[1],size);
  const ink=[...msg.text].filter(char=>(manifest.glyphs[String(char.codePointAt(0))]??manifest.fallback)?.width);
  const originX=rows[row][0]+text.translation[0]-text.size[0]/2;
  const originY=rows[row][1]+text.translation[1]-text.size[1]/2;
  const glyph=char=>quads[ink.indexOf(char)];
  const last=char=>[...ink].reduce((n,item,index)=>item===char?index:n,-1);
  return {layout,text,msg,style,quads,ink,originX,originY,glyph,lastGlyph:char=>quads[last(char)]};
};

const transfer=describe('I_Trans','trans',2);
const language=describe('I_Lang','language',0);
const update=describe('I_Update','update',1);
const format=describe('I_Format','initialize',2);
const transferY=transfer.glyph('y');
const updateY=update.glyph('y');
const languageG=language.glyph('g');
const languageG2=language.lastGlyph('g');
const updateP=update.glyph('p');
const formatY=format.glyph('y');
const formatY2=format.lastGlyph('y');

test('page 3 lower 8 sit on System Transfer y; 5 are already writer-owned',()=>{
  assert.equal(transfer.msg.text,'System Transfer');
  assert.equal(transfer.style.fontScale[0],0.8500000238418579);
  assert.equal(transfer.originX,76);
  assert.equal(transfer.originY,153);
  assert.equal(transferY.right,41.499996185302734);
  assert.equal(transfer.originX+transferY.right,117.49999618530273);
  for(const [x,y] of [[107,179],[108,179],[109,179],[110,179],[111,179]]){
    const localX=x-transfer.originX,localY=y-transfer.originY;
    assert.equal(localY,26);
    assert.equal(ownsLocal(transferY,localX,localY),true,`${x},${y} stays inside writer-local y`);
  }
  for(const y of [163,164,165]){
    const localX=117-transfer.originX,localY=y-transfer.originY;
    assert.equal(ownsLocal(transferY,localX,localY),false,'column 117 stays outside writer-local');
    assert.equal(ownsFit(transferY,localX,localY),true,'the rejected 1/16 fit would include this stem');
  }
});

test('page 4 lower 35 are Language / Update / Format descenders plus the same y stem',()=>{
  assert.equal(language.msg.text,'Language');
  assert.equal(update.msg.text,'System Update');
  assert.equal(format.msg.text,'Format System Memory');
  assert.equal(language.originY,57);
  assert.equal(update.originY,105);
  assert.equal(format.originX,74);
  assert.equal(format.originY,153);
  assert.equal(updateY.right,45.499996185302734);
  assert.equal(update.originX+updateY.right,121.49999618530273);
  for(const [x,box] of [[164,languageG],[202,languageG2]]){
    assert.equal(ownsLocal(box,x-language.originX,83-language.originY),true);
  }
  for(const x of [111,112,113,114,115])assert.equal(ownsLocal(updateY,x-update.originX,131-update.originY),true);
  for(const y of [115,116,117]){
    assert.equal(ownsLocal(updateY,121-update.originX,y-update.originY),false);
    assert.equal(ownsFit(updateY,121-update.originX,y-update.originY),true);
  }
  for(const x of [196,197,198])assert.equal(ownsLocal(updateP,x-update.originX,131-update.originY),true);
  for(const x of [152,153,154,155])assert.equal(ownsLocal(formatY,x-format.originX,179-format.originY),true);
  for(const x of [268,269,270,271])assert.equal(ownsLocal(formatY2,x-format.originX,179-format.originY),true);
});

test('azahar-12p4-fit is not a unique owner of these edges',()=>{
  assert.equal(ownsFit(transferY,117-transfer.originX,179-transfer.originY),true,'(117,179) is not a live residual');
  assert.equal(ownsLocal(transferY,117-transfer.originX,179-transfer.originY),false);
  assert.equal(ownsFit(updateY,121-update.originX,131-update.originY),true,'(121,131) is not a live residual');
  assert.equal(ownsLocal(updateY,121-update.originX,131-update.originY),false);
  assert.equal(format.originX+formatY2.right,276.47850799560547);
  assert.equal(ownsFit(formatY2,276-format.originX,179-format.originY),true,'(276,179) is not a live residual');
  assert.equal(ownsLocal(formatY2,276-format.originX,179-format.originY),false);
});

test('page 3/4 icon layouts have no unused text pane or unused font',()=>{
  for(const name of ['I_Ocam','I_AnalogPad','I_Trans','I_Lang','I_Update','I_Format']){
    const layout=buttonPack.layouts[name];
    const texts=flatten(layout.roots).filter(item=>item.kind==='txt1');
    assert.deepEqual(texts.map(item=>item.name),['TextBox_00']);
    assert.deepEqual(layout.fonts,['cbf_std.bcfnt']);
    assert.equal(texts[0].text.font,0);
  }
  assert.equal(manifest.sourceSha256,'95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581');
  const ocam=describe('I_Ocam','ocam',0);
  const pad=describe('I_AnalogPad','analog_pad',1);
  assert.equal(ocam.msg.text,'Outer Cameras');
  assert.equal(pad.msg.text,'Circle Pad');
  assert.ok(!ocam.ink.includes('y'));
  assert.ok(!pad.ink.includes('y'));
});

test('page 3/4 button draws do not opt into capture-fitted coverage or LCD sampling',()=>{
  const packs={base:{},up:upPack,layout:layoutPack,button:buttonPack,messages,hud:{}};
  const paint=(page,rows)=>{
    const calls=[];
    const renderer={packs,measureSingleLineText(){return 149.60000610351562;},draw(_ctx,alias,name,options={}){
      calls.push({alias,name,options});
      for(const attachment of Object.values(options.attachments??{}))attachment();
      return true;
    }};
    const view={appId:'system-settings',screen:'other',heading:'Other Settings',rows,
      selection:0,data:{page,selectionActive:false},footer:{left:{action:'back',label:'Back'}}};
    assert.equal(drawNativeSettingsMain(renderer,{}, {},view,false,new Date(2026,8,26,21,45,42)),true);
    return calls;
  };
  const page3=paint(2,[
    {id:'outer-cameras',label:'Outer Cameras'},{id:'circle-pad',label:'Circle Pad'},{id:'transfer',label:'System Transfer'},
  ]);
  const page4=paint(3,[
    {id:'language',label:'Language'},{id:'update',label:'System Update'},{id:'format',label:'Format System Memory'},
  ]);
  const names=new Set(['I_Ocam','I_AnalogPad','I_Trans','I_Lang','I_Update','I_Format']);
  const buttons=[...page3,...page4].filter(call=>names.has(call.name));
  assert.deepEqual(page3.filter(call=>names.has(call.name)).map(call=>call.name),['I_Ocam','I_AnalogPad','I_Trans','I_Lang','I_Update','I_Format']);
  assert.deepEqual(page4.filter(call=>names.has(call.name)).map(call=>call.name),['I_Lang','I_Update','I_Format','I_Ocam','I_AnalogPad','I_Trans']);
  for(const call of buttons){
    assert.equal(call.options.textCoverageAdaptation,undefined,`${call.name} keeps source coverage`);
    assert.equal(call.options.textSampling,undefined,`${call.name} is not LCD-sampled`);
    assert.equal(call.options.pictureSampling,undefined,`${call.name} does not opt into LCD picture sampling`);
  }
  const title=page3.find(call=>call.name==='CommonBG_U_00');
  assert.equal(title.options.textSampling,'lcd');
  assert.equal(title.options.textCoverageAdaptation,'azahar-12p4-fit');
});
