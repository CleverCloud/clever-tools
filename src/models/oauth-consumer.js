import { getAll } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { styleText } from '../lib/style-text.js';
import { sendToApi } from './send-to-api.js';

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

/**
 * Fetch all OAuth consumers across all organisations and the user account.
 * Returns each consumer enriched with ownerId and ownerName.
 */
export async function getAllConsumers() {
  const summary = await getSummary().then(sendToApi);
  const allOwners = [summary.user, ...summary.organisations];
  const owners = [...new Map(allOwners.map((o) => [o.id, o])).values()];

  const results = await Promise.all(
    owners.map(async (owner) => {
      const consumers = await getAll({ id: owner.id }).then(sendToApi);
      return consumers.map((c) => ({ ...c, ownerId: owner.id, ownerName: owner.name }));
    }),
  );

  return results.flat();
}

/**
 * Resolve a consumer key or name to { key, ownerId } across all organisations.
 */
export async function resolveConsumer(keyOrName) {
  const consumers = await getAllConsumers();

  const exact = consumers.find((c) => c.key === keyOrName);
  if (exact) return { key: exact.key, ownerId: exact.ownerId };

  const byName = consumers.filter((c) => c.name === keyOrName);

  if (byName.length === 0) {
    throw new Error(`OAuth consumer not found: ${styleText('red', keyOrName)}`);
  }

  if (byName.length > 1) {
    const list = byName.map((c) => `  - ${c.name} ${styleText('grey', `(${c.key})`)}`).join('\n');
    throw new Error(`Ambiguous name ${styleText('red', keyOrName)}, use the key instead:\n${list}`);
  }

  return { key: byName[0].key, ownerId: byName[0].ownerId };
}
