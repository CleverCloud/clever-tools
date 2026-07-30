import type { AccessLogPeer } from '@clevercloud/client/cc-api-commands/log/log.types.js';

/**
 * A runtime log of an application as the v4 log API sends it, which is what `clever logs` printed
 * with `--format json` and `--format json-stream` before the `@clevercloud/client` migration.
 */
export interface LegacyApplicationRuntimeLog {
  id: string;
  applicationId: string;
  commitId: string;
  deploymentId: string;
  instanceId: string;
  date: string;
  region: string;
  zone: string;
  pid: number;
  facility: string;
  severity: string;
  priority: number;
  version: string;
  service: string;
  message: string;
}

/**
 * A runtime log of an add-on as the v4 log API sends it, which is what `clever logs --addon`
 * printed with `--format json` and `--format json-stream` before the migration.
 */
export interface LegacyAddonRuntimeLog {
  id: string;
  resourceId: string;
  hostname: string;
  instanceId: string;
  date: string;
  region: string | null;
  zone: string;
  pid: number;
  facility: string;
  severity: string;
  service: string;
  message: string;
}

/**
 * An HTTP access log as the v4 log API sends it, which is what `clever accesslogs` printed with
 * `--format json` and `--format json-stream` before the migration.
 */
export interface LegacyApplicationAccessLog {
  id: string;
  date: string;
  applicationId: string;
  instanceId: string;
  requestId: string;
  bytesIn: number;
  bytesOut: number;
  source: AccessLogPeer;
  destination: AccessLogPeer;
  tls: { version: string } | null;
  zone: string;
  region: string;
  http: {
    request: { host: string; method: string; path: string; scheme: string };
    response: { statusCode: number; time: number; serviceTime: number | null };
  };
}
