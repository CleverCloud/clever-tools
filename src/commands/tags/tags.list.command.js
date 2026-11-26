import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { formatTagTarget, getTags, resolveTagTargets } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { resourceIdArg } from './tags.args.js';

export const tagsListCommand = defineCommand({
  description: 'List the tags of a resource',
  since: null,
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [resourceIdArg],
  async handler(options, resourceId) {
    const { format } = options;

    const [target] = await resolveTagTargets(resourceId);
    const tags = await getTags(target);

    switch (format) {
      case 'json':
        Logger.printJson({ type: target.type, id: target.id, name: target.name, tags });
        break;
      case 'human':
      default:
        if (tags.length === 0) {
          Logger.println(
            `🔎 No tag found on ${formatTagTarget(target)}, add one with ${styleText('blue', `clever tags add ${target.id} <tag>`)} command`,
          );
          return;
        }

        Logger.println(`🔎 Found ${tags.length} tag${tags.length > 1 ? 's' : ''} on ${formatTagTarget(target)}:`);
        for (const tag of tags) {
          Logger.println(`  • ${tag}`);
        }
        break;
    }
  },
});
