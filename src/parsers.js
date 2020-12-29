'use strict';

const cliparse = require('cliparse');

const AccessLogs = require('./models/accesslogs.js');
const Application = require('./models/application.js');

function flavor (flavor) {
  const flavors = Application.listAvailableFlavors();
  if (flavors.includes(flavor)) {
    return cliparse.parsers.success(flavor);
  }
  return cliparse.parsers.error('Invalid value: ' + flavor);
}

function buildFlavor (flavorOrDisabled) {
  if (flavorOrDisabled === 'disabled') {
    return cliparse.parsers.success(flavorOrDisabled);
  }
  return flavor(flavorOrDisabled);
}

function instances (instances) {
  const parsedInstances = parseInt(instances, 10);
  if (isNaN(parsedInstances)) {
    return cliparse.parsers.error('Invalid number: ' + instances);
  }
  if (parsedInstances < 1 || parsedInstances > 20) {
    return cliparse.parsers.error('The number of instances must be between 1 and 20');
  }
  return cliparse.parsers.success(parsedInstances);
}

function date (dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return cliparse.parsers.error('Invalid date: ' + dateString + ' (timestamps or IS0 8601 dates are accepted)');
  }
  return cliparse.parsers.success(date);
}

const appIdRegex = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function appIdOrName (string) {
  if (string.match(appIdRegex)) {
    return cliparse.parsers.success({ app_id: string });
  }
  return cliparse.parsers.success({ app_name: string });
}

const orgaIdRegex = /^orga_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function orgaIdOrName (string) {
  if (string.match(orgaIdRegex)) {
    return cliparse.parsers.success({ orga_id: string });
  }
  return cliparse.parsers.success({ orga_name: string });
}

const addonIdRegex = /^addon_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function addonIdOrName (string) {
  if (string.match(addonIdRegex)) {
    return cliparse.parsers.success({ addon_id: string });
  }
  return cliparse.parsers.success({ addon_name: string });
}

const ngIdRegex = /^ng_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ngIdOrLabel (string) {
  if (string.match(ngIdRegex)) {
    return cliparse.parsers.success({ ng_id: string });
  }
  return cliparse.parsers.success({ ng_label: string });
}

function commaSeparated (string) {
  return cliparse.parsers.success(string.split(','));
}

function accessLogsFormat (format) {
  const availableFormats = AccessLogs.listAvailableFormats();
  if (availableFormats.includes(format)) {
    return cliparse.parsers.success(format);
  }
  return cliparse.parsers.error('The format must be one of ' + availableFormats.join(', '));
}

function integer (string) {
  const integer = parseInt(string);
  if (isNaN(integer)) {
    return cliparse.parsers.error('Invalid number: ' + string);
  }
  return cliparse.parsers.success(integer);
}

// /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/i;
const tagRegex = /^[^,\s]+$/;

function tag (string) {
  if (string.match(tagRegex)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid tag '${string}'. Should match ${tagRegex}`);
}

function tags (string) {
  const tags = string.split(',');
  for (const current of tags) {
    if (tag(current).error) {
      return cliparse.parsers.error(`Invalid tag '${current}'. Should match \`${tagRegex}\``);
    }
  }
  return cliparse.parsers.success(tags);
}

function ngMemberType (string) {
  const possible = ['application', 'addon', 'external'];
  if (possible.includes(string)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid member type '${string}'. Should be in ${JSON.stringify(possible)}`);
}

function ngPeerRole (string) {
  const possible = ['client', 'server'];
  if (possible.includes(string)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid peer role '${string}'. Should be in ${JSON.stringify(possible)}`);
}

module.exports = {
  buildFlavor,
  flavor,
  instances,
  date,
  appIdOrName,
  orgaIdOrName,
  addonIdOrName,
  ngIdOrLabel,
  commaSeparated,
  accessLogsFormat,
  integer,
  tag,
  tags,
  ngMemberType,
  ngPeerRole,
};
