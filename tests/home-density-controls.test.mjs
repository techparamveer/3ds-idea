import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {getHomeDensityControls} from '../src/os/home-density-controls.ts';
import {getHomeNavigationView,setHomeDensity,settleHomeNavigation,enterHomeFolder,advanceHomeNavigation} from '../src/os/home-navigation.ts';
import {createPortfolioState,tickSystem,dispatchSystemEvent,reduceSystem,saveSettings,restoreSettings} from '../src/os/system.ts';
import {reduceMenu,touchMenu,menuTiles} from '../src/os/state.ts';
import {poseNativeLayout} from '../src/os/native-layout.ts';
import {HOME_DENSITY_TOUCH_GEOMETRY,homeDensityActionAt} from '../src/os/stock-screen-layout.ts';
import {ownedHomeDensityContact} from '../src/os/home-gestures.ts';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const url=new URL('../src/os/firmware-presentation.ts',import.meta.url);
const js=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createFirmwareHome}=await import(moduleUrl(js.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>
 prefix+(path==='./native-renderer'?moduleUrl('export class NativeLayoutRenderer {}'):new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href)+suffix)));
const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json',import.meta.url)));
const state=(folder,density)=>{
 let s=tickSystem(createPortfolioState(),4000);
 if(folder)s=enterHomeFolder({...s,folders:{...s.folders,42:'Folder'}},42);
 return settleHomeNavigation(setHomeDensity(s,density));
};
const touch=(s,phase,x,y=16)=>dispatchSystemEvent(s,{type:'touch',phase,x,y,pointerId:1},4000);
const cases=[[false,0,false,true],[false,1,true,true],[false,5,true,false],
 [true,0,false,true],[true,1,false,true],[true,2,true,true],[true,5,true,false]];
const snapshot=s=>({selected:s.selected,folderSelected:s.folderSelected,homeView:JSON.parse(saveSettings(s)).homeView,
 motion:s.system.homeNavigation.motion,revision:s.system.homeNavigation.selectionRevision,layout:s.system.layout,folderLayouts:s.system.folderLayouts});
function flatten(layout){const result={};const visit=panes=>panes.forEach(p=>{result[p.name]=p;visit(p.children);});visit(layout.roots);return result;}
function presenter(){
 const draws=[],renderer={packs:{launcher:pack},draw(_ctx,bank,name,options){
  draws.push({bank,name,options,pose:poseNativeLayout(pack.layouts[name],pack.animations,options.bindings,options.overrides)});return true;
 }};
 return {home:createFirmwareHome({renderer}),draws};
}

test('density availability uses active context and pending target while preserving state and folder0',()=>{
 for(const [folder,density,decreaseEnabled,increaseEnabled]of cases){
  const s=state(folder,density),before=JSON.stringify(s);
  assert.deepEqual(getHomeDensityControls(s),{decreaseEnabled,increaseEnabled});
  assert.equal(JSON.stringify(s),before);
 }
 for(const [folder,from,to]of [[false,1,0],[false,0,1],[false,4,5],[false,5,4],[true,2,1],[true,1,2],[true,4,5],[true,5,4]]){
  const s=advanceHomeNavigation(setHomeDensity(state(folder,from),to),7),view=getHomeNavigationView(s);
  assert.equal(view.currentDensity,from);assert.equal(view.targetDensity,to);
  assert.ok(view.density>Math.min(from,to)&&view.density<Math.max(from,to));
  assert.deepEqual(getHomeDensityControls(s),{decreaseEnabled:to>(folder?1:0),increaseEnabled:to<5});
 }
});

test('real toolbar resources bind Invalid only to disabled groups and retain the full source base and other panes',()=>{
 const {home,draws}=presenter(),before=JSON.stringify(pack);
 for(const [folder,density,down,up]of cases){
  const s=state(folder,density);assert.equal(home.toolbar({},s),true);
  const draw=draws.at(-1),panes=flatten(draw.pose),groups=[...(!down?['G_Dw_00']:[]),...(!up?['G_Up_00']:[])];
  assert.deepEqual(draw.options.bindings,[{name:'LncBase_D_01_PaletteOut',frame:12},{name:'LncBase_D_01_MvsToggle',frame:0},
   ...(groups.length?[{name:'LncBase_D_01_Invalid',frame:0,groups}]:[])]);
  assert.deepEqual(draw.options.clip,[0,0,320,240]);
  assert.equal(panes.P_Dw_20.alpha,down?255:120);assert.equal(panes.P_Up_20.alpha,up?255:120);
  assert.equal(panes.P_DwP_20.flags&1,0);assert.equal(panes.P_UpP_20.flags&1,0);
  const baseline=flatten(poseNativeLayout(pack.layouts.LncBase_D_01,pack.animations,draw.options.bindings.slice(0,2)));
  for(const [name,pane]of Object.entries(panes))if(!pane.children.length&&!['P_Dw_20','P_Up_20'].includes(name))assert.deepEqual(pane,baseline[name],name);
 }
 assert.equal(JSON.stringify(pack),before);
});

