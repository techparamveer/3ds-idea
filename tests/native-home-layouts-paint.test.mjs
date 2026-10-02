import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHomeLayoutManager} from '../src/os/home-native-layouts.ts';
import {nativeMessageOverride,poseNativeLayout} from '../src/os/native-layout.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const packs=Object.fromEntries(['MyMenu','messages','dialog','dialogmask'].map(name=>[name,JSON.parse(readFileSync(new URL(manifest.home[name],root)))]));
const walk=panes=>panes.flatMap(pane=>[pane,...walk(pane.children)]);
function fixture(source=packs){
 const top={x:0,y:0,sx:1,sy:1},bottom={x:0,y:0,sx:1,sy:1},draws=[];
 const renderer={packs:source,diagnostics:[],failed:null,draw(ctx,pack,name,options={}){
  if(name===this.failed)return false;
  const pose=poseNativeLayout(this.packs[pack].layouts[name],this.packs[pack].animations,options.bindings,options.overrides),before={...ctx};
  const center=options.center??[pose.canvas.width/2,pose.canvas.height/2];ctx.x+=center[0]*ctx.sx;ctx.y+=center[1]*ctx.sy;
  const record={ctx,name,options,pose,center:[ctx.x,ctx.y],visible:[]};draws.push(record);
  const visit=pane=>{
   if(!(pane.flags&1))return;
   const old={...ctx};ctx.x+=pane.translation[0]*ctx.sx;ctx.y-=pane.translation[1]*ctx.sy;ctx.sx*=pane.scale[0];ctx.sy*=pane.scale[1];
   record.visible.push(pane.name);pane.children.forEach(visit);
   if(options.attachments?.[pane.name]){ctx.x-=pose.canvas.width/2*ctx.sx;ctx.y-=pose.canvas.height/2*ctx.sy;options.attachments[pane.name](1);}
   Object.assign(ctx,old);
  };
  pose.roots.forEach(visit);Object.assign(ctx,before);return true;
 }};
 return {manager:createHomeLayoutManager(renderer),renderer,top,bottom,draws};
}
const byName=(draws,name)=>draws.filter(draw=>draw.name===name);

test('layout manager paints all eight source mounts, one source cursor and English upper/footer captions',()=>{
 const before=JSON.stringify(packs),{manager,top,bottom,draws}=fixture();
 assert.equal(manager.draw(top,bottom,{}),true);
 const slots=byName(draws,'MyMenuBtn_D_00');
 assert.deepEqual(slots.map(slot=>slot.center),[[46,62],[122,62],[198,62],[274,62],[46,154],[122,154],[198,154],[274,154]]);
 const cursors=byName(draws,'MyMenuCsr_00');assert.equal(cursors.length,1);assert.deepEqual(cursors[0].center,[46,62]);
 assert.equal(byName(draws,'MyMenu_U_00')[0].ctx,top);
 assert.ok(draws.filter(draw=>draw.name!=='MyMenu_U_00').every(draw=>draw.ctx===bottom));
 for(const [name,pane,label] of [['MyMenu_U_00','TextBox_00','mhm_current_u'],['MyMenu_U_00','TextBox_01','mhm_title_u'],['MyMenuBtmBtn_D_00','T_BtnF_00','mhm_load_4b'],['MyMenuBtmBtn_D_00','T_BtnF_01','mhm_save_4b']])assert.deepEqual(byName(draws,name)[0].options.overrides[pane],nativeMessageOverride(packs.messages,'menu_msbt_LZ',label,''));
 assert.equal(JSON.stringify(packs),before);
});

test('saved slots enable Load/Delete and use native Overwrite text while sample previews stay hidden',()=>{
 const state={homeLayoutSlot:6,homeSavedLayouts:Array.from({length:8},(_,i)=>i===6?{theme:'blue',tiles:['portfolio']} :null)},before=JSON.stringify(state);
 const {manager,renderer,top,bottom,draws}=fixture();manager.draw(top,bottom,state);
 const slots=byName(draws,'MyMenuBtn_D_00');
 assert.deepEqual(slots.map(draw=>draw.options.bindings[0].name),Array.from({length:8},(_,i)=>`MyMenuBtn_D_00_${i===6?'Valid':'Invalid'}`));
 assert.deepEqual(byName(draws,'MyMenuCsr_00')[0].center,[198,154]);
 assert.ok(!slots[6].visible.some(name=>/^Thumb_[UD]_0[01]$/.test(name)));
 for(const [index,draw] of slots.entries())if(index!==6){
  assert.ok(draw.visible.includes('Thumb_U_00'));
  assert.ok(draw.visible.includes('Thumb_D_00'));
 }
 const upper=byName(draws,'MyMenu_U_00')[0];assert.ok(!upper.visible.includes('N_Thumb'));
 const footer=byName(draws,'MyMenuBtmBtn_D_00')[0];
 assert.deepEqual(footer.options.bindings.at(-1).groups,['G_Btn_03']);
 assert.ok(footer.visible.includes('N_Btn_04'));
 assert.deepEqual(footer.options.overrides.T_BtnF_01,nativeMessageOverride(packs.messages,'menu_msbt_LZ','mhm_overwrite_4b',''));
 assert.ok(renderer.diagnostics.some(message=>message.includes('sample thumbnails are hidden')));
 manager.draw(top,bottom,state);assert.equal(renderer.diagnostics.length,2,'repainting does not grow the diagnostic list');
 assert.equal(JSON.stringify(state),before);
});

