import type { AppView, JsonValue } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { stockScreenTargets } from './stock-screen-layout';
import { nativeMessageOverride } from './native-layout';

export const cameraScreenPacks:readonly NativeTitlePackRequest[]=[{
  url:'packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json',alias:'camera-gallery',
  layouts:['P_BrwsBase_D','P_BrwsFld','P_BrwsPic','P_BrwsCursor_D','P_BrwsPhoMntBase','P_BrwsTxt_D'],
  animations:[
    'P_BrwsBase_D_Default',
    'P_BrwsFld_Default','P_BrwsFld_PicL',
    'P_BrwsPic_Default','P_BrwsPic_PicL',
    'P_BrwsCursor_D_Default','P_BrwsCursor_D_CurDefault','P_BrwsCursor_D_PicL',
    'P_BrwsPhoMntBase_PicL',
  ],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json',alias:'camera-finder',
  layouts:['P_FinderVS_U'],animations:[],
},{url:'packs/camera/contents/0000-0000001a/msg-EU_English.json',alias:'camera-messages',layouts:[],animations:[]}];
type RecordValue=Record<string,JsonValue>;
const record=(value:JsonValue|undefined):RecordValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const records=(value:JsonValue|undefined)=>Array.isArray(value)?value.map(record):[];
const str=(value:JsonValue|undefined)=>typeof value==='string'?value:'';
const cameraTitle=(id:string)=>id==='camera'||id==='camera-applet';
/** Source `P_FinderVS_U` capture/error overlays kept out of the read-only gallery. */
const cameraUpperHidden={
  Preview:{visible:false},FocusAdj:{visible:false},ImageInfo:{visible:false},ViewInfo:{visible:false},
  Fit:{visible:false},MovInfo:{visible:false},BrwsError:{visible:false},'Brws_U_fold_Bir':{visible:false},
  Txt_Date:{visible:false},Txt_total:{visible:false},Txt_data4:{visible:false},Txt_data5:{visible:false},
};

/** Lower-LCD rectangle for a centered native pane. Canvas Y is flipped. */
export function nativeLowerPaneRect(translation:readonly number[],size:readonly number[],canvas:readonly number[]=[320,240]):[number,number,number,number]{
  return [canvas[0]/2+translation[0]-size[0]/2,canvas[1]/2-translation[1]-size[1]/2,size[0],size[1]];
}
/** Source `P_BrwsPhoMntBase/-PhoMntPos`: translation [0, 13], size 256×128, origin 4. */
export const cameraPhotoMountRect=nativeLowerPaneRect([0,13],[256,128]);
/** Source `P_BrwsPic/ThmbPic` size. */
export const cameraThumbPicSize=[56,42] as const;
export function cameraThumbPicRect(centerX:number,centerY:number):[number,number,number,number]{
  return [centerX-cameraThumbPicSize[0]/2,centerY-cameraThumbPicSize[1]/2,cameraThumbPicSize[0],cameraThumbPicSize[1]];
}
/** Source `P_FinderVS_U/Brws_U_fold`: translation [-108, 0], size 128×96, origin 4. */
export const cameraFolderPicSize=[128,96] as const;
export const cameraFolderPicRect=nativeLowerPaneRect([-108,0],[128,96],[400,240]);

/** Read-only portfolio gallery composed from native album art. The runtime owns
 * paging and selection; inactive zoom/capture controls are explicitly hidden.
 */