test('decoded lower base owns the striped footer backing rather than a host palette fill',()=>{
 const layout=pack.layouts.LncBase_D_01,panes=flatten(layout),pane=panes.P_BgBtm_00;
 assert.deepEqual(layout.canvas,{height:240,origin:1,width:320});
 assert.deepEqual(pane.size,[320,32]);assert.deepEqual(pane.translation.map(value=>value||0),[0,-120,0]);
 assert.deepEqual(pane.picture.uvSets[0],[0,0,1,0,0,4,1,4]);
 assert.deepEqual(pane.picture.uvSets[1],[0,1,2,1,0,.0625,2,.0625]);
 const material=layout.materials[pane.picture.material];
 assert.equal(material.name,'P_BgBtm_00');assert.deepEqual(material.textureMaps.map(map=>layout.textures[map.texture]),['BgLine.bclim','BgLgt.bclim']);
 assert.deepEqual(material.unsupported,[]);
 assert.equal(pack.textures['BgLine.bclim'].sourceSha256,'5c1ff31e996b2367dd8ed15973e4fa9e1863c2d08927eda513c0a97e00699836');
 assert.equal(pack.textures['BgLgt.bclim'].sourceSha256,'c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b');
});

test('disabled density presses omit Select while enabled presses and other toolbar groups remain isolated',()=>{
 const {home,draws}=presenter();
 for(const [folder,density,down,up]of cases)for(const [x,group,enabled,picture,press]of [
  [282,'G_Dw_00',down,'P_Dw_20','P_DwP_20'],[307,'G_Up_00',up,'P_Up_20','P_UpP_20'],
 ]){
  const initial=state(folder,density),pressed=touch(initial,'down',x);
  home.toolbar({},pressed);const draw=draws.at(-1),panes=flatten(draw.pose);
  const select=draw.options.bindings.filter(b=>b.name==='LncBase_D_01_Select');
  assert.deepEqual(select,enabled?[{name:'LncBase_D_01_Select',frame:1,groups:[group]}]:[]);
  assert.equal(panes[picture].alpha,enabled?255:120);assert.equal(panes[press].flags&1,enabled?1:0);
  const other=group==='G_Dw_00'?'P_UpP_20':'P_DwP_20';assert.equal(panes[other].flags&1,0);
 }
 const memo=touch(state(true,1),'down',76);home.toolbar({},memo);
 const draw=draws.at(-1),panes=flatten(draw.pose);
 assert.deepEqual(draw.options.bindings.at(-1),{name:'LncBase_D_01_Select',frame:1,groups:['G_Memo_00']});
 assert.equal(panes.P_Memo_10.translation[1],-2);assert.equal(panes.P_Dw_20.alpha,120);assert.equal(panes.P_DwP_20.flags&1,0);
 for(const [folder,from,to,x,enabled]of [[false,1,0,282,false],[false,0,1,282,true],
  [false,4,5,307,false],[false,5,4,307,true],[true,2,1,282,false],[true,1,2,282,true]]){
  const pending=advanceHomeNavigation(setHomeDensity(state(folder,from),to),7);
  home.toolbar({},touch(pending,'down',x));const draw=draws.at(-1),p=flatten(draw.pose);
  assert.equal(p[x===282?'P_Dw_20':'P_Up_20'].alpha,enabled?255:120);
  assert.equal(draw.options.bindings.some(b=>b.name==='LncBase_D_01_Select'),enabled);
 }
});

test('shared density geometry assigns the x293 boundary to increase',()=>{
 assert.deepEqual(HOME_DENSITY_TOUCH_GEOMETRY,{x:266,y:0,width:54,height:32,splitX:293});
 for(const [x,action]of [[292.999,'decrease'],[293,'increase'],[293.001,'increase']]){
  assert.equal(homeDensityActionAt(x,16.5),action);
 }
 for(const [x,y]of [[265.999,16.5],[320,16.5],[293,-.001],[293,32],[NaN,16.5],[293,Infinity]]){
  assert.equal(homeDensityActionAt(x,y),null);
 }
 assert.equal(homeDensityActionAt(266,0),'decrease');
 assert.equal(homeDensityActionAt(319.999,31.999),'increase');
});

