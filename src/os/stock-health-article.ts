import type { FontManifest, Glyph } from './bitmap-font';

/** Preserved MSBT runs from safe_msbt_LZ; control 14 carries a hex argument. */
export type HealthToken={text:string}|{control:number;group:number;type:number;arguments?:string};
export type HealthGlyph={code:number;glyph:Glyph;x:number;y:number;width:number;height:number;color:readonly [number,number,number,number]};
export type HealthArticleLayout={glyphs:HealthGlyph[];rows:number;maxScroll:number;warnings:{x:number;y:number}[]};

const f=Math.fround;
/** SafeText_D_00 TextArea_00 after style setter 0x113e6c: 15×18 cell, 3px spacing, 21px pitch (0x156c80). */
export const HEALTH_TEXT={width:15,height:18,lineSpacing:3,pitch:21,viewportRows:8,paneWidth:284};
/** Native 0x13f268 width of the 14-space + U+25B3 prefix (health-font-clip-source-audit.md). */
const WARNING_PREFIX_WIDTH=90.00001525878906;
const tokenText=(token:HealthToken)=>'text' in token?token.text:null;
const argumentBytes=(token:{arguments?:string})=>{
  const hex=token.arguments??'';if(!/^([0-9a-f]{2})*$/i.test(hex))throw new Error('Invalid Health control argument');
  return Array.from({length:hex.length/2},(_,i)=>parseInt(hex.slice(i*2,i*2+2),16));
};

/** Parser 0x157724: pane-height rows and warning heights. Size runs set an absolute height; control 15 resets it. */
export function healthArticleMetrics(tokens:readonly HealthToken[]):{rows:number;maxScroll:number;warningHeights:number[]}{
  const base=HEALTH_TEXT.height;let current=base,cumulative=f(base);const warningHeights:number[]=[];
  const newline=()=>{cumulative=f(cumulative+f(current+HEALTH_TEXT.lineSpacing));};
  newline();
  for(const token of tokens){
    const text=tokenText(token);
    if(text!==null){
      for(const char of text){if(char==='\n')newline();else if(char==='\u25b3')warningHeights.push(cumulative);}
      continue;
    }
    if(!('control' in token))continue;
    if(token.control===15)current=base;
    else if(token.control===14){const bytes=argumentBytes(token);if(bytes.length===2)current=f(base*f((bytes[0]|bytes[1]<<8)*f(0.01)));}
  }
  newline();newline();
  const rows=Math.trunc(cumulative/HEALTH_TEXT.pitch)+1;
  return {rows,maxScroll:Math.max(rows-HEALTH_TEXT.viewportRows,0)*HEALTH_TEXT.pitch,warningHeights};
}

/** Icon writer 0x156db0: SafeIcon origin under N_TextArea. */
export const healthWarningIcon=(height:number)=>({x:f(WARNING_PREFIX_WIDTH-161),y:f(102-height)});

/**
 * Glyph records of rebuild 0x14b3ec for the normalised document (leading newline,
 * two trailing newlines, U+25B3 drawn as U+3000) with Health processor 0x16c734.
 * Coordinates are TextArea_00 box pixels, Y down. The source articles never reach
 * the 284px wrap width; callers must not use this for arbitrary messages.
 */
export function healthArticleGlyphs(manifest:FontManifest,tokens:readonly HealthToken[],paneColor:readonly [number,number,number,number]):HealthGlyph[]{
  const cellWidth=manifest.width??manifest.height,baseY=f(HEALTH_TEXT.height/manifest.height);
  let sx=f(HEALTH_TEXT.width/cellWidth),sy=baseY,savedScale:[number,number]=[sx,sy];
  let color=paneColor,savedColor=paneColor,penX=0,baseline=f(manifest.baseline*baseY);
  const glyphs:HealthGlyph[]=[];
  const lineFeed=()=>{penX=0;baseline=f(baseline+f(f((manifest.lineFeed??manifest.height)*sy)+HEALTH_TEXT.lineSpacing));};
  const draw=(code:number)=>{
    const glyph=manifest.glyphs[String(code)]??manifest.fallback;if(!glyph)return;
    const top=f(baseline-f(manifest.baseline*sy));
    glyphs.push({code,glyph,x:f(penX+f(glyph.left*sx)),y:top,width:f(glyph.width*sx),height:f(glyph.height*sy),color});
    penX=f(penX+f(glyph.advance*sx));
  };
  lineFeed();
  for(const token of tokens){
    const text=tokenText(token);
    if(text!==null){for(const char of text){if(char==='\n')lineFeed();else draw(char==='\u25b3'?0x3000:char.codePointAt(0)!);}continue;}
    if(!('control' in token))continue;
    if(token.control===15){[sx,sy]=savedScale;continue;}
    if(token.control!==14)continue;
    const bytes=argumentBytes(token);
    if(token.group===1&&bytes.length===2){
      const factor=f(f(bytes[0]|bytes[1]<<8)*f(0.01));savedScale=[sx,sy];
      if(token.type===0||token.type===1)sx=f(sx*factor);
      if(token.type===0||token.type===2)sy=f(sy*factor);
    }else if(token.group===0&&token.type===3&&bytes.length===4){
      // 0x155948: opaque black restores the colour saved by the previous colour run.
      if(bytes[0]===0&&bytes[1]===0&&bytes[2]===0&&bytes[3]===255)color=savedColor;
      else{savedColor=color;color=[bytes[0],bytes[1],bytes[2],bytes[3]];}
    }
  }
  return glyphs;
}

export function healthArticleLayout(manifest:FontManifest,tokens:readonly HealthToken[],paneColor:readonly [number,number,number,number]):HealthArticleLayout{
  const metrics=healthArticleMetrics(tokens);
  return {glyphs:healthArticleGlyphs(manifest,tokens,paneColor),rows:metrics.rows,maxScroll:metrics.maxScroll,warnings:metrics.warningHeights.map(healthWarningIcon)};
}
