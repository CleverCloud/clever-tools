import { checkbox } from '@inquirer/prompts';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { exitOnPromptError } from '../../lib/prompts.js';
import { parseRights, RIGHTS_MAP, VALID_RIGHTS } from '../../models/oauth-consumer.js';
import { notEmptyStringSchema } from '../global.args.js';

export const consumerKeyOrNameArg = defineArgument({
  schema: notEmptyStringSchema,
  description: 'OAuth consumer key (or name, if unambiguous)',
  placeholder: 'consumer-key|consumer-name',
});

export const rightsSchema = z
  .string()
  .refine(
    (value) => {
      const rights = value.split(',').map((r) => r.trim());
      return rights.every((r) => VALID_RIGHTS.includes(r));
    },
    { message: `Invalid right. Valid rights are: ${VALID_RIGHTS.join(', ')}` },
  )
  .optional();

export async function promptRights(existingRights) {
  const choices = Object.entries(RIGHTS_MAP).map(([cliName, apiName]) => ({
    name: cliName,
    value: cliName,
    checked: existingRights?.[apiName] ?? false,
  }));

  const selected = await checkbox({ message: 'Select rights', choices }).catch(exitOnPromptError);

  if (selected.length === 0) {
    return parseRights(null);
  }

  return parseRights(selected.join(','));
}