test('density press and release retain one owner below, at and above x293',()=>{
 const {home,draws}=presenter();
 for(const [x,group,delta]of [[292.999,'G_Dw_00',-1],[293,'G_Up_00',1],[293.001,'G_Up_00',1]]){
  const initial=state(false,2),pressed=touch(initial,'down',x,16.5);
  home.toolbar({},pressed);
  assert.deepEqual(draws.at(-1).options.bindings.at(-1),{name:'LncBase_D_01_Select',frame:1,groups:[group]});
  const released=touch(pressed,'up',x,16.5),view=getHomeNavigationView(released);
  assert.equal(view.currentDensity,2);assert.equal(view.targetDensity,2+delta);
 }
});

test('density-origin contact restores the same held owner after leaving downward and releases once',()=>{
 const {home,draws}=presenter();let live=touch(state(false,2),'down',280,12);
 const gesture=()=>live.system.homeNavigation.gesture;
 const select=()=>draws.at(-1).options.bindings.filter(binding=>binding.name==='LncBase_D_01_Select');
 assert.equal(gesture().area,'density');assert.equal(gesture().mode,'press');
 assert.equal(ownedHomeDensityContact(live,gesture()),'decrease');
 home.toolbar({},live);assert.deepEqual(select(),[{name:'LncBase_D_01_Select',frame:1,groups:['G_Dw_00']}]);

 live=touch(live,'move',280,60);assert.equal(gesture().mode,'press');
 assert.equal(ownedHomeDensityContact(live,gesture()),null);
 home.toolbar({},live);assert.deepEqual(select(),[]);

 live=touch(live,'move',280,12);assert.equal(gesture().mode,'press');
 assert.equal(ownedHomeDensityContact(live,gesture()),'decrease');
 home.toolbar({},live);assert.deepEqual(select(),[{name:'LncBase_D_01_Select',frame:1,groups:['G_Dw_00']}]);

 live=touch(live,'up',280,12);const view=getHomeNavigationView(live);
 assert.equal(live.system.homeNavigation.gesture,null);
 assert.equal(view.currentDensity,2);assert.equal(view.targetDensity,1);
});

test('density-origin contact cannot transfer to the other density half, toolbar, footer, grid or outside',()=>{
 for(const [x,y]of [[307,12],[76,16],[160,226],[160,100],[280,60],[-1,12]]){
  const initial=state(false,2),before=snapshot(initial);let live=touch(initial,'down',280,12);
  live=touch(live,'move',x,y);assert.equal(live.system.homeNavigation.gesture.mode,'press');
  assert.equal(ownedHomeDensityContact(live,live.system.homeNavigation.gesture),null);
  live=touch(live,'up',x,y);assert.deepEqual(snapshot(live),before);
  assert.equal(live.panel,null);assert.equal(live.system.homeNavigation.gesture,null);
 }
 let cancelled=touch(state(false,2),'down',280,12);
 cancelled=touch(cancelled,'move',280,60);cancelled=touch(cancelled,'move',280,12);
 cancelled=touch(cancelled,'cancel',280,12);assert.equal(cancelled.system.homeNavigation.gesture,null);
 const stale=touch(cancelled,'up',280,12);assert.equal(stale,cancelled);
});

test('disabled density origins can leave and re-enter but never recover Select or activate',()=>{
 const {home,draws}=presenter();
 for(const [density,x]of [[0,280],[5,307]]){
  const initial=state(false,density),before=snapshot(initial);let live=touch(initial,'down',x,12);
  assert.equal(live.system.homeNavigation.gesture.area,'density');
  live=touch(live,'move',x,60);live=touch(live,'move',x,12);
  assert.equal(ownedHomeDensityContact(live,live.system.homeNavigation.gesture),null);
  home.toolbar({},live);
  assert.ok(!draws.at(-1).options.bindings.some(binding=>binding.name==='LncBase_D_01_Select'));
  live=touch(live,'up',x,12);assert.deepEqual(snapshot(live),before);
 }
});

