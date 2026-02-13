export function createApiToken({ email, password, mfaCode, name, description = '', expirationDate }) {
  return Promise.resolve({
    method: 'post',
    url: '/api-tokens',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { email, password, mfaCode, name, description, expirationDate },
  });
}

export function listApiTokens() {
  return Promise.resolve({
    method: 'get',
    url: '/api-tokens',
    headers: { Accept: 'application/json' },
  });
}

export function deleteApiToken(apiTokenId) {
  return Promise.resolve({
    method: 'delete',
    url: `/api-tokens/${apiTokenId}`,
    headers: { Accept: 'application/json' },
  });
}
