import { APP_ID, ORGA_ID } from './id.js';

const DEFAULT_DEPLOY_URL = `https://push-n3-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`;

/**
 * Build an `.clever.json` (app config) with a single linked application.
 * @param {Partial<{ app_id: string, org_id: string, deploy_url: string, name: string, alias: string }>} [overrides]
 */
export function singleAppConfig(overrides = {}) {
  return {
    apps: [
      {
        app_id: APP_ID,
        org_id: ORGA_ID,
        deploy_url: DEFAULT_DEPLOY_URL,
        name: 'test-app',
        alias: 'test-app',
        ...overrides,
      },
    ],
  };
}

/**
 * Build an `.clever.json` (app config) with two linked applications (aliases: prod, staging).
 */
export function multiAppConfig() {
  return {
    apps: [
      {
        app_id: APP_ID,
        org_id: ORGA_ID,
        deploy_url: DEFAULT_DEPLOY_URL,
        name: 'test-app (prod)',
        alias: 'prod',
      },
      {
        app_id: APP_ID,
        org_id: ORGA_ID,
        deploy_url: DEFAULT_DEPLOY_URL,
        name: 'test-app (staging)',
        alias: 'staging',
      },
    ],
  };
}