test('density ownership cannot be acquired after disabled origin or survive density and HOME lifecycle replacement',()=>{
 let disabled=touch(state(false,0),'down',280,12);
 const disabledContact=disabled.system.homeNavigation.gesture;
 assert.equal(disabledContact.area,'density');
 disabled=reduceSystem(disabled,'zoom-out',4001);
 assert.equal(disabled.system.homeNavigation.gesture,null);
 assert.equal(getHomeNavigationView(disabled).targetDensity,1);
 assert.equal(getHomeDensityControls(disabled).decreaseEnabled,true);
 assert.equal(ownedHomeDensityContact(disabled,disabledContact),null);

 let changed=touch(state(false,2),'down',280,12);
 const changedContact=changed.system.homeNavigation.gesture;
 changed=reduceSystem(changed,'zoom-in',4001);
 assert.equal(changed.system.homeNavigation.gesture,null);
 assert.equal(getHomeNavigationView(changed).targetDensity,1);
 assert.equal(ownedHomeDensityContact(changed,changedContact),null);

 const panel=reduceSystem(touch(state(false,2),'down',280,12),'settings',4001);
 assert.equal(panel.panel,'settings');assert.equal(panel.system.homeNavigation.gesture,null);

 let folder=touch({...state(false,2),folders:{42:'Folder'}},'down',280,12);
 folder=enterHomeFolder(folder,42);
 assert.equal(folder.system.homeNavigation.gesture.area,'density');
 assert.equal(ownedHomeDensityContact(folder,folder.system.homeNavigation.gesture),null);
});

test('shared density boundary preserves disabled and enabled owners at both ends',()=>{
 const {home,draws}=presenter();
 for(const [density,x,group,enabled,target]of [
  [0,292.999,'G_Dw_00',false,0],[0,293,'G_Up_00',true,1],
  [5,292.999,'G_Dw_00',true,4],[5,293,'G_Up_00',false,5],
 ]){
  const initial=state(false,density),pressed=touch(initial,'down',x,16.5);
  home.toolbar({},pressed);
  const select=draws.at(-1).options.bindings.filter(binding=>binding.name==='LncBase_D_01_Select');
  assert.deepEqual(select,enabled?[{name:'LncBase_D_01_Select',frame:1,groups:[group]}]:[]);
  const released=touch(pressed,'up',x,16.5),view=getHomeNavigationView(released);
  assert.equal(view.currentDensity,density);assert.equal(view.targetDensity,target);
 }
});

test('disabled taps preserve records/motion and enabled System down/up retains the existing density transition',()=>{
 for(const [folder,density,down,up]of cases)for(const [x,enabled,delta]of [[282,down,-1],[307,up,1]]){
  const initial=state(folder,density),before=snapshot(initial);
  if(!enabled)assert.equal(touchMenu(initial,x,16),initial);
  const pressed=touch(initial,'down',x);assert.deepEqual(snapshot(pressed),before);
  const released=touch(pressed,'up',x);assert.equal(released.system.homeNavigation.gesture,null);
  if(!enabled)assert.deepEqual(snapshot(released),before);
  else{
   const view=getHomeNavigationView(released);assert.equal(view.currentDensity,density);assert.equal(view.targetDensity,density+delta);
   assert.equal(view.mode,5);assert.equal(released.system.homeNavigation.motion.durationUpdates,15);
  }
 }
 for(const [folder,from,to,x]of [[false,1,0,282],[false,4,5,307],[true,2,1,282],[true,4,5,307]]){
  const pending=advanceHomeNavigation(setHomeDensity(state(folder,from),to),7),before=snapshot(pending);
  assert.equal(touchMenu(pending,x,16),pending);assert.deepEqual(snapshot(pending),before);
  assert.deepEqual(snapshot(touch(touch(pending,'down',x),'up',x)),before);
 }
});

test('restored folder0 keeps geometry and compatibility setters/commands can still reach it',()=>{
 const original=state(true,0),saved=saveSettings(original),restored=restoreSettings(state(false,2),saved);
 assert.equal(getHomeNavigationView(restored).context,42);assert.equal(getHomeNavigationView(restored).targetDensity,0);
 assert.deepEqual(menuTiles(restored),menuTiles(original));
 const view=getHomeNavigationView(restored);assert.equal(view.rows,1);assert.equal(view.baseY,161);assert.equal(view.size,72);
 assert.equal(touchMenu(restored,282,16),restored);
 assert.equal(getHomeNavigationView(reduceMenu(state(true,1),'zoom-in')).targetDensity,0);
 assert.equal(getHomeNavigationView(setHomeDensity(state(true,1),0)).targetDensity,0);
});
