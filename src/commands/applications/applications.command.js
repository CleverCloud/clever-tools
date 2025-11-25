import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { styleText } from '../../lib/style-text.js';
import { formatTable } from '../../format-table.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import * as Organisation from '../../models/organisation.js';
import { truncateWithEllipsis } from '../../models/utils.js';

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

export const applicationsCommand = {
  name: 'applications',
  description: 'List linked applications',
  experimental: false,
  featureFlag: null,
  opts: {
    'only-aliases': {
      name: 'only-aliases',
      description: 'List only application aliases',
      type: 'flag',
      metavar: null,
      aliases: null,
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    json: {
      name: 'json',
      description: 'Show result in JSON format',
      type: 'flag',
      metavar: null,
      aliases: ['j'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [],
  async execute(params) {
    const { 'only-aliases': onlyAliases, json } = params.options;
    
      const { apps } = await AppConfig.loadApplicationConf();
    
      const formattedApps = formatApps(apps, onlyAliases, json);
      Logger.println(formattedApps);
  }
};
