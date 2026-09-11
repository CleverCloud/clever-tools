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

const flavorCountRegex = /^[^:]+:\d+$/;

export function flavorCount(string) {
  if (!flavorCountRegex.test(string)) {
    throw new Error('Expected format: <flavor>:<count>');
  }
  const [flavor, count] = string.split(':');
  return { flavor: flavor.toUpperCase(), targetNodeCount: Number(count) };
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
  const isoDuration = shortDurationToIso(durationStr);
  if (isoDuration != null) {
    return ISO8601.toSeconds(ISO8601.parse(isoDuration));
  }
}

/**
 * Convert a `1h`/`4d`/`2w` like duration to its ISO 8601 form, or `null` if the unit is unknown.
 * @param {string} durationStr
 * @returns {string|null} an ISO 8601 duration
 */
function shortDurationToIso(durationStr) {
  const { rawValue, unit } = durationStr.match(/^(?<rawValue>\d+)(?<unit>.*)$/)?.groups ?? {};
  return unit in SHORT_UNITS_TO_ISO ? SHORT_UNITS_TO_ISO[unit](Number(rawValue)) : null;
}

/**
 * Parse a duration into the ISO 8601 string an API expects.
 *
 * Accepts the same grammar as {@link durationInSeconds} minus the bare number of seconds, which
 * would be ambiguous here, and returns a duration rather than a count of seconds: `P5D` stays
 * `P5D` instead of becoming `432000`, so what the user typed is what gets sent and echoed back.
 * A zero or negative duration is rejected — every caller so far wants a lifespan.
 *
 * @param {string} durationStr an ISO 8601 duration or a `1h, 4d, 2w` like duration
 * @returns {string} an ISO 8601 duration
 */
export function iso8601Duration(durationStr = '') {
  const errorMessage = `Invalid duration: "${durationStr}", expect an ISO 8601 duration (e.g.: P5D, PT12H) or a "1h, 4d, 2w" like duration`;

  const isoDuration = durationStr.startsWith('P') ? durationStr : shortDurationToIso(durationStr);
  if (isoDuration == null) {
    throw new Error(errorMessage);
  }

  let seconds;
  try {
    seconds = ISO8601.toSeconds(ISO8601.parse(isoDuration));
  } catch {
    throw new Error(errorMessage);
  }

  if (seconds <= 0) {
    throw new Error(`Invalid duration: "${durationStr}", it must be strictly positive`);
  }

  return isoDuration;
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
