/**
 * An API token as `GET /api-tokens` returns it, which is what `clever tokens --format json`
 * printed before the `@clevercloud/client` migration.
 */
export interface LegacyApiToken {
  apiTokenId: string;
  userId: string;
  /** ISO date string. */
  creationDate: string;
  /** ISO date string. */
  expirationDate: string;
  ip: string;
  name: string;
  description?: string;
  state: 'ACTIVE' | 'EXPIRED';
}

/**
 * A freshly created API token as `POST /api-tokens` returns it, which is what
 * `clever tokens create --format json` printed before the `@clevercloud/client` migration.
 */
export interface LegacyCreatedApiToken {
  apiToken: string;
  apiTokenId: string;
  /** ISO date string. */
  creationDate: string;
  /** ISO date string. */
  expirationDate: string;
  name: string;
  description?: string;
  state: 'ACTIVE' | 'EXPIRED';
}
