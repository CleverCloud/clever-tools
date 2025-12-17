import { EventsStream } from '@clevercloud/client/esm/streams/events.js';
import { z } from 'zod';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Activity from '../../models/activity.js';
import * as Application from '../../models/application.js';
import { getHostAndTokens } from '../../models/send-to-api.js';
import { Deferred } from '../../models/utils.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

const dtf = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZoneName: 'longOffset',
});

function formatDate(date) {
  const d = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}:${d.second}${d.timeZoneName.replace('GMT', '')}`;
}

function getColoredState(state, isLast) {
  if (state === 'OK') {
    return styleText(['bold', 'green'], state);
  }
  if (state === 'FAIL' || state === 'CANCELLED') {
    return styleText(['bold', 'red'], state);
  }
  if (state === 'WIP' && !isLast) {
    return styleText(['bold', 'red'], 'FAIL');
  }
  if (state === 'WIP' && isLast) {
    return styleText(['bold', 'blue'], 'IN PROGRESS');
  }
  Logger.warn(`Unknown deployment state: ${state}`);
  return 'UNKNOWN';
}

const ACTIVITY_TABLE_COLUMN_WIDTHS = [
  formatDate(Date.now()),
  47,
  'IN PROGRESS',
  'downscale',
  // a git commit id is 8 chars long
  8,
  0,
];

function convertEventToJson(event) {
  return {
    uuid: event.uuid,
    date: event.date,
    state: event.state,
    action: event.action,
    commit: event.commit,
    cause: event.cause,
  };
}

function formatActivityLine(event) {
  return formatTable(
    [
      [
        formatDate(event.date),
        event.uuid,
        getColoredState(event.state, event.isLast),
        event.action,
        event?.commit?.substring(0, 8) ?? 'N/A',
        event.cause,
      ],
    ],

    ACTIVITY_TABLE_COLUMN_WIDTHS,
  );
}

function isTemporaryEvent(ev) {
  if (ev == null) {
    return false;
  }
  return (ev.state === 'WIP' && ev.isLast) || ev.state === 'CANCELLED';
}

function clearPreviousLine() {
  if (process.stdout.isTTY) {
    process.stdout.moveCursor(0, -1);
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }
}

function handleEvent(previousEvent, event, handler) {
  if (isTemporaryEvent(previousEvent)) {
    handler.pop();
  }

  handler.print(event);

  return event;
}

function onEvent(previousEvent, newEvent, handler) {
  const {
    event,
    date,
    data: { uuid, state, action, commit, cause },
  } = newEvent;
  if (event !== 'DEPLOYMENT_ACTION_BEGIN' && event !== 'DEPLOYMENT_ACTION_END') {
    return previousEvent;
  }
  return handleEvent(previousEvent, { date, uuid, state, action, commit, cause, isLast: true }, handler);
}

function getEventHandler(format, follow) {
  switch (format) {
    case 'json': {
      if (follow) {
        throw new Error('The `follow` option and "json" format are not compatible. Use "json-stream" format instead.');
      } else {
        const buf = [];

        return {
          print: (event) => buf.push(convertEventToJson(event)),
          pop: () => buf.pop(),
          end: () => {
            Logger.printJson(buf);
          },
        };
      }
    }
    case 'json-stream': {
      return {
        print: (event) => {
          Logger.println(JSON.stringify(convertEventToJson(event)));
        },
        pop: clearPreviousLine,
        end: () => {},
      };
    }
    case 'human':
    default: {
      return {
        print: (event) => Logger.println(formatActivityLine(event)),
        pop: clearPreviousLine,
        end: () => {},
      };
    }
  }
}

export const activityCommand = defineCommand({
  description: 'Show last deployments of an application',
  since: '0.2.3',
  sinceDate: '2015-08-25',
  options: {
    follow: defineOption({
      name: 'follow',
      schema: z.boolean().default(false),
      description: 'Track new deployments in activity list',
      aliases: ['f'],
    }),
    'show-all': defineOption({
      name: 'show-all',
      schema: z.boolean().default(false),
      description: 'Show all activity',
    }),
    format: defineOption({
      name: 'format',
      schema: z.string().default('human'),
      description: 'Output format (${...})',
      aliases: ['F'],
      placeholder: 'format',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, 'show-all': showAll, follow, format } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const events = await Activity.list(ownerId, appId, showAll);
    const reversedArrayWithIndex = events.reverse().map((event, index, all) => {
      const isLast = index === all.length - 1;
      return { ...event, isLast };
    });

    const handler = getEventHandler(format, follow);

    let lastEvent = reversedArrayWithIndex.reduce(
      (previousEvent, newEvent) => handleEvent(previousEvent, newEvent, handler),
      {},
    );

    if (!follow) {
      handler.end();
      return lastEvent;
    }

    const { apiHost, tokens } = await getHostAndTokens();
    const eventsStream = new EventsStream({ apiHost, tokens, appId });

    const deferred = new Deferred();

    eventsStream
      .on('open', () => Logger.debug('WS for events (open) ' + JSON.stringify({ appId })))
      .on('event', (event) => {
        lastEvent = onEvent(lastEvent, event, handler);
        return lastEvent;
      })
      .on('ping', () => Logger.debug('WS for events (ping)'))
      .on('close', ({ reason }) => Logger.debug('WS for events (close) ' + reason))
      .on('error', deferred.reject);

    eventsStream.open({ autoRetry: true, maxRetryCount: 6 });

    return deferred.promise;
  },
});
