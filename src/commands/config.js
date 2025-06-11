import * as Application from '../models/application.js';
import * as ApplicationConfiguration from '../models/application_configuration.js';
import { Logger } from '../logger.js';
import { styleText } from 'node:util';

export async function list (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const app = await Application.get(ownerId, appId);
  ApplicationConfiguration.printAllValues(app);
}

export async function get (params) {
  const [configurationName] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const app = await Application.get(ownerId, appId);
  ApplicationConfiguration.printValue(app, configurationName);
}

export async function set (params) {
  const [configurationName, configurationValue] = params.args;
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const config = ApplicationConfiguration.getById(configurationName);
  const options = {
    [config.name]: ApplicationConfiguration.parse(config, configurationValue),
  };
  const app = await Application.updateOptions(ownerId, appId, options);
  Logger.printSuccess(`Config ${styleText('green', config.id)} successfully updated to ${styleText('green', ApplicationConfiguration.formatValue(config, app[config.name]))}!`);
}

export async function update (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const options = ApplicationConfiguration.parseOptions(params.options);

  if (Object.keys(options).length === 0) {
    throw new Error('No configuration to update');
  }

  const app = await Application.updateOptions(ownerId, appId, options);

  ApplicationConfiguration.printAllValues(app);
}