export function drawNativeCameraLower(renderer:NativeLayoutRenderer,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(!cameraTitle(view.appId))return false;
  const data=view.data??{},folders=records(data.folders),photos=records(data.photos);
  const image=(photo:RecordValue,x:number,y:number,w:number,h:number)=>{
    const url=str(photo.thumbnail)||str(photo.src);return url?options.image?.(bottom,url,x,y,w,h)??false:false;
  };
  let okay=true;
  const draw=(layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(bottom,'camera-gallery',layout,opts)&&okay;};
  // UserBG carries a blue replacement default. Keep the source neutral BG
  // visible until the native runtime background binding is available.
  draw('P_BrwsBase_D',{bindings:[{name:'P_BrwsBase_D_Default',frame:0}],overrides:{UserBG:{visible:false},BG:{visible:true,alpha:255},'-B-ZoomUp':{visible:false},'-B-ZoomBack':{visible:false}}});
  if(view.screen==='photo'){
    const [x,y,w,h]=cameraPhotoMountRect;
    image(record(data.photo),x,y,w,h);
    draw('P_BrwsPhoMntBase',{bindings:[{name:'P_BrwsPhoMntBase_PicL',frame:0}],overrides:{'-PhoMntPos':{visible:false}}});
  }else{
    for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){
      const row=view.rows[r.row!],x=r.x+r.width/2,y=r.y+27;
      if(view.screen==='main'){
        const folder=folders.find(f=>'folder:'+str(f.id)===row.id);
        draw('P_BrwsFld',{center:[x,y],bindings:[{name:'P_BrwsFld_Default',frame:0},{name:'P_BrwsFld_PicL',frame:0}],overrides:{TxtThmb:{text:String(records(folder?.photos).length)}}});
      }else{
        const shown=image(photos.find(p=>'photo:'+str(p.id)===row.id)??{},...cameraThumbPicRect(x,y));
        // Hide only the load placeholder. ThmbMask is an unflagged child, so it
        // still composites after the portfolio pixels at the source 56×42 slot.
        draw('P_BrwsPic',{center:[x,y],bindings:[{name:'P_BrwsPic_Default',frame:0},{name:'P_BrwsPic_PicL',frame:0}],overrides:shown?{ThmbPic:{alpha:0}}:{}});
      }
      if(r.row===view.selection)draw('P_BrwsCursor_D',{center:[x,y],bindings:[{name:'P_BrwsCursor_D_Default',frame:0},{name:'P_BrwsCursor_D_CurDefault',frame:0},{name:'P_BrwsCursor_D_PicL',frame:0}]});
    }
    if(!view.rows.length)draw('P_BrwsTxt_D',{overrides:{TxtNoData:{...nativeMessageOverride(renderer.packs['camera-messages'],'P','Brws_06',''),size:[280,56]}}});
  }
  return okay;
}

/** Source `P_FinderVS_U` browse upper with portfolio photos as the 400×240 view
 * replacement. `C_Titl_U` is Settings (`P_Set_U` / `Set_Title`), not this scene.
 */
export function drawNativeCameraFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(!cameraTitle(view.appId))return false;
  const data=view.data??{},folders=records(data.folders),photos=records(data.photos);
  const selected=view.rows[view.selection];
  const folder=folders.find(f=>'folder:'+str(f.id)===selected?.id);
  const photo=view.screen==='photo'?record(data.photo):view.screen==='gallery'?photos.find(p=>'photo:'+str(p.id)===selected?.id)??{}:records(folder?.photos)[0]??{};
  const empty=view.screen==='main'&&!view.rows.length;
  const folderView=view.screen==='main'&&!empty;
  const count=folderView?records(folder?.photos).length:photos.length;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['camera-messages'],'P',label,'');
  top.fillStyle='#000';top.fillRect(0,0,400,240);
  // Native browse shows the selected image in the upper viewfinder framebuffer.
  if(view.screen==='gallery'||view.screen==='photo'){
    const url=str(photo.thumbnail)||str(photo.src);
    if(url)options.image?.(top,url,0,0,400,240);
  }
  const upper=renderer.draw(top,'camera-finder','P_FinderVS_U',{overrides:{
    ...cameraUpperHidden,
    BrwsNoData:{visible:empty},
    BrwsFolder:{visible:folderView},
    Txt_NoData:empty?message('Brws_U_04'):{visible:false},
    Txt_data2:message('Brws_U_01_01'),
    Txt_data3:{...message('Brws_U_02_01'),text:String(count)},
  }});
  return drawNativeCameraLower(renderer,bottom,view,options)&&upper;
}
