import { homeSlotAppId } from './system.ts';
import type { MenuState } from './state';
import { nativeMessageOverride, nativePaneParentPath, type NativePixels } from './native-layout.ts';
import type { NativeLayoutRenderer } from './native-renderer';
import { sampleSystemHomeApplicationTransition } from './system-home-application-transition.ts';

export function homeSuspendedApplication(state: MenuState) {
 const s=state.system;
 if(!s||!state.powered||s.phase!=='home'||s.sleeping||s.preferences||state.panel)return null;
 const runtime=s.runtime,owner=runtime.application,application=owner?runtime.instances[owner]:undefined;
 if(!application||!application.suspended||application.closing||runtime.active||runtime.homeReturn!==owner)return null;
 return application;
}
export function retainedSuspendedApplication(state: MenuState) {
 return state.system?.homeNavigation.focus.toolbarActive?null:homeSuspendedApplication(state);
}
export function selectedSuspendedApplication(state: MenuState) {
 const application=retainedSuspendedApplication(state);
 return application&&homeSlotAppId(state,state.opened?state.folderSelected:state.selected)===application.appId?application:null;
}

/** Capture-fitted exit policy; the native disappearance start epoch is untraced. */
export function homeSuspendedIconDisappeared(state: MenuState): boolean {
 const close=sampleSystemHomeApplicationTransition(state);
 return !!homeSuspendedApplication(state)&&close?.intent.kind==='close'
  &&(close.phase==='exiting'||close.phase==='exit-terminal'||close.phase==='footer-exiting'||close.phase==='footer-terminal');
}

export type SuspendedWindowMetadata={description:string;icon:NativePixels};

function validateSleepFrame(frame:number){
 if(!Number.isSafeInteger(frame)||frame<0||frame>=120)throw new RangeError('Invalid native suspended sleep frame');
}

/** Source highlight. Its host-owned pulse epoch is not a traced native epoch. */
export function drawHomeSuspendedIcon(renderer:NativeLayoutRenderer,ctx:CanvasRenderingContext2D,center:readonly[number,number],densityFrame:number,sleepFrame=0,disappeared=false){
 const pack=renderer.packs.launcher,name='LncIconSleep_00';
 validateSleepFrame(sleepFrame);
 const bindings=[{name:name+'_Appear',frame:20},{name:name+'_Scale',frame:densityFrame},{name:name+'_Sleep',frame:sleepFrame}];
 if(disappeared)bindings.push({name:name+'_DisAppear',frame:20});
 if(!pack?.layouts[name])throw Error('Native suspended icon layout unavailable');
 for(const binding of bindings)if(!pack.animations[binding.name])throw Error(`Native suspended icon animation unavailable: ${binding.name}`);
 if(!Number.isFinite(densityFrame)||densityFrame<0||densityFrame>5||center.some(v=>!Number.isFinite(v)))throw Error('Invalid native suspended icon pose');
 if(!renderer.draw(ctx,'launcher',name,{center:[...center],bindings,pictureSampling:'lcd'}))throw Error('Native suspended icon draw failed');
}

/** Source geometry and Sleep loop. Close opacity is an explicit capture-fit input. */
export function drawHomeSuspendedWindow(renderer:NativeLayoutRenderer,ctx:CanvasRenderingContext2D,metadata:SuspendedWindowMetadata,mode:'expanded'|'compact'='expanded',sleepFrame=0,closeOpacity?:number){
 const pack=renderer.packs.launcher,bank=renderer.packs.messages?.messages.menu_msbt_LZ;
 validateSleepFrame(sleepFrame);
 if(closeOpacity!==undefined&&(!Number.isFinite(closeOpacity)||closeOpacity<0||closeOpacity>1))throw new RangeError('Invalid suspended close opacity');
 const bindings=[
  {name:'LncBase_U_00_SceneIn',frame:40},
  {name:'LncBase_U_00_Appear',frame:10},
  {name:'LncBase_U_00_ScaleUpDown',frame:mode==='expanded'?15:0},
  {name:'LncBase_U_00_Sleep',frame:sleepFrame},
  {name:'LncBase_U_00_WhiteBlack',frame:closeOpacity===undefined?1:0},
 ];
 if(!pack?.layouts.LncBase_U_00)throw Error('Native suspended window layout unavailable');
 for(const binding of bindings)if(!pack.animations[binding.name])throw Error(`Native suspended window animation unavailable: ${binding.name}`);
 for(const key of ['lau_pose_title_u','lau_rest_comm_u'])if(bank?.labels[key]===undefined)throw Error(`Native suspended window message unavailable: ${key}`);
 if(!metadata.description.trim()||metadata.icon.width!==64||metadata.icon.height!==64||metadata.icon.data.length!==64*64*4)throw Error('Native suspended window metadata unavailable');
 const message=(key:string)=>nativeMessageOverride(renderer.packs.messages,'menu_msbt_LZ',key,'');
 const resume=message('lau_rest_comm_u'),layout=pack.layouts.LncBase_U_00;
 const text=nativePaneParentPath(layout,'T_TextBtmR_00')?.at(-1)?.text;
 if(!text)throw Error('Native suspended window resume pane unavailable');
 const width=renderer.measureSingleLineText(layout.fonts[text.font],{...text,value:resume.text!,messageStyle:resume.messageStyle});
 // Capture-fitted assembly: center the source glyph + gap + measured caption.
 // The original host's N_TestCenter writer has not yet been traced.
 const centerOffset=mode==='expanded'?125-width/2:0;
 if(!renderer.draw(ctx,'launcher','LncBase_U_00',{bindings,textSampling:'lcd',pictureSampling:'lcd',
  textures:{'runtime:suspended-icon':metadata.icon},overrides:{
   ...(closeOpacity===undefined?{}:{N_Wndw_00:{alpha:Math.round(255*closeOpacity)}}),
   T_TextTop_00:message('lau_pose_title_u'),T_AppTitle_00:{text:metadata.description,visible:mode==='expanded'},
   T_TextBtmR_00:resume,N_TestCenter_00:{translation:[centerOffset,0,0]},P_Icon_00:{textureBindings:{0:'runtime:suspended-icon'}},
  },
 }))throw Error('Native suspended window draw failed');
}
