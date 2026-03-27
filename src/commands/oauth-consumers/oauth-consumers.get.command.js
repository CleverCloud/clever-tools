import { get, getSecret } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { consumerKeyOrNameArg, resolveConsumerKey, RIGHTS_MAP } from './oauth-consumers.args.js';

export const oauthConsumersGetCommand = defineCommand({
  description: 'Get details of an OAuth consumer',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
    withSecret: defineOption({
      name: 'with-secret',
      schema: z.boolean().default(false),
      description: 'Include the consumer secret in the output',
    }),
  },
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { org, format, withSecret } = options;

    const key = await resolveConsumerKey(keyOrName, org);
    const id = org != null ? await Organisation.getId(org) : null;
    const consumer = await get({ id, key }).then(sendToApi);

    if (withSecret) {
      const result = await getSecret({ id, key }).then(sendToApi);
      consumer.secret = result.secret;
    }

    switch (format) {
      case 'json': {
        Logger.printJson(consumer);
        break;
      }
      case 'human':
      default: {
        const dataToPrint = {
          Key: consumer.key,
          Name: consumer.name || '(unnamed)',
          Description: consumer.description || '',
          URL: consumer.url || '',
          Picture: consumer.picture || '',
          'Base URL': consumer.baseUrl || '',
        };

        if (withSecret) {
          dataToPrint.Secret = consumer.secret;
        }

        console.table(dataToPrint);

        if (consumer.rights) {
          Logger.println('');
          const rightsData = {};
          for (const [cliName, apiName] of Object.entries(RIGHTS_MAP)) {
            rightsData[cliName] = consumer.rights[apiName] ?? false;
          }
          console.table(rightsData);
        }
      }
    }
  },
});
