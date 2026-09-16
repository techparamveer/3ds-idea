/** Reproduce the small UI sprites from the recorded native Nintendo screenshots. */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/os', { recursive: true });
for (const [source,rect,name] of [
 ['official-home-native.png',{left:88,top:240,width:272,height:33},'home-toolbar'],
 ['official-settings-full.png',{left:53,top:45,width:190,height:48},'change-theme'],
 ['3DS_8thNUP_UK_euros_1007_1123_02.png',{left:12,top:37,width:42,height:38},'theme-shop'],
]) await sharp(`docs/references/home-menu/${source}`).extract(rect).png().toFile(`public/os/${name}.png`);
