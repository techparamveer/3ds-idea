import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const fontSource=readFileSync(new URL('../src/os/bitmap-font.ts',import.meta.url),'utf8');
const fontCompiled=ts.transpileModule(fontSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {nativeCenteredGlyphQuads,rasterNativeAlphaGlyph}=await import(`data:text/javascript;base64,${Buffer.from(fontCompiled).toString('base64')}`);

const settingsUrl=new URL('../src/os/stock-native-settings.ts',import.meta.url);
const settingsCompiled=ts.transpileModule(readFileSync(settingsUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replace("'./stock-settings-navigation'",JSON.stringify(new URL('../src/os/stock-settings-navigation.ts',import.meta.url).href))
  .replace("'./native-layout'",JSON.stringify(new URL('../src/os/native-layout.ts',import.meta.url).href))
  .replace("'./device-status-profile.ts'",JSON.stringify(new URL('../src/os/device-status-profile.ts',import.meta.url).href));
const {drawNativeSettingsMain}=await import('data:text/javascript;base64,'+Buffer.from(settingsCompiled).toString('base64'));

const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('fonts/shared/font.json',firmware),'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/settings/contents/0000-0000003d/message_EU.json',firmware),'utf8'));
const layoutPack=JSON.parse(readFileSync(new URL('packs/settings/contents/0000-0000003d/layout.json',firmware),'utf8'));
const buttonPack=JSON.parse(readFileSync(new URL('packs/settings/contents/0000-0000003d/button.json',firmware),'utf8'));
const bank=messages.messages.mset;
const mset=label=>bank.messages[bank.labels[label]];
const styleOf=message=>messages.styles[bank.styleTable].styles[message.styleIndex];
const flatten=panes=>panes.flatMap(pane=>[pane,...flatten(pane.children??[])]);
const pane=(layout,name)=>flatten(layout.roots).find(item=>item.name===name);
const ownsLocal=(quad,localX)=>{
  const first=Math.floor(quad.x-.5)+1;
  const lastExclusive=Math.floor(quad.right-.5)+1;
  return localX>=first&&localX<lastExclusive;
};
const ownsFit=(quad,localX)=>{
  const edge=value=>Math.round(value*16)/16;
  const first=Math.floor(edge(quad.x)-.5)+1;
  const lastExclusive=Math.floor(edge(quad.right)-.5)+1;
  return localX>=first&&localX<lastExclusive;
};
const opaqueMask=glyph=>({width:glyph.width+2,height:glyph.height+2,data:new Uint8ClampedArray((glyph.width+2)*(glyph.height+2)*4).fill(255)});
const columnInk=(image,width,height,x)=>{
  let rows=0;
  for(let y=0;y<height;y++)if(image.data[(y*width+x)*4+3])rows++;
  return rows;
};

const other=mset('top_settings');
const otherStyle=styleOf(other);
const otherPane=pane(buttonPack.layouts.I_TopRBs,'TextBox_00');
const otherSize=[(manifest.width??manifest.height)*otherStyle.fontScale[0],manifest.height*otherStyle.fontScale[1]];
const otherQuads=nativeCenteredGlyphQuads(manifest,other.text,otherPane.size[0],otherPane.size[1],otherSize);
const otherInk=[...other.text].filter(char=>(manifest.glyphs[String(char.codePointAt(0))]??manifest.fallback)?.width);
const otherOriginX=160+74-otherPane.size[0]/2;
const secondT=otherQuads[otherInk.map((char,index)=>char==='t'?index:null).filter(index=>index!==null)[2]];
const nQuad=otherQuads[otherInk.indexOf('n')];
const sQuad=otherQuads.at(-1);

