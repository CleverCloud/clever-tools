import { GetOauthConsumerCommand } from '@clevercloud/client/cc-api-commands/oauth-consumer/get-oauth-consumer-command.js';
import { GRANTABLE_RIGHTS } from '@clevercloud/client/cc-api-commands/oauth-consumer/oauth-consumer-rights.js';
import { GetOrganisationSummariesCommand } from '@clevercloud/client/cc-api-commands/organisation/get-organisation-summaries-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { promptCheckbox } from '../lib/prompts.js';
import { styleText } from '../lib/style-text.js';
import { clients } from './cc-api-client.js';
import { findOauthConsumersByKeyOrName } from './ids-resolver.js';

/**
 * The rights an OAuth consumer can be granted, mapping the API's camelCase name to the kebab-case
 * name the CLI exposes through `--rights`. Derived from the client's list rather than spelled out
 * here, so a right added to the API becomes available without a change in clever-tools.
 */
export const OAUTH_RIGHTS =
  /** @type {Record<import('@clevercloud/client/cc-api-commands/oauth-consumer/oauth-consumer.types.js').GrantableRights, string>} */ (
    Object.fromEntries(
      GRANTABLE_RIGHTS.map((right) => [right, right.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)]),
    )
  );

export function rightsFromList(requestedRights = []) {
  const hasAll = requestedRights.includes('all');
  return Object.fromEntries(
    GRANTABLE_RIGHTS.map((right) => {
      return [right, hasAll || requestedRights.includes(OAUTH_RIGHTS[right])];
    }),
  );
}

/**
 * Keeps only the rights the API accepts on create and update, defaulting the missing ones to false.
 * The API also reports `almighty`, which it derives itself and rejects when sent back.
 */
export function pickGrantableRights(rights) {
  return Object.fromEntries(
    GRANTABLE_RIGHTS.map((right) => {
      return [right, rights?.[right] ?? false];
    }),
  );
}

export async function promptRights(existingRights) {
  const choices = GRANTABLE_RIGHTS.map((right) => ({
    name: OAUTH_RIGHTS[right],
    value: OAUTH_RIGHTS[right],
    checked: existingRights?.[right] ?? false,
  }));

  const selected = await promptCheckbox('Select rights', choices, 'Use --rights <list> to set rights directly.');

  return rightsFromList(selected);
}

export async function getAllConsumers() {
  const owners = await clients.ccApi.send(new GetOrganisationSummariesCommand());
  return owners.flatMap((owner) => {
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
  const oauthConsumer = await tolerateNotFound(
    clients.ccApi.send(new GetOauthConsumerCommand({ ownerId, oauthConsumerKey: key, withSecret: false })),
  );

  if (oauthConsumer == null) {
    throw new Error(`OAuth consumer not found: ${styleText('red', keyOrName)}`);
  }

  return { ownerId, ...oauthConsumer };
}
