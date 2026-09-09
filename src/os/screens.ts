import { type MenuState, menuTiles, isFolder } from './state';
import { type BitmapFont } from './bitmap-font';
type Context = CanvasRenderingContext2D;
const fonts = new WeakMap<Context, BitmapFont>();
function rounded(c: Context, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
function text(c:Context,t:string,x:number,y:number,size=11,color='#77817f',align:CanvasTextAlign='left'){
 const font=fonts.get(c);if(font){font.draw(c,t,x,y,size,color,align);return;}
 // Development fallback only. No extracted Nintendo font ships in this repository.
 c.font=`${size}px Arial, sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(t,x,y);
}
function folder(c:Context,x:number,y:number,size:number){
 c.save();c.translate(x,y);c.scale(size/40,size/40);
 rounded(c,-17,-12,18,22,3,'#f3d572','#c0af76');rounded(c,-19,-8,38,28,3,'#f7e5a5','#d6bd6b');
 c.fillStyle='#fff8d4';c.fillRect(-15,-4,30,2);c.restore();
}
function status(c:Context,w:number,date:Date){
 const g=c.createLinearGradient(0,0,0,23);g.addColorStop(0,'#e5e9e5');g.addColorStop(1,'#f7f9f4');c.fillStyle=g;c.fillRect(0,0,w,23);
 c.fillStyle='#81a765';for(let i=0;i<4;i++)c.fillRect(9+i*4,16-i*3,3,3+i*3);
 text(c,'Internet',30,12,10,'#83a76d');text(c,`${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')} (${date.toLocaleDateString('en-GB',{weekday:'short'})})`,w-137,12,10);
 text(c,date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),w-59,12,10);
 rounded(c,w-30,7,21,10,1,'#eef5ee','#7b8b80');c.fillStyle='#80b584';c.fillRect(w-28,9,16,6);c.fillStyle='#7b8b80';c.fillRect(w-8,10,2,4);
}
function toolbar(c:Context){
 const grad=c.createLinearGradient(0,0,0,26);grad.addColorStop(0,'#fff');grad.addColorStop(1,'#dce2da');c.fillStyle=grad;c.fillRect(0,0,320,26);
 c.strokeStyle='#cbd3c9';c.beginPath();c.moveTo(0,25.5);c.lineTo(320,25.5);c.stroke();
 // Brightness sun, menu density, notes, friends, notifications, internet.
 c.strokeStyle='#7592a5';c.lineWidth=1.3;c.beginPath();c.arc(15,12,3,0,Math.PI*2);c.stroke();
 for(let i=0;i<8;i++){let a=i*Math.PI/4;c.beginPath();c.moveTo(15+Math.cos(a)*5,12+Math.sin(a)*5);c.lineTo(15+Math.cos(a)*7,12+Math.sin(a)*7);c.stroke();}
 rounded(c,38,8,11,8,1,'#7390a6');for(let i=0;i<4;i++)rounded(c,61+i%2*5,7+Math.floor(i/2)*5,4,4,.5,'#7d94a6');
 c.strokeStyle='#b9c96b';c.lineWidth=4;c.beginPath();c.moveTo(109,7);c.lineTo(96,17);c.stroke();
 rounded(c,146,6,14,12,3,'#f5f4e9','#cf9567');c.fillStyle='#cf9567';c.fillRect(150,9,2,2);c.fillRect(155,9,2,2);c.beginPath();c.arc(153,12,3,0,Math.PI);c.strokeStyle='#cf9567';c.lineWidth=1;c.stroke();
 rounded(c,199,6,18,12,3,'#93bf8d','#78a779');c.fillStyle='#93bf8d';c.beginPath();c.moveTo(203,17);c.lineTo(203,21);c.lineTo(208,17);c.fill();
 c.strokeStyle='#6babb5';c.beginPath();c.ellipse(272,12,9,6,0,0,Math.PI*2);c.moveTo(263,12);c.lineTo(281,12);c.moveTo(272,6);c.lineTo(272,18);c.stroke();c.beginPath();c.ellipse(272,12,4,6,0,0,Math.PI*2);c.stroke();
}
export function createScreens(options: { font?: BitmapFont; reducedMotion?: boolean } = {}){
 const top=document.createElement('canvas');top.width=800;top.height=240;
 const bottom=document.createElement('canvas');bottom.width=320;bottom.height=240;
 const t=top.getContext('2d')!,b=bottom.getContext('2d')!;
 if(options.font){fonts.set(t,options.font);fonts.set(b,options.font);}
 function paint(state:MenuState,date=new Date(), elapsedMs=0){
  t.resetTransform();t.clearRect(0,0,800,240);b.clearRect(0,0,320,240);
  if(!state.powered){t.fillStyle=b.fillStyle='#101719';t.fillRect(0,0,800,240);b.fillRect(0,0,320,240);return;}
  // Compatibility with the existing full-width texture UVs: 400 logical pixels
  // resampled across 800 storage pixels. This is NOT a packed stereo pair.
  t.scale(2,1);
  const bg=t.createLinearGradient(0,0,0,240);bg.addColorStop(0,'#eef2eb');bg.addColorStop(.65,'#fff');bg.addColorStop(1,'#e3e8e0');t.fillStyle=bg;t.fillRect(0,0,400,240);
  t.strokeStyle='#e4e9e1';t.lineWidth=.5;for(let x=0;x<400;x+=12){t.beginPath();t.moveTo(x,24);t.lineTo(x,240);t.stroke();}for(let y=24;y<240;y+=12){t.beginPath();t.moveTo(0,y);t.lineTo(400,y);t.stroke();}
  status(t,400,date);
  if(!state.opened && isFolder(state.selected)){
   t.save();t.shadowColor='#b5beb2';t.shadowBlur=17;t.shadowOffsetY=14;folder(t,200,111,66);t.restore();
  }
  const bg2=b.createLinearGradient(0,26,0,240);bg2.addColorStop(0,'#f7f8f0');bg2.addColorStop(1,'#e0e6d9');b.fillStyle=bg2;b.fillRect(0,0,320,240);
  toolbar(b);
  if(!state.opened){
   for(const {index,x,y,size} of menuTiles(state)){
    b.save();b.shadowColor='#b4c0ae';b.shadowBlur=2;b.shadowOffsetY=2;rounded(b,x,y,size,size,8,'#fafbf6','#c7d1be');b.restore();
    rounded(b,x+4,y+4,size-8,size-8,5,'#eef2e7','#e1e7d9');
    if(isFolder(index))folder(b,x+size/2,y+size/2-2,size*.52);
    if(index===state.selected){const pulse=options.reducedMotion?0:Math.sin(elapsedMs*Math.PI/700)*.6;b.strokeStyle='#44d3c9';b.lineWidth=2.5;b.beginPath();b.roundRect(x-3-pulse,y-3-pulse,size+6+2*pulse,size+6+2*pulse,9);b.stroke();}
   }
   rounded(b,6,212,32,22,4,'#f2f6eb','#c5d0ba');text(b,'◀',22,223,13,'#8bb270','center');
   if(isFolder(state.selected)){rounded(b,46,212,228,22,4,'#f9fbf4','#c5d0ba');text(b,'Open',160,223,12,'#7d8a71','center');}
   rounded(b,282,212,32,22,4,'#f2f6eb','#c5d0ba');text(b,'▶',298,223,13,'#8bb270','center');
  }else{
   // Plain empty portfolio folder. Content will be supplied by the owner.
   rounded(b,8,33,304,168,5,'#f8faf3','#d4ddca');
   rounded(b,6,212,308,22,4,'#f5f8ef','#c5d0ba');text(b,'Back',160,223,12,'#7d8a71','center');
  }
 }
 return {top,bottom,paint};
}
