import { defineCommand } from '../../lib/define-command.js';
import { assertTagsCanBeChanged, formatTagTarget, removeTag, resolveTagTargets } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import { resourceIdArg, tagArg } from './tags.args.js';

export const tagsRemoveCommand = defineCommand({
  description: 'Remove a tag from a resource (and from the FS bucket add-on of an SFTP application)',
  since: null,
  options: {},
  args: [resourceIdArg, tagArg],
  async handler(_options, resourceId, tag) {
    assertTagsCanBeChanged(resourceId);

    const targets = await resolveTagTargets(resourceId, { withLinkedAddon: true });
    for (const target of targets) {
      await removeTag(target, tag);
      Logger.printSuccess(`Tag ${tag} removed from ${formatTagTarget(target)}`);
    }
  },
});
