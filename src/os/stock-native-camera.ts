import type { AppView, JsonValue } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { cameraBrowseCellRect, cameraBrowsePane, stockScreenTargets } from './stock-screen-layout';
import { cameraAnchorPosition, cameraMaxAnchor, cameraStripOffset, readCameraBrowse, CAMERA_BROWSE_PAGE_WIDTH } from './camera-browse.ts';
import { nativeMessageColorSpans, nativeMessageOverride, type NativeLayout } from './native-layout';

export const cameraScreenPacks:readonly NativeTitlePackRequest[]=[{
  url:'packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json',alias:'camera-gallery',
  layouts:['P_BrwsBase_D','P_BrwsFld','P_BrwsPic','P_BrwsCursor_D','P_BrwsPhoMntBase','P_BrwsTxt_D','P_BrwsMenu_D'],
  animations:[
    'P_BrwsBase_D_Brws',
    'P_BrwsBase_D_Default',
    'P_BrwsFld_Default','P_BrwsFld_PicL',
    'P_BrwsPic_Default','P_BrwsPic_PicL',
    'P_BrwsCursor_D_Default','P_BrwsCursor_D_CurDefault','P_BrwsCursor_D_PicL',
    'P_BrwsPhoMntBase_PicL',
    'P_BrwsMenu_D_Brws',
  ],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json',alias:'camera-shoot',
  layouts:['P_Shoot_D','P_CamBtn','P_CamIcon'],
  animations:['P_Shoot_D_Disable','P_CamBtn_Disable','P_CamIcon_IconPtrn'],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json',alias:'camera-finder',
  layouts:['P_FinderVS_U','P_Finder_U'],animations:[],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-Parakeet-arc-LZ.json',alias:'camera-bird',
  layouts:['ParakeetA_D'],animations:['ParakeetA_D_Wait'],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-C-Sld.json',alias:'camera-slider',
  layouts:['C_SldH_S'],animations:['C_SldH_S_Default','C_SldH_S_Rate'],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-C-Dlg.json',alias:'camera-dialog',
  layouts:['C_DlgChA','C_DlgGuid1BtnW','C_DlgGuid2Btn','C_DlgGuid_U'],animations:['C_DlgGuid1BtnW_Default','C_DlgGuid2Btn_Default'],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-P_Guid_U-arc-LZ.json',alias:'camera-guide-upper',
  layouts:['P_Guid01_U','P_Guid02_U','P_Guid05_U'],animations:[],
},{
  url:'packs/camera/contents/0000-0000001a/lyt-C-Icon.json',alias:'camera-icons',layouts:['C_IconSD'],animations:[],
},{url:'packs/camera/contents/0000-0000001a/msg-EU_English.json',alias:'camera-messages',layouts:[],animations:[]}];
type RecordValue=Record<string,JsonValue>;
const record=(value:JsonValue|undefined):RecordValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const records=(value:JsonValue|undefined)=>Array.isArray(value)?value.map(record):[];
const str=(value:JsonValue|undefined)=>typeof value==='string'?value:'';
const cameraTitle=(id:string)=>id==='camera'||id==='camera-applet';
/** Native populated browse capture, lower LCD background (255,161,0).
 * The source UserBG material exposes a runtime colour slot, defaulting blue. */
