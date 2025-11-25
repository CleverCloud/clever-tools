import { k8sList } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { colorOpt, humanJsonOutputFormatOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const k8sListCommand = {
  name: 'list',
  description: 'List Kubernetes clusters',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [],
  async execute(params) {
    const { format, org: orgIdOrName } = params.options;
    const clusters = await k8sList(orgIdOrName, format);

    switch (format) {
      case 'json':
        Logger.printJson(clusters);
        break;
      case 'human':
      default:
        if (clusters.length === 0) {
          Logger.println(`🔎 No cluster found, create one with ${styleText('blue', `clever k8s create`)} command`);
          return;
        }

        Logger.println(`🔎 Found ${clusters.length} cluster${clusters.length > 1 ? 's' : ''}:`);

        Object.values(clusters).forEach((c) => {
          Logger.println(`  • ${styleText('white', `${c.name} (${c.id})`)} - ${c.status}`);
        });
        break;
    }
  },
};
