import type { FontManifest } from './bitmap-font';
import type { NativeLayout, NativePane, PaneOverrides } from './native-layout';

/** Native 0x132d88 fit: integral percentages, 80% floor, X size only. */
export function fitNativeLabelWidth(measured:number,available:number,original:number):number{
 const f=Math.fround,w=f(measured),limit=f(available);if(w<limit)return original;
 const percentage=Math.max(80,Math.trunc(f(f(f(limit/w)*100)-1)));
 return f(f(original)*f(percentage*f(.01)));
}
/** Retain the source pane's metrics on every rename; never compound a prior fit. */
export function nativeBannerLabelOverride(layout:NativeLayout,font:FontManifest,value:string):PaneOverrides{
 const find=(panes:NativePane[]):NativePane|undefined=>{for(const pane of panes){if(pane.name==='T_Title_00')return pane;const child=find(pane.children);if(child)return child;}};
 const pane=find(layout.roots),text=pane?.text;if(!pane||!text)throw new Error('Native banner title pane unavailable');
 const sx=text.size[0]/(font.width??font.height),spacing=text.characterSpacing;
 const widths=value.replace(/\r\n?/g,'\n').split('\n').map(line=>{
  const glyphs=Array.from(line,char=>font.glyphs[String(char.codePointAt(0))]??font.fallback);
  return glyphs.reduce((width,g)=>width+(g?.advance??0)*sx+spacing,0)-(glyphs.length?spacing:0);
 });
 return {T_Title_00:{text:value,fontSize:[fitNativeLabelWidth(Math.max(0,...widths),pane.size[0],text.size[0]),text.size[1]]}};
}
