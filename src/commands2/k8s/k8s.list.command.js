import { defineCommand } from '../../lib/define-command.js';
import { k8sList } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

export const k8sListCommand = defineCommand({
  description: 'List Kubernetes clusters',
  since: '4.3.0',
  sinceDate: '2025-10-22',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format, org: orgIdOrName } = options;
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
});
