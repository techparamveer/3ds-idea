import { BitmapFont, loadBitmapFont } from './bitmap-font';
import { decodeNativePng } from './native-png';
import { nativeBannerLabelOverride } from './native-banner-label';
import { NativeLayoutRenderer } from './native-renderer';
import { nativeFolderGlyphPixels, nativeMessageOverride, nativeTextureSamplePixels, poseNativeLayout, sampleNativeTrack, type AnimationBinding, type NativePack, type NativePixels, type PaneOverrides } from './native-layout';
import { isHomeFolderBackTouch, rowCount, toolbar as toolbarRegions, type MenuState } from './state';
import { getHomeGestureView } from './system';
import { getHomeFooter, getNativeFolderBalloon, getNativeFolderPanel, getNativeHomePanel, nativeHomeDensityFrame, nativeHomeDensityMetric, type HomePresentation } from './home-presentation';

type Context=CanvasRenderingContext2D;
export type FirmwarePresentationAssets={sharedFont:BitmapFont;hudFont:BitmapFont;renderer:NativeLayoutRenderer;diagnostics:string[];dispose():void};
type Manifest={schema:number;firmware:string;fonts:{shared:string;hud:string};home:Record<string,string>};
const homeLayouts={hud:['HudMenu_00'],banner:['BnrDsTitle_00'],launcher:['LncPlt_00','LncBase_D_01','LncBase_U_00','LncBlln_00','LncCsr_00','LncBtmBtn_02','LncFolder_00','LncFolderCapture_00','LncIconFolder_00','LncIconFolderText_00','LncIconDist_01','LncIconSetSrc_00','LncArw_00','LncIconPickUp_00','LncIconFolderPickUp_00','LncIconPickUpBlank_00','LncIconFolderInT_00','LncIconFolderInB_00']};

export async function loadFirmwarePresentationAssets(manifestUrl='/os/firmware/10.7.0-32E/manifest.json',signal?:AbortSignal):Promise<FirmwarePresentationAssets>{
 const base=new URL(manifestUrl,window.location.href),controller=new AbortController();
 const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const fonts:BitmapFont[]=[];
 try{
  const json=async <T>(url:string):Promise<T>=>{const response=await fetch(new URL(url,base),{signal:controller.signal});if(!response.ok)throw new Error(`Firmware asset HTTP ${response.status}: ${url}`);return response.json();};
  const manifest=await json<Manifest>(base.href);
  if(manifest.schema!==1||manifest.firmware!=='10.7.0-32E'||!manifest.fonts||!manifest.home)throw new Error('Unsupported firmware presentation manifest');
  const font=async (url:string)=>{const result=await loadBitmapFont(new URL(url,base).href,controller.signal);fonts.push(result);return result;};
  const packNames=['hud','launcher','messages','banner'];
  const [sharedFont,hudFont,...loaded]=await Promise.all([font(manifest.fonts.shared),font(manifest.fonts.hud),...packNames.map(name=>json<NativePack>(manifest.home[name]))]);
  const packs=Object.fromEntries(packNames.map((name,i)=>[name,loaded[i]])) as Record<string,NativePack>;
  // Reject an incomplete style conversion during loading, before a paint can partially fail.
  for(const [bank,data] of Object.entries(packs.messages.messages))for(const label of Object.keys(data.labels))nativeMessageOverride(packs.messages,bank,label,'');
  const textures:Record<string,Map<string,NativePixels>>={};const decoded=new Map<string,Promise<NativePixels>>();
  await Promise.all(Object.entries(homeLayouts).map(async ([name,names])=>{
   const pack=packs[name];if(pack.schema!==1||!pack.layouts||!pack.animations)throw new Error(`Invalid native pack ${name}`);
   const needed=new Set<string>();
   for(const layout of names){if(!pack.layouts[layout])throw new Error(`Missing native layout ${layout}`);pack.layouts[layout].textures.forEach(n=>needed.add(n));
    for(const [clip,animation] of Object.entries(pack.animations))if(clip.startsWith(layout+'_'))animation.textures.forEach(n=>needed.add(n));}
   const images=new Map<string,NativePixels>();textures[name]=images;
   await Promise.all([...needed].map(async key=>{
    const record=pack.textures[key];if(!record)throw new Error(`Missing texture record ${name}/${key}`);
    const decodeKey=`${record.picaFormat??'rgba'}:${record.url}`;let pending=decoded.get(decodeKey);
    if(!pending){pending=(async()=>{const response=await fetch(new URL(record.url,base),{signal:controller.signal});
     if(!response.ok)throw new Error(`Firmware texture HTTP ${response.status}: ${key}`);
     return nativeTextureSamplePixels(await decodeNativePng(new Uint8Array(await response.arrayBuffer()),record,controller.signal),record.picaFormat);})();decoded.set(decodeKey,pending);}
    const pixels=await pending;if(pixels.width!==record.width||pixels.height!==record.height)throw new Error(`Texture dimensions differ: ${key}`);images.set(key,pixels);
   }));
  }));
  controller.signal.throwIfAborted();
  const renderer=new NativeLayoutRenderer(packs,textures,new Map([['cbf_std.bcfnt',sharedFont as BitmapFont],['Hud.bcfnt',hudFont as BitmapFont]]));
  renderer.diagnostics.push('Native HOME animation epochs and transitions await synchronized Azahar comparison.','Native layout frame selection and alpha inheritance await Azahar comparison.','Portfolio icons/content intentionally differ from stock applications.');
  let disposed=false;
  return {sharedFont:sharedFont as BitmapFont,hudFont:hudFont as BitmapFont,renderer,diagnostics:renderer.diagnostics,dispose(){if(disposed)return;disposed=true;renderer.dispose();fonts.forEach(f=>f.dispose());}};
 }catch(error){controller.abort();fonts.forEach(font=>font.dispose());throw error;}
 finally{signal?.removeEventListener('abort',abort);}
}

