import { CcApiClient } from '@clevercloud/client/cc-api-client.js';
import { conf, loadOAuthConf } from '../models/configuration.js';

let apiClient: CcApiClient;

export async function getApiClient() {
  if (apiClient == null) {
    const tokens = await loadOAuthConf();
    apiClient = new CcApiClient({
      baseUrl: conf.API_HOST,
      authMethod: {
        type: 'oauth-v1',
        oauthTokens: {
          consumerKey: conf.OAUTH_CONSUMER_KEY,
          consumerSecret: conf.OAUTH_CONSUMER_SECRET,
          token: tokens.token,
          secret: tokens.secret,
        },
      },
    });
  }

  return apiClient;
}
