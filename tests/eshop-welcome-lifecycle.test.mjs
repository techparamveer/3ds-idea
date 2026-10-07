import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as timeline from '../src/os/stock-eshop-welcome.ts';
import {createStockModule,initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';
import {stockScreenActionAt} from '../src/os/stock-screen-layout.ts';
import {activeInstance,createAppRuntime,dispatchRuntime,resumeRuntimeApplication,runtimeView,showRuntimeHome,startApplication,tickRuntime} from '../src/os/app-host.ts';
const {eshopWelcomeBindings:bindings,eshopCurtainFrame:curtain,eshopWelcomePass,eshopExitStartPass,eshopExitEndPass,eshopWelcomePose,ESHOP_WELCOME_PASS_HZ,ESHOP_WELCOME_OK_PASS,ESHOP_WELCOME_STEP_LIMIT_MS,ESHOP_WELCOME_BALLOON_PASS,ESHOP_WELCOME_WAIT_PASS,ESHOP_WELCOME_WAIT_FRAMES}=timeline;
const clip=name=>'welcome_U_00_'+name;
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const services=await import(url(compile('stock-native-services').replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))).replace("'./stock-eshop-welcome'",JSON.stringify(url(compile('stock-eshop-welcome')))).replace("'./device-status-profile'",JSON.stringify(url(compile('device-status-profile'))))));
// Mid-pass milliseconds, so pass boundaries never depend on float rounding.
const ms=pass=>(pass+.5)*1000/ESHOP_WELCOME_PASS_HZ;

test('source passes replace in_00, balloonIn_00 and the looping wait_00 on one animator at 30 Hz',()=>{
 assert.equal(ESHOP_WELCOME_PASS_HZ,30,'0x2e4eac sets a two-VSync swap interval');
 assert.deepEqual([ESHOP_WELCOME_BALLOON_PASS,ESHOP_WELCOME_WAIT_PASS,ESHOP_WELCOME_WAIT_FRAMES,ESHOP_WELCOME_OK_PASS],[11,69,75,12]);
 assert.deepEqual([0,33,34,1000].map(eshopWelcomePass),[0,0,1,30]);
 assert.deepEqual(bindings(0),[{name:clip('in_00'),frame:0}]);
 assert.deepEqual(bindings(10),[{name:clip('in_00'),frame:10}]);
 assert.deepEqual(bindings(11),[{name:clip('in_00'),frame:10},{name:clip('balloonIn_00'),frame:1}]);
 assert.deepEqual(bindings(68).at(-1),{name:clip('balloonIn_00'),frame:58});
 assert.deepEqual(bindings(69),[{name:clip('in_00'),frame:10},{name:clip('balloonIn_00'),frame:58},{name:clip('wait_00'),frame:1}]);
 assert.deepEqual([142,143,144].map(pass=>bindings(pass).at(-1).frame),[74,0,1],'wait_00 wraps at 75');
 assert.deepEqual(bindings(undefined),[{name:clip('in_00'),frame:10},{name:clip('balloonIn_00'),frame:58}]);
 assert.deepEqual(bindings(Number.NaN),bindings(undefined));
 const packs=Object.fromEntries(services.eshopScreenPacks.map(p=>[p.alias,p.animations]));
 assert.deepEqual(packs['shop-welcome'],['in_00','balloonIn_00','wait_00','out_00','out_01'].map(clip));
 assert.deepEqual(packs['shop-background'],['BG_U_00_inOut_00','BG_D_00_inOut_00']);
 assert.deepEqual(packs['shop-hud'],['HudMenu_00_NetMode','HudMenu_00_NetAtn','HudMenu_00_Bat']);
 assert.ok(services.eshopScreenPacks.find(p=>p.alias==='shop-background').layouts.includes('info_U_00'));
 const evenHud=new Date(2026,8,24,7,44,0),oddHud=new Date(2026,8,24,7,44,1);
 const eshopHud=[{name:'HudMenu_00_NetMode',frame:0},{name:'HudMenu_00_NetAtn',frame:3},{name:'HudMenu_00_Bat',frame:4}];
 assert.deepEqual(services.eshopHudBindings(oddHud),eshopHud);
 assert.deepEqual(services.eshopHudBindings(evenHud),eshopHud,'eShop Bat ignores HOME seconds');
 assert.deepEqual(services.eshopHudClock(evenHud),{year:2026,month:9,day:24,hour:7,minute:44,colonVisible:true,batteryFrame:4});
 assert.deepEqual(services.eshopHudClock(oddHud),services.eshopHudClock(evenHud));
});

