import dedent from 'dedent';
import { createApiToken, deleteApiToken, listApiTokens } from '../clever-client/auth-bridge.js';
import { formatDate } from '../lib/format-date.js';
import { promptSecret } from '../lib/prompts.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import { conf } from '../models/configuration.js';
import { sendToAuthBridge } from '../models/send-to-api.js';
import { getCurrent as getCurrentUser } from '../models/user.js';

/**
 * Create a new API token
 * @param {Object} params - Function parameters
 * @param {[string]} params.args - Command line args
 * @param {Object} params.options - Command line options
 * @param {'json'|'human'} params.options.format - Output format
 * @param {number} params.options.expiration - Expiration date as timestamp
 */
export async function create(params) {
  const [apiTokenName] = params.args;
  const { expiration, format } = params.options;
  const user = await getCurrentUser();

  if (!user.hasPassword) {
    const apiTokenListHref = new URL('/users/me/api-tokens', conf.CONSOLE_URL).href;
    throw new Error(dedent`
      ${styleText('yellow', '!')} Your Clever Cloud account is linked via GitHub and has no password. Setting one is required to create API tokens.
      ${styleText('blue', '→')} To do so, go to the following URL: ${styleText('blue', apiTokenListHref)}
    `);
  }

  // Expire in 1 year
  const dateObject = new Date();
  dateObject.setFullYear(dateObject.getFullYear() + 1);
  const maxExpirationDate = dateObject;

  let expirationDate;
  if (expiration != null) {
    if (expiration > maxExpirationDate.getTime()) {
      throw new Error('You cannot set an expiration date greater than 1 year');
    }
    expirationDate = new Date(expiration);
  } else {
    expirationDate = maxExpirationDate;
  }

  const password = await promptSecret('Enter your password:');

  let mfaCode;
  if (user.preferredMFA === 'TOTP') {
    mfaCode = await promptSecret('Enter your 2FA code:');
  }

  const tokenData = {
    email: user.email,
    password,
    mfaCode,
    name: apiTokenName,
    expirationDate: expirationDate.toISOString(),
  };
  const createdToken = await createApiToken(tokenData)
    .then(sendToAuthBridge)
    .catch((error) => {
      const errorCode = error?.cause?.responseBody?.code;
      if (errorCode === 'invalid-credential') {
        throw new Error('Invalid credentials, check your password');
      }
      if (errorCode === 'invalid-mfa-code') {
        throw new Error('Invalid credentials, check your 2FA code');
      }
      throw error;
    });

  switch (format) {
    case 'json':
      Logger.printJson(createdToken);
      break;
    case 'human':
    default:
      Logger.println(dedent`
        ${styleText('green', '✔')} API token successfully created! Store it securely, you won't able to print it again.

          - API token ID : ${styleText('grey', createdToken.apiTokenId)}
          - API token    : ${styleText('grey', createdToken.apiToken)}
          - Expiration   : ${styleText('grey', formatDate(createdToken.expirationDate))}

        Export this token and use it to make authenticated requests to the Clever Cloud API through the Auth Bridge:

        export CC_API_TOKEN=${createdToken.apiToken}
        curl -H "Authorization: Bearer $CC_API_TOKEN" ${conf.AUTH_BRIDGE_HOST}/v2/self

        Then, to revoke this token, run:
        clever tokens revoke ${createdToken.apiTokenId}
      `);
  }
}

/**
 * Get information about an API token
 * @param {Object} params - Function parameters
 * @param {Object} params.options - Command line options
 * @param {Object} params.options.format - Output format
 * @returns {Promise<void>}
 */
export async function list(params) {
  const { format } = params.options;

  const tokens = await listApiTokens().then(sendToAuthBridge);

  if (format === 'json') {
    Logger.printJson(tokens);
  } else {
    if (tokens.length === 0) {
      Logger.println(`ℹ️  No API token found, create one with ${styleText('blue', 'clever tokens create')} command`);
    } else {
      console.table(
        tokens.map((token) => {
          return {
            'API token ID': token.apiTokenId,
            Name: token.name,
            'Creation IP address': token.ip,
            Creation: formatDate(token.creationDate),
            Expiration: formatDate(token.expirationDate),
            State: token.state,
          };
        }),
      );
    }
  }
}

/**
 * Revoke an API token
 * @param {Object} params - Function parameters
 * @param {string[]} params.args - Command line arguments, token ID to revoke is expected as first argument
 * @returns {Promise<void>}
 */
export async function revoke(params) {
  const [apiTokenId] = params.args;

  await deleteApiToken(apiTokenId).then(sendToAuthBridge);

  Logger.println(styleText('green', '✔'), 'API token successfully revoked!');
}
