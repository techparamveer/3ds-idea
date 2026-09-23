import type { AppView } from './app-types';
import { nativeMessageOverride } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';

const browserPrefix='packs/browser/contents/0000-0000001f/',miiversePrefix='packs/miiverse/';
const browserButtons=[
  ['search','SearchButton','SearchBtnPos','StartMenu_Search'],
  ['bookmarks','FavoriteButton','FavoriteBtnPos','StartMenu_Favorite'],
  ['add-bookmark','FavoriteAddButton','AddMenuBtnPos','StartMenu_Add'],
  ['settings','OptionButton','OptionBtnPos',''],
  ['page-info','PageInfoButton','PageInfoBtnPos',''],
  ['address','AddressButton','AddressBtnPos',''],
];
const miiverseButtons=[['communities','CommunityButton'],['activity','ActivityButton'],['profile','MyMenuButton'],['notifications','NotificationButton']];
export const browserScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:browserPrefix+'layout-BG.json',alias:'web-bg',layouts:['BG'],animations:[]},
  {url:browserPrefix+'layout-start-dialog-StartDialog.json',alias:'web-menu',layouts:['StartDialog'],animations:['StartDialog_FadeIn']},
  ...browserButtons.map(([,name])=>({url:browserPrefix+'layout-start-dialog-'+name+'.json',alias:name,layouts:[name],animations:[name+'_FocusedOnOff']})),
  {url:browserPrefix+'layout-toolbar-ExitButton.json',alias:'web-exit',layouts:['ExitButton'],animations:['ExitButton_FocusedOnOff']},
  {url:browserPrefix+'messages-and-loose.json',alias:'web-messages',layouts:[],animations:[]},
];
export const miiverseScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:miiversePrefix+'layout-BG.json',alias:'web-bg',layouts:['BG'],animations:[]},
  ...miiverseButtons.map(([,name])=>({url:miiversePrefix+'layout-toolbar-'+name+'.json',alias:name,layouts:[name],animations:[name+'_ActiveOnOff',name+'_FocusedOnOff']})),
  {url:miiversePrefix+'layout-toolbar-OliveBack.json',alias:'web-back',layouts:['OliveBack'],animations:['OliveBack_FocusedOnOff']},
  {url:miiversePrefix+'messages-and-loose.json',alias:'web-messages',layouts:[],animations:[]},
];

/** Local source chrome only. Remote Browser pages and Miiverse feeds are absent. */
export function drawNativeWebFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  const browser=view.appId==='browser';if(!browser&&view.appId!=='miiverse')return false;
  const bank=browser?'spider':'cave',message=(label:string)=>{
    const pack=renderer.packs['web-messages'],data=pack.messages[bank],value=data?.messages[data.labels[label]];
    // These web applets can reference a message style table absent from the
    // selected archive. Preserve the original pane's typography in that case.
    if(value?.styleIndex!==undefined&&value.styleIndex!==null&&(!data.styleTable||!pack.styles?.[data.styleTable]?.styles[value.styleIndex]))return {text:value.text};
    return nativeMessageOverride(pack,bank,label,'');
  };
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,opts)&&okay;};
  // The native BG spans two stacked screens. Crop each LCD at its own width;
  // do not squash the original 400-pixel canvas onto the 320-pixel touchscreen.
  draw(top,'web-bg','BG',{center:[200,240]});draw(bottom,'web-bg','BG',{center:[160,0]});
  const text=(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size=15,align:CanvasTextAlign='center')=>{
    if(options.font)options.font.draw(ctx,value,x,y,size,'#585b59',align);
    else{ctx.fillStyle='#585b59';ctx.font=`${size}px sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);}
  };
  text(top,message(browser?'lau_title_web':'lau_title_olive').text??view.heading,200,28,22);
  if(browser){
    if(view.screen==='main'){
      const selected=view.rows[view.selection]?.id;
      const attachments=Object.fromEntries(browserButtons.map(([id,name,mount,label])=>[mount,()=>{
        const localized=label?message(label):undefined;
        const overrides={...(localized?{TextBox:localized,EmbossTxb:localized}:{}),...(id==='search'?{GooglePct:{visible:true},YahooPct:{visible:false},YahooJappanPct:{visible:false},NaverPct:{visible:false},YahooChinaPct:{visible:false}}:{})};
        draw(bottom,name,name,{center:[160,120],bindings:[{name:name+'_FocusedOnOff',frame:selected===id?1:0}],overrides});
      }]));
      draw(bottom,'web-menu','StartDialog',{bindings:[{name:'StartDialog_FadeIn',frame:20}],attachments});
    }else{
      const titles:Record<string,string>={bookmarks:'Bookmarks',history:'History',settings:'Settings',search:'Enter search text',address:'Enter URL','page-info':'Page Info','add-bookmark':'Add'};
      text(bottom,titles[view.screen]??view.heading,160,28,18);
      view.rows.slice(Math.floor(view.selection/4)*4,Math.floor(view.selection/4)*4+4).forEach((row,i)=>text(bottom,row.label,24,56+i*39,14,'left'));
    }
    const close=view.screen==='main'?message('StartMenu_End'):{text:view.footer.left?.label??'Back'};
    draw(bottom,'web-exit','ExitButton',{center:[53,226],bindings:[{name:'ExitButton_FocusedOnOff',frame:0}],overrides:{TextBox:close,EmbossTxb:close}});
  }else{
    const active=view.screen==='main'?view.rows[view.selection]?.id:typeof view.data?.field==='string'?view.data.field:'';
    const names:Record<string,string>={communities:'Communities',activity:'Activity Feed',profile:'My Menu',notifications:'Notifications'};
    text(bottom,names[active??'']??'Miiverse',160,40,18);
    // Source icon buttons have different authoring-canvas sizes. Explicit mount
    // centers preserve their local geometry in the shared 64-pixel toolbar cells.
    miiverseButtons.forEach(([id,name],i)=>draw(bottom,name,name,{center:[32+i*64,226],bindings:[{name:name+'_ActiveOnOff',frame:active===id?1:0},{name:name+'_FocusedOnOff',frame:0}],overrides:{TextBox_00:{text:''}}}));
    draw(bottom,'web-back','OliveBack',{center:[288,226],bindings:[{name:'OliveBack_FocusedOnOff',frame:0}]});
  }
  return okay;
}
