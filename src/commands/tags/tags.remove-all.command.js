import { defineCommand } from '../../lib/define-command.js';
import { confirm } from '../../lib/prompts.js';
import { assertTagsCanBeChanged, formatTagTarget, removeAllTags, resolveTagTargets } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import { skipConfirmationOption } from '../global.options.js';
import { resourceIdArg } from './tags.args.js';

export const tagsRemoveAllCommand = defineCommand({
  description: 'Remove all the tags of a resource (and of the FS bucket add-on of an SFTP application)',
  since: null,
  options: {
    yes: skipConfirmationOption,
  },
  args: [resourceIdArg],
  async handler(options, resourceId) {
    const { yes } = options;

    assertTagsCanBeChanged(resourceId);

    const targets = await resolveTagTargets(resourceId, { withLinkedAddon: true });

    if (!yes) {
      const targetsLabel = targets.map(formatTagTarget).join(' and ');
      await confirm(`Are you sure you want to remove all the tags of ${targetsLabel}?`, 'No tags removed');
    }

    for (const target of targets) {
      await removeAllTags(target);
      Logger.printSuccess(`All tags removed from ${formatTagTarget(target)}`);
    }
  },
});
