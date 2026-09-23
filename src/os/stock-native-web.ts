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
const wrapText=(value:string,width=32)=>value.split('\n').map(line=>{const result:string[]=[];let row='';for(const word of line.split(/\s+/)){if(row&&row.length+word.length+1>width){result.push(row);row=word;}else row+=(row?' ':'')+word;}result.push(row);return result.join('\n');}).join('\n');
const browserSettingsLabels:Record<string,string>={'auto-wrap':'Option_AutoWrap','search-engine':'Option_SearchEngine','delete-cookies':'Option_DeleteCookie','clear-history':'Option_DeleteHistoryAll',network:'Option_Network',proxy:'Option_Proxy',version:'Option_VersionInfo',reset:'Option_Initialize'};
const browserSettingsHelp:Record<string,string>={'auto-wrap':'Option_HeaderAutoWrap','search-engine':'Option_HeaderSearchEngine','delete-cookies':'Option_HeaderDeleteCookie','clear-history':'Option_HeaderDeleteHistoryAll',network:'Option_HeaderNetwork',proxy:'Option_HeaderProxy',version:'Option_HeaderVersionInfo',reset:'Option_HeaderReset'};
const dialogPacks=(prefix:string):NativeTitlePackRequest[]=>[
 {url:prefix+'layout-dialog-DialogBaseNormal.json',alias:'web-dialog-base',layouts:['DialogBaseNormal'],animations:[]},
 {url:prefix+'layout-dialog-DialogNotice.json',alias:'web-notice',layouts:['DialogNotice'],animations:[]},
];
const miiverseButtons=[['communities','CommunityButton'],['activity','ActivityButton'],['profile','MyMenuButton'],['notifications','NotificationButton']];
export const browserScreenPacks:readonly NativeTitlePackRequest[]=[
  ...dialogPacks(browserPrefix),
  {url:browserPrefix+'layout-favorite-Item.json',alias:'web-favorite-item',layouts:['Item'],animations:['Item_FocusedOnOff']},
  {url:browserPrefix+'layout-favorite-EmptyMessage.json',alias:'web-empty',layouts:['EmptyMessage'],animations:['EmptyMessage_FadeIn']},
  {url:browserPrefix+'layout-browse-pageinfo-PageInfoDialog.json',alias:'web-page-info',layouts:['PageInfoDialog'],animations:[]},
  {url:browserPrefix+'layout-browse-pageinfo-PageInfoItem.json',alias:'web-info-item',layouts:['PageInfoItem'],animations:[]},
  {url:browserPrefix+'layout-dialog-DialogInput.json',alias:'web-input',layouts:['DialogInput'],animations:[]},
  {url:browserPrefix+'layout-TextField.json',alias:'web-text-field',layouts:['TextField'],animations:['TextField_FocusedOnOff']},
  {url:browserPrefix+'layout-button-ButtonNormal.json',alias:'web-button',layouts:['ButtonNormal'],animations:['ButtonNormal_FocusedOnOff']},
  {url:browserPrefix+'layout-BG.json',alias:'web-bg',layouts:['BG'],animations:[]},
  {url:browserPrefix+'layout-start-dialog-StartDialog.json',alias:'web-menu',layouts:['StartDialog'],animations:['StartDialog_FadeIn']},
  ...browserButtons.map(([,name])=>({url:browserPrefix+'layout-start-dialog-'+name+'.json',alias:name,layouts:[name],animations:[name+'_FocusedOnOff']})),
  {url:browserPrefix+'layout-toolbar-ExitButton.json',alias:'web-exit',layouts:['ExitButton'],animations:['ExitButton_FocusedOnOff']},
  {url:browserPrefix+'messages-and-loose.json',alias:'web-messages',layouts:[],animations:[]},
];
export const miiverseScreenPacks:readonly NativeTitlePackRequest[]=[
  ...dialogPacks(miiversePrefix),
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
      const body=wrapText((view.text??[]).join('\n'));
      const field=typeof view.data?.field==='string'?view.data.field:'';
      const titles:Record<string,string>={bookmarks:'Favorite_HeaderTitle',settings:'Option_Title',search:'StartMenu_Search',address:'Keyboard_InputURL','page-info':'StartMenu_PageInfo','add-bookmark':'StartMenu_Add'};
      const title=screenTitle();
      function screenTitle(){const label=view.screen==='detail'?browserSettingsLabels[field]:titles[view.screen];return label?message(label).text||view.heading:view.heading;}
      draw(bottom,'web-dialog-base','DialogBaseNormal',{center:[160,112],overrides:{DialogBaseLPct:{size:[148,200]},DialogBaseRPct:{size:[148,200]},BottomFrameFPct:{visible:false},BottomFrameF2Pct:{visible:false},BottomFrameHPct:{visible:false}}});
      draw(top,'web-notice','DialogNotice',{center:[200,135],overrides:{TextBox:{text:view.screen==='detail'&&browserSettingsHelp[field]?message(browserSettingsHelp[field]).text:body||title,size:[340,154],fontSize:[16,19.2]}}});
      const start=Math.floor(view.selection/4)*4;
      if(view.screen==='search'||view.screen==='address'){
        draw(bottom,'web-input','DialogInput',{center:[160,120],overrides:{TitleTxb:{text:title},TextBox:{text:body,fontSize:[14,16.8],size:[270,60]}},attachments:{TxfRct:()=>draw(bottom,'web-text-field','TextField',{center:[320,240],bindings:[{name:'TextField_FocusedOnOff',frame:0}],overrides:{PictureL:{size:[135,28]},PictureR:{size:[135,28]},TextBox:{text:view.screen==='address'&&typeof view.data?.url==='string'?view.data.url:'',size:[260,24]}}})}});
      }else{
        draw(bottom,'web-page-info','PageInfoDialog',{overrides:{TitleTxb:{text:title}}});
        if(view.screen==='settings')view.rows.slice(start,start+4).forEach((row,i)=>{
          const label=message(browserSettingsLabels[row.id]).text||row.label;
          draw(bottom,'web-button','ButtonNormal',{center:[160,57+i*39],bindings:[{name:'ButtonNormal_FocusedOnOff',frame:view.selection===start+i?1:0}],overrides:{MainPctL:{size:[148,48]},MainPctR:{size:[148,48]},TextBox:{text:label,size:[276,22],fontSize:[14,16.8]},EmbossTxb:{text:label,size:[276,22],fontSize:[14,16.8]}}});
        });
        else if(view.screen==='bookmarks'||view.screen==='history'){
          if(view.rows.length)view.rows.slice(start,start+4).forEach((row,i)=>draw(bottom,'web-favorite-item','Item',{center:[151,57+i*39],bindings:[{name:'Item_FocusedOnOff',frame:view.selection===start+i?1:0}],overrides:{TitleTxb:{text:row.label},EditBtnPos:{visible:false},FaviconNul:{visible:false}}}));
          else draw(bottom,'web-empty','EmptyMessage',{center:[160,0],bindings:[{name:'EmptyMessage_FadeIn',frame:20}],overrides:{TextBox:{text:message('Favorite_EmptyMessage').text||body}}});
        }else if(view.screen==='page-info'||view.screen==='page'){
          const entry=view.data?.entry&&typeof view.data.entry==='object'?view.data.entry as Record<string,unknown>:{};
          const values=[['PageInfo_Title',typeof entry.title==='string'?entry.title:'—'],['PageInfo_Url',typeof entry.url==='string'?entry.url:typeof view.data?.url==='string'&&view.data.url?view.data.url:'—']];
          values.forEach(([label,value],i)=>draw(bottom,'web-info-item','PageInfoItem',{center:[160,42+i*70],overrides:{LabelTxb:message(label),ContentTxb:{text:value},IconSecurityRct:{visible:false}}}));
        }else draw(bottom,'web-notice','DialogNotice',{center:[160,120],overrides:{TextBox:{text:body||title,size:[260,130],fontSize:[16,19.2]}}});
      }
    }
    const close=view.screen==='main'?message('StartMenu_End'):{text:view.footer.left?.label??'Back'};
    draw(bottom,'web-exit','ExitButton',{center:[53,226],bindings:[{name:'ExitButton_FocusedOnOff',frame:0}],overrides:{TextBox:close,EmbossTxb:close}});
  }else{
    const active=view.screen==='main'?view.rows[view.selection]?.id:typeof view.data?.field==='string'?view.data.field:'';
    const names:Record<string,string>={communities:'Communities',activity:'Activity Feed',profile:'My Menu',notifications:'Notifications'};
    {
      draw(bottom,'web-dialog-base','DialogBaseNormal',{center:[160,110],overrides:{DialogBaseLPct:{size:[148,196]},DialogBaseRPct:{size:[148,196]},BottomFrameFPct:{visible:false},BottomFrameF2Pct:{visible:false},BottomFrameHPct:{visible:false}}});
      draw(bottom,'web-notice','DialogNotice',{center:[160,125],overrides:{TextBox:{text:wrapText((view.text??[]).join('\n')||'No content is available in this portfolio.'),size:[264,112],fontSize:[16,19.2]}}});
    }
    text(bottom,names[active??'']??'Miiverse',160,40,18);
    // Source icon buttons have different authoring-canvas sizes. Explicit mount
    // centers preserve their local geometry in the shared 64-pixel toolbar cells.
    miiverseButtons.forEach(([id,name],i)=>draw(bottom,name,name,{center:[32+i*64,226],bindings:[{name:name+'_ActiveOnOff',frame:active===id?1:0},{name:name+'_FocusedOnOff',frame:0}],overrides:{TextBox_00:{text:''}}}));
    draw(bottom,'web-back','OliveBack',{center:[288,226],bindings:[{name:'OliveBack_FocusedOnOff',frame:0}]});
  }
  return okay;
}
