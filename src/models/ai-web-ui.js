import * as AiEndpoints from './ai-endpoints.js';

/**
 * Enable or disable the Clever AI Web UI for a Clever AI Chat service
 * @param {string} endpointUid - The Clever AI Chat service UID
 * @param {boolean} enabled - Whether to enable or disable the web UI
 * @param {string} [frontend] - The frontend URL (only used when enabling)
 * @public
 */
export async function activate (endpointUid, enabled, frontend = null) {
  const endpoint = enabled ? await AiEndpoints.getEndpointOrShowList(endpointUid) : null;
  return await AiEndpoints.update(endpointUid, {
    web_ui_settings: {
      enabled,
      frontend: enabled
        ? (frontend || `${new URL(`https://${endpoint.frontend_completions}`).origin}/`)
        : '',
    },
  });
}

/**
 * Get the Web UI URL for a Clever AI Chat service
 * @param {string} endpointNameOrUid - The Clever AI Chat service name or ID
 * @throws {Error} - If multiple services are found
 * @returns {string} - The Web UI URL
 * @public
 */
export async function getURL (endpointNameOrUid) {
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);

  return endpoint.web_ui_settings.enabled
    ? `https://${endpoint.web_ui_settings.frontend}`
    : '';
}

/**
 * Get the Clever AI Web UI status for a Clever AI Chat service
 * @param {string} endpointUid - The Clever AI Chat service UID
 * @returns {boolean} - Whether the Clever AI Web UI is enabled
 * @public
 */
export async function status (endpointUid) {
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointUid);
  return endpoint.web_ui_settings.enabled;
}
