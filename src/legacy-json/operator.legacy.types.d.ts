import type { KeycloakInfo } from '@clevercloud/client/cc-api-commands/keycloak/keycloak.types.js';
import type { MatomoInfo } from '@clevercloud/client/cc-api-commands/matomo/matomo.types.js';
import type { OtoroshiInfo } from '@clevercloud/client/cc-api-commands/otoroshi/otoroshi.types.js';

/** An operator payload, as the provider's API returns it. */
export type LegacyOperatorInfo = LegacyKeycloakInfo | LegacyMatomoInfo | LegacyMetabaseInfo | LegacyOtoroshiInfo;

/** What every operator payload carries, whichever provider it comes from. */
interface LegacyOperatorInfoCommon {
  resourceId: string;
  addonId: string;
  name: string;
  ownerId: string;
  plan: string;
  version: string;
  accessUrl: string;
  availableVersions: Array<string>;
}

/**
 * A Keycloak add-on as its API returns it, which is what `clever keycloak get --format json`
 * printed before the `@clevercloud/client` migration.
 */
export interface LegacyKeycloakInfo extends LegacyOperatorInfoCommon {
  javaVersion: string;
  resources: KeycloakInfo['resources'];
  features: { networkGroup: { id: string } | null };
  initialCredentials: KeycloakInfo['initialCredentials'];
  envVars: Record<string, string>;
}

/**
 * A Matomo add-on as its API returns it, which is what `clever matomo get --format json` printed
 * before the migration.
 */
export interface LegacyMatomoInfo extends LegacyOperatorInfoCommon {
  plan: 'BETA';
  phpVersion: string;
  resources: MatomoInfo['resources'];
  envVars: Record<string, string>;
}

/**
 * A Metabase add-on as its API returns it, which is what `clever metabase get --format json`
 * printed before the migration.
 */
export interface LegacyMetabaseInfo extends LegacyOperatorInfoCommon {
  javaVersion: string;
  resources: { entrypoint: string; pgsqlId: string | null };
  envVars: Record<string, string>;
}

/**
 * An Otoroshi add-on as its API returns it, which is what `clever otoroshi get --format json`
 * printed before the migration — minus the environment variables, which the client drops.
 */
export interface LegacyOtoroshiInfo extends LegacyOperatorInfoCommon {
  javaVersion: string;
  resources: {
    entrypoint: string;
    redisId: string;
    pulsarId: string | null;
    elasticId: string | null;
  };
  features: { networkGroup: { id: string } | null };
  api: OtoroshiInfo['api'];
  initialCredentials: OtoroshiInfo['initialCredentials'];
}

/**
 * The version check of an operator as its API returns it, which is what
 * `clever <operator> version` and `clever <operator> version check` printed with `--format json`
 * before the migration.
 */
export interface LegacyOperatorVersionCheck {
  installed: string;
  available: Array<string>;
  latest: string;
  needUpdate: boolean;
}
