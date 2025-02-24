import colors from 'colors/safe.js';
import { Logger } from '../logger.js';
import { password as promptPassword } from '@inquirer/prompts';
import { createApiToken, deleteApiToken, listApiTokens } from '../clever-client/auth-bridge.js';
import { sendToAuthBridge } from '../models/send-to-api.js';
import { getCurrent as getCurrentUser } from '../models/user.js';
import { conf } from '../models/configuration.js';
import dedent from 'dedent';

/**
 * Create a new API token
 * @param {Object} params - Function parameters
 * @param {[string]} params.args - Command line args
 * @param {Object} params.options - Command line options
 * @param {'json'|'human'} params.options.format - Output format
 */
export async function create (params) {
  const [apiTokenName] = params.args;
  const { format } = params.options;

  const user = await getCurrentUser();

  const password = await promptPassword({ message: 'Enter your password:', mask: true });

  let mfaCode;
  if (user.preferredMFA === 'TOTP') {
    mfaCode = await promptPassword({ message: 'Enter your 2FA code:', mask: true });
  }

  // Expire in 1 year
  const dateObject = new Date();
  dateObject.setFullYear(dateObject.getFullYear() + 1);
  const expirationDate = dateObject.toISOString();

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
        ${colors.green('✔')} API token created successfully!

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
      Logger.println(`Your account does not contain any API tokens. To create one, use the ${colors.blue('clever tokens create')} command.`);
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

  Logger.println(colors.green('✔'), 'API token revoked successfully!');
}

function formatDate (dateInput) {
  return new Date(dateInput).toISOString().substring(0, 16).replace('T', ' ');
}
