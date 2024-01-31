'use strict';

const Addon = require('../models/addon.js');
const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');
const { getFormatter } = require('../models/accesslogs.js');
const { getHostAndTokens } = require('../models/send-to-api.js');

// 2000 logs per 100ms maximum
const THROTTLE_ELEMENTS = 2000;
const THROTTLE_PER_IN_MILLISECONDS = 100;

async function accessLogs (params) {
  const { ApplicationAccessLogStream } = await import('./access-logs.mjs');
  const { apiHost, tokens } = await getHostAndTokens();
  const { alias, logsFormat, before, after, addon: addonId } = params.options;

  const { ownerId, appId, realAddonId } = await getIds(addonId, alias);
  //const to = before ?? before.toISOString();
  //const from = after ?? after.toISOString();
  //const to = (before != null) ? toMicroTimestamp(before.toISOString()) : toMicroTimestamp();
  //const from = (after != null) ? toMicroTimestamp(after.toISOString()) : to - ONE_HOUR_MICROS;

  const stream = new ApplicationAccessLogStream({
    apiHost,
    tokens,
    ownerId,
    appId,
    before,
    after,
    throttleElements: THROTTLE_ELEMENTS,
    throttlePerInMilliseconds: THROTTLE_PER_IN_MILLISECONDS,
  })
  console.log(stream.getUrl())

  stream.onLog((log) => {
    console.log(log)
  })

  stream.on('error', (event) => {
    console.error(event, event.error)
  })

  await stream.start()
  /*const formatLogLine = getFormatter(format, addonId != null);

  emitter.on('data', (data) => {
    data.forEach((l) => Logger.println(formatLogLine(l)));
  });

  return new Promise((resolve, reject) => {
    emitter.on('error', reject);
  });*/
}

async function getIds (addonId, alias) {
  if (addonId != null) {
    const addon = await Addon.findById(addonId);
    return {
      ownerId: addon.orgaId,
      realAddonId: addon.realId,
    };
  }
  return AppConfig.getAppDetails({ alias });
}

module.exports = { accessLogs };
