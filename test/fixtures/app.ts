import type { AppConfigFileApp } from '../clever-fs-mock.ts';
import { FLAVOR_M, FLAVOR_S, FLAVOR_XS, type RawFlavor } from './flavor.ts';
import { ORGANISATION_BAR, ORGANISATION_FOO } from './organisation.ts';
import { USER_SELF } from './user.ts';

/** Application as returned by `GET /v2/organisations/:ownerId/applications/:appId`. */
export interface RawApplication {
  id: string;
  name: string;
  description: string;
  zone: string;
  zoneId: string;
  instance: {
    type: string;
    version: string;
    variant: { id: string; slug: string; name: string; deployType: string; logo: string };
    minInstances: number;
    maxInstances: number;
    maxAllowedInstances: number;
    minFlavor: RawFlavor;
    maxFlavor: RawFlavor;
    flavors: Array<RawFlavor>;
    defaultEnv: Record<string, string>;
    lifetime: string;
    instanceAndVersion: string;
    kernelName: string;
  };
  deployment: { shutdownable: boolean; type: string; repoState: string; url: string; httpUrl: string };
  vhosts: Array<{ fqdn: string }>;
  deployUrl: string;
  creationDate: number;
  last_deploy: number;
  archived: boolean;
  stickySessions: boolean;
  homogeneous: boolean;
  favourite: boolean;
  cancelOnPush: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  separateBuild: boolean;
  buildFlavor: RawFlavor;
  ownerId: string;
  state: string;
  commitId: string | null;
  appliance: unknown;
  branch: string;
  forceHttps: string;
  env: Array<{ name: string; value: string }>;
}

// Used by several fields of the application (git URLs, default domain): tests use `APP_NODE.id`.
const APP_NODE_ID = 'app_00000000-0000-4000-8000-000000000300';

