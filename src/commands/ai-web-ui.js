import openPage from 'open';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { getCurlInstructions } from './ai-chat.js';
import { checkUrlStatus } from '../models/utils.js';

import * as AiWebUI from '../models/ai-web-ui.js';
import * as AiEndpoints from '../models/ai-endpoints.js';

/**
 * Check and open Web UI for a Clever AI Chat service
 * @param {Object} endpoint - The Clever AI Endpoint
 * @param {boolean} open - Whether to open the Web UI automatically
 * @returns {Promise<boolean>} Whether the Web UI is enabled
 * @public
 */
export async function checkAndOpenWebUI (endpoint, open) {
  if (endpoint.web_ui_settings.enabled) {
    Logger.println('✅ Your new Clever AI Chat service starts deploying...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Logger.println(`🌐 Open its Web UI with ${colors.blue(`clever ai webui open ${endpoint.name || endpoint.uid}`)} command`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (open) {
      Logger.println(`🚀 Once propagated, it will be automatically opened (${colors.green(`https://${endpoint.web_ui_settings.frontend}`)})`);
      await checkUrlStatus(`https://${endpoint.web_ui_settings.frontend}`);
      await openPage(`https://${endpoint.web_ui_settings.frontend}`, { wait: false });
    }
    else {
      Logger.println(`🚀 Once propagated, it will be available at ${colors.green(`https://${endpoint.web_ui_settings.frontend}`)}`);
    }
  }
  else {
    Logger.error(`Failed to enable Clever AI Chat Web UI ${colors.green(endpoint.uid)}`);
  }

  return endpoint.web_ui_settings.enabled;
}

/**
 * Disable Web UI for a Clever AI Chat service
 * @param {Object} params - The command parameters
 * @public
 */
export async function disableWebUI (params) {
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);

  if (!endpoint.web_ui_settings.enabled) {
    Logger.println(`❎ Clever AI Chat Web UI ${colors.green(endpointNameOrUid)} is already disabled`);
    return;
  }

  const updatedEndpoint = await AiWebUI.activate(endpoint.uid, false);

  if (!updatedEndpoint.web_ui_settings.enabled) {
    Logger.println(`✅ Clever AI Chat Web UI ${colors.green(endpointNameOrUid)} disabled, use it with cURL:`);
    getCurlInstructions({ namedArgs: { 'chat-name-or-uid': endpointNameOrUid } });
  }
  else {
    Logger.error(`Failed to disable Clever AI Chat Web UI ${colors.red(endpoint.uid)}`);
  }
}

/**
   * Enable the Clever AI Web UI for an LLM Endpoint
   * @param {Object} params - The command parameters
   * @public
   */
export async function enableWebUI (params) {
  const { open } = params.options;
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);

  if (endpoint.web_ui_settings.enabled) {
    Logger.println(`❎ Clever AI Chat Web UI ${colors.green(endpointNameOrUid)} is already enabled`);
    return;
  }

  const updatedEndpoint = await AiWebUI.activate(endpoint.uid, true);
  checkAndOpenWebUI(updatedEndpoint, open);
}

/**
 * Open the Clever AI Web UI for an LLM Endpoint
 * @param {Object} params - The command parameters
 * @public
 */
export async function openWebUI (params) {
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  const url = await AiWebUI.getURL(endpoint.uid);

  if (url.length === 0) {
    Logger.println(`Clever AI Chat Web UI is not enabled for endpoint ${colors.green(endpointNameOrUid)}`);
    process.exit(0);
  }
  else {
    Logger.println(`Opening Clever AI Chat Web UI for endpoint ${colors.green(endpointNameOrUid)}...`);
    Logger.debug(`URL: ${url}`);
    await openPage(url, { wait: false });
  }
}

/**
 * Show the Clever AI Web UI status for an LLM Endpoint
 * @param {Object} params - The command parameters
 * @public
 */
export async function showWebUIStatus (params) {
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;
  const { format } = params.options;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  const url = await AiWebUI.getURL(endpoint.uid);

  if (url.length === 0) {
    Logger.println(`Clever AI Chat Web UI is not enabled for endpoint ${colors.green(endpointNameOrUid)}`);
    process.exit(0);
  }

  switch (format) {
    case 'json':
      Logger.printJson({
        web_ui_settings: {
          enabled: !!url,
          frontend: url,
        },
      });
      break;
    case 'human':
    default:
      Logger.println(`Clever AI Chat Web UI is ${url ? 'enabled' : 'disabled'} for endpoint ${colors.green(endpointNameOrUid)}`);
      Logger.println(`Open it with ${colors.blue(`clever ai webui open ${endpointNameOrUid}`)} command or at ${colors.blue(`${url}`)}`);
      break;
  }
}
