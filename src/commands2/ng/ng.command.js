import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { humanJsonOutputFormatFlag, orgaIdOrNameFlag } from '../global.flags.js';

export const ngCommand = defineCommand({
  description: 'List Network Groups',
  isExperimental: true,
  featureFlag: 'ng',
  flags: {
    org: orgaIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    const { org, format } = flags;

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
