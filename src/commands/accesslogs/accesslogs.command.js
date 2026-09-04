import { ApplicationAccessLogStream } from '@clevercloud/client/esm/streams/access-logs.js';
import { formatTable } from '../../format-table.js';
import { formatClf } from '../../lib/access-logs-clf.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { resolveAddon } from '../../models/ids-resolver.js';
import { JsonArray } from '../../models/json-array.js';
import { getHostAndTokens } from '../../models/send-to-api.js';
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

const CITY_MAX_LENGTH = 20;

function formatLocation(endpoint) {
  const country = endpoint.countryCode ?? '(unknown)';
  const hasCity = endpoint.city ?? '';

  return `${country}${hasCity ? '/' + truncateWithEllipsis(CITY_MAX_LENGTH, endpoint.city) : ''}`;
}

function formatHuman(log) {
  const { date, http, source } = log;

  return formatTable(
    [
      [
        styleText('grey', date.toISOString(date)),
        source.ip,
        formatLocation(source),
        colorStatusCode(http.response.statusCode),
        http.request.method.toString().padEnd(4, ' ') + ' ' + http.request.path,
      ],
    ],

    ACCESSLOG_COLUMN_WIDTHS,
  );
}

/** An access log carries this instance ID when the platform did not attach the event to a VM */
const NIL_INSTANCE_ID = '00000000-0000-0000-0000-000000000000';

const INSTANCE_ID_SHORT_LENGTH = 8;

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KiB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MiB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GiB`;
}

/**
 * Format an access log without an HTTP section, as emitted for TCP redirections and for add-ons
 * exposed over raw TCP (Redis, PostgreSQL…). The columns are kept identical to the HTTP ones so both
 * kinds of lines stay aligned in a single stream: `TCP` sits where the status code would be, and the
 * connection details replace the request line.
 *
 * The destination is the load balancer, not the add-on, so it's dropped. The target VM is only
 * printed when the API resolved it: it carries the load balancer server name, which is a bare UUID
 * for some providers but not for others, and the API falls back to the nil UUID when it cannot
 * parse it. Printing `00000000` on every line of those would be pure noise.
 */
function formatHumanTcp(log) {
  const { date, source, bytesIn, bytesOut, instanceId } = log;
  const target =
    instanceId != null && instanceId !== NIL_INSTANCE_ID ? instanceId.slice(0, INSTANCE_ID_SHORT_LENGTH) : null;

  return formatTable(
    [
      [
        styleText('grey', date.toISOString(date)),
        source.ip,
        formatLocation(source),
        styleText('cyan', 'TCP'),
        [`:${source.port}`, `${formatBytes(bytesIn)}↑ ${formatBytes(bytesOut)}↓`, target && styleText('grey', target)]
          .filter((part) => part != null)
          .join('  '),
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
    const { apiHost, tokens } = await getHostAndTokens();
    const { alias, app: appIdOrName, addon: addonIdOrRealId, format, before: until, after: since } = options;

    // Add-ons are served by the very same endpoint as applications: the `applications` path segment
    // is a misnomer, the API accepts any loggable ID. The access logs topic is named after the
    // add-on real ID, an `addon_` ID resolves to no topic at all, hence the `realId` here.
    const { ownerId, resourceId } =
      addonIdOrRealId != null
        ? await resolveAddon(addonIdOrRealId).then(({ ownerId, realId }) => ({ ownerId, resourceId: realId }))
        : await Application.resolveId(appIdOrName, alias).then(({ ownerId, appId }) => ({
            ownerId,
            resourceId: appId,
          }));

    const stream = new ApplicationAccessLogStream({
      apiHost,
      tokens,
      ownerId,
      appId: resourceId,
      since,
      until,
      throttleElements: THROTTLE_ELEMENTS,
      throttlePerInMilliseconds: THROTTLE_PER_IN_MILLISECONDS,
    });

    if (format === 'json' && !until) {
      throw new Error('JSON format only works with a limiting parameter such as `before`');
    }

    // used for 'json' format
    const jsonArray = new JsonArray();

    stream
      .on('open', () => {
        Logger.debug(styleText('blue', `Logs stream (open) ${JSON.stringify({ resourceId })}`));
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
          case 'clf':
            // when the connection is cut too early, or for TCP redirections, we don't have HTTP
            // section. CLF describes an HTTP request, there is nothing meaningful to emit here
            if (log.http == null) {
              break;
            }

            Logger.println(formatClf(log));
            break;
          case 'human':
          default:
            // when the connection is cut too early, or for TCP redirections, we don't have HTTP
            // section. That's the only thing add-ons exposed over raw TCP ever emit, so these logs
            // get their own line instead of being dropped
            Logger.println(log.http == null ? formatHumanTcp(log) : formatHuman(log));
            break;
        }
      });

    // Properly close the stream
    process.once('SIGINT', (signal) => {
      stream.close(signal);
      process.kill(process.pid, 'SIGINT');
    });

    const closeReason = await stream.start();

    if (format === 'json') {
      jsonArray.close();
    }

    Logger.debug(`stream closed: ${closeReason?.type}`);
  },
});
