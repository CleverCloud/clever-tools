import { getSecret as getOauthConsumerSecret } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { OAUTH_RIGHTS, resolveOauthConsumer } from '../../models/oauth-consumer.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { consumerKeyOrNameArg } from './oauth-consumers.args.js';

export const oauthConsumersGetCommand = defineCommand({
  description: 'Get details of an OAuth consumer',
  since: 'unreleased',
  options: {
    format: humanJsonOutputFormatOption,
    withSecret: defineOption({
      name: 'with-secret',
      schema: z.boolean().default(false),
      description: 'Include the consumer secret in the output',
    }),
  },
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { format, withSecret } = options;

    const oauthConsumer = await resolveOauthConsumer(keyOrName);

    const secret = withSecret
      ? await getOauthConsumerSecret({ id: oauthConsumer.ownerId, key: oauthConsumer.key })
          .then(sendToApi)
          .then((c) => c.secret)
      : null;

    switch (format) {
      case 'json': {
        Logger.printJson({ ...oauthConsumer, ...(secret != null && { secret }) });
        break;
      }
      case 'human':
      default: {
        const dataToPrint = {
          Key: oauthConsumer.key,
          Name: oauthConsumer.name || '(unnamed)',
          Description: oauthConsumer.description || '',
          URL: oauthConsumer.url || '',
          Picture: oauthConsumer.picture || '',
          'Base URL': oauthConsumer.baseUrl || '',
        };

        if (secret != null) {
          dataToPrint.Secret = secret;
        }

        console.table(dataToPrint);

        if (oauthConsumer.rights) {
          Logger.println('');
          const rightsData = {};
          for (const [apiName, cliName] of Object.entries(OAUTH_RIGHTS)) {
            rightsData[cliName] = oauthConsumer.rights[apiName] ?? false;
          }
          console.table(rightsData);
        }
      }
    }
  },
});
