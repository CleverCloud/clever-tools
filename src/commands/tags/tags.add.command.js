import { defineCommand } from '../../lib/define-command.js';
import { addTag, assertTagsCanBeChanged, formatTagTarget, resolveTagTargets } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import { resourceIdArg, tagArg } from './tags.args.js';

export const tagsAddCommand = defineCommand({
  description: 'Add a tag to a resource (and to the FS bucket add-on of an SFTP application)',
  since: null,
  options: {},
  args: [resourceIdArg, tagArg],
  async handler(_options, resourceId, tag) {
    assertTagsCanBeChanged(resourceId);

    const targets = await resolveTagTargets(resourceId, { withLinkedAddon: true });
    for (const target of targets) {
      await addTag(target, tag);
      Logger.printSuccess(`Tag ${tag} added to ${formatTagTarget(target)}`);
    }
  },
});
