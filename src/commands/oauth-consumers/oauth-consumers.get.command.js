import { GetOauthConsumerSecretCommand } from '@clevercloud/client/cc-api-commands/oauth-consumer/get-oauth-consumer-secret-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { z } from 'zod';
import { toLegacyOauthConsumer } from '../../legacy-json/oauth-consumer.legacy.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { OAUTH_RIGHTS, resolveOauthConsumer } from '../../models/oauth-consumer.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { consumerKeyOrNameArg } from './oauth-consumers.args.js';

export const oauthConsumersGetCommand = defineCommand({
  description: 'Get details of an OAuth consumer',
  since: '4.8.0',
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

    let secret = null;
    if (withSecret) {
      const response = await tolerateNotFound(
        clients.ccApi.send(
          new GetOauthConsumerSecretCommand({ ownerId: oauthConsumer.ownerId, oauthConsumerKey: oauthConsumer.key }),
        ),
      );
      if (response == null) {
        throw new Error(`Secret not found for OAuth consumer ${oauthConsumer.key}`);
      }
      secret = response.secret;
    }

    switch (format) {
      case 'json': {
        // `--format json` still prints the rights as the API names them, see src/legacy-json/README.md
        Logger.printJson({
          ownerId: oauthConsumer.ownerId,
          ...toLegacyOauthConsumer(oauthConsumer),
          ...(secret != null && { secret }),
        });
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
