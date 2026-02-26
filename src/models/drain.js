export const DRAIN_TYPES = {
  DATADOG: { apiCode: 'DATADOG', cliCode: 'datadog', label: 'Datadog' },
  ELASTICSEARCH: { apiCode: 'ELASTICSEARCH', cliCode: 'elasticsearch', label: 'Elasticsearch' },
  NEWRELIC: { apiCode: 'NEWRELIC', cliCode: 'newrelic', label: 'New Relic' },
  OVH_TCP: { apiCode: 'OVH_TCP', cliCode: 'ovh-tcp', label: 'OVH TCP' },
  RAW_HTTP: { apiCode: 'RAW_HTTP', cliCode: 'raw-http', label: 'Raw HTTP' },
  SYSLOG_TCP: { apiCode: 'SYSLOG_TCP', cliCode: 'syslog-tcp', label: 'Syslog TCP' },
  SYSLOG_UDP: { apiCode: 'SYSLOG_UDP', cliCode: 'syslog-udp', label: 'Syslog UDP' },
};

export const DRAIN_TYPE_CLI_CODES = Object.values(DRAIN_TYPES).map(({ cliCode }) => cliCode);

function formatRate(messagesPerSecond) {
  if (messagesPerSecond < 1) {
    return Math.floor(messagesPerSecond * 3600) + ' messages/hour';
  }
  if (messagesPerSecond < 60) {
    return Math.floor(messagesPerSecond * 60) + ' messages/minute';
  }
  return Math.floor(messagesPerSecond) + ' messages/second';
}

function formatThroughput(bytesPerSecond) {
  if (bytesPerSecond < 1024) {
    return Math.floor(bytesPerSecond) + ' bytes/second';
  }
  if (bytesPerSecond < 1024 * 1024) {
    return (bytesPerSecond / 1024).toFixed(2) + ' KiB/second';
  }
  return (bytesPerSecond / (1024 * 1024)).toFixed(2) + ' MiB/second';
}

export function formatDrain(rawDrain) {
  const drainType = DRAIN_TYPES[rawDrain.recipient.type];
  const drainDetails = [
    ['ID', rawDrain.id],
    ['Status', rawDrain.status.status],
    ['Execution status', rawDrain.execution.status],
    ['URL', rawDrain.recipient.url],
    ['Type', drainType.label],
    ['Custom index', rawDrain.recipient.index],
    ['SD parameters', rawDrain.recipient.rfc5424StructuredDataParameters],
    ['Message output rate', formatRate(rawDrain.backlog.msgRateOut)],
    ['Message throughput', formatThroughput(rawDrain.backlog.msgThroughputOut)],
    ['Backlog', rawDrain.backlog.msgBacklog + ' pending messages'],
    [
      'Retry attempts',
      rawDrain.execution.attempt != null && rawDrain.execution.maxAttempt != null
        ? `${rawDrain.execution.attempt}/${rawDrain.execution.maxAttempt}`
        : null,
    ],
    ['Last attempt at', rawDrain.execution.lastAttemptAt],
    ['Next attempt at', rawDrain.execution.nextAttemptAt],
    ['Retrying since', rawDrain.execution.retryingSince],
    ['Last error', rawDrain.execution.lastError],
  ];
  return Object.fromEntries(drainDetails.filter(([_name, value]) => value != null));
}
