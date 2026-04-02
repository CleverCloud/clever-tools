import { get, update } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { isNotEmpty, isValidUrl, promptField } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { parseRights, resolveConsumer, stripAlmighty, VALID_RIGHTS } from '../../models/oauth-consumer.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notEmptyStringSchema } from '../global.args.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { consumerKeyOrNameArg, promptRights, rightsSchema } from './oauth-consumers.args.js';

export const oauthConsumersUpdateCommand = defineCommand({
  description: 'Update an OAuth consumer',
  since: '4.8.0',
  options: {
    name: defineOption({
      name: 'name',
      schema: notEmptyStringSchema.optional(),
      description: 'Consumer name',
      aliases: ['n'],
      placeholder: 'name',
    }),
    description: defineOption({
      name: 'description',
      schema: notEmptyStringSchema.optional(),
      description: 'Consumer description',
      aliases: ['d'],
      placeholder: 'description',
    }),
    url: defineOption({
      name: 'url',
      schema: z.string().url().optional(),
      description: 'Application home URL',
      placeholder: 'url',
    }),
    picture: defineOption({
      name: 'picture',
      schema: z.string().url().optional(),
      description: 'Application logo URL',
      placeholder: 'url',
    }),
    baseUrl: defineOption({
      name: 'base-url',
      schema: z.string().url().optional(),
      description: 'OAuth callback base URL',
      placeholder: 'url',
    }),
    rights: defineOption({
      name: 'rights',
      schema: rightsSchema,
      description: `Comma-separated list of rights (${VALID_RIGHTS.join(', ')})`,
      placeholder: 'rights',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { name, description, url, picture, baseUrl, rights: rightsCsv, format } = options;

    const { key, ownerId } = await resolveConsumer(keyOrName);

    const existing = await get({ id: ownerId, key }).then(sendToApi);

    const hasAnyOption =
      name != null || description != null || url != null || picture != null || baseUrl != null || rightsCsv != null;

    let body;
    if (hasAnyOption) {
      body = {
        name: name ?? existing.name,
        description: description ?? existing.description,
        url: url ?? existing.url,
        picture: picture ?? existing.picture,
        baseUrl: baseUrl ?? existing.baseUrl,
        rights: rightsCsv != null ? parseRights(rightsCsv) : stripAlmighty(existing.rights),
      };
    } else {
      body = {
        name: await promptField('Name:', null, existing.name, isNotEmpty),
        description: await promptField('Description:', null, existing.description, isNotEmpty),
        url: await promptField('Application home URL:', null, existing.url, isValidUrl),
        picture: await promptField('Application logo URL:', null, existing.picture, isValidUrl),
        baseUrl: await promptField('OAuth callback base URL:', null, existing.baseUrl, isValidUrl),
        rights: await promptRights(existing.rights),
      };
    }

    const consumer = await update({ id: ownerId, key }, body).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(consumer);
        break;
      }
      case 'human':
      default: {
        Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], consumer.key)} has been updated!`);
      }
    }
  },
});
