import assert from 'node:assert/strict';
import { after, beforeEach, describe, it } from 'node:test';
import { CleverFsMock } from './clever-fs-mock.ts';

describe('CleverFsMock', () => {
  const fsMock = new CleverFsMock();

  beforeEach(() => fsMock.reset());
  after(() => fsMock.stop());

  it('should write the experimental features file in config', () => {
    fsMock.writeExperimentalFeaturesFile({ k8s: true });

    assert.equal(
      fsMock.experimentalFeaturesFilePath(),
      fsMock.getPath('config/clever-tools-experimental-features.json'),
    );
    assert.deepEqual(JSON.parse(fsMock.read('config/clever-tools-experimental-features.json')), { k8s: true });
  });

  it('should keep the primitives of fsMock', () => {
    fsMock.write('notes.txt', 'hello');

    assert.equal(fsMock.read('notes.txt'), 'hello');
  });
});
