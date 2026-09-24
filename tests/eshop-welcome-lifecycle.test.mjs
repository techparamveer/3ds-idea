import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const services=compile('stock-native-services').replace("'./native-layout'",JSON.stringify(url(compile('native-layout'))));
const real=await import(url(services));
const {eshopWelcomeBindings:bindings,eshopWelcomePass,eshopScreenPacks,ESHOP_WELCOME_BALLOON_PASS,ESHOP_WELCOME_WAIT_PASS,ESHOP_WELCOME_WAIT_FRAMES}=real;
const clip=name=>'welcome_U_00_'+name;

test('source passes replace in_00, balloonIn_00 and the looping wait_00 on one animator',()=>{
 assert.deepEqual([ESHOP_WELCOME_BALLOON_PASS,ESHOP_WELCOME_WAIT_PASS,ESHOP_WELCOME_WAIT_FRAMES],[11,69,75]);
 assert.deepEqual(bindings(0),[{name:clip('in_00'),frame:0}]);
 assert.deepEqual(bindings(10),[{name:clip('in_00'),frame:10}]);
 // 0x2e4280 starts balloonIn on the pass after in_00 clears +0x38; the same pass ticks it.
 assert.deepEqual(bindings(11),[{name:clip('in_00'),frame:10},{name:clip('balloonIn_00'),frame:1}]);
 assert.deepEqual(bindings(68).at(-1),{name:clip('balloonIn_00'),frame:58});
 assert.deepEqual(bindings(69),[{name:clip('in_00'),frame:10},{name:clip('balloonIn_00'),frame:58},{name:clip('wait_00'),frame:1}]);
 assert.deepEqual([142,143,144].map(pass=>bindings(pass).at(-1).frame),[74,0,1],'wait_00 wraps at 75, never sampling its later keys');
 assert.deepEqual(bindings(undefined),[{name:clip('in_00'),frame:10},{name:clip('balloonIn_00'),frame:58}]);
 assert.deepEqual(bindings(Number.NaN),bindings(undefined));
 assert.deepEqual([0,16,17,1000].map(eshopWelcomePass),[0,0,1,60]);
 assert.deepEqual(eshopScreenPacks.find(p=>p.alias==='shop-welcome').animations,[clip('in_00'),clip('balloonIn_00'),clip('wait_00')]);
});

const calls=[];
globalThis.__eshopLoad=()=>{let resolve;const pending=new Promise(r=>{resolve=r;});calls.push({resolve});return pending;};
const session=url(compile('native-title-session').replace("'./native-title-assets'",JSON.stringify(url('export const loadNativeTitleAssets=(...args)=>globalThis.__eshopLoad(...args)'))));
let source=compile('stock-screen-presentation').replace("'./native-title-session'",JSON.stringify(session));
for(const [file,packs,draw]of [['settings','settingsScreenPacks','drawNativeSettingsMain'],['sound','soundScreenPacks','drawNativeSoundFrame'],['camera','cameraScreenPacks','drawNativeCameraFrame'],['health','healthScreenPacks','drawNativeHealthFrame']])source=source.replace(`'./stock-native-${file}'`,JSON.stringify(url(`export const ${packs}=[];export const ${draw}=()=>false;`)));
source=source.replace("'./stock-screen-layout'",JSON.stringify(url('export const stockScreenTargets=()=>[];')));
source=source.replace("'./stock-native-personal-tools'",JSON.stringify(url('export const nativePersonalToolView=()=>null;export const drawNativePersonalToolFrame=()=>false;')));
source=source.replace("'./stock-native-web'",JSON.stringify(url('export const browserScreenPacks=[],miiverseScreenPacks=[];export const drawNativeWebFrame=()=>false;')));
source=source.replace("'./stock-native-helpers'",JSON.stringify(url('export const nativeHelperView=()=>null;export const drawNativeHelperFrame=()=>false;')));
source=source.replace("'./stock-native-selectors'",JSON.stringify(url('export const nativeSelectorView=()=>null;export const drawNativeSelectorFrame=()=>false;')));
source=source.replace("'./native-screen-input'",JSON.stringify(url(compile('native-screen-input'))));
// Real pass mapping and view identity; the painter records the clock it receives.
globalThis.__eshopReal=real;
source=source.replace("'./stock-native-services'",JSON.stringify(url('const r=globalThis.__eshopReal;export const nativeServiceView=r.nativeServiceView,eshopWelcomeBindings=r.eshopWelcomeBindings,eshopWelcomePass=r.eshopWelcomePass,zoneClock=r.zoneClock;export const drawNativeServiceFrame=(renderer,top,bottom,view,options)=>{globalThis.__eshopPaints.push(options.eshopWelcomeMs);return true;};')));
const {createStockScreenPresentation,ESHOP_WELCOME_STEP_LIMIT_MS}=await import(url(source));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const eshop=screen=>({appId:'eshop',screen,heading:'Nintendo eShop',rows:[{id:'back',label:'OK'}],selection:0,footer:{}});

