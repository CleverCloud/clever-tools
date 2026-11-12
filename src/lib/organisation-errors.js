/**
 * Translate the errors of the organisation and member endpoints into messages the user can act on.
 * An error the API does not explain is kept: its message, then one `<field>: <message>` line per invalid field.
 */

/**
 * @typedef {Error & { id?: number | string, response?: { status: number }, responseBody?: any }} ApiRequestError
 */

/**
 * @param {ApiRequestError} error
 * @returns {number | null} The business code of the API error (`id` of its body), `null` when there is none
 */
function getCode(error) {
  const code = Number(error?.responseBody?.id ?? error?.id);
  return Number.isNaN(code) ? null : code;
}

/**
 * @param {ApiRequestError} error
 * @returns {number | null}
 */
function getStatus(error) {
  return error?.response?.status ?? null;
}

/**
 * Keep the message of an API error, followed by one line per invalid field of a validation error.
 * @param {ApiRequestError} error
 * @returns {Error}
 */
export function rawApiError(error) {
  const fields = error?.responseBody?.fields;
  if (fields == null || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    return error;
  }
  const fieldLines = Object.entries(fields).map(([name, message]) => `${name}: ${message}`);
  return new Error([error.message, ...fieldLines].join('\n'), { cause: error });
}

/**
 * Translate an error of `PUT /v2/organisations/{id}`.
 * @param {ApiRequestError} error
 * @param {string} orgaLabel - `<name> (<id>)` of the organisation
 * @returns {Error}
 */
export function organisationUpdateError(error, orgaLabel) {
  if (getCode(error) === 6102) {
    return new Error(`Cannot update ${orgaLabel}: the OAuth right manage_organisations is missing`, { cause: error });
  }
  if (getStatus(error) === 403) {
    return new Error(`Cannot update ${orgaLabel}: your role does not allow it (ADMIN or MANAGER required)`, {
      cause: error,
    });
  }
  return rawApiError(error);
}
