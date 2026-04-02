import { checkbox, input } from '@inquirer/prompts';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const consumerKeyOrNameArg = defineArgument({
  schema: z.string(),
  description: 'OAuth consumer key (or name, if unambiguous)',
  placeholder: 'consumer-key|consumer-name',
});

export const RIGHTS_MAP = {
  'access-organisations': 'access_organisations',
  'access-organisations-bills': 'access_organisations_bills',
  'access-organisations-consumption-statistics': 'access_organisations_consumption_statistics',
  'access-organisations-credit-count': 'access_organisations_credit_count',
  'access-personal-information': 'access_personal_information',
  'manage-organisations': 'manage_organisations',
  'manage-organisations-applications': 'manage_organisations_applications',
  'manage-organisations-members': 'manage_organisations_members',
  'manage-organisations-services': 'manage_organisations_services',
  'manage-personal-information': 'manage_personal_information',
  'manage-ssh-keys': 'manage_ssh_keys',
};

export const VALID_RIGHTS = [...Object.keys(RIGHTS_MAP), 'all'];

const ALL_API_RIGHTS = Object.values(RIGHTS_MAP);

export function parseRights(rightsCsv) {
  const rightsObj = Object.fromEntries(ALL_API_RIGHTS.map((r) => [r, false]));

  if (rightsCsv == null) {
    return rightsObj;
  }

  const requestedRights = rightsCsv.split(',').map((r) => r.trim());
  for (const right of requestedRights) {
    if (right === 'all') {
      for (const apiRight of ALL_API_RIGHTS) {
        rightsObj[apiRight] = true;
      }
      continue;
    }
    const apiRight = RIGHTS_MAP[right];
    if (apiRight == null) {
      throw new Error(`Invalid right: "${right}". Valid rights are: ${VALID_RIGHTS.join(', ')}`);
    }
    rightsObj[apiRight] = true;
  }

  return rightsObj;
}

export function stripAlmighty(rights) {
  const { almighty, ...rest } = rights;
  return rest;
}

export function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return 'Please enter a valid URL (e.g. https://example.com)';
  }
}

export async function promptField(message, value, defaultValue, validate) {
  if (value != null) return value;
  return input({ message, default: defaultValue, validate });
}

export async function promptRights(existingRights) {
  const choices = Object.entries(RIGHTS_MAP).map(([cliName, apiName]) => ({
    name: cliName,
    value: cliName,
    checked: existingRights?.[apiName] ?? false,
  }));

  const selected = await checkbox({ message: 'Select rights', choices });

  if (selected.length === 0) {
    return parseRights(null);
  }

  return parseRights(selected.join(','));
}
