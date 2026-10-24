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

  it('should write and read the config file in config', () => {
    fsMock.writeConfigFile({ version: 1, profiles: [{ alias: 'default', token: 'token', secret: 'secret' }] });

    assert.equal(fsMock.configFilePath(), fsMock.getPath('config/clever-tools.json'));
    assert.deepEqual(fsMock.readConfigFile(), {
      version: 1,
      profiles: [{ alias: 'default', token: 'token', secret: 'secret' }],
    });
  });

  it('should write and read the .clever.json of the given app directory', () => {
    const app = { app_id: 'app_id', org_id: 'org_id', deploy_url: 'https://example.com/app.git', name: 'my-app' };

    fsMock.writeAppConfigFile('myapp', { apps: [app] });

    assert.equal(fsMock.appConfigFilePath('myapp'), fsMock.getPath('myapp/.clever.json'));
    assert.deepEqual(fsMock.readAppConfigFile('myapp'), { apps: [app] });
    assert.deepEqual(JSON.parse(fsMock.read('myapp/.clever.json')), { apps: [app] });
  });

  it('should keep the primitives of fsMock', () => {
    fsMock.write('notes.txt', 'hello');

    assert.equal(fsMock.read('notes.txt'), 'hello');
  });
});
