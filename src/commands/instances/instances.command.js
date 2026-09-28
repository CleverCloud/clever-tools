import { z } from 'zod';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { listInstances } from '../../models/instances.js';
import { date } from '../../parsers.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

export const instancesCommand = defineCommand({
  description: 'List instances of an application',
  since: null,
  options: {
    all: defineOption({
      name: 'all',
      schema: z.boolean().default(false),
      description: 'List instances in any state, including deleted ones (default: only running instances)',
    }),
    since: defineOption({
      name: 'after',
      schema: z.string().transform(date).optional(),
      description:
        'List instances that existed after this date/time, in any state (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
      aliases: ['since'],
      placeholder: 'after',
    }),
    until: defineOption({
      name: 'before',
      schema: z.string().transform(date).optional(),
      description:
        'List instances that existed before this date/time, in any state (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
      aliases: ['until'],
      placeholder: 'before',
    }),
    deploymentId: defineOption({
      name: 'deployment-id',
      schema: z.string().optional(),
      description: 'List instances created by this deployment, in any state',
      placeholder: 'deployment-id',
    }),
    limit: defineOption({
      name: 'limit',
      schema: z.coerce.number().int().min(1).max(1000).default(100),
      description: 'Maximum number of instances to list, keeping the most recent ones (1 to 1000)',
      placeholder: 'limit',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  async handler(options) {
    const { alias, app: appIdOrName, all, since, until, deploymentId, limit, format } = options;
    if (since != null && until != null && since > until) {
      throw new Error('--after must be earlier than or equal to --before');
    }
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    // Date and deployment filters also include past instances
    const hasFilters = since != null || until != null || deploymentId != null;
    const onlyRunning = !all && !hasFilters;

    const instances = await listInstances({
      ownerId,
      appId,
      onlyRunning,
      since,
      until,
      deploymentId,
      limit,
    });

    switch (format) {
      case 'json': {
        Logger.printJson(instances);
        break;
      }
      case 'human':
      default: {
        if (instances.length === 0) {
          Logger.println(
            styleText(
              'blue',
              onlyRunning
                ? 'No running instances found for this application'
                : hasFilters
                  ? 'No instances found matching the filters'
                  : 'No instances found for this application',
            ),
          );
          return;
        }

        const headers = ['CREATED', 'STATE', '#', 'FLAVOR', 'INSTANCE ID', 'DEPLOYMENT ID'];
        const rows = instances.map((instance) => [
          `${instance.createdAt.substring(0, 19).replace('T', ' ')}Z`,
          instance.state,
          instance.isBuildVm ? 'build' : String(instance.instanceNumber ?? '?'),
          instance.flavor ?? '',
          instance.id,
          instance.deploymentId,
        ]);
        Logger.println(formatTable([headers, ...rows]));
      }
    }
  },
});
