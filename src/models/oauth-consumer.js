import { getAll } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { styleText } from '../lib/style-text.js';
import { sendToApi } from './send-to-api.js';

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
