import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { confirm } from '@inquirer/prompts';
import { checkAndOpenWebUI } from './ai-web-ui.js';
import { getOrAskChatServiceConfig } from './aiconfig.js';

import * as AiApiKeys from '../models/ai-api-keys.js';
import * as AiEndpoints from '../models/ai-endpoints.js';
import * as AiChat from '../models/ai-chat.js';

/**
 * Create a Clever AI Chat service
 * @param {Object} params - The command parameters
 * @public
 */
export async function createChatService (params) {
  const { 'chat-name-or-uid': name } = params.namedArgs;
  const { conf, interactive, open, 'logo-url': logoUrl, 'icon-url': iconUrl } = params.options;
  const { default_configuration, llm_configurations } = await getOrAskChatServiceConfig(conf, interactive);
  const endpoint = await AiChat.create({
    name,
    default_configuration,
    llm_configurations,
    iconUrl,
    logoUrl,
  });

  await AiApiKeys.create(endpoint.uid);

  params.namedArgs['chat-name-or-uid'] = endpoint.uid;
  checkAndOpenWebUI(endpoint, open);
}

/**
 * Delete a Clever AI Chat service
 * @param {Object} params - The command parameters
 * @public
 */
export async function deleteChatService (params) {
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;

  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  await AiEndpoints.undeployAndDelete(endpoint.uid);

  Logger.println(`✅ Clever AI Chat service ${colors.green(endpointNameOrUid)} successfully deleted`);
}

/**
 * Delete all Clever AI Chat services
 * @public
 */
export async function deleteAllChatServices () {
  const confirmed = await confirm({
    message: 'Are you sure you want to delete all Clever AI Chat services?',
    default: false,
  });

  if (confirmed) {
    const endpoints = await AiEndpoints.list();
    await Promise.all(endpoints.map((endpoint) =>
      AiEndpoints.undeployAndDelete(endpoint.uid),
    ));
  }

  Logger.println('✅ All Clever AI Chat services successfully deleted');
}

/**
 * Get the curl command to use to send a message to Clever AI Chat service
 * @param {Object} params - The command parameters
 * @public
 */
export async function getCurlInstructions (params) {
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;

  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  const apiKeys = await AiApiKeys.list(endpoint.uid);

  Logger.println(`
curl -XPOST \\
--url https://${endpoint.frontend_completions} \\
--header 'Authorization: Bearer ${apiKeys[0].token}' \\
--header 'Content-Type: application/json' \\
--data '{
"messages": [
  {
    "role": "user",
    "content": "Learn me something today"
  }
],
"stream": false,
"max_tokens": 300
}'

You can change the the payload above, add "model" and "provider" to adapt the request to your needs.
You can get list of supported models and providers with ${colors.blue('clever ai list providers')} and ${colors.blue('clever ai list models')} commands.`);
}

/**
 * Restart a Clever AI Chat service
 * @param {Object} params - The command parameters
 * @public
 */
export async function restart (params) {
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  await AiEndpoints.deploy(endpoint.uid);

  Logger.println(`✅ Clever AI Chat service ${colors.green(endpointNameOrUid)} restarted successfully, wait a few seconds...`);
}

/**
 * Show information about a Clever AI Chat service
 * @param {Object} params - The command parameters
 * @param {string} params.chat-name-or-uid - The Clever AI Chat service name or UID
 * @param {string} params.format - The output format
 * @public
 */
export async function showServiceInfo (params) {
  const { 'chat-name-or-uid': chatNameOrUid } = params.namedArgs;
  const { format } = params.options;

  const endpoint = await AiEndpoints.getEndpointOrShowList(chatNameOrUid);
  const status = await AiEndpoints.getStatus(endpoint.uid);

  switch (format) {
    case 'json':
      Logger.printJson(endpoint);
      break;
    case 'human':
    default:
      console.table({
        Name: endpoint.name,
        UID: endpoint.uid,
        Description: endpoint.description,
        'API URL': `https://${endpoint.frontend_completions}`,
        'Models URL': `https://${endpoint.frontend_models}`,
        'Default provider': endpoint.default_configuration,
        'Deployed?': status.deployed,
        'Chat Enabled?': endpoint.web_ui_settings.enabled,
        'Chat URL': `https://${endpoint.web_ui_settings.frontend}`,
      });
      break;
  }
}
