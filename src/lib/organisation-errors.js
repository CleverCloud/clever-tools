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

/**
 * Translate an error of `POST /v2/organisations/{id}/members`.
 * @param {ApiRequestError} error
 * @param {Object} context
 * @param {string} context.email - Address of the invited person
 * @param {string} context.role - Role given to the invited person
 * @param {string} context.orgaLabel - `<name> (<id>)` of the organisation
 * @returns {Error}
 */
export function memberInviteError(error, { email, role, orgaLabel }) {
  if (getStatus(error) === 403 && error?.message?.includes('Rate limit exceeded for member invitation')) {
    return new Error(
      `Invitation limit reached for ${email} (4 per hour per recipient, 11 per hour per sender), retry later`,
      { cause: error },
    );
  }
  if (getCode(error) === 6451) {
    return new Error(
      `Cannot invite ${email}: the OAuth right manage_organisations_members is missing or the invitation is not allowed`,
      { cause: error },
    );
  }
  if (getCode(error) === 6453) {
    return new Error(`Cannot assign role ${role}: your role cannot assign it`, { cause: error });
  }
  if (getStatus(error) === 409) {
    return new Error(`${email} is already a member of ${orgaLabel}`, { cause: error });
  }
  return rawApiError(error);
}

/**
 * Translate the errors shared by the member update and removal: unknown member, last admin or last member.
 * @param {ApiRequestError} error
 * @param {'remove' | 'demote'} action
 * @param {string} memberLabel - Email or ID of the member
 * @param {string} orgaLabel - `<name> (<id>)` of the organisation
 * @returns {Error | null} `null` when the error is not one of them
 */
function memberWriteError(error, action, memberLabel, orgaLabel) {
  if (getCode(error) === 6501) {
    return new Error(`Member ${memberLabel} not found in ${orgaLabel}`, { cause: error });
  }
  // These refusals carry no business code, only a plain text message
  if (getStatus(error) === 403 && /last admin/i.test(error?.message ?? '')) {
    return new Error(`Cannot ${action} ${memberLabel}: ${orgaLabel} would have no admin left`, { cause: error });
  }
  if (getStatus(error) === 403 && /last member/i.test(error?.message ?? '')) {
    return new Error(`Cannot ${action} ${memberLabel}: ${orgaLabel} would have no member left`, { cause: error });
  }
  return null;
}

/**
 * Translate an error of `PUT /v2/organisations/{id}/members/{userId}`.
 * @param {ApiRequestError} error
 * @param {Object} context
 * @param {string} context.memberLabel - Email or ID of the member
 * @param {string} context.role - New role of the member
 * @param {string} context.orgaLabel - `<name> (<id>)` of the organisation
 * @returns {Error}
 */
export function memberUpdateError(error, { memberLabel, role, orgaLabel }) {
  if (getCode(error) === 6453) {
    return new Error(`Cannot assign role ${role}: your role cannot assign it`, { cause: error });
  }
  return memberWriteError(error, 'demote', memberLabel, orgaLabel) ?? rawApiError(error);
}
