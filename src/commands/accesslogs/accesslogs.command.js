import { StreamApplicationAccessLogCommand } from '@clevercloud/client/cc-api-commands/log/stream-application-access-log-command.js';
import { formatTable } from '../../format-table.js';
import { toLegacyApplicationAccessLog } from '../../legacy-json/log.legacy.js';
import { formatClf } from '../../lib/access-logs-clf.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { JsonArray } from '../../models/json-array.js';
import { truncateWithEllipsis } from '../../models/utils.js';
import {
  accessLogsFormatOption,
  addonIdOrRealIdOption,
  afterOption,
  aliasOption,
  appIdOrNameOption,
  beforeOption,
} from '../global.options.js';

const THROTTLE_ELEMENTS = 2000;

const THROTTLE_PER_IN_MILLISECONDS = 100;

const RETRY_CONFIGURATION = {
  initRetryTimeout: 3000,
  maxRetryCount: 10,
};

const CITY_MAX_LENGTH = 20;

function formatHuman(log) {
  const { date, detail, source } = log;
  const country = source.countryCode ?? '(unknown)';
  const hasSourceCity = source.city ?? '';

  return formatTable(
    [
      [
        styleText('grey', date),
        source.ip,
        `${country}${hasSourceCity ? '/' + truncateWithEllipsis(CITY_MAX_LENGTH, source.city) : ''}`,
        colorStatusCode(detail.response.statusCode),
        detail.request.method.toString().padEnd(4, ' ') + ' ' + detail.request.path,
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

export const accesslogsCommand = defineCommand({
  description: 'Fetch access logs',
  since: '2.1.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: accessLogsFormatOption,
    before: beforeOption,
    after: afterOption,
    addon: addonIdOrRealIdOption,
  },
  args: [],
  async handler(options) {
    // TODO: drop when add-ons are supported in API
    if (options.addon) {
      throw new Error('Access Logs are not available for add-ons yet');
    }

    const { alias, app: appIdOrName, format, before: until, after: since } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    if (format === 'human') {
      Logger.println(styleText('yellow', '/!\\ This feature is in Beta testing phase'));
    }

    if (format === 'json' && !until) {
      throw new Error('JSON format only works with a limiting parameter such as `before`');
    }

    const stream = await clients.ccApi.stream(
      new StreamApplicationAccessLogCommand({
        ownerId,
        applicationId: appId,
        since,
        until,
        throttleElements: THROTTLE_ELEMENTS,
        throttlePerInMilliseconds: THROTTLE_PER_IN_MILLISECONDS,
      }),
      { retry: RETRY_CONFIGURATION },
    );

    // used for 'json' format
    const jsonArray = new JsonArray();

    stream
      .onOpen(() => {
        Logger.debug(styleText('blue', `Logs stream (open) ${JSON.stringify({ appId })}`));
        if (format === 'json') {
          jsonArray.open();
        }
      })
      .onError((error) => {
        Logger.debug(styleText('red', `Logs stream (error) ${error.message}`));
      })
      .onLog((log) => {
        switch (format) {
          // `--format json` and `--format json-stream` still print the raw payloads,
          // see src/legacy-json/README.md
          case 'json':
            jsonArray.push(toLegacyApplicationAccessLog(log));
            break;
          case 'json-stream':
            Logger.printJson(toLegacyApplicationAccessLog(log));
            break;
          case 'clf':
            Logger.println(formatClf(log));
            break;
          case 'human':
          default:
            Logger.println(formatHuman(log));
            break;
        }
      });

    // Properly close the stream
    process.once('SIGINT', (signal) => {
      stream.close({ type: signal });
      process.kill(process.pid, 'SIGINT');
    });

    const closeReason = await stream.start();

    if (format === 'json') {
      jsonArray.close();
    }

    Logger.debug(`stream closed: ${closeReason?.type}`);
  },
});
