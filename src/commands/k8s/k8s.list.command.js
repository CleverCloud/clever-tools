import { defineCommand } from '../../lib/define-command.js';
import { k8sList } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { formatTagsFilter, hasAllTags } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption, tagsFilterOption } from '../global.options.js';

export const k8sListCommand = defineCommand({
  description: 'List Kubernetes clusters',
  since: '4.3.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
    tags: tagsFilterOption,
  },
  args: [],
  async handler(options) {
    const { format, org: orgIdOrName, tags } = options;
    const allClusters = await k8sList(orgIdOrName, format);
    const clusters = tags == null ? allClusters : allClusters.filter((c) => hasAllTags(c.tags ?? [], tags));

    switch (format) {
      case 'json':
        Logger.printJson(clusters);
        break;
      case 'human':
      default:
        if (tags != null && clusters.length === 0) {
          Logger.println(`🔎 No cluster found with the ${formatTagsFilter(tags)}`);
          return;
        }
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
