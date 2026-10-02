import { z } from 'zod';
import { defineOption } from '../../lib/define-option.js';
import { DRAIN_KINDS } from '../../models/drain.js';

export const drainUsernameOption = defineOption({
  name: 'username',
  schema: z.string().min(1).optional(),
  description: 'Basic auth username',
  aliases: ['u'],
  placeholder: 'username',
});

export const drainPasswordOption = defineOption({
  name: 'password',
  schema: z.string().min(1).optional(),
  description: 'Basic auth password',
  aliases: ['p'],
  placeholder: 'password',
});

export const drainSdParamsOption = defineOption({
  name: 'sd-params',
  schema: z.string().min(1).optional(),
  description: 'RFC5424 structured data parameters, e.g.: `token=\\\"REDACTED\\\"`',
  aliases: ['s'],
  placeholder: 'sd-params',
});

export const drainKindOption = defineOption({
  name: 'kind',
  schema: z.enum(DRAIN_KINDS).default('LOG'),
  description: 'Kind of logs sent to the drain',
  placeholder: 'kind',
});
