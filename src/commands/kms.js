import { Logger } from '../logger.js';
import { getSecret, putSecret } from '../models/kms.js';

/**
 * Get secret from Clever KMS
 * @param {*} params
 * @param {string} params.args[0] - secret name
 * @param {object} params.options.format - output format
 * @returns {Promise<void>}
 */
export async function get (params) {
  const [fieldKey] = params.args;
  const { format } = params.options;

  const secret = await getSecret(fieldKey);

  switch (format) {
    case 'json':
      Logger.printJson(secret.data.data);
      break;
    case 'human':
    default:
      console.table(secret.data.data);
  }
}

/**
 * Put secret in Clever KMS
 * @param {object} params
 * @param {string} params.args[0] - secret name
 * @param {Array<string>} params.args[...n] - key=value pairs
 * @param {object} params.options.format - output format
 * @returns {Promise<void>}
 */
export async function put (params) {
  const [fieldKey, ...fieldValues] = params.args;
  const { format } = params.options;

  const response = await putSecret(fieldKey, fieldValues);

  switch (format) {
    case 'json':
      Logger.printJson(response.data);
      break;
    case 'human':
    default:
      console.table(response.data);
  }
}
