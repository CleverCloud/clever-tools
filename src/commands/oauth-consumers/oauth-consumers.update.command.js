import { update as updateOauthConsumer } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { promptTextOption } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import {
  promptRights,
  removeReadonlyRights,
  resolveOauthConsumer,
  rightsFromList,
} from '../../models/oauth-consumer.js';
import { sendToApi } from '../../models/send-to-api.js';
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
          rights: rights != null ? rightsFromList(rights) : removeReadonlyRights(oauthConsumer.rights),
        }
      : {
          name: await promptTextOption(nameOption, oauthConsumer.name),
          description: await promptTextOption(descriptionOption, oauthConsumer.description),
          url: await promptTextOption(urlOption, oauthConsumer.url),
          picture: await promptTextOption(pictureOption, oauthConsumer.picture),
          baseUrl: await promptTextOption(baseUrlOption, oauthConsumer.baseUrl),
          rights: await promptRights(oauthConsumer.rights),
        };

    const updatedOauthConsumer = await updateOauthConsumer(
      { id: oauthConsumer.ownerId, key: oauthConsumer.key },
      body,
    ).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(updatedOauthConsumer);
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
