import fs from 'node:fs';
import { Logger } from '../logger.js';
import * as AiEndpoints from './ai-endpoints.js';

// TODO: Accepte a custom file path as parameter
export const ASSISTANTS_CONFIG_FILE = '.clever-ai-chat-assistants.json';

/**
 * Read the Clever assistants from the config file
 * @param {string} [filePath] - The path to the configuration file
 * @returns {Array}
 * @throws {Error} If the configuration file is not found or the configuration is invalid
 */
export const readFromFile = (filePath = ASSISTANTS_CONFIG_FILE) => {
  try {
    if (!fs.existsSync(filePath)) {
      Logger.error(`Configuration file ${filePath} not found`);
      process.exit(1);
    }

    const assistants = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    Logger.debug('Assistants configuration:', assistants);

    if (!Array.isArray(assistants)) {
      Logger.error('Invalid assistants configuration: expected an array');
      process.exit(1);
    }

    if (assistants.length === 0) {
      Logger.error('No assistants found in configuration file');
      process.exit(1);
    }

    assistants.forEach((assistant, index) => {
      if (!assistant.id || !assistant.name || !assistant.context_settings) {
        Logger.error(`Invalid assistant configuration at index ${index}`);
        process.exit(1);
      }
    });

    return assistants;
  }
  catch (error) {
    Logger.error(`Failed to read assistants configuration: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Get a Clever AI assistant by its ID
 * @param {string} id - The assistant ID
 * @returns {Object}
 * @throws {Error} If no assistant ID is provided
 */
export function get (id) {
  if (!id) {
    Logger.error('No assistant ID provided');
    process.exit(1);
  }

  const assistants = readFromFile();
  const foundAssistant = assistants.find((assistant) => assistant.id === id);
  Logger.debug('Found assistant:', foundAssistant);

  return foundAssistant;
};

/**
 * List all Clever AI assistants sorted by name
 * @returns {Array}
 */
export function list () {
  const assistants = readFromFile();
  return assistants.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Apply a Clever AI assistant to Clever AI Chat service
 * @param {string} endpointNameOrUid - The endpoint name or UID
 * @param {string} assistantId - The assistant ID
 * @returns {Promise<void>}
 * @throws {Error} If the endpoint or assistant is not found
 */
export async function apply (endpointNameOrUid, assistantId) {
  if (!endpointNameOrUid || !assistantId) {
    Logger.error('Both endpointNameOrUid and assistantId are required');
    process.exit(1);
  }

  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  const assistant = get(assistantId);

  if (!assistant || !endpoint) {
    Logger.error(`${!endpoint ? 'Endpoint' : 'Assistant'} not found: ${!endpoint ? endpointNameOrUid : assistantId}`);
    process.exit(1);
  }

  Logger.debug(`Applying assistant ${assistant.name} to endpoint ${endpoint.uid}`);
  Logger.debug('New endpoint context settings:', assistant.context_settings);

  endpoint.context_settings = assistant.context_settings;
  await AiEndpoints.update(endpoint.uid, endpoint);
};
