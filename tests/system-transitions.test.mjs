import test from 'node:test';
import assert from 'node:assert/strict';
import {appLaunchLogoFrame,systemTransitionDuration} from '../src/os/system-transitions.ts';
import {createPortfolioState,tickSystem,launch} from '../src/os/system.ts';
test('app launch contains the HOME fade and complete native A/B/C logo clips',()=>{
 assert.equal(appLaunchLogoFrame(0),null);
 assert.deepEqual(appLaunchLogoFrame(334),{clip:'A',frame:0});
 assert.deepEqual(appLaunchLogoFrame(1334),{clip:'B',frame:0});
 assert.deepEqual(appLaunchLogoFrame(1834),{clip:'C',frame:0});
 assert.deepEqual(appLaunchLogoFrame(2084),{clip:'C',frame:15});
 let state=launch(tickSystem(createPortfolioState(),4000),'work',4000);
 assert.equal(tickSystem(state,6099).system.phase,'launch');assert.equal(tickSystem(state,6100).system.phase,'app');
 assert.deepEqual(appLaunchLogoFrame(0,true),{clip:'B',frame:15});assert.equal(systemTransitionDuration('launch',true),120);
});
