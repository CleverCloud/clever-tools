import type {
  LogDrainExecutionStatus,
  LogDrainKind,
  LogDrainStatus,
  LogDrainTlsVerification,
} from '@clevercloud/client/cc-api-commands/log-drain/log-drain.types.js';

/**
 * A log drain as the v4 API returns it, which is what `clever drain` and `clever drain get` printed
 * with `--format json` before the `@clevercloud/client` migration.
 */
export interface LegacyLogDrain {
  id: string;
  kind: LogDrainKind;
  status: {
    status: LogDrainStatus;
    date: string;
    authorId: string | null;
    errorReason: string | null;
  };
  recipient: LegacyLogDrainRecipient;
  execution: {
    status: LogDrainExecutionStatus;
    lastError: string | null;
    attempt: number | null;
    maxAttempt: number | null;
    lastAttemptAt: string | null;
    nextAttemptAt: string | null;
    retryingSince: string | null;
  };
  backlog: {
    msgRateOut: number;
    msgThroughputOut: number;
    msgBacklog: number;
  } | null;
}

/** Where a drain ships its logs, as the v4 API returns it. */
export type LegacyLogDrainRecipient =
  | { type: 'RAW_HTTP'; url: string; username?: string; password?: string }
  | { type: 'SYSLOG_TCP' | 'SYSLOG_UDP'; url: string; rfc5424StructuredDataParameters?: string }
  | { type: 'OVH_TCP'; url: string; token?: string; rfc5424StructuredDataParameters?: string }
  | { type: 'DATADOG'; url: string }
  | {
      type: 'ELASTICSEARCH';
      url: string;
      username?: string;
      password?: string;
      index?: string;
      tlsVerification?: LogDrainTlsVerification;
    }
  | { type: 'NEWRELIC'; url: string; apiKey: string }
  | { type: 'BETTERSTACK'; url: string; sourceToken: string };