/** HOME assembly chooses groups and discrete firmware clip frames explicitly. */
export function createFirmwareHome(assets:FirmwarePresentationAssets){
 const renderer=assets.renderer;
 const message=(table:string,key:string,fallback:string)=>nativeMessageOverride(renderer.packs.messages,table,key,fallback);
 const binding=(name:string,frame:number,groups?:string[]):AnimationBinding=>({name,frame,...(groups?{groups}:{})});
 const pressTrack=renderer.packs.launcher.animations.LncCsr_00_Select.tracks.find(track=>track.target==='N_Scene_00'&&track.property==='translation.y');
 const pressOffset=pressTrack?-sampleNativeTrack(pressTrack,5):0;
 const bannerLabels=new Map<string,NativePixels>();
 const folderGlyphs=new Map<string,NativePixels>(),glyphTexture='runtime:folder-first-character';
 function folderGlyph(name:string):NativePixels|undefined{
  // Native 0x2027d0 reads one UTF-16 code unit, including a lone surrogate.
  const character=name.slice(0,1);if(!character)return;
  const cached=folderGlyphs.get(character);if(cached){folderGlyphs.delete(character);folderGlyphs.set(character,cached);return cached;}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  try{
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   if(!renderer.draw(ctx,'launcher','LncIconFolderText_00',{overrides:{T_Icon_00:{text:character},P_Icon_00:{visible:false}}}))return;
   const pixels=nativeFolderGlyphPixels({width:32,height:32,data:ctx.getImageData(0,0,32,32).data});
   if(folderGlyphs.size>=64)folderGlyphs.delete(folderGlyphs.keys().next().value!);folderGlyphs.set(character,pixels);return pixels;
  }finally{canvas.width=canvas.height=0;}
 }
 function folderBannerLabel(name:string):NativePixels|undefined{
  const cached=bannerLabels.get(name);if(cached){bannerLabels.delete(name);bannerLabels.set(name,cached);return cached;}
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
  try{
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   const text=name||message('menu_msbt_LZ','lau_2b_folder_noname','(No name)').text!;
   const layout=renderer.packs.banner?.layouts.BnrDsTitle_00;if(!layout)return;
   if(!renderer.draw(ctx,'banner','BnrDsTitle_00',{overrides:nativeBannerLabelOverride(layout,assets.sharedFont.manifest,text)}))return;
   const pixels={width:256,height:64,data:ctx.getImageData(0,0,256,64).data};if(bannerLabels.size>=2)bannerLabels.delete(bannerLabels.keys().next().value!);bannerLabels.set(name,pixels);return pixels;
  }finally{canvas.width=canvas.height=0;}
 }
 function upperBase(ctx:Context){
  return renderer.draw(ctx,'launcher','LncBase_U_00',{bindings:[binding('LncBase_U_00_SceneIn',40),binding('LncBase_U_00_Appear',10),binding('LncBase_U_00_WhiteBlack',0)],overrides:{N_Wndw_00:{visible:false}},clip:[0,212,400,28]});
 }
 function folderBalloon(ctx:Context,state:MenuState,view:HomePresentation){
  const label=getNativeFolderBalloon(state,view);if(!label)return false;
  return renderer.draw(ctx,'launcher','LncBlln_00',{bindings:[binding('LncBlln_00_Appear',5)],overrides:{
   N_Base_00:{translation:[label.baseX,0,0]},N_LR_00:{translation:[label.bodyOffsetX,-6,0]},T_Blln_00:label.label?{text:label.label}:message('menu_msbt_LZ','lau_2b_folder_noname','(No name)')
  }});
 }
 function hud(ctx:Context,date:Date,time:number){
  const table='hud_msbt_LZ',day=message(table,`day_${date.getDate()}`,String(date.getDate()).padStart(2,'0')).text!,month=message(table,`month_${date.getMonth()+1}`,String(date.getMonth()+1).padStart(2,'0')).text!;
  const weekday=message(table,`week_${['sun','mon','tue','wed','thu','fri','sat'][date.getDay()]}`,'').text!;
  const dateText=message(table,'lau_date','%d/%M (%w)');dateText.text=dateText.text!.replace('%d',day).replace('%M',month).replace('%w',weekday);
  return renderer.draw(ctx,'hud','HudMenu_00',{bindings:[binding('HudMenu_00_SceneIn',41),binding('HudMenu_00_WhiteBlack',0),binding('HudMenu_00_NetMode',4),binding('HudMenu_00_NetAtn',8),binding('HudMenu_00_Bat',3),binding('HudMenu_00_WalkCoin',time*.06)],overrides:{
   T_NetMode_00:message(table,'lau_connect4','Disabled'),T_Date_00:dateText,T_TimeL_00:{text:String(date.getHours()).padStart(2,'0')},T_TimeR_00:{text:String(date.getMinutes()).padStart(2,'0')},T_Walk_00:{text:'0'},T_Coin_00:{text:'0'}
  }});
 }
 function toolbar(ctx:Context,state?:MenuState,fullHeight=false){
  const gesture=state&&getHomeGestureView(state),bindings=[binding('LncBase_D_01_PaletteOut',12),binding('LncBase_D_01_MvsToggle',0)];
  if(!state?.panel&&gesture?.mode==='press'&&gesture.y>=0&&gesture.y<33&&gesture.x>=0&&gesture.x<320){
   const index=toolbarRegions.findIndex(region=>gesture.x>=region.x&&gesture.x<region.x+region.width);
   const group=index>=0?['G_Light_00','G_Memo_00','G_Friend_00','G_News_00','G_Web_00','G_Mvs_00'][index]:gesture.x<294?'G_Dw_00':'G_Up_00';
   bindings.push(binding('LncBase_D_01_Select',1,[group]));
  }
  return renderer.draw(ctx,'launcher','LncBase_D_01',{bindings,clip:[0,0,320,state?.opened||fullHeight?240:212]});
 }
 function homePlate(ctx:Context,state:MenuState){
  if(state.opened)return false;
  const panel=getNativeHomePanel(state);
  return renderer.draw(ctx,'launcher','LncPlt_00',{bindings:[binding('LncPlt_00_PaletteOut',11)],overrides:{W_Plt_00:{translation:[panel.x,-92,0],size:[panel.width,175]},W_Shdw_00:{translation:[panel.x,-102,0],size:[panel.shadowWidth,193]}}});
 }
 function folderBackdrop(ctx:Context,capture:NativePixels){
  // The host supplies canonical rows34..239 of the fresh pre-folder render.
  // This replaces the native rotated framebuffer plus its UV0 crop; UV1 and TEV stay original.
  const texture='runtime:folder-background';
  return renderer.draw(ctx,'launcher','LncFolderCapture_00',{bindings:[binding('LncFolderCapture_00_Fade',8),binding('LncFolderCapture_00_PicUp',0)],textures:{[texture]:capture},overrides:{P_Capture_00:{textureBindings:{0:texture}}}});
 }
 function folderChrome(ctx:Context,state:MenuState){
  const panel=getNativeFolderPanel(state);if(!panel)return false;
  // HOME 0x2b2b68 loads this layout and its FadeIn controller; entry
  // 0x2a34bc starts it. This is the settled frame, pending transition wiring.
  const gesture=state.system?.homeNavigation.gesture;
  const pressed=gesture?.mode==='press'&&isHomeFolderBackTouch(state,gesture.startX,gesture.startY)&&isHomeFolderBackTouch(state,gesture.x,gesture.y);
  return renderer.draw(ctx,'launcher','LncFolder_00',{bindings:[binding('LncFolder_00_FadeIn',16),binding('LncFolder_00_Select',pressed?1:0,['G_Btn_00'])],overrides:{W_Plt_00:{translation:[panel.x,-16,0],size:[panel.width,144]},W_Shdw_00:{translation:[panel.x,-20,0],size:[panel.shadowWidth,164]}}});
 }
 function footer(ctx:Context,state:MenuState){
  const actions=getHomeFooter(state);if(!actions)return true;
  const {two,left:leftAction,right:rightAction}=actions;
  const active=new Set(two?['N_BtnW_R_02','N_BtnW_L_03']:['N_BtnW_C_01']);
  const overrides:PaneOverrides={};
  const walk=(panes:NativePack['layouts'][string]['roots'])=>panes.forEach(p=>{if(/^N_Btn[WB]_[LRC]+_\d+$/.test(p.name))overrides[p.name]={visible:active.has(p.name)};if(p.text)overrides[p.name]={text:''};walk(p.children);});walk(renderer.packs.launcher.layouts.LncBtmBtn_02.roots);
  const label=(action:typeof leftAction|typeof rightAction)=>action===null?{text:''}:message('menu_msbt_LZ',{'close-folder':'lau_2b_close','close-software':'lau_2b_close','folder-settings':'lau_2b_folder_setting',open:'lau_2b_folder_open','create-folder':'lau_1b_make_folder',resume:'lau_2b_restart'}[action],{'close-folder':'Close','close-software':'Close','folder-settings':'Settings',open:'Open','create-folder':'Create Folder',resume:'Resume'}[action]);
  const right=label(rightAction),left=label(leftAction);
  for(const prefix of ['T_BtnBW','T_BtnFW','T_BtnPW']){overrides[`${prefix}_C_01`]=right;overrides[`${prefix}_R_02`]=right;overrides[`${prefix}_L_03`]=left;}
  const bindings=[binding('LncBtmBtn_02_SceneIn',15)],gesture=getHomeGestureView(state);
  if(!state.panel&&gesture?.mode==='press'&&gesture.y>=212&&gesture.y<240&&gesture.x>=0&&gesture.x<320){
   const group=two?(gesture.x<100?'G_BtnW_L_03':'G_BtnW_R_02'):'G_BtnW_C_01';bindings.push(binding('LncBtmBtn_02_Select',1,[group]));
  }
  return renderer.draw(ctx,'launcher','LncBtmBtn_02',{bindings,overrides,clip:[0,210,320,30]});
 }
 function tile(ctx:Context,x:number,y:number,size:number,density:number,folder:boolean,receiving=false,folderName=''){
  const name=folder?(receiving?'LncIconFolderInT_00':'LncIconFolder_00'):'LncIconSetSrc_00';
  // SetSrc stores the ordinary plate at +32 and the empty-slot source at -32.
  const frame=nativeHomeDensityFrame(density),drawn=renderer.draw(ctx,'launcher',name,{center:[x+size/2-(folder?0:32),y+size/2],bindings:[binding(name+'_Scale',frame)],overrides:folder?{}:{N_Color_01:{visible:false},N_Pic_01:{visible:false}}});
  const glyph=folder&&folderGlyph(folderName);
  if(glyph){
   // 0x1d7f3c → 0x256df4 → 0x257254: plain folder glyph size/Y tables.
   const width=nativeHomeDensityMetric([32,32,24,20,18,16],frame),offset=nativeHomeDensityMetric([-6,-6,-3,-3,-2,-1],frame);
   renderer.draw(ctx,'launcher','LncIconDist_01',{center:[x+size/2,y+size/2],textures:{[glyphTexture]:glyph},overrides:{
    // The folder plate above supplies the separately rendered button surface.
    P_IconBtnDmy_00:{size:[0,0]},P_Icon_00:{size:[width,width],translation:[0,offset,0],textureBindings:{0:glyphTexture}}
   }});
  }
  return drawn;
 }
 /** Fresh opening capture replaces only the selected ordinary folder instance.
  * Native priority414 T precedes priority412 B; preserve authored pane geometry.
  */
 function captureFolder(ctx:Context,x:number,y:number,size:number,density:number,name:string){
  const center:[number,number]=[x+size/2,y+size/2],frame=nativeHomeDensityFrame(density);
  const top='LncIconFolderInT_00',bottom='LncIconFolderInB_00',glyph=folderGlyph(name);
  const drawn=renderer.draw(ctx,'launcher',top,{center,bindings:[binding(top+'_Scale',frame),{...binding(top+'_PicToggle',0),childBinding:false}]});
  renderer.draw(ctx,'launcher',bottom,{center,bindings:[binding(bottom+'_Scale',frame)],textures:glyph?{[glyphTexture]:glyph}:undefined,overrides:{
   P_Icon_00:glyph?{visible:true,textureBindings:{0:glyphTexture,1:'IconMask.bclim'}}:{visible:false},P_IconPrize_00:{visible:false}
  }});
  return drawn;
 }
 function empty(ctx:Context,x:number,y:number,size:number,density:number){
  const name='LncIconSetSrc_00';return renderer.draw(ctx,'launcher',name,{center:[x+size/2+32,y+size/2],bindings:[binding(name+'_Scale',nativeHomeDensityFrame(density))],overrides:{N_IconRoot_00:{visible:false},P_BtnShdw_00:{visible:false},N_Pic_01:{visible:false}}});
 }
 function cursor(ctx:Context,x:number,y:number,size:number,density:number,time:number,pressed=false){
  return renderer.draw(ctx,'launcher','LncCsr_00',{center:[x+size/2,y+size/2],bindings:[binding('LncCsr_00_Select',pressed?5:0),binding('LncCsr_00_Scale',nativeHomeDensityFrame(density)),binding('LncCsr_00_Loop',time*.06)]});
 }
 function arrows(ctx:Context,showLeft:boolean){return renderer.draw(ctx,'launcher','LncArw_00',{bindings:[binding('LncArw_00_Appear',15)],overrides:{N_arwL_00:{visible:showLeft}},clip:[0,33,320,179]});}
 const pickupSizes=new Map<string,{x:number;y:number;width:number;height:number;alpha:number}>();
 function pickup(ctx:Context,x:number,y:number,size:number,density:number,folder:boolean,folderName=''){
  const name=folder?'LncIconFolderPickUp_00':'LncIconPickUp_00',frame=nativeHomeDensityFrame(density);
  const glyph=folder&&folderGlyph(folderName);
  const drawn=renderer.draw(ctx,'launcher',name,{center:[x,y],bindings:[binding(name+'_Scale',frame)],textures:glyph?{[glyphTexture]:glyph}:undefined,overrides:{
   P_Icon_00:glyph?{visible:true,textureBindings:{0:glyphTexture,1:'IconMask.bclim'}}:{visible:false},P_IconPrize_00:{visible:false}
  }});
  // Native P_Icon is a direct child of RootPane; retain its sampled bounds for portfolio artwork.
  const key=`${name}:${frame}`;let rect=pickupSizes.get(key);
  if(!rect){const pack=renderer.packs.launcher,posed=poseNativeLayout(pack.layouts[name],pack.animations,[binding(name+'_Scale',frame)]),pane=posed.roots[0].children.find(p=>p.name==='P_Icon_00')!;
   rect={x:pane.translation[0]-pane.size[0]/2,y:-pane.translation[1]-pane.size[1]/2,width:pane.size[0],height:pane.size[1],alpha:pane.alpha/255};if(pickupSizes.size>=16)pickupSizes.delete(pickupSizes.keys().next().value!);pickupSizes.set(key,rect);}
  return {drawn,icon:{x:x+rect.x,y:y+rect.y,width:rect.width,height:rect.height,alpha:rect.alpha}};
 }
 function liftedSource(ctx:Context,x:number,y:number,size:number,density:number){
  const name='LncIconPickUpBlank_00';return renderer.draw(ctx,'launcher',name,{center:[x+size/2,y+size/2],bindings:[binding(name+'_Scale',nativeHomeDensityFrame(density))]});
 }
 return {hud,upperBase,folderBalloon,folderBannerLabel,toolbar,homePlate,folderBackdrop,folderChrome,footer,tile,captureFolder,empty,cursor,arrows,pickup,liftedSource,pressOffset,rows:rowCount};
}
