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
    ['Message output rate', Math.floor(rawDrain.backlog.msgRateOut * 60) + ' messages/minute'],
    ['Message throughput', Math.floor(rawDrain.backlog.msgRateOut) + ' bytes/second'],
    ['Backlog', rawDrain.backlog.msgBacklog + ' pending messages'],
    ['Last error', rawDrain.execution.lastError],
  ];
  return Object.fromEntries(drainDetails.filter(([_name, value]) => value != null));
}
