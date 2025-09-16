import { ApplicationAccessLogStream } from '@clevercloud/client/esm/streams/access-logs.js';
import { formatTable } from '../format-table.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { JsonArray } from '../models/json-array.js';
import { getHostAndTokens } from '../models/send-to-api.js';
import { truncateWithEllipsis } from '../models/utils.js';

// 2000 logs per 100ms maximum
const THROTTLE_ELEMENTS = 2000;
const THROTTLE_PER_IN_MILLISECONDS = 100;
const CITY_MAX_LENGTH = 20;

export async function accessLogs(params) {
  // TODO: drop when add-ons are supported in API
  if (params.options.addon) {
    throw new Error('Access Logs are not available for add-ons yet');
  }

  const { apiHost, tokens } = await getHostAndTokens();
  const { alias, app: appIdOrName, format, before: until, after: since } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const stream = new ApplicationAccessLogStream({
    apiHost,
    tokens,
    ownerId,
    appId,
    since,
    until,
    throttleElements: THROTTLE_ELEMENTS,
    throttlePerInMilliseconds: THROTTLE_PER_IN_MILLISECONDS,
  });

  if (format === 'human') {
    Logger.println(styleText('yellow', '/!\\ This feature is in Beta testing phase'));
  }

  if (format === 'json' && !until) {
    throw new Error('JSON format only works with a limiting parameter such as `before`');
  }

  // used for 'json' format
  const jsonArray = new JsonArray();

  stream
    .on('open', () => {
      Logger.debug(styleText('blue', `Logs stream (open) ${JSON.stringify({ appId })}`));
      if (format === 'json') {
        jsonArray.open();
      }
    })
    .on('error', (event) => {
      Logger.debug(styleText('red', `Logs stream (error) ${event.error.message}`));
    })
    .onLog((log) => {
      switch (format) {
        case 'json':
          jsonArray.push(log);
          break;
        case 'json-stream':
          Logger.printJson(log);
          break;
        case 'human':
        default:
          // when the connection is cut too early, or for TCP redirections, we don't have HTTP section
          if (log.http == null) {
            break;
          }

          Logger.println(formatHuman(log));
          break;
      }
    });

  // Properly close the stream
  process.once('SIGINT', (signal) => stream.close(signal));

  const closeReason = await stream.start();

  if (format === 'json') {
    jsonArray.close();
  }

  Logger.debug(`stream closed: ${closeReason?.type}`);
}

function formatHuman(log) {
  const { date, http, source } = log;
  const country = source.countryCode ?? '(unknown)';
  const hasSourceCity = source.city ?? '';

  return formatTable(
    [
      [
        styleText('grey', date.toISOString(date)),
        source.ip,
        `${country}${hasSourceCity ? '/' + truncateWithEllipsis(CITY_MAX_LENGTH, source.city) : ''}`,
        colorStatusCode(http.response.statusCode),
        http.request.method.toString().padEnd(4, ' ') + ' ' + http.request.path,
      ],
    ],
    ACCESSLOG_COLUMN_WIDTHS,
  );
}

const ACCESSLOG_COLUMN_WIDTHS = [
  '2024-06-24T08:05:43.880Z',
  '255.255.255.255',
  // country / city
  2 + 1 + CITY_MAX_LENGTH,
  'XXX',
  // longest method name
  'OPTIONS',
  // path
];

/**
 * @param {number} code
 * @returns {string}
 */
function colorStatusCode(code) {
  const codeString = code.toString();
  if (code >= 500) {
    return styleText('red', codeString);
  }
  if (code >= 400) {
    return styleText('yellow', codeString);
  }
  if (code >= 300) {
    return styleText('blue', codeString);
  }
  if (code >= 200) {
    return styleText('green', codeString);
  }
  return codeString;
}
