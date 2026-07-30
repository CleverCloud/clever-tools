import { UpdateOauthConsumerCommand } from '@clevercloud/client/cc-api-commands/oauth-consumer/update-oauth-consumer-command.js';
import { z } from 'zod';
import { toLegacyOauthConsumer } from '../../legacy-json/oauth-consumer.legacy.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { promptTextOption } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import {
  pickGrantableRights,
  promptRights,
  resolveOauthConsumer,
  rightsFromList,
} from '../../models/oauth-consumer.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { consumerKeyOrNameArg } from './oauth-consumers.args.js';
import { baseUrlOption, descriptionOption, pictureOption, rightsOption, urlOption } from './oauth-consumers.options.js';

const nameOption = defineOption({
  name: 'name',
  schema: z.string().trim().min(1).optional(),
  description: 'Consumer name',
  aliases: ['n'],
  placeholder: 'name',
});

export const oauthConsumersUpdateCommand = defineCommand({
  description: 'Update an OAuth consumer',
  since: '4.8.0',
  options: {
    name: nameOption,
    description: descriptionOption,
    url: urlOption,
    picture: pictureOption,
    baseUrl: baseUrlOption,
    rights: rightsOption,
    format: humanJsonOutputFormatOption,
  },
  args: [consumerKeyOrNameArg],
  async handler(options, keyOrName) {
    const { name, description, url, picture, baseUrl, rights, format } = options;

    const oauthConsumer = await resolveOauthConsumer(keyOrName);

    const hasAnyOption = [name, description, url, picture, baseUrl, rights].some((v) => v != null);

    const body = hasAnyOption
      ? {
          name: name ?? oauthConsumer.name,
          description: description ?? oauthConsumer.description,
          url: url ?? oauthConsumer.url,
          picture: picture ?? oauthConsumer.picture,
          baseUrl: baseUrl ?? oauthConsumer.baseUrl,
          rights: rights != null ? rightsFromList(rights) : pickGrantableRights(oauthConsumer.rights),
        }
      : {
          name: await promptTextOption(nameOption, oauthConsumer.name),
          description: await promptTextOption(descriptionOption, oauthConsumer.description),
          url: await promptTextOption(urlOption, oauthConsumer.url),
          picture: await promptTextOption(pictureOption, oauthConsumer.picture),
          baseUrl: await promptTextOption(baseUrlOption, oauthConsumer.baseUrl),
          rights: await promptRights(oauthConsumer.rights),
        };

    const updatedOauthConsumer = await clients.ccApi.send(
      new UpdateOauthConsumerCommand({
        ownerId: oauthConsumer.ownerId,
        oauthConsumerKey: oauthConsumer.key,
        ...body,
      }),
    );

    switch (format) {
      case 'json': {
        // `--format json` still prints the rights as the API names them, see src/legacy-json/README.md
        Logger.printJson(toLegacyOauthConsumer(updatedOauthConsumer));
        break;
      }
      case 'human':
      default: {
        Logger.printSuccess(
          `OAuth consumer ${styleText(['bold', 'green'], updatedOauthConsumer.key)} has been updated!`,
        );
      }
    }
  },
});
