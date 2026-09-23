import {poseNativeLayout, type AnimationBinding, type NativeGroup, type NativeLayout, type NativePack, type NativePane, type PaneOverrides} from './native-layout';
import {applyNativeQwertyPaneSubmissions, nativeNicknameQwertyPresentation, type NativeQwertyStyleResources} from './native-keyboard-keys';
import {nativeNicknameTextPose} from './native-keyboard-text';
import type {NativeLayoutRenderer} from './native-renderer';

export type NativeNicknameCheckpoint='capture'|'settled';
export type NativeKeyboardSubmission={layout:string;pane:string;clip:string;frame:number};
export type NativeKeyboardAttachment={parent:'N_decor'|'N_transDecor';layout:string;instance:number;overrides:PaneOverrides};
export type NativeNicknameComposition={
  phase:NativeNicknameCheckpoint;
  pack:NativePack;
  drawOrder:readonly string[];
  attachments:NativeKeyboardAttachment[];
  submissions:{initial:NativeKeyboardSubmission[];capture:NativeKeyboardSubmission[];settled:NativeKeyboardSubmission[]};
  footerEnabled:boolean;
  cursorFrame:number;
  gaps:readonly string[];
};
const DRAW_ORDER=['BG','Btm2Btn','TextArea_02','KeytopModeSelect','Keytop_qwerty','LncArw_00','WaitIcon'] as const;
const walk=(panes:NativePane[]):NativePane[]=>panes.flatMap(p=>[p,...walk(p.children)]);
const groups=(items:NativeGroup[]):NativeGroup[]=>items.flatMap(g=>[g,...groups(g.children)]);

/** Snapshot composition for the verified immediate-ready, ordinary name request.
 * It paints the capture contents or first live settled component, never Fade_D.
 * This function neither advances a clock nor processes an input event.
 */
