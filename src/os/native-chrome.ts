/** Native-resolution screenshot fragments; see public/os/README.md. */
export function createNativeChrome(){
 const names=['tile-frame','icon-tray','home-footer','settings-glyph','internet-status','battery-status'] as const;
 const images=Object.fromEntries(names.map(name=>{const image=new Image();image.src=`/os/${name}.png`;return [name,image];})) as Record<typeof names[number],HTMLImageElement>;
 function draw(c:CanvasRenderingContext2D,name:typeof names[number],x:number,y:number){
  const im=images[name];if(!im.complete||!im.naturalWidth)return false;
  c.drawImage(im,x,y);return true;
 }
 function tile(c:CanvasRenderingContext2D,x:number,y:number,size:number){
  const im=images['tile-frame'];if(!im.complete||!im.naturalWidth)return false;
  // Only the outer 12 pixels are sampled. The central software artwork in
  // the reference is excluded. At two rows, these borders are copied 1:1.
  const w=size+8,edge=Math.min(12,Math.floor(w/3));x=Math.round(x-4);y=Math.round(y-2);
  c.save();c.imageSmoothingEnabled=false;c.fillStyle='#f7f7f7';c.fillRect(x+edge,y+edge,w-2*edge,w-2*edge);
  const source=[0,12,68,80],target=[0,edge,w-edge,w];
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   if(row===1&&col===1)continue;
   c.drawImage(im,source[col],source[row],source[col+1]-source[col],source[row+1]-source[row],x+target[col],y+target[row],target[col+1]-target[col],target[row+1]-target[row]);
  }
  c.restore();return true;
 }
 return {draw,tile,ready:Promise.allSettled(Object.values(images).map(im=>im.decode()))};
}
