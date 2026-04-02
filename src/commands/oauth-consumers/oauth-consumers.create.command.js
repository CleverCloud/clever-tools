import { create } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { isNotEmpty, isValidUrl, promptField } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { parseRights, VALID_RIGHTS } from '../../models/oauth-consumer.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notEmptyStringSchema } from '../global.args.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { promptRights, rightsSchema } from './oauth-consumers.args.js';

export const oauthConsumersCreateCommand = defineCommand({
  description: 'Create an OAuth consumer',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
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
  args: [
    defineArgument({
      schema: notEmptyStringSchema,
      description: 'Consumer name',
      placeholder: 'name',
    }),
  ],
  async handler(options, name) {
    const { org, description, url, picture, baseUrl, rights: rightsCsv, format } = options;

    const id = org != null ? await Organisation.getId(org) : null;

    const body = {
      name,
      description: await promptField('Description:', description, undefined, isNotEmpty),
      url: await promptField('Application home URL:', url, undefined, isValidUrl),
      picture: await promptField('Application logo URL:', picture, undefined, isValidUrl),
      baseUrl: await promptField('OAuth callback base URL:', baseUrl, undefined, isValidUrl),
      rights: rightsCsv != null ? parseRights(rightsCsv) : await promptRights(),
    };

    const consumer = await create({ id }, body).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(consumer);
        break;
      }
      case 'human':
      default: {
        Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], consumer.key)} has been created!`);
        Logger.println();
        Logger.println(
          `Retrieve the secret with ${styleText('blue', `clever oauth-consumers get ${consumer.key} --with-secret`)}`,
        );
      }
    }
  },
});
