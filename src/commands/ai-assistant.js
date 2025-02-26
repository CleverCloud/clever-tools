import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { getCurlInstructions } from './ai-chat.js';

import * as AiAssistants from '../models/ai-assistant.js';
import * as AiEndpoints from '../models/ai-endpoints.js';

// TODO: Accept a custom file path as parameter
/**
 * Apply a Clever AI Chat assistants to Clever AI Chat service
 * @param {Object} params - The command parameters
 * @param {string} params.assistantsId - The assistant ID
 * @param {string} params.chatNameOrUid - The chat name or UID
 * @public
 */
export async function applyAssistantToChatService (params) {
  const { 'assistant-id': assistantId, 'chat-name-or-uid': chatNameOrUid } = params.namedArgs;
  const endpoint = await AiEndpoints.getEndpointOrShowList(chatNameOrUid);

  await AiAssistants.apply(endpoint.uid, assistantId);
  Logger.println(`✅ Assistant ${colors.green(assistantId)} applied to Clever AI Chat service ${colors.green(chatNameOrUid)}`);

  if (!endpoint.web_ui_settings.enabled) {
    Logger.println(`🌐 It will be automatically used in Web UI, open it with: ${colors.blue(`clever ai webui open ${endpoint.name || endpoint.uid}`)}`);
  }
  else {
    Logger.println('🌐 It will be automatically used in your requests, test it with:');
    await getCurlInstructions(params);
  }
}

/**
 * Get a Clever AI Chat assistant by its ID
 * @param {Object} params - The command parameters
 * @param {string} params.assistantId - The assistant ID
 * @public
 * @throws {Error} If the assistant is not found
 */
export async function getAssistant (params) {
  const { 'assistant-id': assistantId } = params.namedArgs;
  const assistant = await AiAssistants.get(assistantId);

  if (!assistant) {
    Logger.error(`Assistant ${colors.red(assistantId)} not found, check ${colors.grey(AiAssistants.ASSISTANTS_CONFIG_FILE)} file`);
    process.exit(1);
  }

  Logger.printJson(assistant);
}

/**
 * List Clever AI Chat assistants
 * @param {Object} params - The command parameters
 * @param {boolean} [params.format] - Whether to use human-readable JSON output
 * @public
 * @throws {Error} If no assistants are found
 */
export async function listAssistants (params) {
  const { format } = params.options;
  const assistants = AiAssistants.list();

  if (assistants.length === 0) {
    Logger.error(`No Clever AI Chat assistants found, check ${colors.red(AiAssistants.ASSISTANTS_CONFIG_FILE)} file`);
    process.exit(1);
  }

  switch (format) {
    case 'json':
      Logger.printJson(assistants);
      break;
    case 'human':
    default:
      Logger.println(`🔎 Found ${colors.green(assistants.length)} assistants:`);
      assistants.forEach((assistant) => {
        Logger.println(colors.grey(` - ${assistant.name} (${assistant.id})`));
      });
      break;
  }
}
