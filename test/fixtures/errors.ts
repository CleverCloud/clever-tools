/**
 * Canonical error text the CLI emits when the API returns 401.
 * Mapped in src/models/send-to-api.js (`processError`).
 */
export const NOT_LOGGED_IN_ERROR =
  "[ERROR] You're not logged in, use clever login command to connect to your Clever Cloud account";

/**
 * Canonical error text the CLI emits when both `--app` and `--alias` are passed.
 * Thrown in src/models/application.js (`resolveId`).
 */
export const APP_ALIAS_MUTEX_ERROR = '[ERROR] Only one of the `--app` or `--alias` options can be set at a time';