export const APP_NODE = {
  id: APP_NODE_ID,
  name: 'my-node-app',
  description: 'my-node-app',
  zone: 'par',
  zoneId: 'aad32a21-24f8-40b3-a750-baab218d927b',
  instance: {
    type: 'node',
    version: '20251020',
    variant: {
      id: '395103fb-d6e2-4fdd-93bc-bc99146f1ea2',
      slug: 'node',
      name: 'Node.js & Bun',
      deployType: 'node',
      logo: 'https://assets.clever-cloud.com/logos/nodejs.svg',
    },
    minInstances: 1,
    maxInstances: 1,
    maxAllowedInstances: 40,
    minFlavor: FLAVOR_XS,
    maxFlavor: FLAVOR_XS,
    flavors: [FLAVOR_XS, FLAVOR_S, FLAVOR_M],
    defaultEnv: {},
    lifetime: 'REGULAR',
    instanceAndVersion: 'node-20251020',
    kernelName: 'linux-vm',
  },
  deployment: {
    shutdownable: false,
    type: 'GIT',
    repoState: 'CREATED',
    url: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_NODE_ID}.git`,
    httpUrl: `https://push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_NODE_ID}.git`,
  },
  vhosts: [{ fqdn: `${APP_NODE_ID.replace('_', '-')}.cleverapps.io/` }],
  deployUrl: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_NODE_ID}.git`,
  creationDate: 1700000000000,
  last_deploy: 1,
  archived: false,
  stickySessions: false,
  homogeneous: false,
  favourite: false,
  cancelOnPush: false,
  webhookUrl: null,
  webhookSecret: null,
  separateBuild: false,
  buildFlavor: { ...FLAVOR_M, disk: null },
  ownerId: USER_SELF.id,
  state: 'SHOULD_BE_UP',
  commitId: '0000000000000000000000000000000000000300',
  appliance: null,
  branch: 'master',
  forceHttps: 'ENABLED',
  env: [],
} satisfies RawApplication;

// Used by several fields of the application (git URLs, default domain): tests use `APP_PHP.id`.
const APP_PHP_ID = 'app_00000000-0000-4000-8000-000000000301';

export const APP_PHP = {
  id: APP_PHP_ID,
  name: 'my-php-app',
  description: 'my-php-app',
  zone: 'par',
  zoneId: 'aad32a21-24f8-40b3-a750-baab218d927b',
  instance: {
    type: 'php',
    version: '20251020',
    variant: {
      id: 'ca6c9c85-63f8-4075-b136-583d3f581a52',
      slug: 'php',
      name: 'PHP',
      deployType: 'php',
      logo: 'https://assets.clever-cloud.com/logos/php.svg',
    },
    minInstances: 1,
    maxInstances: 1,
    maxAllowedInstances: 40,
    minFlavor: FLAVOR_XS,
    maxFlavor: FLAVOR_XS,
    flavors: [FLAVOR_XS, FLAVOR_S, FLAVOR_M],
    defaultEnv: { CC_COMPOSER_VERSION: '2', CC_PHP_VERSION: '8' },
    lifetime: 'REGULAR',
    instanceAndVersion: 'php-20251020',
    kernelName: 'linux-vm',
  },
  deployment: {
    shutdownable: false,
    type: 'GIT',
    repoState: 'CREATED',
    url: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_PHP_ID}.git`,
    httpUrl: `https://push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_PHP_ID}.git`,
  },
  vhosts: [{ fqdn: `${APP_PHP_ID.replace('_', '-')}.cleverapps.io/` }],
  deployUrl: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_PHP_ID}.git`,
  creationDate: 1700000000000,
  last_deploy: 1,
  archived: false,
  stickySessions: false,
  homogeneous: false,
  favourite: false,
  cancelOnPush: false,
  webhookUrl: null,
  webhookSecret: null,
  separateBuild: false,
  buildFlavor: { ...FLAVOR_M, disk: null },
  ownerId: ORGANISATION_FOO.id,
  state: 'SHOULD_BE_UP',
  commitId: '0000000000000000000000000000000000000301',
  appliance: null,
  branch: 'master',
  forceHttps: 'ENABLED',
  env: [],
} satisfies RawApplication;

// Used by several fields of the application (git URLs, default domain): tests use `APP_PYTHON.id`.
const APP_PYTHON_ID = 'app_00000000-0000-4000-8000-000000000302';

export const APP_PYTHON = {
  id: APP_PYTHON_ID,
  name: 'my-python-app',
  description: 'my-python-app',
  zone: 'rbx',
  zoneId: 'b9bd85cc-62db-492f-94f5-ad3e47367d8e',
  instance: {
    type: 'python',
    version: '20251020',
    variant: {
      id: '049c84e1-56a4-4a6a-8940-7ba7e0f57c61',
      slug: 'python',
      name: 'Python',
      deployType: 'python',
      logo: 'https://assets.clever-cloud.com/logos/python.svg',
    },
    minInstances: 1,
    maxInstances: 1,
    maxAllowedInstances: 40,
    minFlavor: FLAVOR_XS,
    maxFlavor: FLAVOR_XS,
    flavors: [FLAVOR_XS, FLAVOR_S, FLAVOR_M],
    defaultEnv: { CC_PYTHON_VERSION: '3' },
    lifetime: 'REGULAR',
    instanceAndVersion: 'python-20251020',
    kernelName: 'linux-vm',
  },
  deployment: {
    shutdownable: false,
    type: 'GIT',
    repoState: 'CREATED',
    url: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_PYTHON_ID}.git`,
    httpUrl: `https://push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_PYTHON_ID}.git`,
  },
  vhosts: [{ fqdn: `${APP_PYTHON_ID.replace('_', '-')}.cleverapps.io/` }],
  deployUrl: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_PYTHON_ID}.git`,
  creationDate: 1710000000000,
  last_deploy: 1,
  archived: false,
  stickySessions: false,
  homogeneous: false,
  favourite: false,
  cancelOnPush: false,
  webhookUrl: null,
  webhookSecret: null,
  separateBuild: false,
  buildFlavor: { ...FLAVOR_M, disk: null },
  ownerId: ORGANISATION_BAR.id,
  state: 'SHOULD_BE_UP',
  commitId: '0000000000000000000000000000000000000302',
  appliance: null,
  branch: 'master',
  forceHttps: 'ENABLED',
  env: [],
} satisfies RawApplication;

// Used by several fields of the application (git URLs, default domain): tests use `APP_GO.id`.
const APP_GO_ID = 'app_00000000-0000-4000-8000-000000000303';

export const APP_GO = {
  id: APP_GO_ID,
  name: 'my-go-app',
  description: 'my-go-app',
  zone: 'par',
  zoneId: 'aad32a21-24f8-40b3-a750-baab218d927b',
  instance: {
    type: 'magic',
    version: '20251020',
    variant: {
      id: 'b7e506a9-241e-49b9-85d4-df74d85e0178',
      slug: 'go',
      name: 'Go',
      deployType: 'go',
      logo: 'https://assets.clever-cloud.com/logos/go.svg',
    },
    minInstances: 1,
    maxInstances: 1,
    maxAllowedInstances: 40,
    minFlavor: FLAVOR_XS,
    maxFlavor: FLAVOR_XS,
    flavors: [FLAVOR_XS, FLAVOR_S, FLAVOR_M],
    defaultEnv: {},
    lifetime: 'REGULAR',
    instanceAndVersion: 'magic-20251020',
    kernelName: 'linux-vm',
  },
  deployment: {
    shutdownable: false,
    type: 'GIT',
    repoState: 'CREATED',
    url: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_GO_ID}.git`,
    httpUrl: `https://push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_GO_ID}.git`,
  },
  vhosts: [{ fqdn: `${APP_GO_ID.replace('_', '-')}.cleverapps.io/` }],
  deployUrl: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_GO_ID}.git`,
  creationDate: 1700000000000,
  last_deploy: 1,
  archived: false,
  stickySessions: false,
  homogeneous: false,
  favourite: false,
  cancelOnPush: false,
  webhookUrl: null,
  webhookSecret: null,
  separateBuild: false,
  buildFlavor: { ...FLAVOR_M, disk: null },
  ownerId: USER_SELF.id,
  state: 'SHOULD_BE_UP',
  commitId: '0000000000000000000000000000000000000303',
  appliance: null,
  branch: 'master',
  forceHttps: 'ENABLED',
  env: [],
} satisfies RawApplication;

// Used by several fields of the application (git URLs, default domain): tests use `APP_JAVA.id`.
const APP_JAVA_ID = 'app_00000000-0000-4000-8000-000000000304';

export const APP_JAVA = {
  id: APP_JAVA_ID,
  name: 'my-java-app',
  description: 'my-java-app',
  zone: 'par',
  zoneId: 'aad32a21-24f8-40b3-a750-baab218d927b',
  instance: {
    type: 'java',
    version: '20251020',
    variant: {
      id: '879bf2c4-54b2-4b84-83f6-704d90c08062',
      slug: 'jar',
      name: 'Java + JAR',
      deployType: 'java',
      logo: 'https://assets.clever-cloud.com/logos/java-jar.svg',
    },
    minInstances: 1,
    maxInstances: 1,
    maxAllowedInstances: 40,
    minFlavor: FLAVOR_XS,
    maxFlavor: FLAVOR_XS,
    flavors: [FLAVOR_XS, FLAVOR_S, FLAVOR_M],
    defaultEnv: { CC_JAVA_VERSION: '21' },
    lifetime: 'REGULAR',
    instanceAndVersion: 'java-20251020',
    kernelName: 'linux-vm',
  },
  deployment: {
    shutdownable: false,
    type: 'GIT',
    repoState: 'CREATED',
    url: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_JAVA_ID}.git`,
    httpUrl: `https://push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_JAVA_ID}.git`,
  },
  vhosts: [{ fqdn: `${APP_JAVA_ID.replace('_', '-')}.cleverapps.io/` }],
  deployUrl: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_JAVA_ID}.git`,
  creationDate: 1700000000000,
  last_deploy: 1,
  archived: false,
  stickySessions: false,
  homogeneous: false,
  favourite: false,
  cancelOnPush: false,
  webhookUrl: null,
  webhookSecret: null,
  separateBuild: false,
  buildFlavor: { ...FLAVOR_M, disk: null },
  ownerId: ORGANISATION_FOO.id,
  state: 'SHOULD_BE_UP',
  commitId: '0000000000000000000000000000000000000304',
  appliance: null,
  branch: 'master',
  forceHttps: 'ENABLED',
  env: [],
} satisfies RawApplication;

/** `APP_NODE` with auto scalability enabled. */
export const APP_NODE_SCALABLE = {
  ...APP_NODE,
  instance: { ...APP_NODE.instance, maxFlavor: FLAVOR_S, maxInstances: 2 },
};

export const LINKED_APP_NODE: AppConfigFileApp = {
  app_id: APP_NODE.id,
  org_id: APP_NODE.ownerId,
  deploy_url: APP_NODE.deployment.httpUrl,
  git_ssh_url: APP_NODE.deployment.url,
  name: APP_NODE.name,
  alias: 'my-node-alias',
};

export const LINKED_APP_PHP: AppConfigFileApp = {
  app_id: APP_PHP.id,
  org_id: APP_PHP.ownerId,
  deploy_url: APP_PHP.deployment.httpUrl,
  git_ssh_url: APP_PHP.deployment.url,
  name: APP_PHP.name,
  alias: 'my-php-alias',
};
