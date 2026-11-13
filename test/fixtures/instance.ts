import { APP_NODE } from './app.ts';
import { DEPLOYMENT_NODE_OK, type RawDeployment } from './deployment.ts';
import { FLAVOR_M, FLAVOR_XS, type RawFlavor } from './flavor.ts';

/** Date as v4 prints it: ISO 8601 in UTC, without the trailing zeros of the fraction of second (`10:00:39.21Z`). */
function orchestrationDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/\.?0+Z$/, 'Z');
}

/**
 * Instance of an application, with every field the API exposes about it through `GET .../instances` (v2) and
 * `GET /v4/orchestration/.../instances` (v4): build the body of either endpoint with `rawInstances()` or
 * `rawOrchestrationInstances()`.
 */
export interface Instance {
  id: string;
  ownerId: string;
  applicationId: string;
  name: string;
  index: number;
  state: string;
  flavor: RawFlavor;
  isBuildVm: boolean;
  deployment: RawDeployment;
  commit: string | null;
  ip: string;
  port: number;
  hypervisorId: string;
  creationDate: number;
  deletionDate: number | null;
}

export const INSTANCE_NODE_1 = {
  id: '00000000-0000-4000-8000-000000000500',
  ownerId: APP_NODE.ownerId,
  applicationId: APP_NODE.id,
  name: 'Calm Fox',
  index: 0,
  state: 'UP',
  flavor: FLAVOR_XS,
  isBuildVm: false,
  deployment: DEPLOYMENT_NODE_OK,
  commit: DEPLOYMENT_NODE_OK.commit,
  ip: '192.0.2.10',
  port: 10500,
  hypervisorId: 'hv-par1-001',
  creationDate: 1772352000000,
  deletionDate: null,
} satisfies Instance;

export const INSTANCE_NODE_2 = {
  id: '00000000-0000-4000-8000-000000000501',
  ownerId: APP_NODE.ownerId,
  applicationId: APP_NODE.id,
  name: 'Bold Owl',
  index: 1,
  state: 'UP',
  flavor: FLAVOR_M,
  isBuildVm: false,
  deployment: DEPLOYMENT_NODE_OK,
  commit: DEPLOYMENT_NODE_OK.commit,
  ip: '192.0.2.11',
  port: 10501,
  hypervisorId: 'hv-par1-002',
  creationDate: 1772446830456,
  deletionDate: null,
} satisfies Instance;

export const INSTANCE_NODE_3 = {
  id: '00000000-0000-4000-8000-000000000502',
  ownerId: APP_NODE.ownerId,
  applicationId: APP_NODE.id,
  name: 'Brave Lynx',
  index: 2,
  state: 'BOOTING',
  flavor: FLAVOR_M,
  isBuildVm: false,
  deployment: DEPLOYMENT_NODE_OK,
  commit: DEPLOYMENT_NODE_OK.commit,
  ip: '192.0.2.12',
  port: 10502,
  hypervisorId: 'hv-par1-003',
  creationDate: 1772447000000,
  deletionDate: null,
} satisfies Instance;

/**
 * Build VM of `APP_NODE` during a deployment: on the build flavor of the app, index 0. v4 flags it with `isBuildVm`,
 * v2 lists it like any other instance.
 */
export const INSTANCE_NODE_BUILD = {
  id: '00000000-0000-4000-8000-000000000503',
  ownerId: APP_NODE.ownerId,
  applicationId: APP_NODE.id,
  name: 'Quiet Otter',
  index: 0,
  state: 'DEPLOYING',
  flavor: APP_NODE.buildFlavor,
  isBuildVm: true,
  deployment: DEPLOYMENT_NODE_OK,
  commit: DEPLOYMENT_NODE_OK.commit,
  ip: '192.0.2.13',
  port: 10503,
  hypervisorId: 'hv-par1-004',
  creationDate: 1772445600000,
  deletionDate: null,
} satisfies Instance;

/** Instance of `APP_NODE` deleted after a scale down, listed by v4 in its history (`DELETED`, with a `deletionDate`). */
export const INSTANCE_NODE_DELETED = {
  id: '00000000-0000-4000-8000-000000000504',
  ownerId: APP_NODE.ownerId,
  applicationId: APP_NODE.id,
  name: 'Old Heron',
  index: 1,
  state: 'DELETED',
  flavor: FLAVOR_XS,
  isBuildVm: false,
  deployment: DEPLOYMENT_NODE_OK,
  commit: DEPLOYMENT_NODE_OK.commit,
  ip: '192.0.2.14',
  port: 10504,
  hypervisorId: 'hv-par1-005',
  creationDate: 1772350200000,
  deletionDate: 1772359200210,
} satisfies Instance;

/** Raw item of `GET /v2/organisations/:ownerId/applications/:appId/instances`, as returned by the API. */
export interface RawInstance {
  id: string;
  appId: string;
  appPort: number;
  ip: string;
  state: string;
  flavor: Pick<RawFlavor, 'name' | 'mem' | 'cpus' | 'price'>;
  commit: string | null;
  deployNumber: number;
  deployId: string;
  instanceNumber: number;
  displayName: string;
  creationDate: number;
}

/** Raw item of `GET /v4/orchestration/organisations/:ownerId/applications/:appId/instances`, as returned by the API. */
export interface RawOrchestrationInstance {
  id: string;
  ownerId: string;
  applicationId: string;
  resourceId: string;
  deploymentId: string;
  name: string;
  flavor: string;
  index: number;
  state: string;
  hypervisorId: string;
  creationDate: string;
  deletionDate: string | null;
  network: string;
  isBuildVm: boolean;
}

/**
 * Raw body of `GET /v2/organisations/:ownerId/applications/:appId/instances`, in the given order.
 *
 * @example
 * rawInstances([INSTANCE_NODE_1, { ...INSTANCE_NODE_2, state: 'DEPLOYING', commit: null }]);
 */
export function rawInstances(instances: Array<Instance>): Array<RawInstance> {
  return instances.map((instance) => ({
    id: instance.id,
    appId: instance.applicationId,
    appPort: instance.port,
    ip: instance.ip,
    state: instance.state,
    flavor: {
      name: instance.flavor.name,
      mem: instance.flavor.mem,
      cpus: instance.flavor.cpus,
      price: instance.flavor.price,
    },
    commit: instance.commit,
    deployNumber: instance.deployment.id,
    deployId: instance.deployment.uuid,
    instanceNumber: instance.index,
    displayName: instance.name,
    creationDate: instance.creationDate,
  }));
}

/**
 * Raw body of `GET /v4/orchestration/organisations/:ownerId/applications/:appId/instances`, in the given order.
 *
 * @example
 * rawOrchestrationInstances([INSTANCE_NODE_2, INSTANCE_NODE_BUILD, INSTANCE_NODE_1]);
 */
export function rawOrchestrationInstances(instances: Array<Instance>): Array<RawOrchestrationInstance> {
  return instances.map((instance) => ({
    id: instance.id,
    ownerId: instance.ownerId,
    applicationId: instance.applicationId,
    resourceId: instance.applicationId,
    deploymentId: instance.deployment.uuid,
    name: instance.name,
    flavor: instance.flavor.name,
    index: instance.index,
    state: instance.state,
    hypervisorId: instance.hypervisorId,
    creationDate: orchestrationDate(instance.creationDate),
    deletionDate: instance.deletionDate == null ? null : orchestrationDate(instance.deletionDate),
    network: `${instance.ip}:${instance.port}`,
    isBuildVm: instance.isBuildVm,
  }));
}
