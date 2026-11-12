import { z } from 'zod';
import { defineOption } from '../../lib/define-option.js';

const ROLES = /** @type {const} */ (['admin', 'manager', 'developer', 'accounting']);
const ROLES_LIST = ROLES.join(', ');

/**
 * Role of a member, case insensitive, transformed to the upper case value of the API.
 * @param {z.ZodString | z.ZodDefault<z.ZodString>} stringSchema
 */
function roleSchema(stringSchema) {
  return stringSchema
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(ROLES))
    .transform((value) => /** @type {'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'ACCOUNTING'} */ (value.toUpperCase()));
}

export const roleFilterOption = defineOption({
  name: 'role',
  schema: roleSchema(z.string()).optional(),
  description: `Only list the members with this role (${ROLES_LIST})`,
  placeholder: 'role',
});

export const inviteRoleOption = defineOption({
  name: 'role',
  schema: roleSchema(z.string().default('developer')),
  description: `Role of the new member (${ROLES_LIST})`,
  placeholder: 'role',
});

export const requiredRoleOption = defineOption({
  name: 'role',
  schema: roleSchema(z.string()),
  description: `New role of the member (${ROLES_LIST})`,
  placeholder: 'role',
});
