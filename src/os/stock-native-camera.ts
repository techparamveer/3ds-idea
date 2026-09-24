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
},{url:'packs/camera/contents/0000-0000001a/msg-EU_English.json',alias:'camera-messages',layouts:[],animations:[]}];
type RecordValue=Record<string,JsonValue>;
const record=(value:JsonValue|undefined):RecordValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const records=(value:JsonValue|undefined)=>Array.isArray(value)?value.map(record):[];
const str=(value:JsonValue|undefined)=>typeof value==='string'?value:'';

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

/** Read-only portfolio gallery composed from native album art. The runtime owns
 * paging and selection; inactive zoom/capture controls are explicitly hidden.
 */
export function drawNativeCameraLower(renderer:NativeLayoutRenderer,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId!=='camera'&&view.appId!=='camera-applet')return false;
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