export function nativeNicknameComposition(source:NativePack,value:string,phase:NativeNicknameCheckpoint,caller:{cancel:string;confirm:string},font:NativeQwertyStyleResources['font']):NativeNicknameComposition{
  if(phase!=='capture'&&phase!=='settled')throw new Error('Unknown native nickname checkpoint');
  const pack:NativePack={...source,layouts:{...source.layouts}},submissions:NativeNicknameComposition['submissions']={initial:[],capture:[],settled:[]};
  const layout=(name:string)=>{const item=pack.layouts[name];if(!item)throw new Error(`Missing nickname layout ${name}`);return item;};
  const pose=(name:string,overrides:PaneOverrides)=>{for(const pane of Object.keys(overrides))if(!walk(layout(name).roots).some(p=>p.name===pane))throw new Error(`Missing nickname pane ${name}/${pane}`);pack.layouts[name]=poseNativeLayout(layout(name),{},[],overrides);};
  const messages=source.messages.english,styles=source.styles?.[messages?.styleTable??'']?.styles;
  if(!messages||!styles)throw new Error('Missing nickname English messages/styles');
  const textPose=nativeNicknameTextPose({value,cursor:value.length,anchor:value.length,selectionActive:false},layout('TextArea_02'));
  for(const name of DRAW_ORDER)layout(name);
  const appendGroup=(name:string,binding:AnimationBinding,stage:keyof typeof submissions)=>{
    const before=layout(name),selected=new Set<string>();
    for(const groupName of binding.groups??[]){
      const group=groups(before.groups).find(g=>g.name===groupName);if(!group)throw new Error(`Missing nickname group ${groupName}`);
      for(const paneName of group.panes){const pane=walk(before.roots).find(p=>p.name===paneName);if(!pane)throw new Error(`Missing nickname group pane ${paneName}`);
        for(const p of binding.childBinding?[...walk(pane.children),pane]:[pane])selected.add(p.name);
      }
    }
    const order=stage==='initial'?[...selected]:walk(before.roots).filter(p=>selected.has(p.name)).map(p=>p.name);
    for(const pane of order)submissions[stage].push({layout:name,pane,clip:binding.name,frame:binding.frame});
    const clip=source.animations[binding.name];if(!clip)throw new Error(`Missing nickname animation ${binding.name}`);
    // Native caller-specified groups replace the resource's default groups.
    const animations={...source.animations,[binding.name]:{...clip,groups:binding.groups??clip.groups}};
    pack.layouts[name]=poseNativeLayout(before,animations,[binding]);
  };
  pose('Btm2Btn',Object.fromEntries(['00','02'].flatMap(suffix=>['T_btn_','T_btnB_'].map(prefix=>[prefix+suffix,{text:suffix==='00'?caller.cancel:caller.confirm}]))));
  pose('TextArea_02',textPose.textArea);
  const selector:PaneOverrides={RootPane:{translation:[0,4,0]}};
  for(let i=0;i<4;i++){
    const suffix=String(i).padStart(2,'0'),label=`char_type_${suffix}`,message=messages.messages[messages.labels[label]];
    if(!message)throw new Error(`Missing nickname selector message ${label}`);
    selector[`T_ktpMode_${suffix}`]={text:message.text};
  }
  pose('KeytopModeSelect',selector);pose('LncArw_00',{RootPane:{translation:[0,8,0]}});
  // Native immediate order is arrows, selected mode, then QWERTY initialization.
  for(const group of ['G_arwL_00','G_arwR_00'])appendGroup('LncArw_00',{name:'LncArw_00_Appear',frame:0,groups:[group],childBinding:false},'initial');
  appendGroup('KeytopModeSelect',{name:'KeytopModeSelect_n0s1',frame:1,groups:['G_ktpMode_00'],childBinding:false},'initial');
  const keys=nativeNicknameQwertyPresentation(layout('Keytop_qwerty'),source.animations,messages,{styles,font});
  pack.layouts.Keytop_qwerty=keys.layout;
  submissions.initial.push(...keys.immediateSubmissions.map(s=>({...s,layout:'Keytop_qwerty'})));
  // Original attachment makes the separate child root influence inherited alpha.
  for(const name of ['DecorCursor','DecorArea_select','DecorArea_cellphone','DecorArea_roman','DecorTrans']){
    pack.layouts[name]=poseNativeLayout(layout(name),{},[]);
    for(const root of pack.layouts[name].roots)root.flags|=2;
  }
  pose('DecorCursor',textPose.cursorLayout);
  const attachments:NativeKeyboardAttachment[]=[
    ...textPose.selectionLayouts.map((overrides,instance)=>({parent:'N_decor' as const,layout:'DecorArea_select',instance,overrides})),
    ...[{layout:'DecorArea_cellphone',count:1},{layout:'DecorArea_roman',count:4},{layout:'DecorTrans',count:4}].flatMap(({layout,count})=>Array.from({length:count},(_,instance)=>({parent:'N_transDecor' as const,layout,instance,overrides:{RootPane:{visible:false}}}))),
    {parent:'N_transDecor',layout:'DecorCursor',instance:0,overrides:{}},
  ];
  const footerEnabled=/[^ \u3000]/u.test(value),cursorFrame=value.length?0:1;
  if(!footerEnabled)appendGroup('Btm2Btn',{name:'Btm3Btn_i0',frame:0,groups:['G_btn_02'],childBinding:false},'capture');
  appendGroup('DecorCursor',{name:'DecorCursor_blink',frame:cursorFrame,groups:['G_decorCursor'],childBinding:false},'capture');
  const globalKeys=keys.firstLocalControllerSubmissions.map(s=>({...s,frame:1}));
  pack.layouts.Keytop_qwerty=applyNativeQwertyPaneSubmissions(keys.layout,source.animations,globalKeys);
  submissions.capture.push(...globalKeys.map(s=>({...s,layout:'Keytop_qwerty'})));
  if(phase==='settled'){
    if(!footerEnabled)appendGroup('Btm2Btn',{name:'Btm3Btn_i0',frame:1,groups:['G_btn_02'],childBinding:false},'settled');
    appendGroup('DecorCursor',{name:'DecorCursor_blink',frame:cursorFrame,groups:['G_decorCursor'],childBinding:false},'settled');
  }
  return {phase,pack,drawOrder:DRAW_ORDER,attachments,submissions,footerEnabled,cursorFrame,gaps:[
    'Selector named-message style and auto-fit writes remain an unresolved endpoint; source pane metrics retained.',
    'Blank T_trans native material+0x14 write remains unresolved.',
    'Native world/glyph/LCD pixels and transition caller underlay are not validated by this component.',
  ]};
}

/** Renderer must already own this composition's immutable pack under alias. */
export function drawNativeNicknameComposition(ctx:CanvasRenderingContext2D,renderer:Pick<NativeLayoutRenderer,'draw'>,alias:string,composition:NativeNicknameComposition):string[]{
  const order:string[]=[];
  const draw=(name:string,overrides?:PaneOverrides)=>{if(!renderer.draw(ctx,alias,name,{overrides}))throw new Error(`Failed nickname draw ${name}`);};
  for(const name of composition.drawOrder){
    order.push(name);
    if(name!=='TextArea_02'){draw(name);continue;}
    const attachments=Object.fromEntries(['N_decor','N_transDecor'].map(parent=>[parent,()=>{
      for(const child of composition.attachments.filter(child=>child.parent===parent)){order.push(`${parent}/${child.layout}[${child.instance}]`);draw(child.layout,child.overrides);}
    }]));
    if(!renderer.draw(ctx,alias,name,{attachments}))throw new Error('Failed nickname text/attachment draw');
  }
  return order;
}
