import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import dedent from 'dedent';
import { z } from 'zod';
import { createMetricsReadToken } from '../../clever-client/stats.js';
import { formatDate } from '../../lib/date-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { promptCheckbox, promptTextOption, selectAnswer } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { commaSeparated, iso8601Duration } from '../../parsers.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

/**
 * The Warp 10 platform applications a READ token can be scoped to, as offered by the prompt.
 *
 * Whether a given owner may actually ask for one of them is a server-side decision that varies
 * per deployment, so this list drives the prompt only — it is never used to validate `--apps`.
 * An unknown or disallowed value goes to the API, whose error names exactly what it accepts;
 * that keeps a stale list here from rejecting an application the platform has since opened up.
 */
const PLATFORM_APPLICATIONS = [
  { value: 'metrics', description: 'Runtime metrics of your applications and add-ons (CPU, memory, disk…)' },
  { value: 'metrics.accesslogs', description: 'HTTP access logs' },
  { value: 'addon-api-cellar', description: 'Cellar storage usage' },
  { value: 'addon-api-fsbucket', description: 'FS Bucket storage usage' },
];

/** The applications a token covers when the request omits them. */
const DEFAULT_APPLICATIONS = ['metrics', 'metrics.accesslogs'];

/**
 * A token lifespan, before normalisation.
 *
 * The rule lives in a `refine` rather than only in the `transform` below because
 * `promptTextOption` validates against the *input* schema: put it here and a typo re-asks, put it
 * in the transform and it throws the prompt away. `iso8601Duration` stays the single source of
 * truth for the grammar — a throw from it is what "invalid" means.
 */
const ttlSchema = z.string().superRefine((value, ctx) => {
  try {
    iso8601Duration(value);
  } catch (error) {
    // Forward the parser's own message: it distinguishes an unparseable duration from a
    // well-formed but non-positive one, which a boolean refine would flatten into one wording.
    ctx.addIssue({ code: 'custom', message: error.message });
  }
});

const ttlOption = defineOption({
  name: 'ttl',
  schema: ttlSchema.transform(iso8601Duration).optional(),
  description: 'Token lifespan, as an ISO 8601 duration (e.g.: P5D, PT12H) or a "1h, 4d, 2w" like duration',
  aliases: ['t'],
  placeholder: 'ttl',
});

const applicationsOption = defineOption({
  name: 'apps',
  schema: z.string().transform(commaSeparated).optional(),
  description: 'Comma separated list of platform applications the token grants read access to',
  aliases: ['a'],
  placeholder: 'applications',
});

export const tokensMetricsGenCommand = defineCommand({
  description: 'Generate a Warp 10 read token to query your metrics',
  since: null,
  options: {
    org: orgaIdOrNameOption,
    apps: applicationsOption,
    ttl: ttlOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org, apps, ttl, format } = options;

    const owner = org != null ? { id: await Organisation.getId(org) } : await promptOwner();
    const lifespan = ttl ?? (await promptTtl());

    // `--apps ''` and a trailing comma both yield empty entries; drop them here rather than let
    // the API answer `"" not in expected values […]`, which reads like a bug in the CLI.
    const applications = (apps ?? (await promptApplications())).map((app) => app.trim()).filter((app) => app !== '');

    if (applications.length === 0) {
      throw new Error('You must pick at least one application');
    }

    const token = await createMetricsReadToken({
      ownerId: owner.id,
      applications,
      ttl: lifespan,
    }).then(sendToApi);

    switch (format) {
      case 'json':
        Logger.printJson(token);
        break;
      case 'human':
      default:
        Logger.println(dedent`
          ${styleText('green', '✔')} Metrics read token successfully created! Store it securely, you won't be able to print it again.

            - Owner        : ${styleText('grey', owner.name ?? owner.id)}
            - Applications : ${styleText('grey', token.applications.join(', '))}
            - Expiration   : ${styleText('grey', formatDate(token.expiresAt))}
            - Token        : ${styleText('grey', token.token)}

          Use it as the read token of your Warp 10 queries, for instance:

            [ '${token.token}' '~.*' {} NOW 1 h ] FETCH
        `);
    }
  },
});

/**
 * Ask which owner the token should be scoped to, personal space included.
 * @returns {Promise<{ id: string, name: string }>}
 */
async function promptOwner() {
  const { user, organisations } = await getSummary({}).then(sendToApi);

  // The summary already lists the personal space among `organisations`, so a bare
  // `[user, ...organisations]` shows it twice. Deduplicating on the first occurrence keeps it at
  // the top of the list, where it is the friendliest default to land on.
  const owners = [user, ...organisations].filter(
    (owner, index, all) => all.findIndex((other) => other.id === owner.id) === index,
  );

  const choices = owners.map((owner) => ({
    name: owner.id === user.id ? `${owner.name} (personal space)` : owner.name,
    value: { id: owner.id, name: owner.name },
  }));

  return selectAnswer(
    'Which organisation do you want a token for?',
    choices,
    'Use --org <org-id|org-name> to skip this prompt.',
  );
}

/**
 * Ask which platform applications the token should grant read access to.
 * @returns {Promise<string[]>}
 */
function promptApplications() {
  const choices = PLATFORM_APPLICATIONS.map(({ value, description }) => ({
    name: value,
    value,
    description,
    checked: DEFAULT_APPLICATIONS.includes(value),
  }));

  return promptCheckbox(
    'Which applications do you want to read?',
    choices,
    'Use --apps <applications> to skip this prompt.',
  );
}

/**
 * Ask how long the token should live.
 *
 * The prompt validates but does not transform, so the answer still goes through
 * `iso8601Duration` to normalise `4d` into `P4D`.
 * @returns {Promise<string>}
 */
async function promptTtl() {
  const answer = await promptTextOption(ttlOption, 'P5D');
  return iso8601Duration(answer);
}
