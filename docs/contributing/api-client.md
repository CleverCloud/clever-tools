# Clever Cloud API client

clever-tools talks to the Clever Cloud API through [`clever-client.js`](https://github.com/CleverCloud/clever-client.js), published as `@clevercloud/client` and pinned in `package.json`.

## The pattern used in `src/`

Every command and model uses the function-per-endpoint API of the client, combined with `sendToApi` from `src/models/send-to-api.js`:

```js
import { updateEnvVar } from '@clevercloud/client/esm/api/v2/application.js';
import { sendToApi } from '../../models/send-to-api.js';

await updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
```

The endpoint function only builds the request params (method, URL, headers, body). `sendToApi` then:

- prefixes the URL with `API_HOST` (overridable per profile or with an env var),
- signs the request with the OAuth tokens of the active profile,
- logs the method and URL at debug level (`-v`),
- turns network, TLS and 401 errors into messages the user can act on (`processError`).

Other API errors are rethrown as is, so their message depends on the endpoint. Run with `-v` to see the request.

Related helpers in the same file:

- `sendToAuthBridge`: same pipeline against `AUTH_BRIDGE_HOST` (API tokens, see `src/commands/tokens/`).
- `sendToApiWithConfig`: same pipeline with explicit credentials, for a profile that is not the active one (`src/lib/profile.js`, login).
- `getHostAndTokens`: host and tokens for the streaming helpers (`@clevercloud/client/esm/streams/*`: logs and access logs, and `activity --follow` through a WebSocket).

## Resolving IDs

Commands accept names or IDs (`--app`, `--alias`, `--org`, add-on names…). Never resolve them by hand in a command:

- `Application.resolveId(appIdOrName, alias)` (`src/models/application.js`) returns `{ ownerId, appId }`, falling back to the app linked in `.clever.json`.
- `src/models/ids-resolver.js` resolves owners, add-ons and OAuth consumers, with a local cache (`src/config/cache.js`, `IDS_CACHE_FILE`).
- Operators, k8s and network groups resolve names in their own models and throw the error built by `ambiguousNameError()` (`src/lib/ambiguous-name-error.js`) when a name matches several resources.

## Endpoints missing from the client

`src/clever-client/` holds endpoints that `@clevercloud/client` does not expose (auth bridge, drains, k8s, network groups, operators). The request-params part of `@clevercloud/client` is no longer updated, so adding an endpoint here is the normal way to get a missing one, no issue or PR on `clever-client.js` is needed.

Before adding one, check that the endpoint does not already exist in `@clevercloud/client` (`node_modules/@clevercloud/client/dist/esm/api/`).

An endpoint is a function returning `Promise.resolve({ method, url, headers, queryParams, body })`, with its HTTP method and path in the JSDoc, chained with `.then(sendToApi)`. From `src/clever-client/drains.js`:

```js
/**
 * GET /v4/drains/organisations/{ownerId}/resources/{resourceId}/drains?status={status}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.resourceId
 * @param {String} params.status
 */
export function getDrains(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/drains/organisations/${params.ownerId}/resources/${params.resourceId}/drains`,
    headers: { Accept: 'application/json' },
    queryParams: { status: params.status },
  });
}
```

This client is expected to disappear with the migration described below.

## The command-based client

`@clevercloud/client` also ships a newer command-based client (`@clevercloud/client/cc-api-client.js` and `cc-api-commands/`). A large migration of clever-tools to it is being prepared, but it has not started: for now it is only used by `scripts/generate-docs.js`, without authentication.

**Don't use it in `src/` yet**, and don't migrate existing code to it as a side effect of another change: keep using the request-params functions and `sendToApi` described above until the migration lands.

## Working against a local checkout of the client

To test an unreleased change to the client without publishing:

```bash
(cd ../clever-client.js && npm pack)
npm install -f ../clever-client.js/clevercloud-client-*.tgz
```

This assumes `clever-client.js` is cloned as a sibling of this repository. It rewrites `package.json` and `package-lock.json`: restore both before committing.