export const cameraBrowseUserColor=[255,161,0,255] as const;
export function cameraBrowseOrange(source:NativeLayout):NativeLayout{
  const posed=structuredClone(source),material=posed.materials.find(item=>item.name==='UserBG');
  if(!material||material.constantColors[5]?.join(',')!=='0,128,255,255')throw new Error('Missing Camera source UserBG colour slot');
  material.constantColors[5]=[...cameraBrowseUserColor];
  return posed;
}
const browseBackgrounds=new WeakMap<NativeLayoutRenderer,NativeLayout>();
export function cameraDateGroupOrange(source:NativeLayout):NativeLayout{
  const posed=structuredClone(source),material=posed.materials.find(item=>item.name==='ThmbBase');
  if(!material||material.constantColors[5]?.join(',')!=='120,193,31,255')throw new Error('Missing Camera source date-group colour slot');
  material.constantColors[5]=[...cameraBrowseUserColor];
  return posed;
}
const browseDateGroups=new WeakMap<NativeLayoutRenderer,NativeLayout>();
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
/** P_BrwsMenu_D/-Navi is the native browse parakeet mount. */
export const cameraBrowseBirdCenter=[48,158] as const;
/** P_BrwsBase_D/-L-Sld: native horizontal browse slider mount. */
export const cameraBrowseSliderCenter=[160,196] as const;
/** Capture-fitted bridge from the read-only strip output to C_SldH_S_Rate's 0–100 frames. */
export function cameraBrowseSliderFrame(output:number,count:number):number{
  const max=cameraAnchorPosition(cameraMaxAnchor(count),count);
  return max>0?Math.round(Math.max(0,Math.min(1,output/max))*100):0;
}

/** RI.mstl +8 is the little-endian RGBA word also used by the Sound guide.
 * Bind only explicitly supplied Camera messages; never recolour other panes. */
export function cameraMessageColors(source:NativeLayout,messages:Readonly<Record<string,ReturnType<typeof nativeMessageOverride>>>):NativeLayout{
  const posed=structuredClone(source);
  const visit=(panes:typeof posed.roots)=>{for(const pane of panes){
    const word=messages[pane.name]?.messageStyle?.unresolvedWords?.['8'];
    if(pane.text&&typeof word==='number'&&Number.isInteger(word)&&word>=0&&word<=0xffffffff){
      const color=[word&255,(word>>>8)&255,(word>>>16)&255,(word>>>24)&255];
      pane.text.topColor=[...color];pane.text.bottomColor=[...color];
    }
    visit(pane.children);
  }};
  visit(posed.roots);return posed;
}

/** Read-only portfolio gallery composed from native album art. The runtime owns
 * paging and selection; visible source zoom chrome has no capture/zoom action.
 */
