export const DRAIN_TYPES = {
  DATADOG: { apiCode: 'DatadogRecipient', cliCode: 'datadog', label: 'Datadog' },
  ELASTICSEARCH: { apiCode: 'ElasticsearchRecipient', cliCode: 'elasticsearch', label: 'Elasticsearch' },
  NEWRELIC: { apiCode: 'NewRelicRecipient', cliCode: 'newrelic', label: 'New Relic' },
  OVH_TCP: { apiCode: 'OVHTCPRecipient', cliCode: 'ovh-tcp', label: 'OVH TCP' },
  RAW_HTTP: { apiCode: 'RawRecipient', cliCode: 'raw-http', label: 'Raw HTTP' },
  SYSLOG_TCP: { apiCode: 'SyslogTCPRecipient', cliCode: 'syslog-tcp', label: 'Syslog TCP' },
  SYSLOG_UDP: { apiCode: 'SyslogUDPRecipient', cliCode: 'syslog-udp', label: 'Syslog UDP' },
};

export const DRAIN_TYPE_CLI_CODES = Object.values(DRAIN_TYPES).map(({ cliCode }) => cliCode);

export function formatDrain(rawDrain) {
  const drainType = Object.values(DRAIN_TYPES).find((t) => {
    return (
      t.apiCode ===
      rawDrain.recipient.type
        // TODO: remove this once API is updated
        .replace(/View$/, '')
    );
  });
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
