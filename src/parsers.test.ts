import assert from 'node:assert';
import { describe, it } from 'node:test';
import { addonIdOrName, appIdOrName, orgaIdOrName } from './parsers.js';

const UUID = '540c1a2b-3c4d-4e5f-8a6b-7c8d9e0fab12';

describe('appIdOrName', () => {
  it('keeps a lowercase app ID', () => {
    assert.deepStrictEqual(appIdOrName(`app_${UUID}`), { app_id: `app_${UUID}` });
  });

  it('sends an app ID typed in uppercase as lowercase, as the API only knows lowercase IDs', () => {
    assert.deepStrictEqual(appIdOrName(`APP_${UUID.toUpperCase()}`), { app_id: `app_${UUID}` });
  });

  it('keeps the case of an app name', () => {
    assert.deepStrictEqual(appIdOrName('My-App'), { app_name: 'My-App' });
  });
});

describe('orgaIdOrName', () => {
  it('sends an organisation ID typed in uppercase as lowercase', () => {
    assert.deepStrictEqual(orgaIdOrName(`ORGA_${UUID}`), { orga_id: `orga_${UUID}` });
    assert.deepStrictEqual(orgaIdOrName(`orga_${UUID.toUpperCase()}`), { orga_id: `orga_${UUID}` });
  });

  it('sends a user ID typed in uppercase as lowercase', () => {
    assert.deepStrictEqual(orgaIdOrName(`User_${UUID}`), { orga_id: `user_${UUID}` });
  });

  it('keeps the case of an organisation name', () => {
    assert.deepStrictEqual(orgaIdOrName('ACME Corp'), { orga_name: 'ACME Corp' });
  });
});

describe('addonIdOrName', () => {
  it('sends an add-on ID typed in uppercase as lowercase', () => {
    assert.deepStrictEqual(addonIdOrName(`ADDON_${UUID.toUpperCase()}`), { addon_id: `addon_${UUID}` });
  });

  it('sends an operator ID typed in uppercase as lowercase', () => {
    assert.deepStrictEqual(addonIdOrName(`Keycloak_${UUID}`), { operator_id: `keycloak_${UUID}` });
  });

  it('keeps the case of a legacy Kubernetes ULID ID', () => {
    assert.deepStrictEqual(addonIdOrName('kubernetes_01HZX3K8Q9R2M4N6P7S8T9V0WX'), {
      operator_id: 'kubernetes_01HZX3K8Q9R2M4N6P7S8T9V0WX',
    });
  });

  it('keeps the case of an add-on name', () => {
    assert.deepStrictEqual(addonIdOrName('My-Redis'), { addon_name: 'My-Redis' });
  });
});