function fixture(options={}){
 const old=globalThis.document,context=canvas=>({canvas,resetTransform(){},clearRect(){},fillRect(){},strokeRect(){},fillText(){},drawImage(){}});
 globalThis.document={createElement:()=>{const canvas={width:0,height:0};canvas.getContext=()=>context(canvas);return canvas;}};
 globalThis.__eshopPaints=[];calls.length=0;
 const screen=createStockScreenPresentation(options),top=context({}),bottom=context({}),font={};
 const draw=(time,owner='eshop:1',screenName='main')=>screen.draw(top,bottom,eshop(screenName),owner,font,undefined,new Date(0),time);
 return {screen,draw,paints:globalThis.__eshopPaints,async ready(owner='eshop:1'){draw(0,owner);await flush();calls.at(-1).resolve({renderer:{},diagnostics:[],dispose(){}});await flush();},dispose(){screen.dispose();globalThis.document=old;}};
}

test('the welcome clock starts at the first published pair and repaints once per source pass',async()=>{
 const f=fixture();
 try{
  await f.ready();assert.deepEqual(f.paints,[]);
  assert.equal(f.draw(5000),true);assert.deepEqual(f.paints,[0],'loading time is not credited');
  f.draw(5010);assert.deepEqual(f.paints,[0],'the same pass republishes without repainting');
  f.draw(5017);f.draw(5100);assert.deepEqual(f.paints,[0,17,100]);
  f.draw(5100,'eshop:1','detail');assert.deepEqual(f.paints.at(-1),100,'OK/Close labels share the welcome controller');
  f.draw(9000);assert.equal(f.paints.at(-1),100+ESHOP_WELCOME_STEP_LIMIT_MS,'hidden-tab gaps are bounded');
 }finally{f.dispose();}
});

test('HOME suspension pauses the owner clock; a new eShop owner restarts in_00',async()=>{
 const f=fixture();
 try{
  await f.ready();f.draw(0);f.draw(200);assert.equal(f.paints.at(-1),200);
  f.screen.sync(null);f.screen.sync('eshop:1');f.draw(60_000);await flush();
  calls.at(-1).resolve({renderer:{},diagnostics:[],dispose(){}});await flush();
  f.draw(61_000);f.draw(61_050);assert.deepEqual(f.paints.slice(-2),[200,250],'the resumed controller continues');
  await f.ready('eshop:2');f.draw(70_000,'eshop:2');assert.equal(f.paints.at(-1),0);
 }finally{f.dispose();}
});

test('reduced motion holds the settled pose without advancing the clock',async()=>{
 let reduced=true;const f=fixture({reducedMotion:()=>reduced});
 try{
  await f.ready();f.draw(0);f.draw(3000);assert.deepEqual(f.paints,[undefined]);
  reduced=false;f.draw(3100);f.draw(3150);assert.deepEqual(f.paints,[undefined,0,50]);
 }finally{f.dispose();}
});