test('the priority-1.0 BG curtain reveals over four passes and covers after out_00',()=>{
 assert.deepEqual([0,1,2,3,4,5,68].map(pass=>curtain(pass)),[0,1,2,3,null,null,null],'frame 4 is N_root_00 alpha 0');
 assert.equal(curtain(undefined),null,'reduced motion draws no curtain');
 // An early decide waits for +0x3b0 to retire at pass 69.
 assert.deepEqual([12,20,68,69,100].map(eshopExitStartPass),[70,70,70,70,101]);
 assert.equal(eshopExitEndPass(20),90);
 const held=bindings(69);
 assert.deepEqual(bindings(69,20),held,'wait_00 plays until 0x2e4058 replaces it');
 assert.deepEqual(bindings(70,20),[...held,{name:clip('out_00'),frame:1}]);
 assert.deepEqual(bindings(84,20),[...held,{name:clip('out_00'),frame:15}]);
 assert.deepEqual(bindings(85,20),[...held,{name:clip('out_00'),frame:15},{name:clip('out_01'),frame:1}]);
 assert.deepEqual([88,89,200].map(pass=>bindings(pass,20).at(-1).frame),[4,4,4]);
 assert.deepEqual([84,85,86,87,88,89].map(pass=>curtain(pass,20)),[null,3,2,1,0,0],'0x286580 reverses from frame 4 in the out_01 pass');
 // A late decide holds the wait_00 pose of its own pass beneath out_00.
 assert.deepEqual(bindings(101,100),[...bindings(100),{name:clip('out_00'),frame:1}]);
 assert.equal(bindings(100).at(-1).frame,32);
});

const module=createStockModule(getTitle('eshop'));
const context={now:0,shared:initialSharedData()};
const reduce=(state,event)=>module.reduce(state,event,context);
function tickTo(state,pass){
 const effects=[];
 for(let left=ms(pass)-state.welcomeElapsed;left>0;left-=ESHOP_WELCOME_STEP_LIMIT_MS){const next=reduce(state,{type:'tick',elapsedMs:Math.min(ESHOP_WELCOME_STEP_LIMIT_MS,left)});state=next.state;effects.push(...(next.effects??[]));}
 return {state,effects};
}
const decided=state=>module.view(state,context).data.welcomeDecidedPass;

test('OK is inert until pass 12, then decides once through A or touch',()=>{
 let state=module.create({},null,context);const view=module.view(state,context);
 assert.deepEqual([view.rows.map(row=>row.id),view.footer.right.action,view.data.welcomePass,'welcomeElapsed' in view.data],[['ok'],'ok',0,false]);
 assert.equal(stockScreenActionAt(view,160,209),'ok','the source OK target keeps its touch geometry');
 state=tickTo(state,11).state;
 for(const event of [{type:'command',command:'open'},{type:'button',command:'open',phase:'down',source:'a'},{type:'touch',phase:'up',x:160,y:209}]){
  const result=reduce(state,event);assert.equal(decided(result.state),undefined);assert.equal(result.effects,undefined);
 }
 state=tickTo(state,12).state;
 const touched=reduce(state,{type:'touch',phase:'up',x:160,y:209});
 assert.deepEqual([decided(touched.state),touched.effects],[12,undefined],'decide does not leave the welcome');
 state=reduce(state,{type:'command',command:'open'}).state;assert.equal(decided(state),12);
 state=tickTo(state,40).state;state=reduce(state,{type:'command',command:'open'}).state;
 assert.equal(decided(state),12,'0x2e3f90 disables OK after one decide');
});

