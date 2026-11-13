import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { userIdRegex } from '../../parsers.js';

export const memberIdOrEmailArg = defineArgument({
  schema: z
    .string()
    .refine(
      (value) => userIdRegex.test(value) || z.string().email().safeParse(value).success,
      'Use a member ID (user_...) or an email address',
    ),
  description: 'Member ID (user_...) or email address',
  placeholder: 'member-id|email',
});