export function drawNativeCameraLower(renderer:NativeLayoutRenderer,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(!cameraTitle(view.appId))return false;
  const data=view.data??{},folders=records(data.folders),photos=records(data.photos);
  const image=(photo:RecordValue,x:number,y:number,w:number,h:number)=>{
    const url=str(photo.thumbnail)||str(photo.src);return url?options.image?.(bottom,url,x,y,w,h)??false:false;
  };
  let okay=true;
  const draw=(layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(bottom,'camera-gallery',layout,opts)&&okay;};
  const base=renderer.packs['camera-gallery']?.layouts?.P_BrwsBase_D;
  if(!base)return false;
  let orange=browseBackgrounds.get(renderer);
  if(!orange){orange=cameraBrowseOrange(base);browseBackgrounds.set(renderer,orange);}
  okay=renderer.drawLayout(bottom,'camera-gallery','P_BrwsBase_D',orange,{bindings:[{name:'P_BrwsBase_D_Brws',frame:0}],overrides:{UserBG:{visible:true},BG:{visible:false}}})&&okay;
  if(view.screen==='photo'){
    const [x,y,w,h]=cameraPhotoMountRect;
    image(record(data.photo),x,y,w,h);
    draw('P_BrwsPhoMntBase',{bindings:[{name:'P_BrwsPhoMntBase_PicL',frame:0}],overrides:{'-PhoMntPos':{visible:false}}});
  }else{
    draw('P_BrwsPhoMntBase',{bindings:[{name:'P_BrwsPhoMntBase_PicL',frame:0}]});
    const offset=view.screen==='gallery'?cameraStripOffset(readCameraBrowse(data.cameraBrowse).output):Math.floor(view.selection/6)*CAMERA_BROWSE_PAGE_WIDTH;
    bottom.save();bottom.beginPath();bottom.rect(cameraBrowsePane.x,cameraBrowsePane.y,cameraBrowsePane.width,cameraBrowsePane.height);bottom.clip();
    for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){
      const row=view.rows[r.row!],rect=cameraBrowseCellRect(r.row!,offset),x=rect[0]+rect[2]/2,y=rect[1]+rect[3]/2;
      if(view.screen==='main'||row.id==='camera-date-group'){
        const folder=folders.find(f=>'folder:'+str(f.id)===row.id);
        // Native first cell is a photo-date group. Portfolio files provide no
        // shared capture date, so retain the source cell without fabricated date text.
        const opts={center:[x,y] as [number,number],bindings:row.id==='camera-date-group'?[{name:'P_BrwsFld_PicL',frame:0}]:[{name:'P_BrwsFld_Default',frame:0},{name:'P_BrwsFld_PicL',frame:0}],overrides:{TxtThmb:{text:row.id==='camera-date-group'?'':String(records(folder?.photos).length)}}};
        if(row.id==='camera-date-group'){
          let dateGroup=browseDateGroups.get(renderer);
          if(!dateGroup){const source=renderer.packs['camera-gallery']?.layouts?.P_BrwsFld;if(!source)return false;dateGroup=cameraDateGroupOrange(source);browseDateGroups.set(renderer,dateGroup);}
          okay=renderer.drawLayout(bottom,'camera-gallery','P_BrwsFld',dateGroup,opts)&&okay;
        }else draw('P_BrwsFld',opts);
      }else{
        const shown=image(photos.find(p=>'photo:'+str(p.id)===row.id)??{},...cameraThumbPicRect(x,y));
        // Hide only the load placeholder. ThmbMask is an unflagged child, so it
        // still composites after the portfolio pixels at the source 56×42 slot.
        draw('P_BrwsPic',{center:[x,y],bindings:[{name:'P_BrwsPic_Default',frame:0},{name:'P_BrwsPic_PicL',frame:0}],overrides:shown?{ThmbPic:{alpha:0}}:{}});
      }
      if(r.row===view.selection)draw('P_BrwsCursor_D',{center:[x,y],bindings:[{name:'P_BrwsCursor_D_Default',frame:0},{name:'P_BrwsCursor_D_CurDefault',frame:0},{name:'P_BrwsCursor_D_PicL',frame:0}]});
    }
    bottom.restore();
    if(view.screen==='gallery'&&view.rows.length){
      const output=readCameraBrowse(data.cameraBrowse).output;
      okay=renderer.draw(bottom,'camera-slider','C_SldH_S',{center:[...cameraBrowseSliderCenter],bindings:[
        {name:'C_SldH_S_Default',frame:20},
        {name:'C_SldH_S_Rate',frame:cameraBrowseSliderFrame(output,view.rows.length)},
      ]})&&okay;
    }
    if(!view.rows.length)draw('P_BrwsTxt_D',{overrides:{TxtNoData:{...nativeMessageOverride(renderer.packs['camera-messages'],'P','Brws_06',''),size:[280,56]}}});
    // The visible browse controls are the source Slideshow/Shoot/Settings
    // panes. Capture and settings operations stay inert in this read-only app;
    // the physical B button remains the explicit return adaptation.
    const message=(label:string)=>nativeMessageOverride(renderer.packs['camera-messages'],'P',label,'');
    const menu=renderer.packs['camera-gallery']?.layouts?.P_BrwsMenu_D;
    if(!menu)return false;
    const menuOptions={bindings:[{name:'P_BrwsMenu_D_Brws',frame:0}],overrides:{
      TxtSShow:message('Brws_02'),TxtShoot:message('Brws_03'),TxtSet:message('setting'),
    }};
    const menuPose=cameraMessageColors(menu,menuOptions.overrides);
    okay=renderer.drawLayout(bottom,'camera-gallery','P_BrwsMenu_D',menuPose,menuOptions)&&okay;
    if(view.screen==='gallery')okay=renderer.draw(bottom,'camera-bird','ParakeetA_D',{
      center:[...cameraBrowseBirdCenter],bindings:[{name:'ParakeetA_D_Wait',frame:0}],
    })&&okay;
  }
  return okay;
}

/** Capture-fitted Welcome theme, limited to named source user-colour slots.
 * Other material constants, texture maps and authored panes remain intact. */
