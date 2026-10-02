import { homeSlotAppId } from './system.ts';
import type { MenuState } from './state';
import { nativeMessageOverride, nativePaneParentPath, type NativePixels } from './native-layout.ts';
import type { NativeLayoutRenderer } from './native-renderer';

/** Only the selected retained application has a captured expanded-window reference.
 * The compact window for another selection remains a separate native source gap. */
export function selectedSuspendedApplication(state: MenuState) {
 const s=state.system;
 if(!s||s.phase!=='home'||s.sleeping||s.preferences||state.panel||s.homeNavigation.focus.toolbarActive)return null;
 const runtime=s.runtime,owner=runtime.application,application=owner?runtime.instances[owner]:undefined;
 if(!application||!application.suspended||application.closing||runtime.active||runtime.homeReturn!==owner)return null;
 return homeSlotAppId(state,state.opened?state.folderSelected:state.selected)===application.appId?application:null;
}

export type SuspendedWindowMetadata={description:string;icon:NativePixels};

/** Source settled expanded pose, not an inferred opening/closing animation. */
export function drawHomeSuspendedWindow(renderer:NativeLayoutRenderer,ctx:CanvasRenderingContext2D,metadata:SuspendedWindowMetadata){
 const pack=renderer.packs.launcher,bank=renderer.packs.messages?.messages.menu_msbt_LZ;
 const bindings=[
  {name:'LncBase_U_00_SceneIn',frame:40},
  {name:'LncBase_U_00_Appear',frame:10},
  {name:'LncBase_U_00_ScaleUpDown',frame:15},
  {name:'LncBase_U_00_Sleep',frame:0},
  {name:'LncBase_U_00_WhiteBlack',frame:1},
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
 const centerOffset=125-width/2;
 if(!renderer.draw(ctx,'launcher','LncBase_U_00',{bindings,textSampling:'lcd',pictureSampling:'lcd',
  textures:{'runtime:suspended-icon':metadata.icon},overrides:{
   T_TextTop_00:message('lau_pose_title_u'),T_AppTitle_00:{text:metadata.description},
   T_TextBtmR_00:resume,N_TestCenter_00:{translation:[centerOffset,0,0]},P_Icon_00:{textureBindings:{0:'runtime:suspended-icon'}},
  },
 }))throw Error('Native suspended window draw failed');
}
