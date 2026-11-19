import { ApplicationAccessLogStream } from '@clevercloud/client/esm/streams/access-logs.js';
import { formatTable } from '../../format-table.js';
import { formatClf } from '../../lib/access-logs-clf.js';
import { guessAccessLogTransport } from '../../lib/access-logs-transport.js';
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

// Same policy as `clever logs` (src/models/log.js): a redeployment of the API cuts the stream
// without an END_OF_STREAM, which the client only notices through its heartbeat watchdog.
// Without retry that ends the command; with it the stream reconnects and resumes from the
// last event id.
const RETRY_CONFIGURATION = {
  enabled: true,
  initRetryTimeout: 3000,
  maxRetryCount: 10,
};

const CITY_MAX_LENGTH = 20;

function formatLocation(endpoint) {
  const country = endpoint.countryCode ?? '(unknown)';
  const hasCity = endpoint.city ?? '';

  return `${country}${hasCity ? '/' + truncateWithEllipsis(CITY_MAX_LENGTH, endpoint.city) : ''}`;
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
 * Format the connection details of an access log without an HTTP section, as emitted for TCP
 * redirections, SSH connections and add-ons exposed over raw TCP (Redis, PostgreSQL…).
 *
 * The destination is the load balancer, not the resource, so it's dropped. The target VM is only
 * printed when the API resolved it: it carries the load balancer server name, which is a bare UUID
 * for some providers but not for others, and the API falls back to the nil UUID when it cannot
 * parse it. Printing `00000000` on every line of those would be pure noise.
 *
 * @param {object} log an access log, as emitted by `ApplicationAccessLogStream`
 * @returns {string}
 */
function formatConnection(log) {
  const { source, bytesIn, bytesOut, instanceId } = log;
  const target =
    instanceId != null && instanceId !== NIL_INSTANCE_ID ? instanceId.slice(0, INSTANCE_ID_SHORT_LENGTH) : null;

  return [
    source.port != null ? `:${source.port}` : null,
    bytesIn != null && bytesOut != null ? `${formatBytes(bytesIn)}↑ ${formatBytes(bytesOut)}↓` : null,
    target && styleText('grey', target),
  ]
    .filter((part) => part != null)
    .join('  ');
}

/**
 * Format an access log as a human readable table row.
 *
 * Non-HTTP access logs (TCP redirections, SSH connections, or HTTP connections cut before the
 * proxy could answer) have no `http` section: their status and method columns are left empty and
 * the connection details sit where the request path would be, so a mixed stream stays aligned.
 *
 * @param {object} log an access log, as emitted by `ApplicationAccessLogStream`
 * @returns {string}
 */
function formatHuman(log) {
  const { date, http, source } = log;

  const columns = [
    styleText('grey', date.toISOString(date)),
    guessAccessLogTransport(log),
    source.ip,
    formatLocation(source),
  ];

  if (http != null) {
    columns.push(colorStatusCode(http.response.statusCode));
    columns.push(http.request.method);
    columns.push(http.request.path);
  } else {
    columns.push('', '', formatConnection(log));
  }

  return formatTable([columns], ACCESSLOG_COLUMN_WIDTHS);
}

const ACCESSLOG_COLUMN_WIDTHS = [
  '2024-06-24T08:05:43.880Z',
  // longest transport name
  'HTTP',
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
      connectionTimeout: 10_000,
      retryConfiguration: RETRY_CONFIGURATION,
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
            // CLF only describes HTTP requests, so logs without an HTTP section are skipped
            if (log.http == null) {
              break;
            }

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
