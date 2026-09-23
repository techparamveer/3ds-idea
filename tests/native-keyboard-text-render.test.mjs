import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {verifyNativeKeyboardText} from '../scripts/verify-native-keyboard-text.mjs';

const options={
 artifactDir:process.env.NATIVE_KEYBOARD_TEXT_ARTIFACT_DIR,
 referenceRoot:process.env.NATIVE_KEYBOARD_REFERENCE_ROOT,
 pack:process.env.NATIVE_KEYBOARD_TEXT_PACK,
 fontManifest:process.env.NATIVE_KEYBOARD_FONT_MANIFEST,
 canvasModule:process.env.NATIVE_CANVAS_MODULE,
};
test('real text-area and attached cursor paint frozen cells, glyphs and parent transforms without stale caches',{
 skip:!Object.values(options).every(Boolean),
},async()=>{
 const report=await verifyNativeKeyboardText({...options,artifactDir:join(options.artifactDir,'test')});
 assert.equal(report.passed,true);assert.deepEqual(report.results.map(r=>r.input),['','Ada','ABCDEFGHIJ']);
 assert.equal(report.results[0].textDifference.pixels,0);
 assert.ok(report.results.slice(1).every(r=>r.textDifference.pixels>0));
 assert.equal(new Set(report.results.map(r=>r.rgbaSha256)).size,3);
 assert.ok(report.results.every(r=>r.cursorDifference.pixels>0&&r.diagnostics.length===0));
 assert.ok(report.cellColorDifference.pixels>0);
});
