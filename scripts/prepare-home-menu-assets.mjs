/** Reproduce the small UI sprites from the recorded native Nintendo screenshots. */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/os', { recursive: true });
for (const [source,rect,name] of [
 ['official-home-native.png',{left:88,top:240,width:272,height:33},'home-toolbar'],
 ['official-settings-full.png',{left:53,top:45,width:190,height:48},'change-theme'],
 ['3DS_8thNUP_UK_euros_1007_1123_02.png',{left:12,top:37,width:42,height:38},'theme-shop'],
 ['official-home-native.png',{left:160,top:284,width:80,height:80},'tile-frame'],
 ['official-home-native.png',{left:0,top:0,width:136,height:20},'internet-status'],
 ['official-home-native.png',{left:370,top:0,width:30,height:20},'battery-status'],
]) await sharp(`docs/references/home-menu/${source}`).extract(rect).png().toFile(`public/os/${name}.png`);

// Reconstruct empty chrome only from unobstructed reference pixels. Software
// artwork and the reference's selected state must never become part of a tile.
const native=await sharp('docs/references/home-menu/official-home-native.png').ensureAlpha().raw().toBuffer();
const pixel=(x,y)=>native.subarray((y*400+x)*4,(y*400+x+1)*4);
async function raster(name,width,height,sample){
 const data=Buffer.alloc(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)sample(x,y).copy(data,(y*width+x)*4);
 await sharp(data,{raw:{width,height,channels:4}}).png().toFile(`public/os/${name}.png`);
}
await raster('icon-tray',320,181,(x,y)=>pixel(40+Math.min(x,28),273+y));
await raster('home-footer',320,26,(x,y)=>pixel(40+(x<24?x:x>=296?x:24),454+y));
await raster('settings-glyph',36,32,(x,y)=>{
 const p=pixel(47+x,240+y);
 // The blue glyph is separable from the green selection frame and neutral
 // button. Retain the captured blue edge pixels, rather than redraw its shape.
 return p[2]>p[0]+8&&p[2]>p[1]+3?p:Buffer.from([0,0,0,0]);
});