test('S-01 Other Settings t/n/s writer-local rights still exclude the live residual columns',()=>{
  assert.equal(other.text,'Other Settings');
  assert.equal(other.text.includes('\n'),false);
  assert.equal(otherStyle.fontScale[0],0.699999988079071);
  assert.equal(otherPane.size[0],134);
  assert.equal(otherOriginX,167);
  assert.equal(secondT.right,92.49999618530273);
  assert.equal(nQuad.right,106.49999237060547);
  assert.equal(sQuad.right,127.49999237060547);
  assert.equal(otherOriginX+secondT.right,259.49999618530273);
  assert.equal(otherOriginX+nQuad.right,273.49999237060547);
  assert.equal(otherOriginX+sQuad.right,294.49999237060547);
  for(const [quad,screenX] of [[secondT,259],[nQuad,273],[sQuad,294]]){
    const local=screenX-otherOriginX;
    assert.equal(ownsLocal(quad,local),false,`${screenX} stays outside writer-local coverage`);
    assert.equal(ownsFit(quad,local),true,'the rejected 1/16 capture-fit would include this still');
    const writer={width:134,height:42,data:new Uint8ClampedArray(134*42*4)};
    const fitted={width:134,height:42,data:new Uint8ClampedArray(134*42*4)};
    rasterNativeAlphaGlyph(writer,opaqueMask(quad.glyph),quad);
    rasterNativeAlphaGlyph(fitted,opaqueMask(quad.glyph),quad,'top','azahar-12p4-fit');
    assert.equal(columnInk(writer,134,42,local),0);
    assert.ok(columnInk(fitted,134,42,local)>0);
  }
});

test('a blanket endpoint snap is not uniquely determined by this still',()=>{
  const firstSettingsT=otherQuads[otherInk.map((char,index)=>char==='t'?index:null).filter(index=>index!==null)[1]];
  assert.equal(otherOriginX+firstSettingsT.right,253.1999969482422);
  assert.equal(ownsLocal(firstSettingsT,253-otherOriginX),false);
  assert.equal(ownsFit(firstSettingsT,253-otherOriginX),false);
});

test('main Settings draw does not opt into capture-fitted coverage or LCD text sampling',()=>{
  const calls=[];
  const packs={base:{},up:{},layout:{},button:buttonPack,messages,hud:{}};
  const renderer={packs,draw(_ctx,alias,name,options={}){
    calls.push({alias,name,options});
    for(const attachment of Object.values(options.attachments??{}))attachment();
    return true;
  }};
  const view={appId:'system-settings',screen:'main',heading:'System Settings',
    rows:['internet','parental','data','other','nnid'].map(id=>({id,label:id})),selection:0,
    footer:{left:{action:'back',label:'Back'}}};
  assert.equal(drawNativeSettingsMain(renderer,{}, {},view,false,new Date(2026,8,27,3,0)),true);
  const lower=calls.filter(call=>['Top_D_02','I_TopLTs','I_TopRTs','I_TopLBs','I_TopRBs','I_TopTs','TopBase_D_00'].includes(call.name));
  assert.equal(lower.length,7);
  for(const call of lower){
    assert.equal(call.options.textCoverageAdaptation,undefined,`${call.name} keeps source coverage`);
    assert.equal(call.options.textSampling,undefined,`${call.name} is not LCD-sampled`);
    assert.equal(call.options.pictureSampling,undefined,`${call.name} does not opt into LCD picture sampling`);
  }
  const parent=calls.find(call=>call.name==='Top_D_02');
  assert.deepEqual(parent.options.bindings,[{name:'Top_D_02_SceneIn_00',frame:35}]);
});

test('Internet chrome residuals sit on I_TopLTs left edge, not the globe or Parental',()=>{
  const mount=pane(layoutPack.layouts.Top_D_02,'N_I_TopLTs_00');
  assert.deepEqual(mount.translation,[-74,43,0]);
  assert.deepEqual(mount.size,[128,78]);
  const centerX=160+mount.translation[0];
  const centerY=120-mount.translation[1];
  const left=centerX-mount.size[0]/2;
  const top=centerY-mount.size[1]/2;
  const bottom=centerY+mount.size[1]/2;
  assert.equal(left,22);
  assert.equal(top,38);
  assert.equal(bottom,116);
  const chrome=[[20,45],[18,105],[22,110]];
  for(const [x,y] of chrome){
    assert.ok(x>=left-4&&x<=left,'x is the Internet button left fringe');
    assert.ok(y>=top-1&&y<=bottom,'y stays in the Internet button band');
    assert.ok(x<centerX-40,'not the globe icon around the button centre');
    assert.ok(x<160,'not Parental Controls');
  }
  assert.ok(mset('top_internet').text.includes('\n'));
  assert.ok(mset('top_parental').text.includes('\n'));
  assert.ok(mset('top_software').text.includes('\n'));
  assert.equal(mset('top_software').text,'Data\nManagement');
});
