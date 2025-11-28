import ISO8601 from 'iso8601-duration';
import * as Application from './models/application.js';
import { NG_MEMBER_PREFIXES } from './models/ng.js';

const addonOptionsRegex = /^[\w-]+=.+$/;

export function addonOptions(options) {
  const optionsArray = typeof options === 'string' ? [options] : options;
  for (const option of optionsArray) {
    if (!option.match(addonOptionsRegex)) {
      throw new Error('Invalid option: ' + option);
    }
  }
  return optionsArray.join(',');
}

export function flavor(flavor) {
  const flavors = Application.listAvailableFlavors();
  if (flavors.includes(flavor)) {
    return flavor;
  }
  throw new Error('Invalid value: ' + flavor);
}

export function buildFlavor(flavorOrDisabled) {
  if (flavorOrDisabled === 'disabled') {
    return flavorOrDisabled;
  }
  return flavor(flavorOrDisabled);
}

export function instances(instances) {
  const parsedInstances = parseInt(instances, 10);
  if (isNaN(parsedInstances)) {
    throw new Error('Invalid number: ' + instances);
  }
  if (parsedInstances < 1 || parsedInstances > 20) {
    throw new Error('The number of instances must be between 1 and 20');
  }
  return parsedInstances;
}

export function date(dateString) {
  const date = new Date(dateString);
  if (isNaN(dateString) && !isNaN(date.getTime())) {
    return date;
  }

  const seconds = durationInSeconds(dateString);
  return new Date(Date.now() - seconds * 1000);
}

export function futureDateOrDuration(dateString) {
  const date = new Date(dateString);
  if (isNaN(dateString) && !isNaN(date.getTime())) {
    return date;
  }

  const seconds = durationInSeconds(dateString);
  return new Date(Date.now() + seconds * 1000);
}

// This simple regex is enough for our use cases
const emailRegex = /^\S+@\S+\.\S+$/g;

export function email(string) {
  if (string.match(emailRegex)) {
    return string;
  }
  throw new Error('Invalid email');
}

const appIdRegex = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function appIdOrName(string) {
  if (string.match(appIdRegex)) {
    return { app_id: string };
  }
  return { app_name: string };
}

const orgaIdRegex = /^(user_|orga_)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function orgaIdOrName(string) {
  if (string.match(orgaIdRegex)) {
    return { orga_id: string };
  }
  return { orga_name: string };
}

const addonIdRegex = /^addon_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const operatorIdRegex =
  /^(keycloak|otoroshi|matomo|metabase)_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ulidRegex = /^(kubernetes)_[0-9A-HJ-NP-TV-Z]{26}$/i;

export function addonIdOrName(string) {
  if (string.match(addonIdRegex)) {
    return { addon_id: string };
  }
  if (string.match(operatorIdRegex) || string.match(ulidRegex)) {
    return { operator_id: string };
  }
  return { addon_name: string };
}

export function commaSeparated(string) {
  return string.split(',');
}

export function integer(string) {
  const integer = parseInt(string);
  if (isNaN(integer)) {
    throw new Error('Invalid number: ' + string);
  }
  return integer;
}

export function nonEmptyString(string) {
  if (typeof string !== 'string' || string === '') {
    throw new Error('Invalid string, it should not be empty');
  }
  return string;
}

// /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/i;
const tagRegex = /^[^,\s]+$/;

export function tag(string) {
  if (string.match(tagRegex)) {
    return string;
  }
  throw new Error(`Invalid tag '${string}'. Should match ${tagRegex}`);
}

export function tags(string) {
  if (String(string).length === 0) {
    return [];
  }
  const tags = String(string).split(',');
  for (const current of tags) {
    tag(current); // will throw if invalid
  }
  return tags;
}

/**
 * Parse a duration into seconds
 * A Zero seconds duration is allowed
 * @param {string} durationStr an ISO8601, 1h or a positive number
 * @returns {number} number of seconds
 */
export function durationInSeconds(durationStr = '') {
  const errorMessage = `Invalid duration: "${durationStr}", expect (IS0 8601 duration / a "1h, 1m, 30s" like duration / a positive number in seconds)`;

  if (durationStr.startsWith('P')) {
    try {
      const d = ISO8601.parse(durationStr);
      return ISO8601.toSeconds(d);
    } catch {
      throw new Error(errorMessage);
    }
  }

  try {
    return parseSimpleDuration(durationStr);
  } catch {
    const n = Number.parseInt(durationStr);
    if (isNaN(n) || n < 0) {
      throw new Error(errorMessage);
    }
    return n;
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
    return { ngId: string };
  }
  if (Object.keys(NG_MEMBER_PREFIXES).some((prefix) => string.startsWith(prefix))) {
    return { memberId: string };
  }
  return { ngResourceLabel: string };
}

export function ngValidType(string) {
  if (string === 'NetworkGroup' || string === 'Member' || string === 'CleverPeer' || string === 'ExternalPeer') {
    return string;
  }
  throw new Error(`Invalid Network Group resource type: ${string}`);
}
