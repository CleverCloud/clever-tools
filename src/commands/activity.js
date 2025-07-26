import { styleText } from 'node:util';

import * as Activity from '../models/activity.js';
import { formatTable } from '../format-table.js';
import { Logger } from '../logger.js';
import { Deferred } from '../models/utils.js';
import { EventsStream } from '@clevercloud/client/esm/streams/events.js';
import { getHostAndTokens } from '../models/send-to-api.js';
import * as Application from '../models/application.js';

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

function formatDate (date) {
  const d = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}:${d.second}${d.timeZoneName.replace('GMT', '')}`;
}

function getColoredState (state, isLast) {
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

// We use examples of maximum width text to have a clean display
const formatActivityTable = formatTable([
  formatDate(Date.now()),
  47,
  'IN PROGRESS',
  'downscale',
  // a git commit id is 8 chars long
  8,
  0,
]);

function convertEventToJson (event) {
  return {
    uuid: event.uuid,
    date: event.date,
    state: event.state,
    action: event.action,
    commit: event.commit,
    cause: event.cause,
  };
}

function formatActivityLine (event) {
  return formatActivityTable([
    [
      formatDate(event.date),
      event.uuid,
      getColoredState(event.state, event.isLast),
      event.action,
      event?.commit?.substring(0, 8) ?? 'N/A',
      event.cause,
    ],
  ]);
}

function isTemporaryEvent (ev) {
  if (ev == null) {
    return false;
  }
  return (ev.state === 'WIP' && ev.isLast) || ev.state === 'CANCELLED';
}

function clearPreviousLine () {
  if (process.stdout.isTTY) {
    process.stdout.moveCursor(0, -1);
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }
}

function handleEvent (previousEvent, event, handler) {
  if (isTemporaryEvent(previousEvent)) {
    handler.pop();
  }

  handler.print(event);

  return event;
}

function onEvent (previousEvent, newEvent, handler) {
  const { event, date, data: { uuid, state, action, commit, cause } } = newEvent;
  if (event !== 'DEPLOYMENT_ACTION_BEGIN' && event !== 'DEPLOYMENT_ACTION_END') {
    return previousEvent;
  }
  return handleEvent(previousEvent, { date, uuid, state, action, commit, cause, isLast: true }, handler);
}

function getEventHandler (format, follow) {
  switch (format) {
    case 'json': {
      if (follow) {
        throw new Error('The `follow` option and "json" format are not compatible. Use "json-stream" format instead.');
      }
      else {
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
        end: () => {
        },
      };
    }
    case 'human':
    default: {
      return {
        print: (event) => Logger.println(formatActivityLine(event)),
        pop: clearPreviousLine,
        end: () => {
        },
      };
    }
  }
}

export async function activity (params) {
  const { alias, app: appIdOrName, 'show-all': showAll, follow, format } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
  const events = await Activity.list(ownerId, appId, showAll);
  const reversedArrayWithIndex = events
    .reverse()
    .map((event, index, all) => {
      const isLast = index === all.length - 1;
      return ({ ...event, isLast });
    });

  const handler = getEventHandler(format, follow);

  let lastEvent = reversedArrayWithIndex.reduce((previousEvent, newEvent) => handleEvent(previousEvent, newEvent, handler), {});

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
}