test('the exit returns HOME at the source task end and resets the welcome',()=>{
 let state=tickTo(module.create({},null,context),30).state;
 state=reduce(state,{type:'command',command:'open'}).state;
 let result=tickTo(state,eshopExitEndPass(30)-1);
 assert.deepEqual(result.effects,[],'out_00, out_01 and the BG cover still play');
 assert.deepEqual(eshopWelcomePose(module.view(result.state,context)),{upper:bindings(89,30),curtain:0});
 result=tickTo(result.state,eshopExitEndPass(30));
 assert.deepEqual(result.effects,[{type:'home'}]);
 assert.deepEqual([result.state.welcomeElapsed,decided(result.state)],[0,undefined]);
 assert.equal(reduce(state,{type:'tick',elapsedMs:10_000}).state.welcomeElapsed,state.welcomeElapsed+ESHOP_WELCOME_STEP_LIMIT_MS,'hidden-tab steps are bounded');
 assert.deepEqual(reduce(state,{type:'command',command:'back'}).effects,[{type:'home'}],'B keeps the existing HOME route');
});

test('only the active owner advances; HOME suspension pauses the exit',()=>{
 let runtime=startApplication(createAppRuntime(),'eshop',0),now=0;
 const advance=until=>{while(now<until){now=Math.min(until,now+16);runtime=tickRuntime(runtime,now);}};
 advance(500);const owner=runtime.active;
 runtime=dispatchRuntime(runtime,{type:'command',command:'open'},now);
 assert.equal(runtimeView(runtime).data.welcomeDecidedPass,15);
 runtime=showRuntimeHome(runtime,now);advance(60_000);
 assert.equal(runtime.instances[owner].state.welcomeElapsed,500,'a suspended owner receives no ticks');
 runtime=resumeRuntimeApplication(runtime,now);
 const exitMs=ms(eshopExitEndPass(15))-500;advance(now+exitMs-100);
 assert.equal(runtime.active,owner,'the exit is still playing');
 advance(now+200);
 assert.deepEqual([runtime.active,runtime.homeReturn,runtime.instances[owner].state.welcomeElapsed],[null,owner,0]);
 runtime=resumeRuntimeApplication(runtime,now);
 assert.deepEqual([activeInstance(runtime).id,runtimeView(runtime).data.welcomePass],[owner,0],'a resumed title restarts the welcome');
});

