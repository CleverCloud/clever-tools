import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';

function formatApps(apps, onlyAliases, json) {
  if (json) {
    if (onlyAliases) {
      apps = apps.map((a) => a.alias);
    }
    return JSON.stringify(apps, null, 2);
  } else {
    if (onlyAliases) {
      return apps.map((a) => a.alias).join('\n');
    } else {
      return apps
        .map((app) => {
          const sshUrl = app.git_ssh_url ?? app.deploy_url.replace('https://', 'git+ssh://git@');
          return [
            `Application ${app.name}`,
            `  alias: ${styleText('bold', app.alias)}`,
            `  ID: ${app.app_id}`,
            `  deployment URL: ${app.deploy_url}`,
            `  git+ssh URL: ${sshUrl}`,
          ].join('\n');
        })
        .join('\n\n');
    }
  }
}

export const applicationsCommand = defineCommand({
  description: 'List linked applications',
  since: '0.3.0',
  sinceDate: '2015-09-23',
  options: {
    'only-aliases': defineOption({
      name: 'only-aliases',
      schema: z.boolean().default(false),
      description: 'List only application aliases',
    }),
    json: defineOption({
      name: 'json',
      schema: z.boolean().default(false),
      description: 'Show result in JSON format',
      aliases: ['j'],
    }),
  },
  args: [],
  async handler(options) {
    const { 'only-aliases': onlyAliases, json } = options;

    const { apps } = await AppConfig.loadApplicationConf();

    const formattedApps = formatApps(apps, onlyAliases, json);
    Logger.println(formattedApps);
  },
});
