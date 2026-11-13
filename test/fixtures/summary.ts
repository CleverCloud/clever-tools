import type { RawApplication } from './app.ts';
import { ORGANISATION_SELF, type RawOrganisation } from './organisation.ts';
import { USER_SELF } from './user.ts';

/** Raw entry of `applications` in `GET /v2/summary`, as returned by the API. */
export interface RawSummaryApplication {
  id: string;
  name: string;
  instanceType: string;
  instanceVariant: string;
  variantSlug: string;
  variantLogoUrl: string;
  state: string;
  commit: string | null;
  archived: boolean;
  homogeneous: boolean;
  systemTags: Array<string>;
  customerTags: Array<string>;
}

/**
 * Raw `user` of `GET /v2/summary`, as returned by the API: the current user and the resources of their personal space.
 */
export interface RawSummaryUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  admin: boolean;
  lang: string;
  canSEPA: boolean;
  contextFlags: Array<string>;
  partnerId: string;
  partnerName: string;
  partnerConsoleUrl: string;
  applications: Array<RawSummaryApplication>;
  addons: Array<unknown>;
  consumers: Array<unknown>;
}

/** Raw entry of `organisations` in `GET /v2/summary`, as returned by the API. */
export interface RawSummaryOrganisation {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  applications: Array<RawSummaryApplication>;
  addons: Array<unknown>;
  consumers: Array<unknown>;
  providers: Array<unknown>;
  contextFlags: Array<string>;
  canPay: boolean;
  canSEPA: boolean;
  cleverEnterprise: boolean;
  emergencyNumber: string | null;
  isTrusted: boolean;
  vatState: string;
}

/** Raw body of `GET /v2/summary`, as returned by the API. */
export interface RawSummary {
  user: RawSummaryUser;
  organisations: Array<RawSummaryOrganisation>;
}

/**
 * Raw `GET /v2/summary` body of the current user (`USER_SELF`), the only way to build one in tests.
 *
 * It takes the entities as returned by their own endpoint (`USER_SELF`, `APP_NODE`, `ORGANISATION_FOO`) and keeps the
 * fields the summary lists, as checked against the real API. Like the real API, the personal space shows up twice with
 * the same ID: in `user`, which holds its resources, and first in `organisations`, without any resource. The given
 * `organisations` follow it, in the given order, with the role of the current user in each of them.
 *
 * @example
 * rawSummary({
 *   user: { applications: [APP_NODE] },
 *   organisations: [{ organisation: ORGANISATION_FOO, role: 'MANAGER' }],
 * });
 */
export function rawSummary({
  user = {},
  organisations = [],
}: {
  user?: { applications?: Array<RawApplication> };
  organisations?: Array<{ organisation: RawOrganisation; role: string }>;
} = {}): RawSummary {
  return {
    user: {
      id: USER_SELF.id,
      email: USER_SELF.email,
      name: USER_SELF.name,
      avatar: USER_SELF.avatar,
      admin: USER_SELF.admin,
      lang: USER_SELF.lang,
      canSEPA: ORGANISATION_SELF.canSEPA,
      contextFlags: USER_SELF.contextFlags,
      partnerId: USER_SELF.partnerId,
      partnerName: USER_SELF.partnerName,
      partnerConsoleUrl: USER_SELF.partnerConsoleUrl,
      applications: (user.applications ?? []).map(summaryApplication),
      addons: [],
      consumers: [],
    },
    organisations: [
      summaryOrganisation(ORGANISATION_SELF, 'ADMIN'),
      ...organisations.map(({ organisation, role }) => summaryOrganisation(organisation, role)),
    ],
  };
}

function summaryApplication(application: RawApplication): RawSummaryApplication {
  return {
    id: application.id,
    name: application.name,
    instanceType: application.instance.type,
    instanceVariant: application.instance.variant.name,
    variantSlug: application.instance.variant.slug,
    variantLogoUrl: application.instance.variant.logo,
    state: application.state,
    commit: application.commitId,
    archived: application.archived,
    homogeneous: application.homogeneous,
    systemTags: [],
    customerTags: [],
  };
}

function summaryOrganisation(organisation: RawOrganisation, role: string): RawSummaryOrganisation {
  return {
    id: organisation.id,
    name: organisation.name,
    role,
    avatar: organisation.avatar,
    applications: [],
    addons: [],
    consumers: [],
    providers: [],
    contextFlags: organisation.contextFlags,
    canPay: organisation.canPay,
    canSEPA: organisation.canSEPA,
    cleverEnterprise: organisation.cleverEnterprise,
    emergencyNumber: organisation.emergencyNumber,
    isTrusted: organisation.isTrusted,
    vatState: organisation.vatState,
  };
}
