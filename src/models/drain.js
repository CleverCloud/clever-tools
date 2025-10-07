export function formatDrain(rawDrain) {
  return {
    ID: rawDrain.id,
    Status: rawDrain.status.status,
    'Execution status': rawDrain.execution.status,
    URL: rawDrain.recipient.url,
    Type: rawDrain.recipient.type,
    'Message output rate': Math.floor(rawDrain.backlog.msgRateOut * 60) + ' messages/minute',
    'Message throughput': Math.floor(rawDrain.backlog.msgRateOut) + ' bytes/second',
    Backlog: rawDrain.backlog.msgBacklog + ' pending messages',
    'Last error': rawDrain.execution.lastError,
  };
}
