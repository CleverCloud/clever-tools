import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { k8sListActivity } from '../../lib/k8s.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sActivityCommand = defineCommand({
  description: 'Show recent deployment events of a Kubernetes cluster',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
    limit: defineOption({
      name: 'limit',
      schema: z.coerce.number().int().min(1).max(1000).default(50),
      description: 'Number of events to fetch (1 to 1000)',
      placeholder: 'limit',
    }),
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { format, org: orgIdOrName, limit } = options;
    const events = await k8sListActivity(orgIdOrName, clusterIdOrName, limit);

    switch (format) {
      case 'json':
        Logger.printJson(events);
        break;
      case 'human':
      default:
        if (events.length === 0) {
          Logger.println('🔎 No deployment event found');
          return;
        }
        console.table(
          events.map((e) => ({
            Date: formatDate(e.createdAt),
            Operation: e.operation,
            Step: e.stepName ?? '-',
            Status: e.status,
          })),
        );
        break;
    }
  },
});

function formatDate(iso) {
  if (iso == null) return '-';
  return `${iso.slice(0, 19).replace('T', ' ')}Z`;
}
