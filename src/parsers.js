import cliparse from 'cliparse';
import ISO8601 from 'iso8601-duration';
import * as Application from './models/application.js';
import { NG_MEMBER_PREFIXES } from './models/ng.js';

const addonOptionsRegex = /^[\w-]+=.+$/;

export function addonOptions(options) {
  const optionsArray = typeof options === 'string' ? [options] : options;
  for (const option of optionsArray) {
    if (!option.match(addonOptionsRegex)) {
      return cliparse.parsers.error('Invalid option: ' + option);
    }
  }
  return cliparse.parsers.success(optionsArray.join(','));
}

export function flavor(flavor) {
  const flavors = Application.listAvailableFlavors();
  if (flavors.includes(flavor)) {
    return cliparse.parsers.success(flavor);
  }
  return cliparse.parsers.error('Invalid value: ' + flavor);
}

export function buildFlavor(flavorOrDisabled) {
  if (flavorOrDisabled === 'disabled') {
    return cliparse.parsers.success(flavorOrDisabled);
  }
  return flavor(flavorOrDisabled);
}

export function instances(instances) {
  const parsedInstances = parseInt(instances, 10);
  if (isNaN(parsedInstances)) {
    return cliparse.parsers.error('Invalid number: ' + instances);
  }
  if (parsedInstances < 1 || parsedInstances > 20) {
    return cliparse.parsers.error('The number of instances must be between 1 and 20');
  }
  return cliparse.parsers.success(parsedInstances);
}

export function date(dateString) {
  const date = new Date(dateString);
  if (isNaN(dateString) && !isNaN(date.getTime())) {
    return cliparse.parsers.success(date);
  }

  const duration = durationInSeconds(dateString);
  if (duration.success) {
    return cliparse.parsers.success(new Date(Date.now() - duration.success * 1000));
  }

  return duration;
}

export function futureDateOrDuration(dateString) {
  const date = new Date(dateString);
  if (isNaN(dateString) && !isNaN(date.getTime())) {
    return cliparse.parsers.success(date);
  }

  const duration = durationInSeconds(dateString);
  if (duration.success) {
    return cliparse.parsers.success(new Date(Date.now() + duration.success * 1000));
  }

  return duration;
}

// This simple regex is enough for our use cases
const emailRegex = /^\S+@\S+\.\S+$/g;

export function email(string) {
  if (string.match(emailRegex)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error('Invalid email');
}

const appIdRegex = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function appIdOrName(string) {
  if (string.match(appIdRegex)) {
    return cliparse.parsers.success({ app_id: string });
  }
  return cliparse.parsers.success({ app_name: string });
}

const orgaIdRegex = /^(user_|orga_)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function orgaIdOrName(string) {
  if (string.match(orgaIdRegex)) {
    return cliparse.parsers.success({ orga_id: string });
  }
  return cliparse.parsers.success({ orga_name: string });
}

const addonIdRegex = /^addon_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const operatorIdRegex =
  /^(keycloak|otoroshi|matomo|metabase)_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ulidRegex = /^(kubernetes)_[0-9A-HJ-NP-TV-Z]{26}$/i;

export function addonIdOrName(string) {
  if (string.match(addonIdRegex)) {
    return cliparse.parsers.success({ addon_id: string });
  }
  if (string.match(operatorIdRegex) || string.match(ulidRegex)) {
    return cliparse.parsers.success({ operator_id: string });
  }
  return cliparse.parsers.success({ addon_name: string });
}

export function commaSeparated(string) {
  return cliparse.parsers.success(string.split(','));
}

export function integer(string) {
  const integer = parseInt(string);
  if (isNaN(integer)) {
    return cliparse.parsers.error('Invalid number: ' + string);
  }
  return cliparse.parsers.success(integer);
}

export function nonEmptyString(string) {
  if (typeof string !== 'string' || string === '') {
    return cliparse.parsers.error('Invalid string, it should not be empty');
  }
  return cliparse.parsers.success(string);
}

// /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/i;
const tagRegex = /^[^,\s]+$/;

export function tag(string) {
  if (string.match(tagRegex)) {
    return cliparse.parsers.success(string);
  }
  return cliparse.parsers.error(`Invalid tag '${string}'. Should match ${tagRegex}`);
}

export function tags(string) {
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

/**
 * Parse a duration into seconds
 * A Zero seconds duration is allowed
 * @param {string} durationStr an ISO8601, 1h or a positive number
 * @returns {number} number of seconds
 */
export function durationInSeconds(durationStr = '') {
  const failed = cliparse.parsers.error(
    `Invalid duration: "${durationStr}", expect (IS0 8601 duration / a "1h, 1m, 30s" like duration / a positive number in seconds)`,
  );

  if (durationStr.startsWith('P')) {
    try {
      const d = ISO8601.parse(durationStr);
      return cliparse.parsers.success(ISO8601.toSeconds(d));
    } catch {
      return failed;
    }
  }

  try {
    const durationInSeconds = parseSimpleDuration(durationStr);
    return cliparse.parsers.success(durationInSeconds);
  } catch {
    const n = Number.parseInt(durationStr);
    if (isNaN(n) || n < 0) {
      return failed;
    }

    return cliparse.parsers.success(n);
  }
}

const SHORT_UNITS_TO_ISO = {
  ms: (v) => `PT${(v / 1000).toFixed(3)}S`,
  s: (v) => `PT${v}S`,
  m: (v) => `PT${v}M`,
  h: (v) => `PT${v}H`,
  d: (v) => `P${v}D`,
  w: (v) => `P${v}W`,
  M: (v) => `P${v}M`,
  y: (v) => `P${v}Y`,
};

function parseSimpleDuration(durationStr) {
  const { rawValue, unit } = durationStr.match(/^(?<rawValue>\d+)(?<unit>.*)$/)?.groups ?? {};
  if (unit in SHORT_UNITS_TO_ISO) {
    const value = Number(rawValue);
    const isoDuration = SHORT_UNITS_TO_ISO[unit](value);
    const d = ISO8601.parse(isoDuration);
    return ISO8601.toSeconds(d);
  }
}

// Network Groups parsers
export function ngResourceType(string) {
  if (string.startsWith('ng_')) {
    return cliparse.parsers.success({ ngId: string });
  }
  if (Object.keys(NG_MEMBER_PREFIXES).some((prefix) => string.startsWith(prefix))) {
    return cliparse.parsers.success({ memberId: string });
  }
  return cliparse.parsers.success({ ngResourceLabel: string });
}

export function ngValidType(string) {
  if (string === 'NetworkGroup' || string === 'Member' || string === 'CleverPeer' || string === 'ExternalPeer') {
    return cliparse.parsers.success(string);
  } else {
    return cliparse.parsers.error(`Invalid Network Group resource type: ${string}`);
  }
}