test('empty selection disables native Load/Delete/Zoom and retains signed footer separators as reflections',()=>{
 const {manager,top,bottom,draws}=fixture();manager.draw(top,bottom,{homeLayoutSlot:7});
 assert.deepEqual(byName(draws,'MyMenuCsr_00')[0].center,[274,154]);
 const footer=byName(draws,'MyMenuBtmBtn_D_00')[0];
 assert.deepEqual(footer.options.bindings.at(-1).groups,['G_Btn_03','G_Btn_01','G_Btn_04']);
 assert.equal(footer.options.bindings[1].name,'MyMenuBtmBtn_D_00_BtnOut2');
 assert.ok(!footer.visible.includes('N_Btn_04'));
 for(const name of ['P_BtnLineR_00','P_BtnLineR_01']){
  const pane=walk(footer.pose.roots).find(pane=>pane.name===name);
  assert.deepEqual(pane.size,[60,28]);assert.deepEqual(pane.scale,[-1,1]);
 }
});

test('empty slots retain the original grey LCD plates without displaying saved-image placeholders',()=>{
 const {manager,top,bottom,draws}=fixture();manager.draw(top,bottom,{});
 for(const slot of byName(draws,'MyMenuBtn_D_00')){
  for(const name of ['Thumb_U_00','Thumb_D_00']){
   assert.ok(slot.visible.includes(name));
   const pane=walk(slot.pose.roots).find(pane=>pane.name===name);
   const material=slot.pose.materials[pane.picture.material];
   assert.equal(slot.pose.textures[material.textureMaps[0].texture],'PlateGray.bclim');
  }
  assert.ok(!slot.visible.includes('Thumb_U_01'));
  assert.ok(!slot.visible.includes('Thumb_D_01'));
 }
});

test('missing selected resources and child draw failure stop the manager explicitly',()=>{
 for(const [remove,expected] of [
  [source=>delete source.MyMenu.layouts.MyMenuBtn_D_00,/layout unavailable: MyMenuBtn_D_00/],
  [source=>delete source.MyMenu.animations.MyMenuCsr_00_Loop,/animation unavailable: MyMenuCsr_00_Loop/],
  [source=>delete source.MyMenu.animations.MyMenuBtmBtn_D_00_BtnOut2,/animation unavailable: MyMenuBtmBtn_D_00_BtnOut2/],
  [source=>delete source.messages.messages.menu_msbt_LZ.labels.mhm_title_u,/message unavailable: mhm_title_u/],
 ]){
  const source=structuredClone(packs);remove(source);const {manager,top,bottom,draws}=fixture(source);
  assert.throws(()=>manager.draw(top,bottom,{}),expected);assert.equal(draws.length,0);
 }
 const {manager,renderer,top,bottom}=fixture();renderer.failed='MyMenuBtn_D_00';assert.throws(()=>manager.draw(top,bottom,{}),/draw failed/);
});

test('confirmation adapts the native two-button dialog and source messages without sample thumbnails',()=>{
 for(const action of ['save','load','delete'])for(const selected of [false,true]){
  const {manager,renderer,top,bottom,draws}=fixture();
  manager.draw(top,bottom,{homeSavedLayouts:[{}],homeLayoutAction:action,homeLayoutConfirm:selected});
  assert.deepEqual(draws.slice(-3).map(draw=>draw.name),['DlgMask_U_00','DlgMask_D_00','Dlg_A_D_02']);
  const dialog=draws.at(-1);
  assert.deepEqual(dialog.options.overrides.TextBoxDialog,nativeMessageOverride(packs.messages,'menu_msbt_LZ',`lau_dlg_mhm_${action}`,''));
  assert.deepEqual(dialog.options.overrides.TextBox_01,nativeMessageOverride(packs.messages,'menu_msbt_LZ','lau_dlg_2b_canc0',''));
  assert.deepEqual(dialog.options.overrides.TextBox_03,nativeMessageOverride(packs.messages,'menu_msbt_LZ',action==='delete'?'lau_dlg_2b_delete':'lau_dlg_2b_decide',''));
  assert.deepEqual(dialog.options.bindings.at(-1).groups,[selected?'Group_01':'Group_00']);
  assert.ok(renderer.diagnostics.some(message=>message.includes('source-layout assembly adaptation')));
  assert.equal(byName(draws,'MyMenuDlg_00').length,0);
 }
});

test('missing confirmation sources fail before either LCD is painted',()=>{
 for(const [remove,expected] of [
  [source=>delete source.dialog,/confirmation layout unavailable: dialog/],
  [source=>delete source.dialogmask.layouts.DlgMask_U_00,/confirmation layout unavailable: dialogmask/],
  [source=>delete source.dialog.animations.Dlg_A_D_02_Select,/confirmation animation unavailable/],
  [source=>delete source.messages.messages.menu_msbt_LZ.labels.lau_dlg_mhm_load,/message unavailable: lau_dlg_mhm_load/],
 ]){
  const source=structuredClone(packs);remove(source);const {manager,top,bottom,draws}=fixture(source);
  assert.throws(()=>manager.draw(top,bottom,{homeSavedLayouts:[{}],homeLayoutAction:'load'}),expected);assert.equal(draws.length,0);
 }
});

test('empty-slot confirmations, inconsistent action state and invalid slots fail explicitly',()=>{
 for(const state of [{homeLayoutAction:'save'},{homeLayoutAction:'load'},{homeLayoutAction:'delete'},{homeLayoutAction:'unknown'},{homeLayoutConfirm:true},{homeLayoutSlot:-1},{homeLayoutSlot:8},{homeLayoutSlot:.5},{homeLayoutSlot:NaN}]){
  const {manager,top,bottom,draws}=fixture();assert.throws(()=>manager.draw(top,bottom,state),/requires a saved slot|confirmation has no action|Invalid HOME layout/);assert.equal(draws.length,0);
 }
});
