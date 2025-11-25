import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { colorOpt, humanJsonOutputFormatOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const ngCommand = defineCommand({
  name: 'ng',
  description: 'List Network Groups',
  experimental: true,
  featureFlag: 'ng',
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [],
  async execute(params) {
    const { org, format } = params.options;

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
