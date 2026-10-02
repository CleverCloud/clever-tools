import dedent from 'dedent';
import { styleText } from '../lib/style-text.js';
import { sendToApi } from './send-to-api.js';

const TOKEN_ID_REGEX = /^token_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function listServiceTokens(orgaId) {
  return Promise.resolve({
    method: 'get',
    url: `/v2/organisations/${orgaId}/service-tokens`,
    headers: { Accept: 'application/json' },
  });
}

export function getServiceTokenById(orgaId, tokenId) {
  return Promise.resolve({
    method: 'get',
    url: `/v2/organisations/${orgaId}/service-tokens/${tokenId}`,
    headers: { Accept: 'application/json' },
  });
}

export async function resolveServiceTokenId(orgaId, tokenIdOrName) {
  if (TOKEN_ID_REGEX.test(tokenIdOrName)) {
    return tokenIdOrName;
  }

  const tokens = await listServiceTokens(orgaId).then(sendToApi);
  const matches = tokens.filter((t) => t.name === tokenIdOrName);

  if (matches.length === 0) {
    throw new Error(`Could not find service token ${styleText('red', tokenIdOrName)}`);
  }
  if (matches.length > 1) {
    const list = matches.map((t) => `- ${t.name} (${t.id})`).join('\n');
    throw new Error(dedent`
      Ambiguous name ${styleText('red', tokenIdOrName)}, use the ID instead:
      ${styleText('grey', list)}
    `);
  }

  return matches[0].id;
}

export function createServiceToken(orgaId, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v2/organisations/${orgaId}/service-tokens`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body,
  });
}

export function deleteServiceToken(orgaId, tokenId) {
  return Promise.resolve({
    method: 'delete',
    url: `/v2/organisations/${orgaId}/service-tokens/${tokenId}`,
    headers: { Accept: 'application/json' },
  });
}
