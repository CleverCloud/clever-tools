import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { formatTagsFilter, hasAllTags } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption, tagsFilterOption } from '../global.options.js';

export const ngCommand = defineCommand({
  description: 'List Network Groups',
  since: '3.12.0',
  isExperimental: true,
  featureFlag: 'ng',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
    tags: tagsFilterOption,
  },
  args: [],
  async handler(options) {
    const { org, format, tags } = options;

    const allNgs = await networkGroup.getAllNGs(org);
    const ngs = tags == null ? allNgs : allNgs.filter((ng) => hasAllTags(ng.tags ?? [], tags));

    switch (format) {
      case 'json': {
        Logger.printJson(ngs);
        break;
      }
      case 'human':
      default: {
        if (tags != null && !ngs.length) {
          Logger.println(`🔎 No Network Group found with the ${formatTagsFilter(tags)}`);
          return;
        }
        if (!ngs.length) {
          Logger.println(`ℹ️ No Network Group found, create one with ${styleText('blue', 'clever ng create')} command`);
          return;
        }
        const ngList = ngs.map(({ id, label, networkIp, members, peers }) => ({
          ID: id,
          Label: label,
          'Network CIDR': networkIp,
          Members: Object.keys(members).length,
          Peers: Object.keys(peers).length,
        }));

        console.table(ngList);
      }
    }
  },
});