export function cameraShootWelcomeTheme(source:NativeLayout):NativeLayout{
  const posed=structuredClone(source);
  for(const [name,expected] of [['ShootLBase','0,128,255,255'],['ShootRBase','0,128,255,255'],['Lever1','0,128,255,255'],['UserWdw1','145,221,210,255']]){
    const material=posed.materials.find(item=>item.name===name);
    if(!material||material.constantColors[5]?.join(',')!==expected)throw new Error('Missing Camera shoot colour slot '+name);
    material.constantColors[5]=[...cameraBrowseUserColor];
  }
  return posed;
}
const shootWelcomeLayouts=new WeakMap<NativeLayoutRenderer,NativeLayout>();
function drawCameraShootWelcome(renderer:NativeLayoutRenderer,bottom:CanvasRenderingContext2D):boolean{
  const source=renderer.packs['camera-shoot']?.layouts?.P_Shoot_D;
  if(!source)return false;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['camera-messages'],'P',label,'');
  const overrides={TxtBtn:message('Shoot_01'),TxtShootL:message('Shoot_00'),TxtShootR:message('Shoot_00'),TxtBrws:message('Shoot_05'),TxtSet:message('setting')};
  let layout=shootWelcomeLayouts.get(renderer);
  if(!layout){layout=cameraMessageColors(cameraShootWelcomeTheme(source),overrides);shootWelcomeLayouts.set(renderer,layout);}
  bottom.save();
  try{
    // Native exposed orange is (127,81,0), near half of (255,161,0).
    // This 2D-only brightness fit is not a replay of the native guide mask.
    bottom.filter='brightness(0.5)';
    let childrenOkay=true;
    const parentOkay=renderer.drawLayout(bottom,'camera-shoot','P_Shoot_D',layout,{
      bindings:[{name:'P_Shoot_D_Disable',frame:0}],overrides,
      attachments:{'-L-BtnIOcam':()=>{
        // Source LYT links P_Shoot_D/P_CamBtn, then P_Shoot_D/P_CamIcon.
        // Disable frame 0 is a capture-fitted Welcome candidate: the original
        // controller selection is unverified. Geometry stays at source anchors.
        childrenOkay=renderer.draw(bottom,'camera-shoot','P_CamBtn',{
          bindings:[{name:'P_CamBtn_Disable',frame:0}],
          attachments:{'-L-CamIcon':()=>{
            // Source anchor ANM_IconPtrn=[0] selects Icam. This authored default
            // does not establish the Welcome controller's active camera state.
            childrenOkay=renderer.draw(bottom,'camera-shoot','P_CamIcon',{
              bindings:[{name:'P_CamIcon_IconPtrn',frame:0}],
            })&&childrenOkay;
          }},
        })&&childrenOkay;
      }},
    });
    return parentOkay&&childrenOkay;
  }finally{bottom.restore();}
}

/** Original Guide_snk.gbin first GUID: D_003_0..4, modes 2/3/3/3/4.
 * Illustration names come from each message's group 4/type 1 token. */
