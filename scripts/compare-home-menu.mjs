/** Match native screen resolution without cropping the 800-wide storage canvas. */
import sharp from 'sharp';
for(const [name,reference] of [
 ['settings','official-settings-full.png'],
 ['themes','3DS_8thNUP_UK_euros_1007_1123_02.png'],
]) {
 const source=await sharp(`docs/references/home-menu/${reference}`).resize(320,240,{fit:'fill'}).png().toBuffer();
 await sharp({create:{width:656,height:268,channels:3,background:'#fafafa'}}).composite([
  {input:source,top:28,left:0},
  {input:`docs/validation/uifix/${name}-bottom.png`,top:28,left:336},
  {input:Buffer.from('<svg width="656" height="28"><text x="8" y="19" font-family="Arial" font-size="13">Nintendo reference</text><text x="344" y="19" font-family="Arial" font-size="13">uifix browser capture</text></svg>'),top:0,left:0},
 ]).png().toFile(`docs/validation/uifix/${name}-comparison.png`);
}
