import { APP_ID, USER_ID } from './id.ts';

/**
 * Build a raw runtime flavor as returned by the v2 API
 * (the shape expected by the client's `transformProductRuntimeFlavor`).
 */
export function rawFlavor(name = 'S') {
  return {
    name,
    mem: 1024,
    cpus: 1,
    gpus: 0,
    disk: null,
    price: 0.6,
    available: true,
    microservice: false,
    machine_learning: false,
    nice: 0,
    price_id: `apps.${name}`,
    memory: {
      unit: 'B',
      value: 1073741824,
      formatted: '1 GB',
    },
    cpuFactor: 1,
    memFactor: 1,
  };
}

/**
 * Build a raw application object as returned by the v2 API
 * (the shape expected by the client's `transformApplication`).
 * Pass overrides for the fields the test cares about.
 */
export function rawApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: APP_ID,
    ownerId: USER_ID,
    name: 'test-app',
    description: 'test-app',
    zone: 'par',
    zoneId: `zone_00000000-0000-2222-aaaa-000000000001`,
    instance: {
      type: 'node',
      version: '20',
      variant: {
        id: '00000000-0000-2222-aaaa-000000000002',
        slug: 'node',
        name: 'Node',
        deployType: 'node',
        logo: 'https://assets.clever-cloud.com/logos/nodejs.svg',
      },
      minInstances: 1,
      maxInstances: 1,
      maxAllowedInstances: 40,
      minFlavor: rawFlavor('S'),
      maxFlavor: rawFlavor('S'),
      flavors: [rawFlavor('S')],
      defaultEnv: {},
      lifetime: 'REGULAR',
    },
    deployment: {
      shutdownable: false,
      type: 'GIT',
      repoState: 'CREATED',
      url: `git+ssh://git@push-n2-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
      httpUrl: `https://push-n2-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
    },
    vhosts: [{ fqdn: `${APP_ID.replace('app_', 'app-')}.cleverapps.io` }],
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
    buildFlavor: rawFlavor('S'),
    state: 'SHOULD_BE_UP',
    commitId: '0000000000000000000000000000000000000000',
    appliance: null,
    branch: 'master',
    forceHttps: 'DISABLED',
    env: [],
    ...overrides,
  };
}
