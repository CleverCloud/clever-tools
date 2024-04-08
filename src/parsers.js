'use strict';

const cliparse = require('cliparse');

const Application = require('./models/application.js');
const ISO8601 = require('iso8601-duration');
const Duration = require('duration-js');

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
  if (isNaN(dateString) && !isNaN(date.getTime())) {
    return cliparse.parsers.success(date);
  }

  const duration = durationInSeconds(dateString);
  if (duration.success) {
    return cliparse.parsers.success(new Date(Date.now() - (duration.success * 1000)));
  }

  return duration;
}

const appIdRegex = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function appIdOrName (string) {
  if (string.match(appIdRegex)) {
    return cliparse.parsers.success({ app_id: string });
  }
  return cliparse.parsers.success({ app_name: string });
}

const orgaIdRegex = /^(user_|orga_)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function integer (string) {
  const integer = parseInt(string);
  if (isNaN(integer)) {
    return cliparse.parsers.error('Invalid number: ' + string);
  }
  return cliparse.parsers.success(integer);
}

function nonEmptyString (string) {
  if (typeof string !== 'string' || string === '') {
    return cliparse.parsers.error('Invalid string, it should not be empty');
  }
  return cliparse.parsers.success(string);
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
  if (String(string).length === 0) {
    return cliparse.parsers.success([]);
  }
  const tags = String(string).split(',');
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

const ipAddressRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])$/;

function ipAddress (string) {
  if (string.match(ipAddressRegex)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid IP address '${string}'. Should match ${ipAddressRegex}`);
}

const portNumberRegex = /^\d{1,5}$/;

function portNumber (number) {
  if (String(number).match(portNumberRegex)) {
    return cliparse.parsers.success(number);
  }
  return cliparse.parsers.error(`Invalid port number '${number}'. Should match ${portNumberRegex}`);
}

/**
 * Parse a duration into seconds
 * A Zero seconds duration is allowed
 * @param {string} durationStr an ISO8601, 1h or a positive number
 * @returns {number} number of seconds
 */
function durationInSeconds (durationStr = '') {
  const failed = cliparse.parsers.error(`Invalid duration: "${durationStr}", expect (IS0 8601 duration / a "1h, 1m, 30s" like duration / a positive number in seconds)`);

  if (durationStr.startsWith('P')) {
    try {
      const d = ISO8601.parse(durationStr);
      return cliparse.parsers.success(ISO8601.toSeconds(d));
    }
    catch (err) {
      return failed;
    }
  }

  try {
    const duration = Duration.parse(durationStr);
    return cliparse.parsers.success(duration.seconds());
  }
  catch (err) {
    const n = Number.parseInt(durationStr);
    if (isNaN(n) || n < 0) {
      return failed;
    }

    return cliparse.parsers.success(n);
  }
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
  integer,
  tag,
  tags,
  ngMemberType,
  ngPeerRole,
  ipAddressRegex,
  ipAddress,
  portNumberRegex,
  portNumber,
  durationInSeconds,
  nonEmptyString,
};
