import { z } from 'zod';

const ROLES = /** @type {const} */ (['admin', 'manager', 'developer', 'accounting']);

export const ROLES_LIST = ROLES.join(', ');

/**
 * Role of a member, case insensitive, transformed to the upper case value of the API.
 */
export const roleSchema = z
  .string()
  .transform((value) => value.toLowerCase())
  .pipe(z.enum(ROLES))
  .transform((value) => /** @type {'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'ACCOUNTING'} */ (value.toUpperCase()));
