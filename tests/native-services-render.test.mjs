import test from 'node:test';
import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyNativeServices} from '../scripts/verify-native-services.mjs';
const options={
 artifactDir:process.env.NATIVE_SERVICES_ARTIFACT_DIR,
 assetRoot:resolve(fileURLToPath(new URL('../public/os/firmware/10.7.0-32E',import.meta.url))),
 canvasModule:process.env.NATIVE_CANVAS_MODULE,
};
test('real Nintendo Zone HUD paints the source full-battery and wireless-off status',{
 skip:!options.artifactDir||!options.canvasModule,
},async()=>{
 const report=await verifyNativeServices({...options,artifactDir:join(options.artifactDir,'test')});
 const zone=report.reports.filter(r=>r.appId==='nintendo-zone');
 assert.equal(zone.length,2);
 for(const {hud}of zone)assert.deepEqual(hud,{battery:'HudBat_03.bclim',wireless:'HudNetAtnOff_00.bclim',barTop:0,identityProjection:['Hud_00/P_Bat_00 rotation [360,0,360]']});
});
