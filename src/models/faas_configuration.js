'use strict';

const { promises: fs } = require('fs');
const path = require('path');

const _ = require('lodash');
const slugify = require('slugify');

const Logger = require('../logger.js');
const User = require('./user.js');
const { conf } = require('./configuration.js');

// TODO: Maybe use fs-utils findPath()
async function loadFunctionConf (ignoreParentConfig = false, pathToFolder) {
  if (pathToFolder == null) {
    pathToFolder = path.dirname(conf.APP_CONFIGURATION_FILE);
  }
  const fileName = path.basename(conf.APP_CONFIGURATION_FILE);
  const fullPath = path.join(pathToFolder, fileName);

  Logger.debug('Loading faas configuration from ' + fullPath);
  try {
    const contents = await fs.readFile(fullPath);
    return JSON.parse(contents);
  }
  catch (error) {
    Logger.info('Cannot load faas configuration from ' + conf.APP_CONFIGURATION_FILE + ' (' + error + ')');
    if (ignoreParentConfig || path.parse(pathToFolder).root === pathToFolder) {
      return { functions: [] };
    }
    return loadFunctionConf(ignoreParentConfig, path.normalize(path.join(pathToFolder, '..')));
  }
};

function findFunction (config, alias) {

  if (_.isEmpty(config.functions)) {
    throw new Error('There are no functions linked. You can add one with `clever link`');
  }

  if (alias != null) {
    const [functionByAlias, secondFunctionByAlias] = _.filter(config.functions, { alias });
    if (functionByAlias == null) {
      throw new Error(`There are no functions matching alias ${alias}`);
    }
    if (secondFunctionByAlias != null) {
      throw new Error(`There are several functions matching alias ${alias}. This should not happen, your \`.clever.json\` should be fixed.`);
    }
    return functionByAlias;
  }

  return findDefaultFunction(config);
}

function findDefaultFunction (config) {
  if (_.isEmpty(config.functions)) {
    throw new Error('There are no functions linked. You can add one with `clever link`');
  }

  if (config.default != null) {
    const defaultFunction = _.find(config.functions, { function_id: config.default });
    if (defaultFunction == null) {
      throw new Error('The default function is not listed anymore. This should not happen, your `.clever.json` should be fixed.');
    }
    return defaultFunction;
  }

  if (config.functions.length === 1) {
    return config.functions[0];
  }

  const aliases = _.map(config.functions, 'alias').join(', ');
  throw new Error(`Several functions are linked. You can specify one with the "--alias" option. Run "clever faas" to list linked applications. Available aliases: ${aliases}`);
}

module.exports = {
  findFunction,
  loadFunctionConf,
};
