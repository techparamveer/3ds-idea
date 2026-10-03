import type { AppView } from './app-types';
import { rasterNativeAlphaGlyph, type AlphaSurface, type BitmapFont } from './bitmap-font';
import { evaluateNativeMaterial, nativeMessageOverride, nativePaneParentPath, type NativeMaterial, type PaneOverrides } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { healthTopLoopFrame } from './stock-health-scroll';
import { healthDocumentArticles } from './stock-health-layout';
import { healthArticleLayout, type HealthArticleLayout, type HealthGlyph, type HealthToken } from './stock-health-article';

const prefix='packs/health-and-safety/';
export const healthScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'common.json',alias:'health-common',layouts:['CmnFade_U_00'],animations:['CmnFade_U_00_SceneIn']},
  {url:prefix+'bg.json',alias:'health-bg',layouts:['Bg_U_00','Bg_D_00'],animations:['Bg_U_00_TopLoop']},
  {url:prefix+'safehealth.json',alias:'health-pages',layouts:['SafeTop_D_00','SafeText_D_00'],animations:['SafeTop_D_00_SceneIn','SafeTop_D_00_Select','SafeText_D_00_SceneIn']},
  {url:prefix+'slidebar.json',alias:'health-slidebar',layouts:['SlideBar'],animations:['SlideBar_Select']},
  {url:prefix+'btmbtn.json',alias:'health-back',layouts:['BtmBtn_White'],animations:['BtmBtn_White_SceneIn']},
  {url:prefix+'messages-and-loose.json',alias:'health-messages',layouts:[],animations:[]},
];
/** Controller 0x12894c stretches the bar to N_SlideBar_00's 152px and, past the 8-row viewport,
 * shows the base line and thumb (0x15504c); scrollbar 0x155664 sizes the thumb for >45 rows. */
const slideBarSizes:PaneOverrides={SBBaseWndw:{size:[16,176]},SBBaseLine_00:{size:[8,152],visible:true},B_Groove_00:{size:[16,176]}};
const layouts=new Map<string,HealthArticleLayout>();
/** TextArea_00 box in its attachment frame: the pane point is the layout centre; top-centre origin, 284px wide. */
const TEXT_LEFT=160-142,TEXT_TOP=120;

/** Unclipped article glyphs (0x14b3ec emits no scissor), drawn between the text panes and warning icons. */
function paintArticle(ctx:CanvasRenderingContext2D,font:BitmapFont,glyphs:readonly HealthGlyph[],material:NativeMaterial,alpha:number){
  const m=ctx.getTransform();if(m.b||m.c)throw new Error('Unsupported Health article transform');
  const width=ctx.canvas.width,height=ctx.canvas.height,layers=new Map<string,{color:readonly number[];surface:AlphaSurface}>();
  for(const g of glyphs){
    const y=m.d*(TEXT_TOP+g.y)+m.f,h=m.d*g.height;
    if(!g.glyph.width||y+h<0||y>height)continue;
    const key=g.color.join();let layer=layers.get(key);
    if(!layer)layers.set(key,layer={color:g.color,surface:{width,height,data:new Uint8ClampedArray(width*height*4)}});
    rasterNativeAlphaGlyph(layer.surface,font.glyphMask(g.glyph),{glyph:g.glyph,x:m.a*(TEXT_LEFT+g.x)+m.e,y,width:m.a*g.width,height:h});
  }
  if(!layers.size)return;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  try{
    const target=canvas.getContext('2d')!,image=target.createImageData(width,height);
    for(const {color,surface} of layers.values()){
      const primary=color.map(v=>v/255);primary[3]*=alpha;
      for(let at=0;at<surface.data.length;at+=4){
        const a=surface.data[at+3];if(!a)continue;
        const out=evaluateNativeMaterial(material,[[1,1,1,a/255]],primary).map(v=>v*255),over=out[3]/255,under=image.data[at+3]/255,total=over+under*(1-over);
        for(let i=0;i<3;i++)image.data[at+i]=total?(out[i]*over+image.data[at+i]*under*(1-over))/total:0;
        image.data[at+3]=total*255;
      }
    }
    target.putImageData(image,0,0);
    ctx.save();try{ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(canvas,0,0);}finally{ctx.restore();}
  }finally{canvas.width=canvas.height=0;}
}

