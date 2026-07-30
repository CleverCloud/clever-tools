import { CreateOauthConsumerCommand } from '@clevercloud/client/cc-api-commands/oauth-consumer/create-oauth-consumer-command.js';
import { GetOauthConsumerSecretCommand } from '@clevercloud/client/cc-api-commands/oauth-consumer/get-oauth-consumer-secret-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { z } from 'zod';
import { toLegacyOauthConsumer } from '../../legacy-json/oauth-consumer.legacy.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { promptTextOption } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { promptRights, rightsFromList } from '../../models/oauth-consumer.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { baseUrlOption, descriptionOption, pictureOption, rightsOption, urlOption } from './oauth-consumers.options.js';

export const oauthConsumersCreateCommand = defineCommand({
  description: 'Create an OAuth consumer',
  since: '4.8.0',
  options: {
    org: orgaIdOrNameOption,
    description: descriptionOption,
    url: urlOption,
    picture: pictureOption,
    baseUrl: baseUrlOption,
    rights: rightsOption,
    format: humanJsonOutputFormatOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Consumer name',
      placeholder: 'name',
    }),
  ],
  async handler(options, name) {
    const { org, description, url, picture, baseUrl, rights, format } = options;

    const ownerId = await getOwnerIdFromOrgIdOrName(org);

    const oauthConsumer = await clients.ccApi.send(
      new CreateOauthConsumerCommand({
        ownerId,
        name,
        description: description ?? (await promptTextOption(descriptionOption)),
        url: url ?? (await promptTextOption(urlOption)),
        picture: picture ?? (await promptTextOption(pictureOption)),
        baseUrl: baseUrl ?? (await promptTextOption(baseUrlOption)),
        rights: rights != null ? rightsFromList(rights) : await promptRights(),
      }),
    );

    // The creation endpoint answers without the secret, it lives behind its own endpoint
    const secretResponse = await tolerateNotFound(
      clients.ccApi.send(new GetOauthConsumerSecretCommand({ ownerId, oauthConsumerKey: oauthConsumer.key })),
    );
    const secret = secretResponse?.secret;

    switch (format) {
      case 'json': {
        // `--format json` still prints the rights as the API names them, see src/legacy-json/README.md
        Logger.printJson({ ...toLegacyOauthConsumer(oauthConsumer), ...(secret != null && { secret }) });
        break;
      }
      case 'human':
      default: {
        Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], oauthConsumer.key)} has been created!`);
        Logger.println();
        if (secret != null) {
          Logger.println(`Key:    ${styleText('grey', oauthConsumer.key)}`);
          Logger.println(`Secret: ${styleText('grey', secret)}`);
        } else {
          Logger.println(
            `Retrieve the secret with ${styleText('blue', `clever oauth-consumers get ${oauthConsumer.key} --with-secret`)}`,
          );
        }
      }
    }
  },
});
