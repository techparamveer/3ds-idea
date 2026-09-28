import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {verifyNativeKeyboardSelection} from '../scripts/verify-native-keyboard-selection.mjs';
const options={
 artifactDir:process.env.NATIVE_KEYBOARD_SELECTION_ARTIFACT_DIR,
 referenceRoot:process.env.NATIVE_KEYBOARD_REFERENCE_ROOT,
 pack:process.env.NATIVE_KEYBOARD_SELECTION_PACK,
 fontManifest:process.env.NATIVE_KEYBOARD_FONT_MANIFEST,
 canvasModule:process.env.NATIVE_CANVAS_MODULE,
};
test('real nickname selection paints at the native attachment point beneath the text',{
 skip:!Object.values(options).every(Boolean),
},async()=>{
 const report=await verifyNativeKeyboardSelection({...options,artifactDir:join(options.artifactDir,'test')});
 assert.equal(report.passed,true);assert.equal(report.results.length,7);
 assert.equal(report.results.filter(r=>r.selectionPixels>0).length,4);
 assert.ok(report.results.filter(r=>r.selectionPixels>0).every(r=>r.lateOverlayDifference>0));
});