export const cameraWelcomePages=[
  {label:'D_003_0',illustration:null},
  {label:'D_003_1',illustration:null},
  {label:'D_003_2',illustration:'P_Guid05_U'},
  {label:'D_003_3',illustration:'P_Guid01_U'},
  {label:'D_003_4',illustration:'P_Guid02_U'},
] as const;
export function drawNativeCameraGuide(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions={}):boolean{
  const raw=view.data?.guidePage,page=typeof raw==='number'?Math.max(0,Math.min(4,Math.floor(raw))):0;
  const entry=cameraWelcomePages[page],first=page===0;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['camera-messages'],'P_tips',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,opts)&&okay;};
  // The reference is a black emulated finder. Capacity 3000 and SD are its
  // fixture state, not browser storage/device readings. Capture stays disabled.
  top.fillStyle='#000';top.fillRect(0,0,400,240);
  bottom.fillStyle='#000';bottom.fillRect(0,0,320,240);
  if(options.cameraShoot)okay=options.cameraShoot.draw(bottom)&&okay;
  okay=drawCameraShootWelcome(renderer,bottom)&&okay;
  const capacity=nativeMessageOverride(renderer.packs['camera-messages'],'P','Finder_Pho_00_00','');
  // The monoscopic reference uses the source 2DView material (100/255 grey),
  // which shares the cube texture with the white 3DView material.
  draw(top,'camera-finder','P_Finder_U',{overrides:{
    Grid:{visible:false},ShootInfoDlg:{visible:false},ShootInfo:{visible:false},State_IcamOcam:{visible:false},
    MovRem:{visible:false},MovInt:{visible:false},RecSign:{visible:false},State_PhoMov:{visible:false},MovFrm:{visible:false},
    '3DView':{visible:false},'2DView':{visible:true},ShootCapa_Pho:{...capacity,text:capacity.text+'3000'},
  }});
  // P_Finder_U/Storage/-L-SD has world translation (187,-105).
  draw(top,'camera-icons','C_IconSD',{center:[387,225]});
  if(entry.illustration){draw(top,'camera-dialog','C_DlgGuid_U');draw(top,'camera-guide-upper',entry.illustration);}
  // Both source guide button containers mount this body at identity; the body
  // includes its own Bird artwork. Entry/exit animation remains unported.
  draw(bottom,'camera-dialog','C_DlgChA');
  const total=message('Guide_D_00_00'),current=message('Guide_D_00_01');
  const width=total.messageStyle?.unresolvedWords?.['0'];
  if(width!==48||current.messageStyle?.unresolvedWords?.['0']!==48)return false;
  // Shared RI.mstl counter width; 24px height follows the documented Sound guide adapter.
  const common={TxtDlg:{...message(entry.label),colorSpans:nativeMessageColorSpans(renderer.packs['camera-messages'],'P_tips',entry.label)},TxtNumber0:{...total,text:total.text+'5',size:[width,24]},TxtNumber1:{...current,text:`${page+1}${current.text}`,size:[width,24]}};
  const layout=first?'C_DlgGuid1BtnW':'C_DlgGuid2Btn';
  const overrides=first?{...common,Guid1TxtW:message('Guide_D_N_Btn0')}:{...common,Guid2TxtB:message('Guide_D_BN_Btn0'),Guid2TxtW:message(page===4?'Guide_D_BO_Btn1':'Guide_D_BN_Btn1')};
  const source=renderer.packs['camera-dialog']?.layouts?.[layout];
  if(!source)return false;
  okay=renderer.drawLayout(bottom,'camera-dialog',layout,cameraMessageColors(source,overrides),{textSampling:'lcd-source-size',bindings:[{name:layout+'_Default',frame:0}],overrides})&&okay;
  return okay;
}

/** Source `P_FinderVS_U` browse upper with portfolio photos as the 400×240 view
 * replacement. `C_Titl_U` is Settings (`P_Set_U` / `Set_Title`), not this scene.
 */
export function drawNativeCameraFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(!cameraTitle(view.appId))return false;
  if(view.appId==='camera'&&view.screen==='guide')return drawNativeCameraGuide(renderer,top,bottom,view,options);
  const data=view.data??{},folders=records(data.folders),photos=records(data.photos);
  const selected=view.rows[view.selection];
  const folder=folders.find(f=>'folder:'+str(f.id)===selected?.id);
  const photo=view.screen==='photo'?record(data.photo):view.screen==='gallery'?photos.find(p=>'photo:'+str(p.id)===selected?.id)??photos[0]??{}:records(folder?.photos)[0]??{};
  const empty=view.screen==='main'&&!view.rows.length;
  const folderView=view.screen==='main'&&!empty;
  const count=folderView?records(folder?.photos).length:photos.length;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['camera-messages'],'P',label,'');
  top.fillStyle='#000';top.fillRect(0,0,400,240);
  // P_FinderVS_U supplies the 400×240 frame. Portfolio JPEGs have no stereo
  // metadata: use the native mono branch of 0x210230, not MPO framing.
  if(view.screen==='gallery'||view.screen==='photo'){
    const url=str(photo.thumbnail)||str(photo.src);
    if(url)options.image?.(top,url,0,0,400,240,'camera-mono');
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
