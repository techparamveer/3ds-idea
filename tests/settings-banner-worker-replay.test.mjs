import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const replay = JSON.parse(readFileSync(new URL('../docs/evidence/settings-banner-worker-replay.json', import.meta.url), 'utf8'));

test('Settings source replay retains failure, launch and retarget boundaries', () => {
  assert.equal(replay.codeSha256, '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
  assert.equal(replay.titleWorkerOpenFailure.completionByte, 0);
  assert.equal(replay.titleWorkerOpenFailure.archiveReadCalled, false);
  assert.equal(replay.titleWorkerReadFailure.completionByte, 0);
  assert.equal(replay.titleWorkerReadFailure.archiveReadCalled, true);
  assert.equal(replay.titleWorkerSuppliedResources.completionByte, 1);
  assert.equal(replay.titleWorkerSuppliedResources.commonCandidate, '0x500600');
  assert.equal(replay.titleWorkerSuppliedResources.selectedCandidate, '0x500700');
  assert.deepEqual(replay.titleWorkerSuppliedResources.decodeCalls, [
    ['0x508020', '0x50a000'], ['0x508040', '0x50c000'],
  ]);

  assert.equal(replay.state4.workerPending.state, 4);
  assert.equal(replay.state4.workerPending.prepared, false);
  assert.equal(replay.state4.resourceReady.state, 5);
  assert.equal(replay.state4.resourceReady.prepared, true);
  assert.equal(replay.state4.presentationLaunchFailure.state, 4);
  assert.equal(replay.state4.resourceFlagClear.state, 6);
  assert.equal(replay.state4.resourceFlagClear.prepared, false);
  assert.equal(replay.state4.resourceFlagClearAlternative.requestedType, 13);
  assert.equal(replay.state4.retargetBeforePresentation.state, 5);

  assert.deepEqual(replay.state5.workerPending.visibilityRequests, []);
  assert.deepEqual(replay.state5.matchingRequest.visibilityRequests.map(([, visible]) => visible), [1, 1]);
  for (const name of ['retargetedTitle', 'changedType', 'ineligiblePrimary']) {
    assert.equal(replay.state5[name].state, 6);
    assert.deepEqual(replay.state5[name].visibilityRequests.map(([, visible]) => visible), [0, 0]);
  }
  assert.deepEqual(replay.state5.noPendingRequest.visibilityRequests.map(([, visible]) => visible), [1, 1]);
  assert.equal(replay.postState5Acknowledgement.matchingRequest.requestPending, 0);
  assert.deepEqual(replay.postState5Acknowledgement.matchingRequest.visibilityRequests.map(([, visible]) => visible), [1, 1]);
  for (const name of ['retargetedTitle', 'changedType']) {
    assert.equal(replay.postState5Acknowledgement[name].requestPending, 1);
    assert.deepEqual(replay.postState5Acknowledgement[name].visibilityRequests, []);
  }
  assert.equal(replay.postState5Acknowledgement.missingPrimary.requestPending, 0);
  assert.deepEqual(replay.postState5Acknowledgement.missingPrimary.visibilityRequests.map(([, visible]) => visible), [1]);
});
