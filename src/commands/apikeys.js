import { Logger } from '../logger.js';
import * as Apikeys from '../models/ai-api-keys.js';
import * as AiEndpoints from '../models/ai-endpoints.js';

export async function list (params) {
  const { 'chat-name-or-uid': endpointNameOrUid } = params.namedArgs;
  const endpoint = await AiEndpoints.getEndpointOrShowList(endpointNameOrUid);
  const apikeys = await Apikeys.list(endpoint.uid);

  Logger.printJson(apikeys);
}
