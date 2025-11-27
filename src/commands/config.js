import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import * as ApplicationConfiguration from '../models/application_configuration.js';

export async function list(flags) {
  const { alias, app: appIdOrName } = flags;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const app = await Application.get(ownerId, appId);
  ApplicationConfiguration.printAllValues(app);
}

export async function get(flags, configurationName) {
  const { alias, app: appIdOrName } = flags;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const app = await Application.get(ownerId, appId);
  ApplicationConfiguration.printValue(app, configurationName);
}

export async function set(flags, configurationName, configurationValue) {
  const { alias, app: appIdOrName } = flags;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const config = ApplicationConfiguration.getById(configurationName);
  const options = {
    [config.name]: ApplicationConfiguration.parse(config, configurationValue),
  };
  const app = await Application.updateOptions(ownerId, appId, options);
  Logger.printSuccess(
    `Config ${styleText('green', config.id)} successfully updated to ${styleText('green', ApplicationConfiguration.formatValue(config, app[config.name]).toString())}!`,
  );
}

export async function update(flags) {
  const { alias, app: appIdOrName } = flags;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const options = ApplicationConfiguration.parseOptions(flags);

  if (Object.keys(options).length === 0) {
    throw new Error('No configuration to update');
  }

  const app = await Application.updateOptions(ownerId, appId, options);

  ApplicationConfiguration.printAllValues(app);
}
