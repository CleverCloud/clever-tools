import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const ngCommand = defineCommand({
  description: 'List Network Groups',
  since: '3.12.0',
  sinceDate: '2025-03-06',
  isExperimental: true,
  featureFlag: 'ng',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org, format } = options;

    const ngs = await networkGroup.getAllNGs(org);

    switch (format) {
      case 'json': {
        Logger.printJson(ngs);
        break;
      }
      case 'human':
      default: {
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