// Presentation: the real pose selects repaints; the painter records the pose it receives.
const calls=[];
globalThis.__eshopLoad=()=>{let resolve;const pending=new Promise(r=>{resolve=r;});calls.push({resolve});return pending;};
const session=url(compile('native-title-session').replace("'./native-title-assets'",JSON.stringify(url('export const loadNativeTitleAssets=(...args)=>globalThis.__eshopLoad(...args)'))));
let source=compile('stock-screen-presentation').replace("'./stock-settings-hud'",JSON.stringify(url(compile('stock-settings-hud').replace("'./device-status-profile.ts'",JSON.stringify(url(compile('device-status-profile'))))))).replace("'./stock-health-scroll'",JSON.stringify(url(compile('stock-health-scroll')))).replace("'./native-title-session'",JSON.stringify(session));
for(const [file,packs,draw]of [['settings','settingsScreenPacks','drawNativeSettingsMain'],['sound','soundScreenPacks','drawNativeSoundFrame'],['camera','cameraScreenPacks','drawNativeCameraFrame'],['health','healthScreenPacks','drawNativeHealthFrame']])source=source.replace(`'./stock-native-${file}'`,JSON.stringify(url(`export const ${packs}=[];export const ${draw}=()=>false;${file==='sound'?'export const soundHudTimeKey=()=>null;':''}`)));
source=source.replace("'./stock-screen-layout'",JSON.stringify(url('export const stockScreenTargets=()=>[];')));
source=source.replace("'./stock-native-personal-tools'",JSON.stringify(url('export const nativePersonalToolView=()=>null;export const drawNativePersonalToolFrame=()=>false;export const notificationsHudClock=()=>null;export const notesHudClock=()=>null;')));
source=source.replace("'./stock-native-web'",JSON.stringify(url('export const browserScreenPacks=[],miiverseScreenPacks=[];export const drawNativeWebFrame=()=>false;export const browserHudClock=()=>null;')));
source=source.replace("'./stock-native-helpers'",JSON.stringify(url('export const nativeHelperView=()=>null;export const drawNativeHelperFrame=()=>false;')));
source=source.replace("'./stock-native-selectors'",JSON.stringify(url('export const nativeSelectorView=()=>null;export const drawNativeSelectorFrame=()=>false;')));
source=source.replace("'./native-screen-input'",JSON.stringify(url(compile('native-screen-input'))));
source=source.replace("'./notes-boot-cover'",JSON.stringify(new URL('../src/os/notes-boot-cover.ts',import.meta.url).href));
globalThis.__eshopReal=services;
source=source.replace("'./stock-native-services'",JSON.stringify(url('const r=globalThis.__eshopReal;export const nativeServiceView=r.nativeServiceView,eshopWelcomePose=r.eshopWelcomePose,eshopHudClock=r.eshopHudClock,zoneClock=r.zoneClock;export const drawNativeServiceFrame=(renderer,top,bottom,view,options)=>{globalThis.__eshopPaints.push(r.eshopWelcomePose(view,options.reducedMotion));return true;};')));
const {createStockScreenPresentation}=await import(url(source));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const eshop=(welcomePass,welcomeDecidedPass)=>({appId:'eshop',screen:'main',heading:'Nintendo eShop',rows:[{id:'ok',label:'OK'}],selection:0,footer:{},data:{welcomePass,...(welcomeDecidedPass===undefined?{}:{welcomeDecidedPass})}});
function fixture(options={}){
 const old=globalThis.document,context=canvas=>({canvas,resetTransform(){},clearRect(){},fillRect(){},strokeRect(){},fillText(){},drawImage(){}});
 globalThis.document={createElement:()=>{const canvas={width:0,height:0};canvas.getContext=()=>context(canvas);return canvas;}};
 globalThis.__eshopPaints=[];calls.length=0;
 const screen=createStockScreenPresentation(options),top=context({}),bottom=context({}),font={};
 const draw=(pass,decidedPass,owner='eshop:1',date=new Date(0))=>screen.draw(top,bottom,eshop(pass,decidedPass),owner,font,undefined,date,0);
 return {draw,paints:globalThis.__eshopPaints,async ready(){draw(0);await flush();calls.at(-1).resolve({renderer:{},diagnostics:[],dispose(){}});await flush();},dispose(){screen.dispose();globalThis.document=old;}};
}

test('the stock pair repaints once per changed source pose',async()=>{
 const f=fixture();
 try{
  await f.ready();
  assert.equal(f.draw(0),true);f.draw(0);assert.deepEqual(f.paints.map(p=>p.curtain),[0]);
  f.draw(3);f.draw(4);assert.deepEqual(f.paints.map(p=>p.curtain),[0,3,null]);
  const count=f.paints.length;f.draw(88,20);f.draw(89,20);f.draw(89,20);
  assert.equal(f.paints.length,count+1,'the covered end pose does not repaint');
 }finally{f.dispose();}
});

test('eShop pair cache ignores wall-clock seconds on Bat',async()=>{
 const f=fixture(),odd=new Date(2026,8,24,7,44,1),even=new Date(2026,8,24,7,44,0);
 try{
  await f.ready();
  f.draw(4,undefined,'eshop:1',odd);
  const count=f.paints.length;
  f.draw(4,undefined,'eshop:1',even);
  assert.equal(f.paints.length,count,'frozen ctor Bat 4 does not republish on seconds');
 }finally{f.dispose();}
});

test('reduced motion holds the settled pose without a curtain',async()=>{
 let reduced=true;const f=fixture({reducedMotion:()=>reduced});
 try{
  await f.ready();f.draw(0);f.draw(3);f.draw(80,20);
  assert.deepEqual(f.paints,[{upper:bindings(undefined),curtain:null}]);
  reduced=false;f.draw(80,20);assert.deepEqual(f.paints.at(-1),{upper:bindings(80,20),curtain:null});
 }finally{f.dispose();}
});
