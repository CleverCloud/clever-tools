import { CcApiBridgeClient } from '@clevercloud/client/cc-api-bridge-client.js';
import { CcApiClient } from '@clevercloud/client/cc-api-client.js';
import { config } from '../config/config.js';
import { Logger } from '../logger.js';

/** @type {import('@clevercloud/client').CcClientHooks} */
const hooks = {
  onRequest: (request) => {
    // Stream (SSE) requests don't define a method, they are always GET
    Logger.debug(`${(request.method ?? 'get').toUpperCase()} ${request.url} ? ${JSON.stringify(request.queryParams)}`);
  },
};

/** @type {{ key: string, client: CcApiClient } | null} */
let ccApiCache = null;
/** @type {{ key: string, client: CcApiBridgeClient } | null} */
let ccApiBridgeCache = null;

/**
 * Clients are exposed through getters so that they are built on first use, and rebuilt whenever the
 * credentials or the host they were built from change. The clients copy those values at construction
 * time, so a module-level instance would keep serving the credentials that were in place when it was
 * imported, and `reloadConfig()` (login, logout, profile switch) would go unnoticed.
 */
export const clients = {
  /** @returns {CcApiClient} */
  get ccApi() {
    const key = cacheKey(config.API_HOST);
    if (ccApiCache?.key !== key) {
      ccApiCache = { key, client: createCcApiClient() };
    }
    return ccApiCache.client;
  },

  /** @returns {CcApiBridgeClient} */
  get ccApiBridge() {
    const key = cacheKey(config.AUTH_BRIDGE_HOST);
    if (ccApiBridgeCache?.key !== key) {
      ccApiBridgeCache = { key, client: createCcApiBridgeClient() };
    }
    return ccApiBridgeCache.client;
  },
};

/**
 * Identifies the configuration a cached client was built from.
 * @param {string} host
 * @returns {string}
 */
function cacheKey(host) {
  return [host, config.OAUTH_CONSUMER_KEY, config.OAUTH_CONSUMER_SECRET, config.token, config.secret].join('\0');
}

/**
 * Creates an API request function with a custom config.
 * @param {object} [customConfig]
 * @param {string} [customConfig.apiHost] - API host
 * @param {string} [customConfig.consumerKey] - OAuth consumer key
 * @param {string} [customConfig.consumerSecret] - OAuth consumer secret
 * @param {string} [customConfig.token] - OAuth token
 * @param {string} [customConfig.secret] - OAuth secret
 * @returns {CcApiClient}
 */
export function createCcApiClient(customConfig = {}) {
  return new CcApiClient({
    baseUrl: customConfig?.apiHost ?? config.API_HOST,
    authMethod: {
      type: 'oauth-v1',
      oauthTokens: {
        consumerKey: customConfig?.consumerKey ?? config.OAUTH_CONSUMER_KEY,
        consumerSecret: customConfig?.consumerSecret ?? config.OAUTH_CONSUMER_SECRET,
        token: customConfig?.token ?? config.token,
        secret: customConfig?.secret ?? config.secret,
      },
    },
    hooks,
  });
}

/**
 * @returns {CcApiBridgeClient}
 */
function createCcApiBridgeClient() {
  return new CcApiBridgeClient({
    baseUrl: config.AUTH_BRIDGE_HOST,
    oauthTokens: {
      consumerKey: config.OAUTH_CONSUMER_KEY,
      consumerSecret: config.OAUTH_CONSUMER_SECRET,
      token: config.token,
      secret: config.secret,
    },
    hooks,
  });
}
