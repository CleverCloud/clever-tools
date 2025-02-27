import dedent from 'dedent';
import Duration from 'duration-js';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { createApiToken, deleteApiToken, listApiTokens } from '../clever-client/auth-bridge.js';
import { sendToAuthBridge } from '../models/send-to-api.js';
import { getCurrent as getCurrentUser } from '../models/user.js';
import { conf } from '../models/configuration.js';
import { promptPassword } from '../prompt-password.js';

/**
 * Create a new API token
 * @param {Object} params - Function parameters
 * @param {[string]} params.args - Command line args
 * @param {Object} params.options - Command line options
 * @param {'json'|'human'} params.options.format - Output format
 */
export async function create (params) {
  const [apiTokenName] = params.args;
  const { expiration, format } = params.options;

  const dateObject = new Date();
  const moreThanOneYearErrorMessage = 'You cannot set an expiration date greater than 1 year';

  // Duration can be weeks, days, hours, minutes, seconds, milliseconds
  // If it's months or years, we use setMonth or setFullYear
  const expirationUnit = expiration.slice(-1);
  if (expirationUnit === 'M' || expirationUnit === 'y') {
    const durationValue = parseInt(expiration.slice(0, -1), 10);
    if ((expirationUnit === 'M' && durationValue > 12) || (expirationUnit === 'y' && durationValue > 1)) {
      throw new Error(moreThanOneYearErrorMessage);
    }
    expirationUnit === 'M'
      ? dateObject.setMonth(dateObject.getMonth() + durationValue)
      : dateObject.setFullYear(dateObject.getFullYear() + durationValue);
  }
  else {
    const secondsToAdd = new Duration(expiration).seconds();
    if (secondsToAdd > 31622400) {
      throw new Error(moreThanOneYearErrorMessage);
    }
    dateObject.setSeconds(dateObject.getSeconds() + secondsToAdd);
  }

  const expirationDate = dateObject.toISOString();

  const user = await getCurrentUser();

  const password = await promptPassword('Enter your password:');

  let mfaCode;
  if (user.preferredMFA === 'TOTP') {
    mfaCode = await promptPassword('Enter your 2FA code:');
  }

  const tokenData = {
    email: user.email,
    password,
    mfaCode,
    name: apiTokenName,
    expirationDate,
  };
  const createdToken = await createApiToken(tokenData).then(sendToAuthBridge);

  switch (format) {
    case 'json':
      Logger.printJson(createdToken);
      break;
    case 'human':
    default:
      Logger.println(dedent`
        ${colors.green('✔')} API token successfully created!

          - API token ID : ${colors.grey(createdToken.apiTokenId)}
          - API token    : ${colors.grey(createdToken.apiToken)}
          - Expiration   : ${colors.grey(new Date(createdToken.expirationDate).toLocaleString())}

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
export async function list (params) {
  const { format } = params.options;

  const tokens = await listApiTokens().then(sendToAuthBridge);

  if (format === 'json') {
    Logger.printJson(tokens);
  }
  else {
    if (tokens.length === 0) {
      Logger.println(`ℹ️  No API token found, create one with ${colors.blue('clever tokens create')} command`);
    }
    else {
      console.table(tokens.map((token) => {
        return {
          'API token ID': token.apiTokenId,
          Name: token.name,
          'Creation IP address': token.ip,
          'Creation date/time': formatDate(token.creationDate),
          'Expiration date/time': formatDate(token.expirationDate),
        };
      }));
    }
  }
}

/**
 * Revoke an API token
 * @param {Object} params - Function parameters
 * @param {string[]} params.args - Command line arguments, token ID to revoke is expected as first argument
 * @returns {Promise<void>}
 */
export async function revoke (params) {
  const [apiTokenId] = params.args;

  await deleteApiToken(apiTokenId).then(sendToAuthBridge);

  Logger.println(colors.green('✔'), 'API token successfully revoked!');
}

function formatDate (dateInput) {
  return new Date(dateInput).toISOString().substring(0, 16).replace('T', ' ');
}
