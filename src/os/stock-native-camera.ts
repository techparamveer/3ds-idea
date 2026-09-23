import type { AppView, JsonValue } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { stockScreenTargets } from './stock-screen-layout';

export const cameraScreenPacks:readonly NativeTitlePackRequest[]=[{
  url:'packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json',alias:'camera-gallery',
  layouts:['P_BrwsBase_D','P_BrwsFld','P_BrwsPic','P_BrwsCursor_D','P_BrwsPhoMntBase','P_BrwsTxt_D'],
  animations:['P_BrwsBase_D_Default','P_BrwsFld_Default','P_BrwsPic_Default','P_BrwsCursor_D_Default','P_BrwsCursor_D_CurDefault','P_BrwsPhoMntBase_PicL'],
}];
type RecordValue=Record<string,JsonValue>;
const record=(value:JsonValue|undefined):RecordValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const records=(value:JsonValue|undefined)=>Array.isArray(value)?value.map(record):[];
const str=(value:JsonValue|undefined)=>typeof value==='string'?value:'';

/** Read-only portfolio gallery composed from native album art. The runtime owns
 * paging and selection; inactive zoom/capture controls are explicitly hidden.
 */
export function drawNativeCameraLower(renderer:NativeLayoutRenderer,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId!=='camera'&&view.appId!=='camera-applet')return false;
  const data=view.data??{},folders=records(data.folders),photos=records(data.photos);
  const text=(value:string,x:number,y:number,size=12)=>{
    if(options.font)options.font.draw(bottom,value,x,y,size,'#665529','center');
    else{bottom.fillStyle='#665529';bottom.font=`${size}px sans-serif`;bottom.textAlign='center';bottom.textBaseline='middle';bottom.fillText(value,x,y);}
  };
  const image=(photo:RecordValue,x:number,y:number,w:number,h:number)=>{
    const url=str(photo.thumbnail)||str(photo.src);return url?options.image?.(bottom,url,x,y,w,h)??false:false;
  };
  let okay=true;
  const draw=(layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(bottom,'camera-gallery',layout,opts)&&okay;};
  // UserBG carries a blue replacement default. Keep the source neutral BG
  // visible until the native runtime background binding is available.
  draw('P_BrwsBase_D',{bindings:[{name:'P_BrwsBase_D_Default',frame:0}],overrides:{UserBG:{visible:false},BG:{visible:true,alpha:255},'-B-ZoomUp':{visible:false},'-B-ZoomBack':{visible:false}}});
  text(view.heading,160,16,14);
  if(view.screen==='photo'){
    draw('P_BrwsPhoMntBase',{bindings:[{name:'P_BrwsPhoMntBase_PicL',frame:0}]});
    image(record(data.photo),48,43,224,128);text(str(record(data.photo).title),160,197,12);
    for(const r of stockScreenTargets(view).filter(r=>r.action==='previous'||r.action==='next')){
      bottom.fillStyle='#fffbe4';bottom.strokeStyle='#baa574';bottom.beginPath();bottom.roundRect(r.x,r.y,r.width,r.height,5);bottom.fill();bottom.stroke();text(r.action==='previous'?'‹':'›',r.x+r.width/2,r.y+r.height/2,24);
    }
  }else{
    for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){
      const row=view.rows[r.row!],x=r.x+r.width/2,y=r.y+27;
      if(view.screen==='main'){
        const folder=folders.find(f=>'folder:'+str(f.id)===row.id);
        draw('P_BrwsFld',{center:[x,y],bindings:[{name:'P_BrwsFld_Default',frame:0}],overrides:{TxtThmb:{text:String(records(folder?.photos).length)}}});
      }else{
        draw('P_BrwsPic',{center:[x,y],bindings:[{name:'P_BrwsPic_Default',frame:0}],overrides:{ThmbPic:{visible:false}}});
        image(photos.find(p=>'photo:'+str(p.id)===row.id)??{},x-28,y-21,56,42);
      }
      if(r.row===view.selection)draw('P_BrwsCursor_D',{center:[x,y],bindings:[{name:'P_BrwsCursor_D_Default',frame:0},{name:'P_BrwsCursor_D_CurDefault',frame:0}]});
      text(row.label,x,r.y+61,10);
    }
    if(!view.rows.length)draw('P_BrwsTxt_D',{overrides:{TxtNoData:{text:'No photos',size:[240,24]}}});
  }
  return okay;
}
