import type { AppView } from './app-types';
import { nativeMessageOverride, type PaneOverrides } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { healthDocumentArticles, healthDocumentLinesPerPage } from './stock-health-layout';

const prefix='packs/health-and-safety/';
export const healthScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'bg.json',alias:'health-bg',layouts:['Bg_U_00','Bg_D_00'],animations:['Bg_U_00_TopLoop']},
  {url:prefix+'safehealth.json',alias:'health-pages',layouts:['SafeTop_D_00','SafeText_D_00'],animations:['SafeTop_D_00_SceneIn','SafeTop_D_00_Select','SafeText_D_00_SceneIn']},
  {url:prefix+'btmbtn.json',alias:'health-back',layouts:['BtmBtn_White'],animations:['BtmBtn_White_SceneIn']},
  {url:prefix+'messages-and-loose.json',alias:'health-messages',layouts:[],animations:[]},
];
/** Native Health artwork and English text; page slicing is a portfolio adapter. */
export function drawNativeHealthFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId!=='health-safety')return false;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['health-messages'],'safe_msbt_LZ',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,opts)&&okay;};
  draw(top,'health-bg','Bg_U_00',{bindings:[{name:'Bg_U_00_TopLoop',frame:0}],overrides:{TextBoxTitle_00:message('title')}});
  draw(bottom,'health-bg','Bg_D_00');
  if(view.screen==='main'){
    const overrides:PaneOverrides={T_Home_00:message('base_1b_menu')};
    for(let i=0;i<3;i++)for(const layer of ['B','F'])overrides[`T_Btn${layer}_0${i}`]=message('article_title_'+(i+1));
    draw(bottom,'health-pages','SafeTop_D_00',{bindings:[{name:'SafeTop_D_00_SceneIn',frame:20},...[0,1,2].map(i=>({name:'SafeTop_D_00_Select',frame:view.selection===i?1:0,groups:['G_Btn_0'+i]}))],overrides});
  }else if(view.screen==='document'){
    const topic=typeof view.data?.topic==='string'?view.data.topic:'3d',article=healthDocumentArticles[topic]??'article_1',body=message(article),lines=(body.text??'').split('\n');
    const count=Math.max(1,Math.ceil(lines.length/healthDocumentLinesPerPage));
    const requested=typeof view.data?.page==='number'&&Number.isFinite(view.data.page)?Math.floor(view.data.page):0,page=Math.max(0,Math.min(count-1,requested));
    const titleNumber=Number(article.slice(-1))+3;
    const overrides:PaneOverrides={TextBoxTitle_00:message('article_title_'+titleNumber),TextArea_00:{...body,text:lines.slice(page*healthDocumentLinesPerPage,(page+1)*healthDocumentLinesPerPage).join('\n'),size:[284,168]}};
    for(let i=1;i<5;i++)overrides['TextArea_0'+i]={visible:false};
    for(let i=1;i<6;i++)overrides['SafeIcon_0'+i]={visible:false};
    draw(bottom,'health-pages','SafeText_D_00',{bindings:[{name:'SafeText_D_00_SceneIn',frame:20}],overrides});
    const left={...message('back'),...(view.footer.left?.action==='previous'?{text:view.footer.left.label}:{})};
    draw(bottom,'health-back','BtmBtn_White',{bindings:[{name:'BtmBtn_White_SceneIn',frame:20}],overrides:{T_BtnB_00:{...left,translation:[-82,23.5,0]},T_BtnF_00:{...left,translation:[-82,25,0]}}});
    const text=(value:string,x:number,size:number)=>{
      if(options.font)options.font.draw(bottom,value,x,226,size,'#6e6c59','center');
      else{bottom.fillStyle='#6e6c59';bottom.font=`${size}px sans-serif`;bottom.textAlign='center';bottom.textBaseline='middle';bottom.fillText(value,x,226);}
    };
    text(`${page+1} / ${count}`,160,10);text(view.footer.right?.label??(page<count-1?'Next':'Done'),250,14);
  }else return false;
  return okay;
}
