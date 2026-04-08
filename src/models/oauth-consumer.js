import { get as getOauthConsumer } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { promptCheckbox } from '../lib/prompts.js';
import { styleText } from '../lib/style-text.js';
import { findOauthConsumersByKeyOrName } from './ids-resolver.js';
import { sendToApi } from './send-to-api.js';

/* eslint-disable camelcase */
export const OAUTH_RIGHTS = {
  access_organisations: 'access-organisations',
  access_organisations_bills: 'access-organisations-bills',
  access_organisations_consumption_statistics: 'access-organisations-consumption-statistics',
  access_organisations_credit_count: 'access-organisations-credit-count',
  access_personal_information: 'access-personal-information',
  manage_organisations: 'manage-organisations',
  manage_organisations_applications: 'manage-organisations-applications',
  manage_organisations_members: 'manage-organisations-members',
  manage_organisations_services: 'manage-organisations-services',
  manage_personal_information: 'manage-personal-information',
  manage_ssh_keys: 'manage-ssh-keys',
};
/* eslint-enable camelcase */

export function rightsFromList(requestedRights = []) {
  const hasAll = requestedRights.includes('all');
  return Object.fromEntries(
    Object.entries(OAUTH_RIGHTS).map(([apiName, cliName]) => {
      return [apiName, hasAll || requestedRights.includes(cliName)];
    }),
  );
}

const READONLY_RIGHTS = ['almighty'];

export function removeReadonlyRights(rights) {
  return Object.fromEntries(
    Object.entries(rights).filter(([key]) => {
      return !READONLY_RIGHTS.includes(key);
    }),
  );
}

export async function promptRights(existingRights) {
  const choices = Object.entries(OAUTH_RIGHTS).map(([apiName, cliName]) => ({
    name: cliName,
    value: cliName,
    checked: existingRights?.[apiName] ?? false,
  }));

  const selected = await promptCheckbox('Select rights', choices);

  return rightsFromList(selected);
}

export async function getAllConsumers() {
  const summary = await getSummary().then(sendToApi);
  return [summary.user, ...summary.organisations].flatMap((owner) => {
    return owner.consumers.map((c) => ({ ownerId: owner.id, ownerName: owner.name, ...c }));
  });
}

export async function resolveOauthConsumer(keyOrName) {
  const candidates = await findOauthConsumersByKeyOrName(keyOrName);

  if (candidates.length === 0) {
    throw new Error(`OAuth consumer not found: ${styleText('red', keyOrName)}`);
  }

  if (candidates.length > 1) {
    const list = candidates.map((c) => `  - ${c.name} ${styleText('grey', `(${c.key})`)}`).join('\n');
    throw new Error(`Ambiguous name ${styleText('red', keyOrName)}, use the key instead:\n${list}`);
  }

  const { ownerId, key } = candidates[0];
  const oauthConsumer = await getOauthConsumer({ id: ownerId, key }).then(sendToApi);
  return { ownerId, ...oauthConsumer };
}
