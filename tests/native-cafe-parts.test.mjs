import test from 'node:test';
import assert from 'node:assert/strict';
import { instantiateNativePart, nativeWindowPatches, nativeWhite, poseNativeLayout } from '../src/os/native-layout.ts';
const pane=(name,extra={})=>({kind:'pan1',name,flags:3,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[320,240],children:[],...extra});
const material=(name,texture)=>({name,bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureOnly:false,textureMaps:texture===undefined?[]:[{texture,wrapS:0,wrapT:0,minFilter:1,magFilter:1}],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
const text={font:0,material:0,value:'Original',size:[14,16],alignment:4,lineAlignment:2,characterSpacing:0,lineSpacing:0,topColor:[255,255,255,255],bottomColor:[255,255,255,255],callName:'OriginalLabel'};
const picture={material:1,colors:nativeWhite,uvSets:[[0,0,1,0,0,1,1,1]]};
const layout=(roots,materials,textures=[])=>({sourceFormat:'FLYT',canvas:{origin:1,width:320,height:240},roots,materials,textures,fonts:['child.bffnt'],groups:[],unsupported:[]});
function fixture(){
 const child=layout([pane('RootPane',{children:[pane('Title',{kind:'txt1',text}),pane('Icon',{kind:'pic1',picture}),pane('Body',{size:[282,50]})]})],[material('title'),material('icon',0)],['childIcon']);
 const parent=layout([],[material('title'),material('icon',0)],['parentIcon']);
 const basic={translation:[-114,0,0],rotation:[0,0,0],scale:[.86,.86],size:[280,46],alpha:0,userData:'0000000000000000',padding:'000000'};
 const part={layout:'PortalBtn',capability:'amiibo-portal-v1',magnify:[1,1],entries:[
  {name:'Title',usageFlags:1,basicUsageFlags:0x28,materialUsageFlags:0,basicInfo:basic,property:pane('Title',{kind:'txt1',text:{...text,font:0xffff,value:'',callName:'Register'}})},
  {name:'Icon',usageFlags:0,basicUsageFlags:0x28,materialUsageFlags:0,basicInfo:{...basic,translation:[-112,0,0]},property:pane('Icon',{kind:'pic1',picture})},
  {name:'Body',usageFlags:0,basicUsageFlags:0x10,materialUsageFlags:0,basicInfo:basic},
 ]};return {parent,child,part};
}
const find=(layout,name)=>layout.roots[0].children.find(p=>p.name===name);
test('parts retain separate scopes and source-indexed textures, and inherit the sentinel font',()=>{
 const {parent,child,part}=fixture(),before=JSON.stringify({parent,child,part});
 const first=instantiateNativePart(parent,part,child),second=instantiateNativePart(parent,part,child);
 assert.equal(find(first.layout,'Title').text.callName,'Register');assert.equal(find(first.layout,'Title').text.font,0);
 assert.deepEqual(find(first.layout,'Title').translation,[-114,0,0]);assert.deepEqual(find(first.layout,'Title').scale,[.86,.86]);
 assert.deepEqual(find(first.layout,'Title').size,[320,240]);assert.equal(find(first.layout,'Title').alpha,255);
 assert.deepEqual(find(first.layout,'Body').size,[280,46]);assert.deepEqual(find(first.layout,'Body').translation,[0,0,0]);
 assert.deepEqual(first.parentTextures,{__parent_texture_0:'parentIcon'});
 assert.equal(first.layout.textures[first.layout.materials[1].textureMaps[0].texture],'__parent_texture_0');
 const clip={frames:2,loop:false,groups:[],textures:[],tracks:[{target:'Icon',binding:'pane',property:'alpha',index:0,component:16,interpolation:'step',keys:[{frame:0,value:64}]}]};
 const posed=poseNativeLayout(first.layout,{select:clip},[{name:'select',frame:0}],{Title:{text:'First instance'}});
 assert.equal(find(posed,'Icon').alpha,64);assert.equal(find(second.layout,'Icon').alpha,255);
 assert.equal(find(second.layout,'Title').text.value,'');assert.equal(JSON.stringify({parent,child,part}),before);
});
test('unverified part override flags, missing references and repeated names fail explicitly',()=>{
 for(const change of [f=>f.part.entries[0].basicUsageFlags=4,f=>f.part.entries[0].usageFlags=3,f=>f.part.entries[0].materialUsageFlags=1,f=>f.part.entries[0].property.text.font=2,f=>f.part.entries[0].name='absent',f=>f.part.entries.push(f.part.entries[0]),f=>f.part.magnify=[2,1]]){
  const f=fixture();change(f);assert.throws(()=>instantiateNativePart(f.parent,f.part,f.child));
 }
});
test('FLYT windows accept only explicit frame sizes equal to their actual frame textures',()=>{
 const m=material('frame',0),l=layout([],[m],['corner']),pixels={width:8,height:8,data:new Uint8ClampedArray(256)};
 const window=pane('Window',{size:[100,50],window:{inflation:[0,0,0,0],frameSize:[8,8,8,8],flags:1,content:{...picture,material:0},frames:[{material:0,flip:0}]}});
 const patches=nativeWindowPatches(window,l,new Map([['corner',pixels]]));
 assert.deepEqual(patches[0],{x:8,y:8,width:84,height:34,picture:window.window.content});
 assert.throws(()=>nativeWindowPatches(window,{...l,sourceFormat:undefined},new Map([['corner',pixels]])),/Unsupported window/);
 window.window.frameSize[0]=9;assert.throws(()=>nativeWindowPatches(window,l,new Map([['corner',pixels]])),/custom frame size/);
});

const privateRoot=process.env.FIRMWARE_AMIIBO_CONVERTED;
test('real original-model portal instantiates all five parts without aliasing source materials or panes',{skip:!privateRoot},async()=>{
 const {readFile}=await import('node:fs/promises');const {join}=await import('node:path');
 const read=async(name,layout)=>JSON.parse(await readFile(join(privateRoot,'packs/amiibo-settings',name+'.json'),'utf8')).layouts[layout];
 const parent=await read('layout-Body-Portal-PortalSceneCTR-arc-cmp','PortalSceneCTR');
 const templates={PortalBtn:await read('layout-Parts-Portal-PortalBtn-arc-cmp','PortalBtn'),PortalBtnSub:await read('layout-Parts-Portal-PortalBtnSub-arc-cmp','PortalBtnSub'),BtnBtm_03:await read('layout-Parts-Common-BtnBtm_03-BtnBtm_03-arc-cmp','BtnBtm_03')};
 const walk=items=>items.flatMap(p=>[p,...walk(p.children)]),parts=walk(parent.roots).filter(p=>p.part),before=JSON.stringify({parent,templates});
 const instances=parts.map(p=>instantiateNativePart(parent,p.part,templates[p.part.layout]));
 assert.equal(instances.length,5);
 const titles=instances.flatMap(i=>walk(i.layout.roots).filter(p=>p.text).map(p=>p.text.callName));
 assert.deepEqual(titles,['BtnSetNicknameOwner','BtnEraseGameData','BtnInitializeAmiibo','BtnUpdateFangate','Finish','Finish']);
 const icons=instances.slice(0,3).map(i=>walk(i.layout.roots).find(p=>p.name==='P_Icon_00'));
 assert.ok(icons.every(p=>p.translation[0]===-114));assert.ok(icons.every(p=>Math.abs(p.scale[0]-.86)<1e-6));
 assert.deepEqual(instances.slice(0,3).map(i=>Object.values(i.parentTextures)),[['EditIcon.bflim'],['DeleteIcon.bflim'],['InitializeIcon.bflim']]);
 assert.equal(JSON.stringify({parent,templates}),before);
});
