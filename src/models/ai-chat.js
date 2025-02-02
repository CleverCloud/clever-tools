import { v4 as uuidv4 } from 'uuid';
import * as AiEndpoints from './ai-endpoints.js';
import { generateRandomString } from './utils.js';

const CHAT_HOST = process.env.CHAT_HOST;

/**
 * Create a new Clever Chat Service
 * @param {Object} payload - The Clever Chat Service configuration payload
 * @param {string} payload.name - The name of the Clever Chat Service
 * @param {string} payload.description - The description of the Clever Chat Service
 * @param {string} payload.default_configuration - The default configuration of the Clever Chat Service
 * @param {string} payload.llm_configurations - The list of LLM configurations of the Clever Chat Service
 * @param {string} payload.iconUrl - The URL of the icon to use for the Clever Chat Service
 * @param {string} payload.logoUrl - The URL of the logo to use for the Clever Chat Service
 * @returns {Promise<Object>} The created Clever Chat Service
 */
export async function create ({ withChat = true, name = null, description = null, default_configuration = null, llm_configurations = [], iconUrl, logoUrl }) {

  const { endpoint: templateEndpoint } = await AiEndpoints.getTemplates();
  const endpointBaseUrl = generateFrontendHostname(name);
  const endpointUid = `endpoint_${uuidv4()}`;

  const llmEndpoint = {
    ...templateEndpoint,
    uid: endpointUid,
    name: name || endpointUid,
    origin: 'Clever Tools',
    description: description || '',
    frontend_base: `${endpointBaseUrl}/v1`,
    default_configuration,
    llm_configurations,
  };

  if (withChat) {
    llmEndpoint.web_ui_settings.enabled = true;
    llmEndpoint.web_ui_settings.frontend = `${endpointBaseUrl}/`;
    if (iconUrl) llmEndpoint.web_ui_settings.custom_style.assistant_icon = iconUrl;
    if (iconUrl) llmEndpoint.web_ui_settings.custom_style.favicon = iconUrl;
    if (logoUrl) llmEndpoint.web_ui_settings.custom_style.brand_logo = logoUrl;
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));
  const endpoint = await AiEndpoints.create(llmEndpoint);

  await AiEndpoints.deploy(endpoint.uid);
  return endpoint;
}

/**
 * Generate a Clever AI Endpoint frontend hostname
 * @param {string} [name] - The name of the endpoint (default: random UUID)
 * @returns {string} - The Clever AI Endpoint frontend hostname
 * @public
 */
export function generateFrontendHostname (name) {
  if (!name) {
    name = generateRandomString(6);
  }
  return `${name.toLowerCase()}-${generateRandomString(8).toLowerCase()}.${new URL(CHAT_HOST).hostname}`;
}