type ArticleView={paneY:number;thumbY:number;selectFrame:number};
function articleView(view:AppView):ArticleView|null{
  const value=view.data?.article;
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const {paneY,thumbY,selectFrame}=value;
  return [paneY,thumbY,selectFrame].every(n=>typeof n==='number'&&Number.isFinite(n))?{paneY:paneY as number,thumbY:thumbY as number,selectFrame:selectFrame as number}:null;
}

/** Native Health artwork, English text and the replayed continuous article. */
export function drawNativeHealthFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId!=='health-safety')return false;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['health-messages'],'safe_msbt_LZ',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,opts)&&okay;};
  draw(top,'health-bg','Bg_U_00',{bindings:[{name:'Bg_U_00_TopLoop',frame:healthTopLoopFrame(typeof view.data?.healthElapsedMs==='number'?view.data.healthElapsedMs:0,options.reducedMotion)}],overrides:{TextBoxTitle_00:message('title')}});
  draw(top,'health-common','CmnFade_U_00',{bindings:[{name:'CmnFade_U_00_SceneIn',frame:options.healthEntryFrame??20}]});
  draw(bottom,'health-bg','Bg_D_00');
  if(view.screen==='main'){
    const overrides:PaneOverrides={T_Home_00:message('base_1b_menu')};
    for(let i=0;i<3;i++)for(const layer of ['B','F'])overrides[`T_Btn${layer}_0${i}`]=message('article_title_'+(i+1));
    draw(bottom,'health-pages','SafeTop_D_00',{bindings:[{name:'SafeTop_D_00_SceneIn',frame:20},...[0,1,2].map(i=>({name:'SafeTop_D_00_Select',frame:view.data?.selectionActive!==false&&view.selection===i?1:0,groups:['G_Btn_0'+i]}))],overrides});
  }else if(view.screen==='document'){
    const topic=typeof view.data?.topic==='string'?view.data.topic:'3d',label=healthDocumentArticles[topic]??'article_1';
    const article=articleView(view),font=options.font,bank=renderer.packs['health-messages']?.messages.safe_msbt_LZ;
    const text=nativePaneParentPath(renderer.packs['health-pages'].layouts.SafeText_D_00,'TextArea_00')?.at(-1)?.text;
    const tokens=bank?.messages[bank.labels[label]]?.tokens as HealthToken[]|undefined;
    if(!article||!font||!tokens||!text)return false;
    const key=font.manifest.sourceSha256+':'+label;
    let layout=layouts.get(key);
    if(!layout){layout=healthArticleLayout(font.manifest,tokens,text.topColor as [number,number,number,number]);if(layouts.size>=3)layouts.delete(layouts.keys().next().value!);layouts.set(key,layout);}
    const material=renderer.packs['health-pages'].layouts.SafeText_D_00.materials[text.material],articleGlyphs=layout.glyphs;
    const overrides:PaneOverrides={TextBoxTitle_00:message('article_title_'+(Number(label.slice(-1))+3)),N_TextArea:{translation:[0,article.paneY,0]},TextArea_00:{text:''}};
    for(let i=1;i<5;i++)overrides['TextArea_0'+i]={visible:false};
    for(let i=0;i<5;i++){const icon=layout.warnings[i];overrides['SafeIcon_0'+(i+1)]=icon?{visible:true,translation:[icon.x,icon.y,0]}:{visible:false};}
    draw(bottom,'health-pages','SafeText_D_00',{bindings:[{name:'SafeText_D_00_SceneIn',frame:20}],overrides,attachments:{
      TextArea_00:alpha=>paintArticle(bottom,font,articleGlyphs,material,alpha),
      N_SlideBar_00:()=>draw(bottom,'health-slidebar','SlideBar',{pictureSampling:'lcd',bindings:[{name:'SlideBar_Select',frame:article.selectFrame}],
        overrides:{...slideBarSizes,B_Slide_00:{size:[24,22],translation:[0,article.thumbY,0]},N_Slide_00:{visible:true,translation:[0,article.thumbY,0]}}}),
    }});
    draw(bottom,'health-back','BtmBtn_White',{textSampling:'lcd',textCoverageAdaptation:'azahar-12p4-fit',bindings:[{name:'BtmBtn_White_SceneIn',frame:20}],overrides:{T_BtnB_00:message('back'),T_BtnF_00:message('back')}});
  }else return false;
  return okay;
}
