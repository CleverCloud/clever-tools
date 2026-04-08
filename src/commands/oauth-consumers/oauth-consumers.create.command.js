import { create } from '@clevercloud/client/esm/api/v2/oauth-consumer.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { promptTextOption } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { promptRights, rightsFromList } from '../../models/oauth-consumer.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { baseUrlOption, descriptionOption, pictureOption, rightsOption, urlOption } from './oauth-consumers.options.js';

export const oauthConsumersCreateCommand = defineCommand({
  description: 'Create an OAuth consumer',
  since: 'unreleased',
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

    const body = {
      name,
      description: description ?? (await promptTextOption(descriptionOption)),
      url: url ?? (await promptTextOption(urlOption)),
      picture: picture ?? (await promptTextOption(pictureOption)),
      baseUrl: baseUrl ?? (await promptTextOption(baseUrlOption)),
      rights: rights != null ? rightsFromList(rights) : await promptRights(),
    };

    const oauthConsumer = await create({ id: ownerId }, body).then(sendToApi);

    switch (format) {
      case 'json': {
        Logger.printJson(oauthConsumer);
        break;
      }
      case 'human':
      default: {
        Logger.printSuccess(`OAuth consumer ${styleText(['bold', 'green'], oauthConsumer.key)} has been created!`);
        Logger.println();
        Logger.println(
          `Retrieve the secret with ${styleText('blue', `clever oauth-consumers get ${oauthConsumer.key} --with-secret`)}`,
        );
      }
    }
  },
});
